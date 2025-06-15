'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import {
  FeatureType,
  FeatureCategory,
  type Team,
  type PlanFeature,
  type Feature,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Types for feature flag system
export interface FeatureCheck {
  hasAccess: boolean;
  limit?: number;
  currentUsage?: number;
  remainingUsage?: number;
  isUnlimited?: boolean;
}

export interface TeamFeatureAccess extends Team {
  subscription?: {
    plan: {
      features: (PlanFeature & {
        feature: Feature;
      })[];
    };
  } | null;
}

// Input schemas
const checkFeatureAccessSchema = z.object({
  featureType: z.nativeEnum(FeatureType),
  teamId: z.string().cuid(),
});

const updateFeatureUsageSchema = z.object({
  featureType: z.nativeEnum(FeatureType),
  teamId: z.string().cuid(),
  increment: z.number().int().min(0).default(1),
});

const getFeatureUsageSchema = z.object({
  teamId: z.string().cuid(),
  featureType: z.nativeEnum(FeatureType).optional(),
});

/**
 * Check if a team has access to a specific feature
 */
const action = createSafeActionClient();

export const checkFeatureAccess = action
  .schema(checkFeatureAccessSchema)
  .action(async ({ parsedInput: { featureType, teamId } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      throw new Error('Not a member of this team');
    }

    // Get team with subscription and plan features
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                features: {
                  include: {
                    feature: true,
                  },
                  where: {
                    isEnabled: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // For free teams, check basic feature access
    if (!team.subscription) {
      const basicFeatures: FeatureType[] = [
        FeatureType.TRUE_FALSE_QUESTION,
        FeatureType.SINGLE_CHOICE_QUESTION,
        FeatureType.MULTIPLE_CHOICE_QUESTION,
        FeatureType.FREE_TEXT_QUESTION,
        FeatureType.AUTO_GRADING,
        FeatureType.MANUAL_GRADING,
        FeatureType.PASSWORD_PROTECTION,
      ];

      return {
        hasAccess: basicFeatures.includes(featureType),
        limit: featureType === FeatureType.AI_QUIZ_GENERATION ? 3 : undefined,
        isUnlimited: false,
      } as FeatureCheck;
    }

    // Check plan feature access
    const planFeature = team.subscription.plan.features.find(
      pf => pf.feature.type === featureType
    );

    if (!planFeature) {
      return {
        hasAccess: false,
        limit: 0,
        isUnlimited: false,
      } as FeatureCheck;
    }

    // Get current usage if there's a limit
    let currentUsage = 0;
    if (planFeature.limit && planFeature.limit > 0) {
      currentUsage = await getCurrentFeatureUsage(teamId, featureType);
    }

    return {
      hasAccess: true,
      limit: planFeature.limit || undefined,
      currentUsage,
      remainingUsage: planFeature.limit
        ? Math.max(0, planFeature.limit - currentUsage)
        : undefined,
      isUnlimited: !planFeature.limit || planFeature.limit === -1,
    } as FeatureCheck;
  });

/**
 * Update feature usage count for a team
 */
export const updateFeatureUsage = action
  .schema(updateFeatureUsageSchema)
  .action(async ({ parsedInput: { featureType, teamId, increment } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      throw new Error('Not a member of this team');
    }

    // Check if user has access to this feature first
    const featureCheck = await checkFeatureAccess({
      featureType,
      teamId,
    });

    if (!featureCheck.hasAccess) {
      throw new Error('Feature access denied');
    }

    // Check if incrementing would exceed limit
    if (featureCheck.limit && !featureCheck.isUnlimited) {
      const newUsage = (featureCheck.currentUsage || 0) + increment;
      if (newUsage > featureCheck.limit) {
        throw new Error(
          `Feature usage limit exceeded. Limit: ${featureCheck.limit}, Current: ${featureCheck.currentUsage}, Requested: ${increment}`
        );
      }
    }

    // Update usage count in usage tracking table
    await prisma.featureUsage.upsert({
      where: {
        teamId_featureType_month: {
          teamId,
          featureType,
          month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        },
      },
      create: {
        teamId,
        featureType,
        month: new Date().toISOString().slice(0, 7),
        count: increment,
      },
      update: {
        count: {
          increment,
        },
      },
    });

    revalidatePath('/dashboard');
    return {
      success: true,
      newUsage: (featureCheck.currentUsage || 0) + increment,
    };
  });

/**
 * Get current feature usage for a team
 */
async function getCurrentFeatureUsage(
  teamId: string,
  featureType: FeatureType
): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const usage = await prisma.featureUsage.findUnique({
    where: {
      teamId_featureType_month: {
        teamId,
        featureType,
        month: currentMonth,
      },
    },
  });

  return usage?.count || 0;
}

/**
 * Get all feature usage for a team
 */
export const getFeatureUsage = action
  .schema(getFeatureUsageSchema)
  .action(async ({ parsedInput: { teamId, featureType } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      throw new Error('Not a member of this team');
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    if (featureType) {
      const usage = await prisma.featureUsage.findUnique({
        where: {
          teamId_featureType_month: {
            teamId,
            featureType,
            month: currentMonth,
          },
        },
      });

      return { [featureType]: usage?.count || 0 };
    }

    // Get all usage for the team in current month
    const usages = await prisma.featureUsage.findMany({
      where: {
        teamId,
        month: currentMonth,
      },
    });

    const usageMap: Record<FeatureType, number> = {} as Record<
      FeatureType,
      number
    >;
    usages.forEach(usage => {
      usageMap[usage.featureType] = usage.count;
    });

    return usageMap;
  });

/**
 * Runtime feature flag checker hook-compatible function
 */
export async function checkTeamFeatureAccess(
  teamId: string,
  featureType: FeatureType
): Promise<FeatureCheck> {
  const result = await checkFeatureAccess({ featureType, teamId });

  if (!result.data) {
    return {
      hasAccess: false,
      limit: 0,
      isUnlimited: false,
    };
  }

  return result.data;
}

/**
 * Check multiple features at once
 */
export async function checkMultipleFeatures(
  teamId: string,
  featureTypes: FeatureType[]
): Promise<Record<FeatureType, FeatureCheck>> {
  const results: Record<FeatureType, FeatureCheck> = {} as Record<
    FeatureType,
    FeatureCheck
  >;

  await Promise.all(
    featureTypes.map(async featureType => {
      results[featureType] = await checkTeamFeatureAccess(teamId, featureType);
    })
  );

  return results;
}
