'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();
import { FeatureType, FeatureCategory, TeamRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Input schemas for admin operations
const createFeatureSchema = z.object({
  type: z.nativeEnum(FeatureType),
  name: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  category: z.nativeEnum(FeatureCategory),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updatePlanFeatureSchema = z.object({
  planId: z.string().cuid(),
  featureId: z.string().cuid(),
  isEnabled: z.boolean(),
  limit: z.number().int().min(-1).optional(), // -1 means unlimited
  metadata: z.record(z.any()).optional(),
});

const bulkUpdatePlanFeaturesSchema = z.object({
  planId: z.string().cuid(),
  features: z.array(
    z.object({
      featureId: z.string().cuid(),
      isEnabled: z.boolean(),
      limit: z.number().int().min(-1).optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
});

const resetFeatureUsageSchema = z.object({
  teamId: z.string().cuid(),
  featureType: z.nativeEnum(FeatureType).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // YYYY-MM format
});

/**
 * Admin-only: Create a new feature definition
 */
export const createFeature = action(createFeatureSchema, async input => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user is admin (you may want to add admin role check here)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMemberships: {
        where: { role: 'OWNER' },
        include: { team: true },
      },
    },
  });

  if (!user || user.teamMemberships.length === 0) {
    throw new Error('Admin access required');
  }

  const feature = await prisma.feature.create({
    data: input,
  });

  revalidatePath('/admin/features');
  return { feature };
});

/**
 * Admin-only: Update plan feature configuration
 */
export const updatePlanFeature = action(
  updatePlanFeatureSchema,
  async ({ planId, featureId, isEnabled, limit, metadata }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMemberships: {
          where: { role: 'OWNER' },
        },
      },
    });

    if (!user || user.teamMemberships.length === 0) {
      throw new Error('Admin access required');
    }

    const planFeature = await prisma.planFeature.upsert({
      where: {
        planId_featureId: {
          planId,
          featureId,
        },
      },
      create: {
        planId,
        featureId,
        isEnabled,
        limit,
        metadata,
      },
      update: {
        isEnabled,
        limit,
        metadata,
      },
      include: {
        feature: true,
        plan: true,
      },
    });

    revalidatePath('/admin/plans');
    return { planFeature };
  }
);

/**
 * Admin-only: Bulk update plan features
 */
export const bulkUpdatePlanFeatures = action(
  bulkUpdatePlanFeaturesSchema,
  async ({ planId, features }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMemberships: {
          where: { role: 'OWNER' },
        },
      },
    });

    if (!user || user.teamMemberships.length === 0) {
      throw new Error('Admin access required');
    }

    // Use transaction for bulk updates
    const results = await prisma.$transaction(
      features.map(({ featureId, isEnabled, limit, metadata }) =>
        prisma.planFeature.upsert({
          where: {
            planId_featureId: {
              planId,
              featureId,
            },
          },
          create: {
            planId,
            featureId,
            isEnabled,
            limit,
            metadata,
          },
          update: {
            isEnabled,
            limit,
            metadata,
          },
        })
      )
    );

    revalidatePath('/admin/plans');
    return { updatedFeatures: results };
  }
);

/**
 * Admin-only: Reset feature usage for a team
 */
export const resetFeatureUsage = action(
  resetFeatureUsageSchema,
  async ({ teamId, featureType, month }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMemberships: {
          where: { role: 'OWNER' },
        },
      },
    });

    if (!user || user.teamMemberships.length === 0) {
      throw new Error('Admin access required');
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7);

    if (featureType) {
      // Reset specific feature
      await prisma.featureUsage.deleteMany({
        where: {
          teamId,
          featureType,
          month: currentMonth,
        },
      });
    } else {
      // Reset all features for team
      await prisma.featureUsage.deleteMany({
        where: {
          teamId,
          month: currentMonth,
        },
      });
    }

    revalidatePath('/admin/usage');
    return { success: true };
  }
);

/**
 * Get all features with plan associations
 */
export async function getAllFeaturesWithPlans() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const features = await prisma.feature.findMany({
    include: {
      planFeatures: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });

  return features;
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats(month?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const usageStats = await prisma.featureUsage.groupBy({
    by: ['featureType'],
    where: {
      month: currentMonth,
    },
    _sum: {
      count: true,
    },
    _count: {
      teamId: true,
    },
  });

  return usageStats.map(stat => ({
    featureType: stat.featureType,
    totalUsage: stat._sum.count || 0,
    teamCount: stat._count.teamId,
  }));
}

/**
 * Get teams with high feature usage
 */
export async function getHighUsageTeams(
  featureType: FeatureType,
  month?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const highUsageTeams = await prisma.featureUsage.findMany({
    where: {
      featureType,
      month: currentMonth,
    },
    include: {
      team: {
        include: {
          subscription: {
            include: {
              planFeatures: {
                where: {
                  feature: {
                    type: featureType,
                  },
                },
                include: {
                  feature: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      count: 'desc',
    },
    take: 50,
  });

  return highUsageTeams.map(usage => ({
    teamId: usage.teamId,
    teamName: usage.team.name,
    usage: usage.count,
    limit: usage.team.subscription?.planFeatures[0]?.limit,
    isOverLimit: usage.team.subscription?.planFeatures[0]?.limit
      ? usage.count > usage.team.subscription.planFeatures[0].limit
      : false,
  }));
}

/**
 * Generate feature usage report
 */
export async function generateFeatureUsageReport(
  startMonth: string,
  endMonth: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify admin access
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMemberships: {
        where: { role: 'OWNER' },
      },
    },
  });

  if (!user || user.teamMemberships.length === 0) {
    throw new Error('Admin access required');
  }

  const usage = await prisma.featureUsage.findMany({
    where: {
      month: {
        gte: startMonth,
        lte: endMonth,
      },
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
    orderBy: [{ month: 'asc' }, { featureType: 'asc' }, { count: 'desc' }],
  });

  // Group and aggregate data
  const report = usage.reduce(
    (acc, record) => {
      const key = `${record.month}-${record.featureType}`;
      if (!acc[key]) {
        acc[key] = {
          month: record.month,
          featureType: record.featureType,
          totalUsage: 0,
          teamCount: 0,
          avgUsagePerTeam: 0,
          planBreakdown: {},
        };
      }

      acc[key].totalUsage += record.count;
      acc[key].teamCount += 1;

      const planName = record.team.subscription?.plan.name || 'Free';
      acc[key].planBreakdown[planName] =
        (acc[key].planBreakdown[planName] || 0) + record.count;

      return acc;
    },
    {} as Record<string, any>
  );

  // Calculate averages
  Object.keys(report).forEach(key => {
    report[key].avgUsagePerTeam =
      report[key].totalUsage / report[key].teamCount;
  });

  return Object.values(report);
}
