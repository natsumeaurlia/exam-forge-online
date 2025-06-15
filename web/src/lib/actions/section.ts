'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createSectionSchema,
  updateSectionSchema,
  deleteSectionSchema,
  reorderSectionsSchema,
  moveQuestionToSectionSchema,
} from '@/types/quiz-schemas';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// ユーザーとクイズの権限チェック
async function checkQuizPermission(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
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

  if (!quiz) {
    throw new Error('クイズが見つからないか、権限がありません');
  }

  return quiz;
}

// セクション作成
export const createSection = action
  .schema(createSectionSchema)
  .action(async ({ parsedInput: { title, description, quizId } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // クイズの権限チェック
    await checkQuizPermission(quizId, session.user.id);

    // 新しいセクションの順序を取得
    const lastSection = await prisma.section.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = lastSection ? lastSection.order + 1 : 1;

    // セクション作成
    const section = await prisma.section.create({
      data: {
        title,
        description,
        quizId,
        order: newOrder,
      },
    });

    // キャッシュを無効化
    revalidatePath(`/dashboard/quizzes/${quizId}/edit`);
    revalidateTag(`quiz-${quizId}`);

    return {
      success: true,
      data: section,
      message: 'セクションを作成しました',
    };
  });

// セクション更新
export const updateSection = action
  .schema(updateSectionSchema)
  .action(async ({ parsedInput: { id, title, description } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // セクションを取得してクイズの権限チェック
    const existingSection = await prisma.section.findUnique({
      where: { id },
      select: { quizId: true },
    });

    if (!existingSection) {
      throw new Error('セクションが見つかりません');
    }

    await checkQuizPermission(existingSection.quizId, session.user.id);

    // セクション更新
    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    // キャッシュを無効化
    revalidatePath(`/dashboard/quizzes/${existingSection.quizId}/edit`);
    revalidateTag(`quiz-${existingSection.quizId}`);

    return {
      success: true,
      data: section,
      message: 'セクションを更新しました',
    };
  });

// セクション削除
export const deleteSection = action
  .schema(deleteSectionSchema)
  .action(async ({ parsedInput: { id } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // セクションを取得してクイズの権限チェック
    const existingSection = await prisma.section.findUnique({
      where: { id },
      select: { quizId: true, order: true },
    });

    if (!existingSection) {
      throw new Error('セクションが見つかりません');
    }

    await checkQuizPermission(existingSection.quizId, session.user.id);

    // セクション内の問題を確認
    const questionsInSection = await prisma.question.count({
      where: { sectionId: id },
    });

    if (questionsInSection > 0) {
      // セクション内の問題をセクションなしに移動
      await prisma.question.updateMany({
        where: { sectionId: id },
        data: { sectionId: null },
      });
    }

    // セクション削除
    await prisma.section.delete({
      where: { id },
    });

    // 後続のセクションの順序を調整
    await prisma.section.updateMany({
      where: {
        quizId: existingSection.quizId,
        order: { gt: existingSection.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    // キャッシュを無効化
    revalidatePath(`/dashboard/quizzes/${existingSection.quizId}/edit`);
    revalidateTag(`quiz-${existingSection.quizId}`);

    return {
      success: true,
      message: 'セクションを削除しました',
    };
  });

// セクション順序変更
export const reorderSections = action
  .schema(reorderSectionsSchema)
  .action(async ({ parsedInput: { quizId, sectionIds } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // クイズの権限チェック
    await checkQuizPermission(quizId, session.user.id);

    // 全セクションが指定されたクイズに属することを確認
    const sections = await prisma.section.findMany({
      where: {
        id: { in: sectionIds },
        quizId,
      },
    });

    if (sections.length !== sectionIds.length) {
      throw new Error('無効なセクションIDが含まれています');
    }

    // トランザクションでセクションの順序を更新
    await prisma.$transaction(
      sectionIds.map((sectionId, index) =>
        prisma.section.update({
          where: { id: sectionId },
          data: { order: index + 1 },
        })
      )
    );

    // キャッシュを無効化
    revalidatePath(`/dashboard/quizzes/${quizId}/edit`);
    revalidateTag(`quiz-${quizId}`);

    return {
      success: true,
      message: 'セクションの順序を変更しました',
    };
  });

// 問題のセクション移動
export const moveQuestionToSection = action
  .schema(moveQuestionToSectionSchema)
  .action(async ({ parsedInput: { questionId, sectionId } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // 問題を取得してクイズの権限チェック
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question) {
      throw new Error('問題が見つかりません');
    }

    await checkQuizPermission(question.quizId, session.user.id);

    // セクションが指定されている場合、同じクイズのセクションかチェック
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { quizId: true },
      });

      if (!section || section.quizId !== question.quizId) {
        throw new Error('無効なセクションです');
      }
    }

    // 問題のセクションを更新
    await prisma.question.update({
      where: { id: questionId },
      data: { sectionId },
    });

    // キャッシュを無効化
    revalidatePath(`/dashboard/quizzes/${question.quizId}/edit`);
    revalidateTag(`quiz-${question.quizId}`);

    return {
      success: true,
      message: sectionId
        ? '問題をセクションに移動しました'
        : '問題をセクションから外しました',
    };
  });

// セクション一覧取得（キャッシュ付き）
export async function getSections(quizId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  await checkQuizPermission(quizId, session.user.id);

  const sections = await prisma.section.findMany({
    where: { quizId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          text: true,
          type: true,
          points: true,
          order: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  return sections;
}

// セクション詳細取得
export async function getSection(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
      quiz: {
        select: {
          id: true,
          title: true,
          teamId: true,
        },
      },
    },
  });

  if (!section) {
    throw new Error('セクションが見つかりません');
  }

  await checkQuizPermission(section.quiz.id, session.user.id);

  return section;
}
