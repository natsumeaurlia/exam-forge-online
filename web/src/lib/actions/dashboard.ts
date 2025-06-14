'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// Activity types enum
export type ActivityType =
  | 'quiz_created'
  | 'quiz_completed'
  | 'user_joined'
  | 'quiz_edited'
  | 'quiz_shared'
  | 'quiz_published';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  metadata?: {
    quizId?: string;
    quizTitle?: string;
    score?: number;
    participants?: number;
  };
}

export interface UsageStats {
  quizzes: {
    current: number;
    limit: number;
  };
  participants: {
    current: number;
    limit: number;
  };
  storage: {
    current: number; // in MB
    limit: number; // in MB
  };
  members: {
    current: number;
    limit: number;
  };
}

// スキーマ定義
const getActivitiesSchema = z.object({
  teamId: z.string(),
  limit: z.number().min(1).max(50).default(10),
});

const getUsageStatsSchema = z.object({
  teamId: z.string(),
});

// チームのアクティビティを取得
export const getTeamActivities = action
  .schema(getActivitiesSchema)
  .action(async ({ parsedInput: { teamId, limit } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // チームメンバーかどうか確認
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied');
    }

    const activities: ActivityItem[] = [];

    // 1. クイズ作成アクティビティ
    const quizCreated = await prisma.quiz.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit * 0.4), // 40%
      include: {
        createdBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    quizCreated.forEach(quiz => {
      activities.push({
        id: `quiz_created_${quiz.id}`,
        type: 'quiz_created',
        title: 'Quiz Created',
        description: `New quiz "${quiz.title}" was created`,
        timestamp: quiz.createdAt,
        user: {
          id: quiz.createdBy.id,
          name: quiz.createdBy.name || 'Unknown User',
          image: quiz.createdBy.image || undefined,
        },
        metadata: {
          quizId: quiz.id,
          quizTitle: quiz.title,
        },
      });
    });

    // 2. クイズ完了アクティビティ
    const quizCompleted = await prisma.quizResponse.findMany({
      where: {
        quiz: { teamId },
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: Math.floor(limit * 0.4), // 40%
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        quiz: {
          select: { id: true, title: true },
        },
      },
    });

    quizCompleted.forEach(response => {
      if (response.user && response.completedAt) {
        activities.push({
          id: `quiz_completed_${response.id}`,
          type: 'quiz_completed',
          title: 'Quiz Completed',
          description: `${response.user.name} completed "${response.quiz.title}"`,
          timestamp: response.completedAt,
          user: {
            id: response.user.id,
            name: response.user.name || 'Unknown User',
            image: response.user.image || undefined,
          },
          metadata: {
            quizId: response.quiz.id,
            quizTitle: response.quiz.title,
            score: response.score || undefined,
          },
        });
      }
    });

    // 3. ユーザー参加アクティビティ
    const userJoined = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { joinedAt: 'desc' },
      take: Math.floor(limit * 0.2), // 20%
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    userJoined.forEach(member => {
      activities.push({
        id: `user_joined_${member.id}`,
        type: 'user_joined',
        title: 'New User Joined',
        description: `${member.user.name} joined the team`,
        timestamp: member.joinedAt,
        user: {
          id: member.user.id,
          name: member.user.name || 'Unknown User',
          image: member.user.image || undefined,
        },
      });
    });

    // 日時順でソート
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  });

// チームの使用量統計を取得
export const getTeamUsageStats = action
  .schema(getUsageStatsSchema)
  .action(async ({ parsedInput: { teamId } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // チームメンバーかどうか確認
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied');
    }

    // チームとプラン情報を取得
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            quizzes: true,
            members: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // プランの制限値を取得
    const plan = team.subscription?.plan;
    const limits = {
      quizzes: plan?.maxQuizzes || 5, // Free plan default
      members: plan?.maxMembers || 3, // Free plan default
      storage: plan?.maxStorageMB || 100, // Free plan default (MB)
      responsesPerMonth: plan?.maxResponsesPerMonth || 100, // Free plan default
    };

    // 現在の月の参加者数を計算
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const monthlyParticipants = await prisma.quizResponse.count({
      where: {
        quiz: { teamId },
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // ストレージ使用量を取得
    const storageUsage = await prisma.userStorage.aggregate({
      where: {
        user: {
          teamMembers: {
            some: { teamId },
          },
        },
      },
      _sum: {
        usedBytes: true,
      },
    });

    const usedStorageMB = Math.round(
      Number(storageUsage._sum.usedBytes || 0) / (1024 * 1024)
    );

    const usageStats: UsageStats = {
      quizzes: {
        current: team._count.quizzes,
        limit: limits.quizzes,
      },
      participants: {
        current: monthlyParticipants,
        limit: limits.responsesPerMonth,
      },
      storage: {
        current: usedStorageMB,
        limit: limits.storage,
      },
      members: {
        current: team._count.members,
        limit: limits.members,
      },
    };

    return usageStats;
  });

// プラン情報を取得
export const getTeamPlanInfo = action
  .schema(getUsageStatsSchema)
  .action(async ({ parsedInput: { teamId } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return {
      planType: team.subscription?.plan?.type || 'FREE',
      planName: team.subscription?.plan?.name || 'Free Plan',
      nextBillingDate: team.subscription?.currentPeriodEnd,
      status: team.subscription?.status || 'ACTIVE',
    };
  });
