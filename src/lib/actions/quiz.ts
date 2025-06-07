'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { correctAnswerSchema } from '@/types/quiz-schemas';

import {
  QuizStatus,
  ScoringType,
  SharingMode,
  QuestionType,
} from '@prisma/client';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// バリデーションスキーマ
const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().optional(),
  scoringType: z.nativeEnum(ScoringType),
  sharingMode: z.nativeEnum(SharingMode),
  password: z.string().optional(),
});

const updateQuizSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional(),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  coverImage: z.string().optional(),
  subdomain: z
    .string()
    .min(3, 'サブドメインは3文字以上必要です')
    .max(30, 'サブドメインは30文字以下にしてください')
    .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です')
    .optional(),
  timeLimit: z.number().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  maxAttempts: z.number().min(1).optional(),
});

const deleteQuizSchema = z.object({
  id: z.string(),
});

const publishQuizSchema = z.object({
  id: z.string(),
  subdomain: z
    .string()
    .min(3, 'サブドメインは3文字以上必要です')
    .max(30, 'サブドメインは30文字以下にしてください')
    .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です'),
});

const getQuizzesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'responseCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tags: z.array(z.string()).optional(),
});

const addQuestionSchema = z.object({
  quizId: z.string(),
  type: z.enum([
    'TRUE_FALSE',
    'MULTIPLE_CHOICE',
    'CHECKBOX',
    'SHORT_ANSWER',
    'SORTING',
    'FILL_IN_BLANK',
    'DIAGRAM',
    'MATCHING',
    'NUMERIC',
  ]),
  text: z.string().min(1, '問題文は必須です'),
  points: z.number().min(1).default(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1, '選択肢は必須です'),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
  correctAnswer: correctAnswerSchema.optional(),
  sectionId: z.string().optional(),
});

const updateQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, '問題文は必須です').optional(),
  points: z.number().min(1).optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  correctAnswer: correctAnswerSchema.optional(),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        text: z.string().min(1, '選択肢は必須です'),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
});

const deleteQuestionSchema = z.object({
  id: z.string(),
});

const reorderQuestionsSchema = z.object({
  quizId: z.string(),
  questionIds: z.array(z.string()),
});

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  return session.user.id;
}

// クイズ作成
export const createQuiz = action
  .schema(createQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          description: data.description,
          scoringType: data.scoringType,
          sharingMode: data.sharingMode,
          password: data.password,
          userId,
        },
      });

      revalidatePath('/dashboard/quizzes');
      return { quiz };
    } catch (error) {
      throw new Error('クイズの作成に失敗しました');
    }
  });

// クイズ更新
export const updateQuiz = action
  .schema(updateQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          userId,
        },
      });

      if (!existingQuiz) {
        throw new Error('クイズが見つからないか、編集権限がありません');
      }

      // サブドメインの重複チェック
      if (data.subdomain) {
        const existingSubdomain = await prisma.quiz.findFirst({
          where: {
            subdomain: data.subdomain,
            NOT: { id: data.id },
          },
        });

        if (existingSubdomain) {
          throw new Error('このサブドメインは既に使用されています');
        }
      }

      const { id, ...updateData } = data;
      const quiz = await prisma.quiz.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/dashboard/quizzes');
      revalidatePath(`/dashboard/quizzes/${id}`);
      return { quiz };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'クイズの更新に失敗しました'
      );
    }
  });

// クイズ削除
export const deleteQuiz = action
  .schema(deleteQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          userId,
        },
      });

      if (!existingQuiz) {
        throw new Error('クイズが見つからないか、削除権限がありません');
      }

      await prisma.quiz.delete({
        where: { id: data.id },
      });

      revalidatePath('/dashboard/quizzes');
      return { success: true };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'クイズの削除に失敗しました'
      );
    }
  });

// クイズ公開
export const publishQuiz = action
  .schema(publishQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          userId,
        },
        include: {
          questions: true,
        },
      });

      if (!existingQuiz) {
        throw new Error('クイズが見つからないか、公開権限がありません');
      }

      if (existingQuiz.questions.length === 0) {
        throw new Error('問題が1つも作成されていません');
      }

      // サブドメインの重複チェック
      const existingSubdomain = await prisma.quiz.findFirst({
        where: {
          subdomain: data.subdomain,
          NOT: { id: data.id },
        },
      });

      if (existingSubdomain) {
        throw new Error('このサブドメインは既に使用されています');
      }

      const quiz = await prisma.quiz.update({
        where: { id: data.id },
        data: {
          status: QuizStatus.PUBLISHED,
          subdomain: data.subdomain,
          publishedAt: new Date(),
        },
      });

      revalidatePath('/dashboard/quizzes');
      revalidatePath(`/dashboard/quizzes/${data.id}`);
      return { quiz };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'クイズの公開に失敗しました'
      );
    }
  });

