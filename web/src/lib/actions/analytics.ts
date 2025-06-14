'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { authAction } from './auth-action';
import { AnalyticsWhereClause } from '@/types/database';

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
  .schema(getQuizAnalyticsSchema)
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

        const where: AnalyticsWhereClause = { quizId };
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
  .schema(getDashboardStatsSchema)
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
  .schema(getRecentActivitiesSchema)
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
  .schema(getRecentQuizzesSchema)
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
  .schema(getUsageDataSchema)
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

// チーム全体分析データの型定義
interface TeamAnalytics {
  overview: {
    totalQuizzes: number;
    totalParticipants: number;
    totalResponses: number;
    averageScore: number;
    overallPassRate: number;
    totalQuestions: number;
  };
  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  rankings: {
    popularQuizzes: Array<{
      id: string;
      title: string;
      responseCount: number;
      averageScore: number;
    }>;
    highScoreQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
    challengingQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
  };
  statistics: {
    quizzesByStatus: {
      published: number;
      draft: number;
      archived: number;
    };
    responsesByMonth: Array<{
      month: string;
      count: number;
    }>;
    topPerformers: Array<{
      name: string;
      averageScore: number;
      completedQuizzes: number;
    }>;
  };
}

// チーム全体分析データ取得用のスキーマ
const getTeamAnalyticsSchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export const getTeamAnalytics = authAction
  .schema(getTeamAnalyticsSchema)
  .action(async ({ parsedInput: { range }, ctx }) => {
    const { userId } = ctx;

    try {
      // Get user's teams
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
      const teamIds = userTeams.map(tm => tm.teamId);

      if (teamIds.length === 0) {
        throw new Error('No teams found for user');
      }

      // Calculate date range
      const endDate = endOfDay(new Date());
      let startDate: Date;

      switch (range) {
        case '7d':
          startDate = startOfDay(subDays(endDate, 7));
          break;
        case '30d':
          startDate = startOfDay(subDays(endDate, 30));
          break;
        case '90d':
          startDate = startOfDay(subDays(endDate, 90));
          break;
        case 'all':
        default:
          startDate = startOfDay(subDays(endDate, 365)); // 1年前まで
          break;
      }

      // 並列でデータを取得
      const [
        allQuizzes,
        allResponses,
        recentResponses,
        quizStats,
        participantStats,
      ] = await Promise.all([
        // 全クイズ取得
        prisma.quiz.findMany({
          where: { teamId: { in: teamIds } },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                responses: true,
                questions: true,
              },
            },
          },
        }),

        // 全回答取得
        prisma.quizResponse.findMany({
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: { not: null },
          },
          select: {
            id: true,
            score: true,
            totalPoints: true,
            isPassed: true,
            completedAt: true,
            participantEmail: true,
            quiz: {
              select: {
                id: true,
                title: true,
              },
            },
            user: {
              select: {
                name: true,
              },
            },
          },
        }),

        // 期間内の回答
        prisma.quizResponse.findMany({
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            completedAt: true,
            score: true,
            totalPoints: true,
            isPassed: true,
          },
        }),

        // クイズ別統計
        prisma.quiz.findMany({
          where: {
            teamId: { in: teamIds },
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            title: true,
            responses: {
              where: { completedAt: { not: null } },
              select: {
                score: true,
                totalPoints: true,
                isPassed: true,
              },
            },
          },
        }),

        // 参加者統計
        prisma.quizResponse.groupBy({
          by: ['participantEmail'],
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: { not: null },
            participantEmail: { not: null },
          },
          _count: true,
          _avg: {
            score: true,
          },
        }),
      ]);

      // 概要統計を計算
      const totalQuizzes = allQuizzes.length;
      const totalParticipants = new Set([
        ...allResponses.map(r => r.participantEmail).filter(Boolean),
        ...allResponses.map(r => r.user?.name).filter(Boolean),
      ]).size;
      const totalResponses = allResponses.length;
      const totalQuestions = allQuizzes.reduce(
        (sum, quiz) => sum + quiz._count.questions,
        0
      );

      const validScores = allResponses.filter(
        r => r.score !== null && r.totalPoints > 0
      );
      const averageScore =
        validScores.length > 0
          ? validScores.reduce(
              (sum, r) => sum + (r.score! / r.totalPoints) * 100,
              0
            ) / validScores.length
          : 0;

      const overallPassRate =
        allResponses.length > 0
          ? (allResponses.filter(r => r.isPassed).length /
              allResponses.length) *
            100
          : 0;

      // トレンドデータを生成
      const dailyTrend = generateTrendData(
        recentResponses,
        'day',
        startDate,
        endDate
      );
      const weeklyTrend = generateTrendData(
        recentResponses,
        'week',
        startDate,
        endDate
      );
      const monthlyTrend = generateTrendData(
        recentResponses,
        'month',
        startDate,
        endDate
      );

      // ランキングデータを生成
      const quizAnalytics = quizStats.map(quiz => {
        const responses = quiz.responses;
        const responseCount = responses.length;
        const validResponses = responses.filter(
          r => r.score !== null && r.totalPoints > 0
        );
        const avgScore =
          validResponses.length > 0
            ? validResponses.reduce(
                (sum, r) => sum + (r.score! / r.totalPoints) * 100,
                0
              ) / validResponses.length
            : 0;

        return {
          id: quiz.id,
          title: quiz.title,
          responseCount,
          averageScore: avgScore,
        };
      });

      const popularQuizzes = [...quizAnalytics]
        .sort((a, b) => b.responseCount - a.responseCount)
        .slice(0, 10);

      const highScoreQuizzes = [...quizAnalytics]
        .filter(q => q.responseCount >= 3) // 最低3回答以上
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 10);

      const challengingQuizzes = [...quizAnalytics]
        .filter(q => q.responseCount >= 3) // 最低3回答以上
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 10);

      // ステータス別クイズ数
      const quizzesByStatus = {
        published: allQuizzes.filter(q => q.status === 'PUBLISHED').length,
        draft: allQuizzes.filter(q => q.status === 'DRAFT').length,
        archived: allQuizzes.filter(q => q.status === 'ARCHIVED').length,
      };

      // 月別回答数
      const responsesByMonth = generateMonthlyResponseData(allResponses);

      // トップパフォーマー
      const topPerformers = participantStats
        .filter(p => p._count > 2) // 最低3回答以上
        .sort((a, b) => (b._avg.score || 0) - (a._avg.score || 0))
        .slice(0, 10)
        .map(p => ({
          name: p.participantEmail || 'Anonymous',
          averageScore: p._avg.score || 0,
          completedQuizzes: p._count,
        }));

      const data: TeamAnalytics = {
        overview: {
          totalQuizzes,
          totalParticipants,
          totalResponses,
          averageScore: Math.round(averageScore * 100) / 100,
          overallPassRate: Math.round(overallPassRate * 100) / 100,
          totalQuestions,
        },
        trends: {
          daily: dailyTrend,
          weekly: weeklyTrend,
          monthly: monthlyTrend,
        },
        rankings: {
          popularQuizzes,
          highScoreQuizzes,
          challengingQuizzes,
        },
        statistics: {
          quizzesByStatus,
          responsesByMonth,
          topPerformers,
        },
      };

      return data;
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      throw new Error('Failed to fetch team analytics');
    }
  });

