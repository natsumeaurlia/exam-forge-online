'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FeatureType } from '@prisma/client';

export async function getUserPlan() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
      data: null,
    };
  }

  try {
    // First, get the user's active team membership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembers: {
          where: {
            role: {
              in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
            },
          },
          include: {
            team: {
              include: {
                subscription: {
                  include: {
                    plan: {
                      include: {
                        features: {
                          include: {
                            feature: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      };
    }

    // Get the first team's subscription (or the active team if we implement team switching)
    const activeTeamMember = user.teamMembers[0];
    const subscription = activeTeamMember?.team.subscription;

    // If no team or subscription, user is on FREE plan
    if (!activeTeamMember || !subscription) {
      const freePlan = await prisma.plan.findUnique({
        where: { type: 'FREE' },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      });

      return {
        success: true,
        error: null,
        data: {
          planType: 'FREE' as const,
          plan: freePlan,
          subscription: null,
          features: freePlan?.features.map(pf => pf.feature.type) || [],
        },
      };
    }

    // Check if subscription is active
    const isActive =
      subscription.status === 'ACTIVE' ||
      subscription.status === 'TRIALING';

    // If subscription is not active, treat as FREE plan
    if (!isActive) {
      const freePlan = await prisma.plan.findUnique({
        where: { type: 'FREE' },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      });

      return {
        success: true,
        error: null,
        data: {
          planType: 'FREE' as const,
          plan: freePlan,
          subscription: subscription,
          features: freePlan?.features.map(pf => pf.feature.type) || [],
        },
      };
    }

    return {
      success: true,
      error: null,
      data: {
        planType: subscription.plan.type,
        plan: subscription.plan,
        subscription: subscription,
        features: subscription.plan.features.map(pf => pf.feature.type),
      },
    };
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return {
      success: false,
      error: 'Failed to fetch user plan',
      data: null,
    };
  }
}

export async function checkUserFeature(featureType: FeatureType) {
  const planResult = await getUserPlan();

  if (!planResult.success || !planResult.data) {
    return false;
  }

  return planResult.data.features.includes(featureType);
}
