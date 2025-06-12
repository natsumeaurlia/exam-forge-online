'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface TrendPoint {
  date: string;
  count: number;
  averageScore: number;
}

export interface QuizAnalytics {
  totalResponses: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
  trend: TrendPoint[];
}

export async function getQuizAnalytics(
  quizId: string,
  range: 'all' | '30d' | '7d' = 'all'
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    // Use transaction to ensure data consistency
    return await prisma.$transaction(async tx => {
      // ensure user has access to quiz via team membership
      const quiz = await tx.quiz.findFirst({
        where: {
          id: quizId,
          team: {
            members: { some: { userId: session.user.id } },
          },
        },
        select: { id: true },
      });

      if (!quiz) {
        return { success: false, error: 'Quiz not found', data: null } as const;
      }

      const where: any = { quizId };
      if (range === '30d') {
        where.completedAt = { gte: subDays(new Date(), 30) };
      } else if (range === '7d') {
        where.completedAt = { gte: subDays(new Date(), 7) };
      }

      // Use aggregation for better performance
      const [aggregated, passedCount, responses, completedResponses] =
        await Promise.all([
          tx.quizResponse.aggregate({
            where,
            _count: true,
            _avg: {
              score: true,
            },
          }),
          tx.quizResponse.count({
            where: {
              ...where,
              isPassed: true,
            },
          }),
          // Only fetch necessary data for time calculation and trend
          tx.quizResponse.findMany({
            where,
            select: {
              score: true,
              startedAt: true,
              completedAt: true,
            },
          }),
          // Count responses with non-null scores for accurate average calculation
          tx.quizResponse.count({
            where: {
              ...where,
              score: { not: null },
            },
          }),
        ]);

      const totalResponses = aggregated._count;
      // Fix: Only calculate average from responses with non-null scores
      const averageScore =
        completedResponses > 0 && aggregated._avg.score !== null
          ? aggregated._avg.score
          : 0;
      const passRate =
        totalResponses === 0 ? 0 : (passedCount / totalResponses) * 100;

      // Calculate average time
      const averageTime =
        totalResponses === 0
          ? 0
          : responses.reduce((sum, r) => {
              if (r.completedAt) {
                return sum + (r.completedAt.getTime() - r.startedAt.getTime());
              }
              return sum;
            }, 0) /
            totalResponses /
            1000; // seconds

      const trendMap = new Map<string, { count: number; avg: number }>();
      for (const r of responses) {
        if (!r.completedAt) continue;
        const day = r.completedAt.toISOString().slice(0, 10);
        const existing = trendMap.get(day) || { count: 0, avg: 0 };
        const newCount = existing.count + 1;
        const newAvg =
          (existing.avg * existing.count + (r.score ?? 0)) / newCount;
        trendMap.set(day, { count: newCount, avg: newAvg });
      }

      const trend: TrendPoint[] = Array.from(trendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, val]) => ({
          date,
          count: val.count,
          averageScore: val.avg,
        }));

      const data: QuizAnalytics = {
        totalResponses,
        averageScore,
        passRate,
        averageTime,
        trend,
      };

      return { success: true, error: null, data } as const;
    });
  } catch (error) {
    console.error('Error fetching quiz analytics:', error);
    return {
      success: false,
      error: 'Failed to fetch analytics',
      data: null,
    } as const;
  }
}

