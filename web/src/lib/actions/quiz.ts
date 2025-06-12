'use server';

import { createSafeActionClient } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { handleActionError } from './utils';
import {
  createQuizSchema,
  updateQuizSchema,
  deleteQuizSchema,
  publishQuizSchema,
  getQuizzesSchema,
  addQuestionSchema,
  updateQuestionSchema,
  deleteQuestionSchema,
  reorderQuestionsSchema,
  checkSubdomainSchema,
} from '@/types/quiz-schemas';
import { QuizStatus, QuestionType } from '@prisma/client';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('INVALID_USER:認証が必要です');
  }

  return session.user.id;
}

// Helper function to get user's active team
async function getUserActiveTeam(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        where: {
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER'],
          },
        },
        include: {
          team: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
    },
  });

  if (!user) {
    // User not found - this shouldn't happen if authentication is working
    throw new Error(
      'INVALID_USER:ユーザー情報が見つかりません。再度ログインしてください。'
    );
  }

  if (user.teamMembers.length === 0) {
    console.log(
      'Creating new team for user:',
      userId,
      'User name:',
      user?.name
    );

    try {
      // Use transaction to ensure atomicity and handle race conditions
      const newTeam = await prisma.$transaction(async tx => {
        // Double-check user exists in the transaction
        const userCheck = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        });

        if (!userCheck) {
          throw new Error(
            'INVALID_USER:セッションのユーザーIDが無効です。ブラウザのCookieをクリアして再ログインしてください。'
          );
        }

        // Generate a unique slug within the transaction to prevent race conditions
        // Use timestamp and random string to minimize collision probability
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 6);
        let teamSlug = `team-${userId.substring(0, 8)}-${timestamp}-${randomStr}`;

        // Additional safety check: ensure slug is truly unique
        let attempts = 0;
        const maxAttempts = 10;

        while (await tx.team.findUnique({ where: { slug: teamSlug } })) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(
              'Failed to generate unique team slug after multiple attempts'
            );
          }
          // Generate new random component
          const newRandomStr = Math.random().toString(36).substring(2, 6);
          teamSlug = `team-${userId.substring(0, 8)}-${timestamp}-${newRandomStr}-${attempts}`;
        }

        // Create the team
        const team = await tx.team.create({
          data: {
            name: `${userCheck.name || 'ユーザー'}のチーム`,
            slug: teamSlug,
            creatorId: userId,
            members: {
              create: {
                userId,
                role: 'OWNER',
              },
            },
            teamSettings: {
              create: {
                maxMembers: 1, // Free plan default
              },
            },
          },
        });

        return team;
      });

      console.log('New team created:', newTeam.id, 'with slug:', newTeam.slug);
      return newTeam.id;
    } catch (error) {
      console.error('Error creating team:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error meta:', error.meta);
        console.error('Prisma error message:', error.message);

        // Handle specific foreign key constraint error
        if (
          error.code === 'P2003' &&
          error.meta?.field_name === 'Team_creatorId_fkey'
        ) {
          throw new Error(
            'ユーザーの認証に問題があります。再ログインしてください。'
          );
        }
      }
      throw new Error('チームの作成に失敗しました');
    }
  }

  // Return the first team (in the future, we can implement team switching)
  return user.teamMembers[0].team.id;
}

// クイズ作成
export const createQuiz = action
  .schema(createQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      const teamId = await getUserActiveTeam(userId);

      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          description: data.description || null,
          scoringType: data.scoringType,
          sharingMode: data.sharingMode,
          password: data.password || null,
          createdById: userId,
          teamId,
        },
      });

      revalidatePath('/dashboard/quizzes');
      return { quiz };
    } catch (error) {
      console.error('Quiz creation error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error meta:', error.meta);
      }
      throw new Error('クイズの作成に失敗しました');
    }
  });

// クイズ更新
export const updateQuiz = action
  .schema(updateQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          teamId,
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
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          teamId,
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
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // クイズの所有者確認
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: data.id,
          teamId,
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

      // Get user's team to filter quizzes
      const teamId = await getUserActiveTeam(userId);

      // 検索条件の構築
      const where: Prisma.QuizWhereInput = {
        teamId,
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
      console.error('getQuizzes error:', error);
      throw new Error('クイズ一覧の取得に失敗しました');
    }
  });

// 問題追加
export const addQuestion = action
  .schema(addQuestionSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          teamId,
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
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // 問題の所有者確認
      const question = await prisma.question.findFirst({
        where: {
          id: data.id,
          quiz: {
            teamId,
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
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // 問題の所有者確認
      const question = await prisma.question.findFirst({
        where: {
          id: data.id,
          quiz: {
            teamId,
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
      // Get user's team to verify permissions
      const teamId = await getUserActiveTeam(userId);

      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          teamId,
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
  .schema(checkSubdomainSchema)
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

// クイズ詳細取得（編集用）
export async function getQuizForEdit(quizId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Get user's team to verify permissions
  const teamId = await getUserActiveTeam(session.user.id);

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      teamId,
    },
    include: {
      questions: {
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      sections: {
        orderBy: { order: 'asc' },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!quiz) {
    throw new Error('クイズが見つからないか、編集権限がありません');
  }

  return quiz;
}

// Get quiz with questions for preview
export async function getQuizWithQuestionsById(quizId: string) {
  try {
    const userId = await getAuthenticatedUser();
    const teamId = await getUserActiveTeam(userId);

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        teamId,
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
            media: true,
          },
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!quiz) {
      return {
        data: null,
        error: 'クイズが見つからないか、アクセス権限がありません',
      };
    }

    // Transform tags for easier use
    const transformedQuiz = {
      ...quiz,
      tags: quiz.tags.map(quizTag => quizTag.tag),
    };

    return { data: transformedQuiz, error: null };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return { data: null, error: 'クイズの取得に失敗しました' };
  }
}
