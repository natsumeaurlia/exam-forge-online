'use server';

import { createSafeActionClient } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createTagSchema,
  updateTagSchema,
  deleteTagSchema,
  addTagToQuizSchema,
  removeTagFromQuizSchema,
  getTagsSchema,
} from '@/types/quiz-schemas';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  return session.user.id;
}

// タグ作成
export const createTag = action
  .schema(createTagSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // ユーザーのデフォルトチーム（最初のチーム）を取得
      const userTeam = await prisma.teamMember.findFirst({
        where: { userId },
        include: { team: true },
      });

      if (!userTeam) {
        throw new Error('チームが見つかりません');
      }

      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color,
          teamId: userTeam.teamId,
        },
      });

      revalidatePath('/dashboard/quizzes');
      return { tag };
    } catch (error) {
      throw new Error('タグの作成に失敗しました');
    }
  });

// タグ更新
export const updateTag = action
  .schema(updateTagSchema)
  .action(async ({ parsedInput: data }) => {
    await getAuthenticatedUser();

    try {
      const { id, ...updateData } = data;
      const tag = await prisma.tag.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/dashboard/quizzes');
      return { tag };
    } catch (error) {
      throw new Error('タグの更新に失敗しました');
    }
  });

// タグ削除
export const deleteTag = action
  .schema(deleteTagSchema)
  .action(async ({ parsedInput: data }) => {
    await getAuthenticatedUser();

    try {
      await prisma.tag.delete({
        where: { id: data.id },
      });

      revalidatePath('/dashboard/quizzes');
      return { success: true };
    } catch (error) {
      throw new Error('タグの削除に失敗しました');
    }
  });

// クイズにタグを追加
export const addTagToQuiz = action
  .schema(addTagToQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          team: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new Error('クイズが見つからないか、編集権限がありません');
      }

      const quizTag = await prisma.quizTag.create({
        data: {
          quizId: data.quizId,
          tagId: data.tagId,
        },
      });

      revalidatePath('/dashboard/quizzes');
      revalidatePath(`/dashboard/quizzes/${data.quizId}`);
      return { quizTag };
    } catch (error) {
      throw new Error('タグの追加に失敗しました');
    }
  });

// クイズからタグを削除
export const removeTagFromQuiz = action
  .schema(removeTagFromQuizSchema)
  .action(async ({ parsedInput: data }) => {
    const userId = await getAuthenticatedUser();

    try {
      // クイズの所有者確認
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          team: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new Error('クイズが見つからないか、編集権限がありません');
      }

      await prisma.quizTag.deleteMany({
        where: {
          quizId: data.quizId,
          tagId: data.tagId,
        },
      });

      revalidatePath('/dashboard/quizzes');
      revalidatePath(`/dashboard/quizzes/${data.quizId}`);
      return { success: true };
    } catch (error) {
      throw new Error('タグの削除に失敗しました');
    }
  });

// タグ一覧取得
export const getTags = action.schema(getTagsSchema).action(async () => {
  const userId = await getAuthenticatedUser();

  try {
    // ユーザーのチーム一覧を取得
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = userTeams.map(tm => tm.teamId);

    const tags = await prisma.tag.findMany({
      where: {
        teamId: { in: teamIds },
      },
      include: {
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { tags };
  } catch (error) {
    throw new Error('タグ一覧の取得に失敗しました');
  }
});
