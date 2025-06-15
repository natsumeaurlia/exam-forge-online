'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { FeatureType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface FeatureCheck {
  hasAccess: boolean;
  limit?: number;
  currentUsage?: number;
  remainingUsage?: number;
  isUnlimited?: boolean;
}

/**
 * Check if a team has access to a specific feature
 */
export async function checkFeatureAccess(
  featureType: FeatureType,
  teamId: string
): Promise<FeatureCheck> {
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

  // Get team with subscription
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      subscription: true,
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // For free teams, check basic feature access
  if (!team.subscription) {
    const basicFeatures = [
      FeatureType.TRUE_FALSE_QUESTION,
      FeatureType.SINGLE_CHOICE_QUESTION,
      FeatureType.MULTIPLE_CHOICE_QUESTION,
    ];

    return {
      hasAccess: basicFeatures.includes(featureType),
      limit: featureType === FeatureType.QUIZ_CREATION_LIMIT ? 5 : undefined,
      isUnlimited: false,
    };
  }

  // Pro/Premium teams have access to most features
  return {
    hasAccess: true,
    isUnlimited: true,
  };
}

/**
 * Update feature usage count for a team
 */
export async function updateFeatureUsage(
  featureType: FeatureType,
  teamId: string,
  increment: number = 1
): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
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
    return true;
  } catch (error) {
    console.error('Failed to update feature usage:', error);
    return false;
  }
}