export interface DashboardStats {
  totalQuizzes: number;
  monthlyParticipants: number;
  averageScore: number;
  activeQuizzes: number;
  percentageChanges: {
    totalQuizzes: number;
    monthlyParticipants: number;
    averageScore: number;
    activeQuizzes: number;
  };
}

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    const teamIds = userTeams.map(tm => tm.teamId);

    // Current month stats
    const [totalQuizzes, activeQuizzes, monthlyResponses, monthlyScores] =
      await Promise.all([
        prisma.quiz.count({
          where: { teamId: { in: teamIds } },
        }),
        prisma.quiz.count({
          where: {
            teamId: { in: teamIds },
            publishedAt: { not: null },
          },
        }),
        prisma.quizResponse.count({
          where: {
            quiz: { teamId: { in: teamIds } },
            startedAt: { gte: startOfMonth },
          },
        }),
        prisma.quizResponse.aggregate({
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: { gte: startOfMonth },
            score: { not: null },
          },
          _avg: { score: true },
        }),
      ]);

    // Last month stats for comparison
    const [
      lastMonthQuizzes,
      lastMonthActive,
      lastMonthResponses,
      lastMonthScores,
    ] = await Promise.all([
      prisma.quiz.count({
        where: {
          teamId: { in: teamIds },
          createdAt: { lte: endOfLastMonth },
        },
      }),
      prisma.quiz.count({
        where: {
          teamId: { in: teamIds },
          publishedAt: { not: null, lte: endOfLastMonth },
        },
      }),
      prisma.quizResponse.count({
        where: {
          quiz: { teamId: { in: teamIds } },
          startedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.quizResponse.aggregate({
        where: {
          quiz: { teamId: { in: teamIds } },
          completedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          score: { not: null },
        },
        _avg: { score: true },
      }),
    ]);

    const averageScore = monthlyScores._avg.score || 0;
    const lastMonthAverage = lastMonthScores._avg.score || 0;

    const data: DashboardStats = {
      totalQuizzes,
      monthlyParticipants: monthlyResponses,
      averageScore,
      activeQuizzes,
      percentageChanges: {
        totalQuizzes:
          lastMonthQuizzes === 0
            ? 100
            : ((totalQuizzes - lastMonthQuizzes) / lastMonthQuizzes) * 100,
        monthlyParticipants:
          lastMonthResponses === 0
            ? 100
            : ((monthlyResponses - lastMonthResponses) / lastMonthResponses) *
              100,
        averageScore:
          lastMonthAverage === 0
            ? 0
            : ((averageScore - lastMonthAverage) / lastMonthAverage) * 100,
        activeQuizzes:
          lastMonthActive === 0
            ? 100
            : ((activeQuizzes - lastMonthActive) / lastMonthActive) * 100,
      },
    };

    return { success: true, error: null, data } as const;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard stats',
      data: null,
    } as const;
  }
}

export interface RecentActivity {
  id: string;
  type:
    | 'quiz_completed'
    | 'quiz_created'
    | 'user_joined'
    | 'quiz_edited'
    | 'quiz_shared';
  title: string;
  timestamp: Date;
  details?: string;
}

export async function getRecentActivities(limit = 10) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    const userId = session.user.id;

    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    const teamIds = userTeams.map(tm => tm.teamId);

    // Fetch various activity types
    const [quizResponses, newQuizzes, newMembers, updatedQuizzes] =
      await Promise.all([
        // Quiz completions
        prisma.quizResponse.findMany({
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: { not: null },
          },
          select: {
            id: true,
            completedAt: true,
            user: { select: { name: true } },
            quiz: { select: { title: true } },
          },
          orderBy: { completedAt: 'desc' },
          take: limit,
        }),
        // New quizzes
        prisma.quiz.findMany({
          where: { teamId: { in: teamIds } },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        // New team members
        prisma.teamMember.findMany({
          where: { teamId: { in: teamIds } },
          select: {
            id: true,
            createdAt: true,
            user: { select: { name: true } },
            team: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        // Recently updated quizzes
        prisma.quiz.findMany({
          where: {
            teamId: { in: teamIds },
            updatedAt: { gt: subDays(new Date(), 7) },
          },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            createdAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        }),
      ]);

    // Combine and format activities
    const activities: RecentActivity[] = [];

    quizResponses.forEach(response => {
      if (response.completedAt) {
        activities.push({
          id: response.id,
          type: 'quiz_completed',
          title: `${response.user?.name || 'Anonymous'} completed ${response.quiz.title}`,
          timestamp: response.completedAt,
        });
      }
    });

    newQuizzes.forEach(quiz => {
      activities.push({
        id: quiz.id,
        type: 'quiz_created',
        title: `New quiz created: ${quiz.title}`,
        timestamp: quiz.createdAt,
      });
    });

    newMembers.forEach(member => {
      activities.push({
        id: member.id,
        type: 'user_joined',
        title: `${member.user.name || 'User'} joined ${member.team.name}`,
        timestamp: member.createdAt,
      });
    });

    updatedQuizzes.forEach(quiz => {
      // Only include if it's an update (not same as creation time)
      if (quiz.updatedAt.getTime() - quiz.createdAt.getTime() > 60000) {
        activities.push({
          id: quiz.id,
          type: 'quiz_edited',
          title: `Quiz updated: ${quiz.title}`,
          timestamp: quiz.updatedAt,
        });
      }
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const limitedActivities = activities.slice(0, limit);

    return { success: true, error: null, data: limitedActivities } as const;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return {
      success: false,
      error: 'Failed to fetch recent activities',
      data: null,
    } as const;
  }
}

export interface RecentQuiz {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  participants: number;
  questions: number;
  createdAt: Date;
}

export async function getRecentQuizzes(limit = 5) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    const userId = session.user.id;

    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });
    const teamIds = userTeams.map(tm => tm.teamId);

    const quizzes = await prisma.quiz.findMany({
      where: { teamId: { in: teamIds } },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const data: RecentQuiz[] = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      status: quiz.publishedAt ? 'published' : 'draft',
      participants: quiz._count.responses,
      questions: quiz._count.questions,
      createdAt: quiz.createdAt,
    }));

    return { success: true, error: null, data } as const;
  } catch (error) {
    console.error('Error fetching recent quizzes:', error);
    return {
      success: false,
      error: 'Failed to fetch recent quizzes',
      data: null,
    } as const;
  }
}

