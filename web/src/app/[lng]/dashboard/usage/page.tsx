import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UsageMonitoringClient } from './client';

interface UsagePageProps {
  params: Promise<{ lng: string }>;
}

async function getTeamUsageData(teamId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get current period usage
  const currentUsage = await prisma.usageRecord.groupBy({
    by: ['resourceType'],
    where: {
      teamId,
      periodStart: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      count: true,
    },
  });

  // Get weekly trends
  const weeklyTrends = await prisma.usageRecord.findMany({
    where: {
      teamId,
      periodStart: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      periodStart: 'asc',
    },
  });

  // Get monthly trends
  const monthlyTrends = await prisma.usageRecord.findMany({
    where: {
      teamId,
      periodStart: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      periodStart: 'asc',
    },
  });

  return {
    currentUsage,
    weeklyTrends,
    monthlyTrends,
  };
}

async function getTeamQuizStats(teamId: string) {
  const totalQuizzes = await prisma.quiz.count({
    where: { teamId },
  });

  const publishedQuizzes = await prisma.quiz.count({
    where: {
      teamId,
      status: 'PUBLISHED',
    },
  });

  const totalResponses = await prisma.quizResponse.count({
    where: {
      quiz: {
        teamId,
      },
    },
  });

  const thisMonthResponses = await prisma.quizResponse.count({
    where: {
      quiz: {
        teamId,
      },
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  return {
    totalQuizzes,
    publishedQuizzes,
    totalResponses,
    thisMonthResponses,
  };
}

export default async function UsagePage({ params }: UsagePageProps) {
  const { lng } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard.usage');

  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get user's team
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
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
  });

  if (!teamMember) {
    redirect(`/${lng}/dashboard`);
  }

  const team = teamMember.team;
  const [usageData, quizStats] = await Promise.all([
    getTeamUsageData(team.id),
    getTeamQuizStats(team.id),
  ]);

  const teamData = {
    id: team.id,
    name: team.name,
    subscription: team.subscription
      ? {
          plan: {
            name: team.subscription.plan.name,
            type: team.subscription.plan.type,
            maxQuizzes: team.subscription.plan.maxQuizzes,
            maxMembers: team.subscription.plan.maxMembers,
            maxResponsesPerMonth: team.subscription.plan.maxResponsesPerMonth,
            maxStorageMB: team.subscription.plan.maxStorageMB,
          },
        }
      : null,
  };

  return (
    <UsageMonitoringClient
      lng={lng}
      team={teamData}
      usageData={usageData}
      quizStats={quizStats}
    />
  );
}
