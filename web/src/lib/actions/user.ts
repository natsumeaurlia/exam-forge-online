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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      };
    }

    // If no subscription, user is on FREE plan
    if (!user.subscription) {
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
      user.subscription.status === 'ACTIVE' ||
      user.subscription.status === 'TRIALING';

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
          subscription: user.subscription,
          features: freePlan?.features.map(pf => pf.feature.type) || [],
        },
      };
    }

    return {
      success: true,
      error: null,
      data: {
        planType: user.subscription.plan.type,
        plan: user.subscription.plan,
        subscription: user.subscription,
        features: user.subscription.plan.features.map(pf => pf.feature.type),
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
