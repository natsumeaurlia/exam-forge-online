import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authAction } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FeatureType } from '@prisma/client';
import { getUserPlanData } from './helpers';

const getUserPlanSchema = z.object({});

export const getUserPlan = authAction
  .inputSchema(getUserPlanSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    try {
      return await getUserPlanData(userId);
    } catch (error) {
      console.error('Error fetching user plan:', error);
      throw new Error('Failed to fetch user plan');
    }
  });

const checkUserFeatureSchema = z.object({
  featureType: z.nativeEnum(FeatureType),
});

export const checkUserFeature = authAction
  .inputSchema(checkUserFeatureSchema)
  .action(async ({ parsedInput: { featureType }, ctx }) => {
    const { userId } = ctx;

    try {
      const planResult = await getUserPlanData(userId);

      if (!planResult) {
        return false;
      }

      return planResult.features.includes(featureType);
    } catch (error) {
      console.error('Error checking user feature:', error);
      return false;
    }
  });
