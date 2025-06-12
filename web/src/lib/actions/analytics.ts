'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { authAction } from './auth-action';

// 内部型定義（エクスポートしない）
interface TrendPoint {
  date: string;
  count: number;
  averageScore: number;
}

interface QuizAnalytics {
  totalResponses: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
  trend: TrendPoint[];
}

interface DashboardStats {
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

interface RecentActivity {
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

interface RecentQuiz {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  participants: number;
  questions: number;
  createdAt: Date;
}

interface UsageData {
  currentPlan: 'free' | 'pro' | 'enterprise';
  usage: {
    quizzes: { current: number; limit: number };
    participants: { current: number; limit: number };
    storage: { current: number; limit: number }; // in MB
    members: { current: number; limit: number };
  };
}

// クイズ分析取得用のスキーマ
const getQuizAnalyticsSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  range: z.enum(['all', '30d', '7d']).default('all'),
});

export const getQuizAnalytics = authAction
  .inputSchema(getQuizAnalyticsSchema)
  .action(async ({ parsedInput: { quizId, range }, ctx }) => {
    const { userId } = ctx;

    try {
      // Use transaction to ensure data consistency
      return await prisma.$transaction(async tx => {
        // ensure user has access to quiz via team membership
        const quiz = await tx.quiz.findFirst({
          where: {
            id: quizId,
            team: {
              members: { some: { userId } },
            },
          },
          select: { id: true },
        });

        if (!quiz) {
          throw new Error('Quiz not found');
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
                  return (
                    sum + (r.completedAt.getTime() - r.startedAt.getTime())
                  );
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

        return data;
      });
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  });

// ダッシュボード統計取得用のスキーマ（パラメータなし）
const getDashboardStatsSchema = z.object({});

export const getDashboardStats = authAction
  .inputSchema(getDashboardStatsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
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

      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  });

// 最近のアクティビティ取得用のスキーマ
const getRecentActivitiesSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
});

export const getRecentActivities = authAction
  .inputSchema(getRecentActivitiesSchema)
  .action(async ({ parsedInput: { limit }, ctx }) => {
    const { userId } = ctx;

    try {
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

      return limitedActivities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Failed to fetch recent activities');
    }
  });

// 最近のクイズ取得用のスキーマ
const getRecentQuizzesSchema = z.object({
  limit: z.number().min(1).max(50).default(5),
});

export const getRecentQuizzes = authAction
  .inputSchema(getRecentQuizzesSchema)
  .action(async ({ parsedInput: { limit }, ctx }) => {
    const { userId } = ctx;

    try {
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

      return data;
    } catch (error) {
      console.error('Error fetching recent quizzes:', error);
      throw new Error('Failed to fetch recent quizzes');
    }
  });

// 使用量データ取得用のスキーマ（パラメータなし）
const getUsageDataSchema = z.object({});

export const getUsageData = authAction
  .inputSchema(getUsageDataSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    try {
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
          currentPlan: 'free' as const,
          usage: {
            quizzes: { current: 0, limit: 5 },
            participants: { current: 0, limit: 300 },
            storage: { current: 0, limit: 100 },
            members: { current: 0, limit: 1 },
          },
        };
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

      return data;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw new Error('Failed to fetch usage data');
    }
  });