// クイズ一覧取得
export const getQuizzes = action
  .schema(getQuizzesSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      const { page, limit, search, status, sortBy, sortOrder, tags } = data;
      const skip = (page - 1) * limit;

      // 検索条件の構築
      const where: Prisma.QuizWhereInput = {
        userId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && { status }),
        ...(tags &&
          tags.length > 0 && {
            tags: {
              some: {
                tag: {
                  name: { in: tags },
                },
              },
            },
          }),
      };

      // ソート条件の構築
      const orderBy: Prisma.QuizOrderByWithRelationInput =
        sortBy === 'responseCount'
          ? { responses: { _count: sortOrder } }
          : { [sortBy]: sortOrder };

      const [quizzes, total] = await Promise.all([
        prisma.quiz.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            questions: {
              select: { id: true },
            },
            responses: {
              select: { id: true },
            },
            _count: {
              select: {
                questions: true,
                responses: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.quiz.count({ where }),
      ]);

      const result = {
        quizzes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
      return result;
    } catch (error) {
      throw new Error('クイズ一覧の取得に失敗しました');
    }
  });

// 問題追加
export const addQuestion = action
  .schema(addQuestionSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          userId,
        },
        include: {
          questions: {
            select: { order: true },
          },
        },
      });

      if (!quiz) {
        throw new Error('クイズが見つからないか、編集権限がありません');
      }

      // 次の順序番号を計算
      const maxOrder = quiz.questions.reduce(
        (max, q) => Math.max(max, q.order),
        0
      );
      const nextOrder = maxOrder + 1;

      const question = await prisma.question.create({
        data: {
          quizId: data.quizId,
          type: data.type as QuestionType,
          text: data.text,
          points: data.points,
          hint: data.hint,
          explanation: data.explanation,
          correctAnswer: data.correctAnswer,
          sectionId: data.sectionId,
          order: nextOrder,
          options: data.options
            ? {
                create: data.options.map((option, index) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  order: index + 1,
                })),
              }
            : undefined,
        },
        include: {
          options: true,
        },
      });

      revalidatePath(`/dashboard/quizzes/${data.quizId}`);
      return { question };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '問題の追加に失敗しました'
      );
    }
  });

// 問題更新
export const updateQuestion = action
  .schema(updateQuestionSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // 問題の所有者確認
      const question = await prisma.question.findFirst({
        where: {
          id: data.id,
          quiz: {
            userId,
          },
        },
        include: {
          options: true,
        },
      });

      if (!question) {
        throw new Error('問題が見つからないか、編集権限がありません');
      }

      const { id, options, ...updateData } = data;

      // トランザクションで問題と選択肢を更新
      const updatedQuestion = await prisma.$transaction(async tx => {
        // 問題を更新
        const updated = await tx.question.update({
          where: { id },
          data: updateData,
        });

        // 選択肢がある場合は更新
        if (options) {
          // 既存の選択肢を削除
          await tx.questionOption.deleteMany({
            where: { questionId: id },
          });

          // 新しい選択肢を作成
          await tx.questionOption.createMany({
            data: options.map((option, index) => ({
              questionId: id,
              text: option.text,
              isCorrect: option.isCorrect,
              order: index + 1,
            })),
          });
        }

        return updated;
      });

      revalidatePath(`/dashboard/quizzes/${question.quizId}`);
      return { question: updatedQuestion };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '問題の更新に失敗しました'
      );
    }
  });

// 問題削除
export const deleteQuestion = action
  .schema(deleteQuestionSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // 問題の所有者確認
      const question = await prisma.question.findFirst({
        where: {
          id: data.id,
          quiz: {
            userId,
          },
        },
      });

      if (!question) {
        throw new Error('問題が見つからないか、削除権限がありません');
      }

      await prisma.question.delete({
        where: { id: data.id },
      });

      revalidatePath(`/dashboard/quizzes/${question.quizId}`);
      return { success: true };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '問題の削除に失敗しました'
      );
    }
  });

// 問題順序変更
export const reorderQuestions = action
  .schema(reorderQuestionsSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          userId,
        },
      });

      if (!quiz) {
        throw new Error('クイズが見つからないか、編集権限がありません');
      }

      // トランザクションで順序を更新
      await prisma.$transaction(
        data.questionIds.map((questionId, index) =>
          prisma.question.update({
            where: { id: questionId },
            data: { order: index + 1 },
          })
        )
      );

      revalidatePath(`/dashboard/quizzes/${data.quizId}`);
      return { success: true };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '問題順序の変更に失敗しました'
      );
    }
  });

// サブドメイン利用可能チェック
export const checkSubdomainAvailability = action
  .schema(z.object({ subdomain: z.string() }))
  .action(async ({ parsedInput: data }) => {
    try {
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          subdomain: data.subdomain,
        },
      });

      return { available: !existingQuiz };
    } catch (error) {
      throw new Error('サブドメインの確認に失敗しました');
    }
  });
