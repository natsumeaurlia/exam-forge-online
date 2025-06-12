import { createSafeActionClient } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '../utils/auth';
import {
  createTagSchema,
  updateTagSchema,
  deleteTagSchema,
  addTagToQuizSchema,
  removeTagFromQuizSchema,
  getTagsSchema,
} from '@/types/quiz-schemas';
import { authAction } from './auth';

const actionClient = createSafeActionClient();

async function getAuthenticatedUserId() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('認証が必要です');
  }
  return user.id;
}

// タグ作成
export const createTag = authAction
  .inputSchema(createTagSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

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
export const updateTag = authAction
  .inputSchema(updateTagSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

    try {
      const { id, ...updateData } = data;

      // タグの所有権確認 - ユーザーのチームに属するタグのみ更新可能
      const tag = await prisma.tag.findFirst({
        where: {
          id,
          team: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      });

      if (!tag) {
        throw new Error('タグが見つからないか、編集権限がありません');
      }

      const updatedTag = await prisma.tag.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/dashboard/quizzes');
      return { tag: updatedTag };
    } catch (error) {
      throw new Error('タグの更新に失敗しました');
    }
  });

// タグ削除
export const deleteTag = authAction
  .inputSchema(deleteTagSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

    try {
      // タグの所有権確認 - ユーザーのチームに属するタグのみ削除可能
      const tag = await prisma.tag.findFirst({
        where: {
          id: data.id,
          team: {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      });

      if (!tag) {
        throw new Error('タグが見つからないか、削除権限がありません');
      }

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
export const addTagToQuiz = authAction
  .inputSchema(addTagToQuizSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

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
export const removeTagFromQuiz = authAction
  .inputSchema(removeTagFromQuizSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

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
export const getTags = authAction
  .inputSchema(getTagsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

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
