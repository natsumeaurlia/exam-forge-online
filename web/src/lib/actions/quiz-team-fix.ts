'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// チーム作成時の競合状態を修正
export async function createTeamSafely(
  userId: string,
  userName?: string | null
) {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      return await prisma.$transaction(
        async tx => {
          // トランザクション内でユーザー存在確認
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true },
          });

          if (!user) {
            throw new Error('ユーザーが見つかりません');
          }

          // ユニークなslugを生成（トランザクション内で確認）
          let teamSlug = `team-${userId.substring(0, 8)}`;
          let slugSuffix = 0;

          // トランザクション内でslugの一意性を確認
          while (true) {
            const existingTeam = await tx.team.findUnique({
              where: { slug: teamSlug },
            });

            if (!existingTeam) break;

            slugSuffix++;
            teamSlug = `team-${userId.substring(0, 8)}-${slugSuffix}`;
          }

          // チームを作成
          const team = await tx.team.create({
            data: {
              name: `${user.name || 'ユーザー'}のチーム`,
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
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2034: Transaction failed due to a write conflict or a deadlock
        if (error.code === 'P2034' && retries < MAX_RETRIES - 1) {
          retries++;
          // 指数バックオフで待機
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retries) * 100)
          );
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error('チーム作成に失敗しました（最大再試行回数超過）');
}
