'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

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
