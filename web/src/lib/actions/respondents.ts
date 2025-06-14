'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { User, QuizResponse, Quiz } from '@prisma/client';

type QuizResponseWithUserAndQuiz = QuizResponse & {
  user: User | null;
  quiz: Pick<Quiz, 'title'>;
};

const getRespondentsSchema = z.object({
  teamId: z.string(),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'blocked']).default('all'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const getRespondentDetailsSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});

export interface RespondentSummary {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  quizzesCompleted: number;
  averageScore: number;
  lastActivity: Date | null;
  totalPoints: number;
  status: 'active' | 'inactive' | 'blocked';
}

export interface RespondentDetails extends RespondentSummary {
  quizResponses: {
    id: string;
    quizTitle: string;
    score: number | null;
    totalPoints: number;
    isPassed: boolean | null;
    completedAt: Date | null;
    duration: number; // in minutes
  }[];
}

export async function getRespondents(
  input: z.infer<typeof getRespondentsSchema>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    const validatedInput = getRespondentsSchema.parse(input);
    const { teamId, search, status, page, limit } = validatedInput;

    // Verify team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
      },
    });

    if (!teamMember) {
      return { error: 'Not a member of this team' };
    }

    const skip = (page - 1) * limit;

    // Get users who have taken quizzes from this team
    const quizResponsesQuery = prisma.quizResponse.findMany({
      where: {
        quiz: { teamId },
        userId: { not: null },
        ...(search && {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        user: true,
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const quizResponses = await quizResponsesQuery;

    // Group by user and calculate statistics
    const userStatsMap = new Map<
      string,
      {
        user: User;
        responses: QuizResponseWithUserAndQuiz[];
        lastActivity: Date | null;
      }
    >();

    quizResponses.forEach(response => {
      if (!response.user) return;

      const userId = response.user.id;
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          user: response.user,
          responses: [],
          lastActivity: null,
        });
      }

      const userStats = userStatsMap.get(userId)!;
      userStats.responses.push(response);

      if (
        response.completedAt &&
        (!userStats.lastActivity ||
          response.completedAt > userStats.lastActivity)
      ) {
        userStats.lastActivity = response.completedAt;
      }
    });

    // Convert to respondent summaries
    const allRespondents: RespondentSummary[] = [];

    userStatsMap.forEach(({ user, responses, lastActivity }) => {
      const completedResponses = responses.filter(r => r.completedAt);
      const totalScore = completedResponses.reduce(
        (sum, r) => sum + (r.score || 0),
        0
      );
      const totalPoints = completedResponses.reduce(
        (sum, r) => sum + r.totalPoints,
        0
      );
      const averageScore =
        completedResponses.length > 0
          ? totalScore / completedResponses.length
          : 0;

      // Determine status based on last activity
      let userStatus: 'active' | 'inactive' | 'blocked' = 'active';
      if (lastActivity) {
        const daysSinceLastActivity =
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastActivity > 30) {
          userStatus = 'inactive';
        }
      }

      allRespondents.push({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        quizzesCompleted: completedResponses.length,
        averageScore,
        lastActivity,
        totalPoints,
        status: userStatus,
      });
    });

    // Apply status filter
    const filteredRespondents =
      status === 'all'
        ? allRespondents
        : allRespondents.filter(r => r.status === status);

    // Sort by last activity (most recent first)
    filteredRespondents.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

    // Paginate
    const paginatedRespondents = filteredRespondents.slice(skip, skip + limit);

    // Calculate summary stats
    const stats = {
      totalRespondents: allRespondents.length,
      activeRespondents: allRespondents.filter(r => r.status === 'active')
        .length,
      averageScore:
        allRespondents.length > 0
          ? allRespondents.reduce((sum, r) => sum + r.averageScore, 0) /
            allRespondents.length
          : 0,
      totalQuizzes: allRespondents.reduce(
        (sum, r) => sum + r.quizzesCompleted,
        0
      ),
      totalPoints: allRespondents.reduce((sum, r) => sum + r.totalPoints, 0),
    };

    return {
      respondents: paginatedRespondents,
      pagination: {
        page,
        limit,
        total: filteredRespondents.length,
        totalPages: Math.ceil(filteredRespondents.length / limit),
      },
      stats,
    };
  } catch (error) {
    console.error('Error fetching respondents:', error);
    return { error: 'Failed to fetch respondents' };
  }
}

export async function getRespondentDetails(
  input: z.infer<typeof getRespondentDetailsSchema>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    const validatedInput = getRespondentDetailsSchema.parse(input);
    const { teamId, userId } = validatedInput;

    // Verify team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
      },
    });

    if (!teamMember) {
      return { error: 'Not a member of this team' };
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Get quiz responses for this user from this team
    const quizResponses = await prisma.quizResponse.findMany({
      where: {
        userId,
        quiz: { teamId },
      },
      include: {
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calculate user statistics
    const completedResponses = quizResponses.filter(r => r.completedAt);
    const totalScore = completedResponses.reduce(
      (sum, r) => sum + (r.score || 0),
      0
    );
    const totalPoints = completedResponses.reduce(
      (sum, r) => sum + r.totalPoints,
      0
    );
    const averageScore =
      completedResponses.length > 0
        ? totalScore / completedResponses.length
        : 0;

    const lastActivity =
      completedResponses.length > 0 ? completedResponses[0].completedAt : null;

    // Determine status
    let status: 'active' | 'inactive' | 'blocked' = 'active';
    if (lastActivity) {
      const daysSinceLastActivity =
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 30) {
        status = 'inactive';
      }
    }

    const respondentDetails: RespondentDetails = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      image: user.image,
      quizzesCompleted: completedResponses.length,
      averageScore,
      lastActivity,
      totalPoints,
      status,
      quizResponses: quizResponses.map(response => ({
        id: response.id,
        quizTitle: response.quiz.title,
        score: response.score,
        totalPoints: response.totalPoints,
        isPassed: response.isPassed,
        completedAt: response.completedAt,
        duration:
          response.completedAt && response.startedAt
            ? Math.round(
                (response.completedAt.getTime() -
                  response.startedAt.getTime()) /
                  (1000 * 60)
              )
            : 0,
      })),
    };

    return { respondent: respondentDetails };
  } catch (error) {
    console.error('Error fetching respondent details:', error);
    return { error: 'Failed to fetch respondent details' };
  }
}

export async function exportRespondents(input: {
  teamId: string;
  format: 'csv' | 'excel';
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    const { teamId } = input;

    // Verify team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
      },
    });

    if (!teamMember) {
      return { error: 'Not a member of this team' };
    }

    // Get all respondents data for export
    const result = await getRespondents({
      teamId,
      limit: 1000,
      page: 1,
      status: 'all',
    });

    if ('error' in result) {
      return result;
    }

    // TODO: Implement actual CSV/Excel export logic
    // For now, return the data structure that can be used by the frontend
    return {
      data: result.respondents,
      format: input.format,
    };
  } catch (error) {
    console.error('Error exporting respondents:', error);
    return { error: 'Failed to export respondents' };
  }
}