export interface UsageData {
  currentPlan: 'free' | 'pro' | 'enterprise';
  usage: {
    quizzes: { current: number; limit: number };
    participants: { current: number; limit: number };
    storage: { current: number; limit: number }; // in MB
    members: { current: number; limit: number };
  };
}

export async function getUsageData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    const userId = session.user.id;

    // Get user's teams and their plans
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            subscription: {
              include: { plan: true },
            },
            _count: {
              select: {
                members: true,
                quizzes: true,
              },
            },
          },
        },
      },
    });

    // For simplicity, use the highest plan among all teams
    let currentPlan: 'free' | 'pro' | 'enterprise' = 'free';
    let teamWithHighestPlan = userTeams[0]?.team;

    for (const membership of userTeams) {
      const team = membership.team;
      if (team.subscription?.plan.type === 'PREMIUM') {
        currentPlan = 'enterprise';
        teamWithHighestPlan = team;
        break;
      } else if (team.subscription?.plan.type === 'PRO') {
        currentPlan = 'pro';
        teamWithHighestPlan = team;
      }
    }

    if (!teamWithHighestPlan) {
      // No teams found, return default free limits
      return {
        success: true,
        error: null,
        data: {
          currentPlan: 'free',
          usage: {
            quizzes: { current: 0, limit: 5 },
            participants: { current: 0, limit: 300 },
            storage: { current: 0, limit: 100 },
            members: { current: 0, limit: 1 },
          },
        },
      } as const;
    }

    // Get usage stats for the team with highest plan
    const [monthlyParticipants, storageUsage] = await Promise.all([
      prisma.quizResponse.count({
        where: {
          quiz: { teamId: teamWithHighestPlan.id },
          startedAt: { gte: startOfDay(subDays(new Date(), 30)) },
        },
      }),
      // Storage calculation would need file tracking implementation
      // For now, return estimated value based on number of quizzes
      Promise.resolve(teamWithHighestPlan._count.quizzes * 15), // Estimate 15MB per quiz
    ]);

    // Define plan limits
    const planLimits = {
      free: {
        quizzes: 5,
        participants: 300,
        storage: 100,
        members: 1,
      },
      pro: {
        quizzes: -1, // unlimited
        participants: -1, // unlimited
        storage: 10240, // 10GB
        members: -1, // unlimited
      },
      enterprise: {
        quizzes: -1,
        participants: -1,
        storage: -1, // unlimited
        members: -1,
      },
    };

    const limits = planLimits[currentPlan];

    const data: UsageData = {
      currentPlan,
      usage: {
        quizzes: {
          current: teamWithHighestPlan._count.quizzes,
          limit: limits.quizzes,
        },
        participants: {
          current: monthlyParticipants,
          limit: limits.participants,
        },
        storage: {
          current: storageUsage,
          limit: limits.storage,
        },
        members: {
          current: teamWithHighestPlan._count.members,
          limit: limits.members,
        },
      },
    };

    return { success: true, error: null, data } as const;
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return {
      success: false,
      error: 'Failed to fetch usage data',
      data: null,
    } as const;
  }
}
