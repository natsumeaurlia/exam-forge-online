'use server';

import { authAction } from './auth-action';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for team usage data
const getTeamUsageSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export interface TeamUsageData {
  quizzes: {
    total: number;
    thisMonth: number;
    thisYear: number;
  };
  responses: {
    total: number;
    thisMonth: number;
    thisYear: number;
  };
  questions: {
    maxPerQuiz: number;
    totalQuestions: number;
  };
  members: {
    total: number;
    active: number;
  };
  storage: {
    usedBytes: number;
    maxBytes: number;
  };
}

/**
 * Get real-time usage data for a team
 */
export const getTeamUsage = authAction
  .schema(getTeamUsageSchema)
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    const { userId } = ctx;

    // Verify team membership
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      throw new Error('Team not found or access denied');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get quiz statistics
    const [
      totalQuizzes,
      monthlyQuizzes,
      yearlyQuizzes,
      totalResponses,
      monthlyResponses,
      yearlyResponses,
      maxQuestionsInQuiz,
      totalQuestions,
      totalMembers,
      activeMembers,
    ] = await Promise.all([
      // Total quizzes
      prisma.quiz.count({
        where: { teamId },
      }),
      // Monthly quizzes
      prisma.quiz.count({
        where: {
          teamId,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Yearly quizzes
      prisma.quiz.count({
        where: {
          teamId,
          createdAt: { gte: startOfYear },
        },
      }),
      // Total responses
      prisma.quizResponse.count({
        where: {
          quiz: { teamId },
        },
      }),
      // Monthly responses
      prisma.quizResponse.count({
        where: {
          quiz: { teamId },
          createdAt: { gte: startOfMonth },
        },
      }),
      // Yearly responses
      prisma.quizResponse.count({
        where: {
          quiz: { teamId },
          createdAt: { gte: startOfYear },
        },
      }),
      // Maximum questions in a single quiz
      prisma.question.groupBy({
        by: ['quizId'],
        where: {
          quiz: { teamId },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 1,
      }),
      // Total questions across all quizzes
      prisma.question.count({
        where: {
          quiz: { teamId },
        },
      }),
      // Total team members
      prisma.teamMember.count({
        where: { teamId },
      }),
      // Active members (joined in last 30 days or have activity)
      prisma.teamMember.count({
        where: {
          teamId,
          OR: [
            {
              joinedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            {
              user: {
                createdQuizzes: {
                  some: {
                    teamId,
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    ]);

    // Get storage usage for the team
    const teamStorageUsage = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          include: {
            storage: true,
          },
        },
      },
    });

    const totalStorageUsed = teamStorageUsage.reduce(
      (total, member) => total + Number(member.user.storage?.usedBytes || 0),
      0
    );

    const maxStoragePerUser = 10 * 1024 * 1024 * 1024; // 10GB per user
    const totalMaxStorage = totalMembers * maxStoragePerUser;

    const usageData: TeamUsageData = {
      quizzes: {
        total: totalQuizzes,
        thisMonth: monthlyQuizzes,
        thisYear: yearlyQuizzes,
      },
      responses: {
        total: totalResponses,
        thisMonth: monthlyResponses,
        thisYear: yearlyResponses,
      },
      questions: {
        maxPerQuiz: maxQuestionsInQuiz[0]?._count.id || 0,
        totalQuestions,
      },
      members: {
        total: totalMembers,
        active: activeMembers,
      },
      storage: {
        usedBytes: totalStorageUsed,
        maxBytes: totalMaxStorage,
      },
    };

    return usageData;
  });

/**
 * Get current user's team usage data
 */
export const getCurrentUserTeamUsage = authAction.action(async ({ ctx }) => {
  const { userId } = ctx;

  // Get user's active team
  const activeTeamMember = await prisma.teamMember.findFirst({
    where: { userId },
    include: {
      team: {
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  if (!activeTeamMember) {
    throw new Error('No team found for user');
  }

  const usageData = await getTeamUsage({
    teamId: activeTeamMember.teamId,
  });

  return {
    teamId: activeTeamMember.teamId,
    teamName: activeTeamMember.team.name,
    planType: activeTeamMember.team.subscription?.plan.type || 'FREE',
    subscription: activeTeamMember.team.subscription,
    usage: usageData?.data,
  };
});
