'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// 認証済みユーザー取得（quiz.tsから同じパターンを使用）
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  return session.user.id;
}

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
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

// クイズ回答の提出
export const submitQuizResponse = action
  .schema(submitQuizResponseSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
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

        // 2. 回答回数制限チェック
        if (quiz.maxAttempts) {
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
            userId,
            startedAt: new Date(data.startedAt),
            completedAt: new Date(data.completedAt),
            score: 0, // 後で計算
            totalPoints: 0, // 後で計算
          },
        });

        // 4. 各質問への回答を保存し、スコアを計算
        let totalScore = 0;
        let totalPoints = 0;

        for (const response of data.responses) {
          const question = quiz.questions.find(
            q => q.id === response.questionId
          );
          if (!question) continue;

          totalPoints += question.points;

          // 正解判定
          const isCorrect = checkAnswer(question, response.answer);
          if (isCorrect) {
            totalScore += question.points;
          }

          // QuestionResponseを作成
          await tx.questionResponse.create({
            data: {
              quizResponseId: quizResponse.id,
              questionId: response.questionId,
              answer: response.answer,
              isCorrect,
              score: isCorrect ? question.points : 0,
              // timeSpent: response.timeSpent || 0, // Prismaスキーマに存在しないため除外
            },
          });
        }

        // 5. QuizResponseのスコアを更新
        const updatedResponse = await tx.quizResponse.update({
          where: { id: quizResponse.id },
          data: {
            score: totalScore,
            totalPoints,
            isPassed: quiz.passingScore
              ? (totalScore / totalPoints) * 100 >= quiz.passingScore
              : true,
          },
          // includeは不要（デフォルトで全フィールドが取得される）
        });

        return updatedResponse;
      });

      revalidatePath(`/quiz/${data.quizId}/results`);
      return { data: result };
    } catch (error) {
      console.error('Quiz submission error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'クイズの提出に失敗しました'
      );
    }
  });

// 正解判定ヘルパー関数
function checkAnswer(question: any, answer: any): boolean {
  if (!question.correctAnswer) return false;

  switch (question.type) {
    case 'TRUE_FALSE':
      return answer === question.correctAnswer;

    case 'MULTIPLE_CHOICE':
      return answer === question.correctAnswer;

    case 'CHECKBOX':
      if (!Array.isArray(answer) || !Array.isArray(question.correctAnswer)) {
        return false;
      }
      return (
        JSON.stringify(answer.sort()) ===
        JSON.stringify(question.correctAnswer.sort())
      );

    case 'NUMERIC':
      return Number(answer) === Number(question.correctAnswer);

    case 'SHORT_ANSWER':
      // 大文字小文字を無視して比較
      return (
        String(answer).toLowerCase().trim() ===
        String(question.correctAnswer).toLowerCase().trim()
      );

    case 'SORTING':
      return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);

    case 'FILL_IN_BLANK':
    case 'MATCHING':
      return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);

    case 'DIAGRAM':
      const correct = question.correctAnswer as any;
      return (
        answer.x === correct.x &&
        answer.y === correct.y &&
        answer.label === correct.label
      );

    default:
      return false;
  }
}

// クイズ回答履歴の取得
export const getQuizResponses = action
  .schema(
    z.object({
      quizId: z.string().optional(),
      limit: z.number().default(10),
    })
  )
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

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
          // questions: true, // QuizResponseにはquestionsの直接リレーションはない
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: data.limit,
      });

      return { data: responses };
    } catch (error) {
      throw new Error('回答履歴の取得に失敗しました');
    }
  });