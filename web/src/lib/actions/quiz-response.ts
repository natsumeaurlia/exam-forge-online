'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { authAction } from './auth-action';
import {
  QuizAnswer,
  QuestionWithDetails,
  validateAnswerFormat,
} from '@/types/quiz-answers';
import {
  createQuizErrorResponse,
  validateQuizResponseData,
  QuizErrorType,
} from '@/lib/utils/quiz-error-handling';

// 回答スキーマ（各問題タイプに応じた検証）
const answerSchema = z.union([
  z.boolean(), // TRUE_FALSE
  z.string(), // MULTIPLE_CHOICE, SHORT_ANSWER
  z.array(z.string()), // CHECKBOX, SORTING
  z.record(z.string()), // FILL_IN_BLANK, MATCHING
  z.number(), // NUMERIC
  z.object({
    // DIAGRAM
    x: z.number(),
    y: z.number(),
    label: z.string(),
  }),
]);

// クイズ回答提出スキーマ
const submitQuizResponseSchema = z.object({
  quizId: z.string(),
  responses: z.array(
    z.object({
      questionId: z.string(),
      answer: answerSchema,
      timeSpent: z.number().optional(),
    })
  ),
  participantName: z.string().optional(),
  participantEmail: z.string().email().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

// クイズ回答の提出
export const submitQuizResponse = authAction
  .schema(submitQuizResponseSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // 入力データの詳細検証
      const validation = validateQuizResponseData(data);
      if (!validation.isValid) {
        return createQuizErrorResponse(
          new Error('入力データに問題があります'),
          {
            action: 'submit',
            quizId: data.quizId,
            userId,
          }
        );
      }

      // トランザクションで回答を保存
      const result = await prisma.$transaction(async tx => {
        // 1. クイズの存在確認とアクセス権チェック
        const quiz = await tx.quiz.findFirst({
          where: {
            id: data.quizId,
            status: 'PUBLISHED',
          },
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        });

        if (!quiz) {
          throw new Error('クイズが見つからないか、公開されていません');
        }

        // For non-public quizzes, require authentication
        if (!quiz.sharingMode || quiz.sharingMode !== 'URL') {
          if (!userId) {
            throw new Error('認証が必要です');
          }
        }

        // 2. 回答回数制限チェック
        if (quiz.maxAttempts && userId) {
          const attemptCount = await tx.quizResponse.count({
            where: {
              quizId: data.quizId,
              userId,
            },
          });

          if (attemptCount >= quiz.maxAttempts) {
            throw new Error('回答回数の上限に達しています');
          }
        }

        // 3. QuizResponseを作成
        const quizResponse = await tx.quizResponse.create({
          data: {
            quizId: data.quizId,
            userId: userId || null,
            participantName: data.participantName,
            participantEmail: data.participantEmail,
            startedAt: new Date(data.startedAt),
            completedAt: new Date(data.completedAt),
            score: 0, // 後で計算
            totalPoints: 0, // 後で計算
          },
        });

        // 4. 各質問への回答を保存し、スコアを計算
        let totalScore = 0;
        let totalPoints = 0;
        let correctAnswers = 0;

        for (const response of data.responses) {
          const question = quiz.questions.find(
            q => q.id === response.questionId
          );
          if (!question) continue;

          totalPoints += question.points;

          // 正解判定
          const isCorrect = checkAnswer(
            question as QuestionWithDetails,
            response.answer
          );
          if (isCorrect) {
            totalScore += question.points;
            correctAnswers++;
          }

          // QuestionResponseを作成
          await tx.questionResponse.create({
            data: {
              quizResponseId: quizResponse.id,
              questionId: response.questionId,
              answer: JSON.stringify(response.answer),
              isCorrect,
              score: isCorrect ? question.points : 0,
            },
          });
        }

        // 5. QuizResponseのスコアを更新
        const scorePercentage =
          totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
        const updatedResponse = await tx.quizResponse.update({
          where: { id: quizResponse.id },
          data: {
            score: scorePercentage,
            totalPoints,
            isPassed: quiz.passingScore
              ? scorePercentage >= quiz.passingScore
              : true,
            timeTaken: Math.floor(
              (new Date(data.completedAt).getTime() -
                new Date(data.startedAt).getTime()) /
                1000
            ),
          },
        });

        return {
          id: updatedResponse.id,
          score: updatedResponse.score || 0,
          totalQuestions: quiz.questions.length,
          correctAnswers,
          passed: updatedResponse.isPassed || false,
        };
      });

      revalidatePath(`/quiz/${data.quizId}/results`);
      return { success: true, data: result };
    } catch (error) {
      console.error('Quiz submission error:', error);

      // 統一エラーハンドリングを使用
      return createQuizErrorResponse(error, {
        action: 'submit',
        quizId: data.quizId,
        userId: ctx.userId,
      });
    }
  });