// トレンドデータ生成のヘルパー関数
function generateTrendData(
  responses: Array<{
    completedAt: Date | null;
    score: number | null;
    totalPoints: number;
  }>,
  interval: 'day' | 'week' | 'month',
  startDate: Date,
  endDate: Date
): TrendPoint[] {
  const validResponses = responses.filter(
    r => r.completedAt && r.score !== null
  );

  const dateMap = new Map<
    string,
    { count: number; totalScore: number; totalPossible: number }
  >();

  // 日付の範囲を生成
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = formatDateKey(current, interval);
    dateMap.set(key, { count: 0, totalScore: 0, totalPossible: 0 });

    if (interval === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  // 回答データを集計
  validResponses.forEach(response => {
    const key = formatDateKey(response.completedAt!, interval);
    const existing = dateMap.get(key);
    if (existing) {
      existing.count++;
      existing.totalScore += response.score!;
      existing.totalPossible += response.totalPoints;
    }
  });

  // 結果を配列に変換
  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    averageScore:
      data.count > 0 ? (data.totalScore / data.totalPossible) * 100 : 0,
  }));
}

function formatDateKey(date: Date, interval: 'day' | 'week' | 'month'): string {
  if (interval === 'day') {
    return date.toISOString().split('T')[0];
  } else if (interval === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

function generateMonthlyResponseData(
  responses: Array<{ completedAt: Date | null }>
): Array<{ month: string; count: number }> {
  const monthMap = new Map<string, number>();

  responses.forEach(response => {
    if (response.completedAt) {
      const month = `${response.completedAt.getFullYear()}-${String(response.completedAt.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    }
  });

  return Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // 最新12ヶ月
}
