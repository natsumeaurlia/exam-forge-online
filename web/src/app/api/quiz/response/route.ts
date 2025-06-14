import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { QuizAnswer, QuestionWithDetails } from '@/types/quiz-answers';
import {
  createQuizErrorResponse,
  validateQuizResponseData,
  getQuizErrorMessage,
  analyzeQuizError,
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
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

// 正解判定ヘルパー関数
function checkAnswer(
  question: QuestionWithDetails,
  answer: QuizAnswer
): boolean {
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
      const correct = question.correctAnswer as {
        x: number;
        y: number;
        label: string;
      };
      const diagramAnswer = answer as { x: number; y: number; label: string };
      return (
        diagramAnswer.x === correct.x &&
        diagramAnswer.y === correct.y &&
        diagramAnswer.label === correct.label
      );

    default:
      return false;
  }
}

// POST: クイズ回答の提出
export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック（匿名回答も許可）
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 2. リクエストボディの取得と検証
    const body = await request.json();
    const validationResult = submitQuizResponseSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = createQuizErrorResponse(
        new Error('入力データに問題があります'),
        { action: 'submit', userId: userId || undefined }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const data = validationResult.data;

    // 詳細データ検証
    const dataValidation = validateQuizResponseData(data);
    if (!dataValidation.isValid) {
      const errorResponse = createQuizErrorResponse(
        new Error('回答データの形式が正しくありません'),
        { action: 'submit', quizId: data.quizId, userId: userId || undefined }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 3. トランザクションで回答を保存
    const result = await prisma.$transaction(async tx => {
      // クイズの存在確認とアクセス権チェック
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

      // パスワード保護されたクイズの場合は認証が必要
      if (quiz.password && !userId) {
        throw new Error('認証が必要です');
      }

      // 回答回数制限チェック（認証ユーザーのみ）
      if (userId && quiz.maxAttempts) {
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

      // QuizResponseを作成
      const quizResponse = await tx.quizResponse.create({
        data: {
          quizId: data.quizId,
          userId: userId || undefined, // 匿名の場合はnull
          startedAt: new Date(data.startedAt),
          completedAt: new Date(data.completedAt),
          score: 0, // 後で計算
          totalPoints: 0, // 後で計算
        },
      });

      // 各質問への回答を保存し、スコアを計算
      let totalScore = 0;
      let totalPoints = 0;

      for (const response of data.responses) {
        const question = quiz.questions.find(q => q.id === response.questionId);
        if (!question) continue;

        totalPoints += question.points;

        // 正解判定
        const isCorrect = checkAnswer(
          question as QuestionWithDetails,
          response.answer
        );
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
          },
        });
      }

      // QuizResponseのスコアを更新
      const updatedResponse = await tx.quizResponse.update({
        where: { id: quizResponse.id },
        data: {
          score: totalScore,
          totalPoints,
          isPassed: quiz.passingScore
            ? (totalScore / totalPoints) * 100 >= quiz.passingScore
            : true,
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              passingScore: true,
            },
          },
        },
      });

      return updatedResponse;
    });

    // 4. キャッシュの無効化
    revalidatePath(`/quiz/${data.quizId}/results`);
    if (userId) {
      revalidatePath('/dashboard');
    }

    // 5. 成功レスポンス
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          quizId: result.quizId,
          score: result.score,
          totalPoints: result.totalPoints,
          isPassed: result.isPassed,
          completedAt: result.completedAt,
          quiz: result.quiz,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Quiz response submission error:', error);

    // 統一エラーハンドリングを使用
    const errorResponse = createQuizErrorResponse(error, {
      action: 'submit',
      quizId: data?.quizId,
      userId: userId || undefined,
    });

    // エラータイプに応じたHTTPステータスコード
    let statusCode = 500;
    if (error instanceof Error) {
      if (
        error.message.includes('見つからない') ||
        error.message.includes('not found')
      ) {
        statusCode = 404;
      } else if (
        error.message.includes('認証') ||
        error.message.includes('Authentication')
      ) {
        statusCode = 401;
      } else if (
        error.message.includes('上限') ||
        error.message.includes('attempts')
      ) {
        statusCode = 403;
      } else if (
        error.message.includes('入力') ||
        error.message.includes('validation')
      ) {
        statusCode = 400;
      }
    }

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// GET: クイズ回答履歴の取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const errorResponse = createQuizErrorResponse(
        new Error('認証が必要です'),
        { action: 'load' }
      );
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // 回答履歴の取得
    const responses = await prisma.quizResponse.findMany({
      where: {
        userId: session.user.id,
        ...(quizId && { quizId }),
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: responses,
    });
  } catch (error) {
    console.error('Failed to fetch quiz responses:', error);
    const errorResponse = createQuizErrorResponse(error, {
      action: 'load',
      userId: session?.user?.id,
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