// 正解判定ヘルパー関数
function checkAnswer(
  question: QuestionWithDetails,
  answer: QuizAnswer
): boolean {
  if (!question.correctAnswer) return false;

  switch (question.type) {
    case 'TRUE_FALSE':
      const trueFalseAnswer =
        typeof answer === 'boolean'
          ? answer.toString()
          : typeof answer === 'string'
            ? answer.toLowerCase()
            : String(answer);
      return (
        (question.correctAnswer as string)?.toLowerCase() === trueFalseAnswer
      );

    case 'MULTIPLE_CHOICE':
      const correctOption = question.options.find(opt => opt.isCorrect);
      return correctOption?.id === answer;

    case 'CHECKBOX':
      const correctOptions = question.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt.id);
      const selectedOptions = Array.isArray(answer) ? answer : [];
      return (
        correctOptions.length === selectedOptions.length &&
        correctOptions.every((id: string) => selectedOptions.includes(id))
      );

    case 'NUMERIC':
      const correctNum = parseFloat(String(question.correctAnswer) || '0');
      const answerNum = parseFloat(String(answer) || '0');
      const tolerance = 0.01;
      return Math.abs(correctNum - answerNum) < tolerance;

    case 'SHORT_ANSWER':
      // Normalize strings for comparison (handle full/half-width characters)
      const normalizeString = (str: string) => {
        return str
          ?.toLowerCase()
          .trim()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
            String.fromCharCode(s.charCodeAt(0) - 0xfee0)
          );
      };
      return (
        normalizeString(String(question.correctAnswer) || '') ===
        normalizeString(String(answer) || '')
      );

    case 'SORTING':
      const correctOrder = JSON.parse(String(question.correctAnswer) || '[]');
      const answerOrder = Array.isArray(answer) ? answer : [];
      return (
        correctOrder.length === answerOrder.length &&
        correctOrder.every(
          (item: string, index: number) => item === answerOrder[index]
        )
      );

    case 'FILL_IN_BLANK':
      const correctBlanks = JSON.parse(String(question.correctAnswer) || '[]');
      const answerBlanks = Array.isArray(answer) ? answer : [];
      return (
        correctBlanks.length === answerBlanks.length &&
        correctBlanks.every(
          (blank: string, index: number) =>
            blank.toLowerCase().trim() ===
            String(answerBlanks[index] || '')
              .toLowerCase()
              .trim()
        )
      );

    case 'MATCHING':
      const correctMatches = JSON.parse(String(question.correctAnswer) || '{}');
      const answerMatches =
        typeof answer === 'object' && answer !== null
          ? (answer as Record<string, string>)
          : {};
      return Object.keys(correctMatches).every(
        key => correctMatches[key] === answerMatches[key]
      );

    case 'DIAGRAM':
      const correct = JSON.parse(String(question.correctAnswer) || '{}') as {
        x: number;
        y: number;
        label: string;
      };
      const diagramAnswer =
        typeof answer === 'object' && answer !== null
          ? (answer as { x: number; y: number; label: string })
          : { x: 0, y: 0, label: '' };
      return (
        diagramAnswer.x === correct.x &&
        diagramAnswer.y === correct.y &&
        diagramAnswer.label === correct.label
      );

    default:
      return false;
  }
}

// This function would be called from a background job or calculated on-demand
// to avoid performance issues during response submission
async function calculateAverageScore(quizId: string): Promise<number> {
  const result = await prisma.quizResponse.aggregate({
    where: {
      quizId,
      completedAt: { not: null },
    },
    _avg: { score: true },
  });
  return result._avg.score || 0;
}

export const getQuizResponse = authAction
  .schema(z.object({ responseId: z.string() }))
  .action(async ({ parsedInput: { responseId }, ctx }) => {
    try {
      const { userId } = ctx;

      const response = await prisma.quizResponse.findUnique({
        where: { id: responseId },
        include: {
          quiz: {
            include: {
              questions: true,
            },
          },
          responses: {
            include: {
              question: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      });

      if (!response) {
        return createQuizErrorResponse(new Error('Response not found'), {
          action: 'load',
          userId: ctx.userId,
        });
      }

      // Check permissions: Only the respondent or team members can view
      if (response.userId && response.userId !== userId) {
        // Check if user is a team member
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: response.quiz.teamId,
            userId,
          },
        });

        if (!teamMember) {
          return createQuizErrorResponse(new Error('認証が必要です'), {
            action: 'load',
            userId: ctx.userId,
          });
        }
      }

      return {
        success: true,
        data: {
          id: response.id,
          score: response.score || 0,
          totalQuestions: response.quiz.questions?.length || 0,
          correctAnswers: response.responses.filter(a => a.isCorrect).length,
          passed: response.isPassed || false,
          answers: response.responses,
          quiz: response.quiz,
        },
      };
    } catch (error) {
      console.error('Error fetching quiz response:', error);
      return createQuizErrorResponse(error, {
        action: 'load',
        userId: ctx.userId,
      });
    }
  });

// クイズ回答履歴の取得
export const getQuizResponses = authAction
  .schema(
    z.object({
      quizId: z.string().optional(),
      limit: z.number().default(10),
    })
  )
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

    try {
      const responses = await prisma.quizResponse.findMany({
        where: {
          userId,
          ...(data.quizId && { quizId: data.quizId }),
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: data.limit,
      });

      return { success: true, data: responses };
    } catch (error) {
      console.error('Error fetching quiz responses:', error);
      return createQuizErrorResponse(error, {
        action: 'load',
        userId: ctx.userId,
      });
    }
  });
