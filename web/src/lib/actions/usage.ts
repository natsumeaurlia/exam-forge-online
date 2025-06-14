'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ResourceType } from '@prisma/client';
import { authAction } from './auth-action';

const createUsageRecordSchema = z.object({
  teamId: z.string(),
  resourceType: z.nativeEnum(ResourceType),
  count: z.number().min(0),
  periodStart: z.date(),
  periodEnd: z.date(),
});

const getUsageStatsSchema = z.object({
  teamId: z.string(),
  resourceType: z.nativeEnum(ResourceType).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Create or update usage record for a team
export const createUsageRecord = authAction
  .schema(createUsageRecordSchema)
  .action(
    async ({
      parsedInput: { teamId, resourceType, count, periodStart, periodEnd },
      ctx: { userId },
    }) => {
      // Verify user has access to the team
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (!teamMember) {
        throw new Error('Team not found or access denied');
      }

      // Check if usage record already exists for this period
      const existingRecord = await prisma.usageRecord.findFirst({
        where: {
          teamId,
          resourceType,
          periodStart,
          periodEnd,
        },
      });

      if (existingRecord) {
        // Update existing record
        const updatedRecord = await prisma.usageRecord.update({
          where: { id: existingRecord.id },
          data: { count },
        });
        return { success: true, data: updatedRecord };
      } else {
        // Create new record
        const newRecord = await prisma.usageRecord.create({
          data: {
            teamId,
            resourceType,
            count,
            periodStart,
            periodEnd,
          },
        });
        return { success: true, data: newRecord };
      }
    }
  );

// Get usage statistics for a team
export const getUsageStats = authAction
  .schema(getUsageStatsSchema)
  .action(
    async ({
      parsedInput: { teamId, resourceType, startDate, endDate },
      ctx: { userId },
    }) => {
      // Verify user has access to the team
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId,
        },
      });

      if (!teamMember) {
        throw new Error('Team not found or access denied');
      }

      const where = {
        teamId,
        ...(resourceType && { resourceType }),
        ...(startDate &&
          endDate && {
            periodStart: { gte: startDate },
            periodEnd: { lte: endDate },
          }),
      };

      const usageRecords = await prisma.usageRecord.findMany({
        where,
        orderBy: { periodStart: 'desc' },
      });

      const summary = await prisma.usageRecord.groupBy({
        by: ['resourceType'],
        where,
        _sum: {
          count: true,
        },
      });

      return {
        success: true,
        data: {
          records: usageRecords,
          summary,
        },
      };
    }
  );

// Increment usage for a specific resource type
export async function incrementUsage(
  teamId: string,
  resourceType: ResourceType,
  increment: number = 1
) {
  const now = new Date();
  const periodStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);

  const existingRecord = await prisma.usageRecord.findFirst({
    where: {
      teamId,
      resourceType,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
  });

  if (existingRecord) {
    await prisma.usageRecord.update({
      where: { id: existingRecord.id },
      data: { count: { increment } },
    });
  } else {
    await prisma.usageRecord.create({
      data: {
        teamId,
        resourceType,
        count: increment,
        periodStart,
        periodEnd,
      },
    });
  }
}

// Get current month usage for a team
export async function getCurrentMonthUsage(teamId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const usage = await prisma.usageRecord.groupBy({
    by: ['resourceType'],
    where: {
      teamId,
      periodStart: { gte: monthStart },
      periodEnd: { lt: monthEnd },
    },
    _sum: {
      count: true,
    },
  });

  return usage.reduce(
    (acc, item) => {
      acc[item.resourceType] = item._sum.count || 0;
      return acc;
    },
    {} as Record<string, number>
  );
}

// Check if team is within usage limits
export async function checkUsageLimits(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (!team?.subscription?.plan) {
    return { withinLimits: true, warnings: [] };
  }

  const plan = team.subscription.plan;
  const currentUsage = await getCurrentMonthUsage(teamId);
  const warnings: string[] = [];

  // Check quiz limit
  if (plan.maxQuizzes && currentUsage.QUIZ > plan.maxQuizzes) {
    warnings.push('Quiz limit exceeded');
  }

  // Check response limit
  if (
    plan.maxResponsesPerMonth &&
    currentUsage.RESPONSE > plan.maxResponsesPerMonth
  ) {
    warnings.push('Monthly response limit exceeded');
  }

  // Check member limit
  if (plan.maxMembers && currentUsage.MEMBER > plan.maxMembers) {
    warnings.push('Member limit exceeded');
  }

  // Check storage limit
  if (
    plan.maxStorageMB &&
    currentUsage.STORAGE > plan.maxStorageMB * 1024 * 1024
  ) {
    warnings.push('Storage limit exceeded');
  }

  return {
    withinLimits: warnings.length === 0,
    warnings,
    currentUsage,
    limits: {
      maxQuizzes: plan.maxQuizzes,
      maxResponsesPerMonth: plan.maxResponsesPerMonth,
      maxMembers: plan.maxMembers,
      maxStorageMB: plan.maxStorageMB,
    },
  };
}
