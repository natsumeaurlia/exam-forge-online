'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PlanType, FeatureCategory } from '@prisma/client';

const actionClient = createSafeActionClient();

export interface PlanWithFeatures {
  id: string;
  type: PlanType;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxQuizzes: number | null;
  maxMembers: number | null;
  maxQuestionsPerQuiz: number | null;
  maxResponsesPerMonth: number | null;
  maxStorageMB: number | null;
  isActive: boolean;
  displayOrder: number;
  features: Array<{
    id: string;
    type: string;
    name: string;
    nameEn: string | null;
    description: string | null;
    descriptionEn: string | null;
    category: FeatureCategory;
    displayOrder: number;
    isEnabled: boolean;
    limit: number | null;
  }>;
}

const getPlansWithFeaturesSchema = z.object({});

export const getPlansWithFeatures = actionClient
  .inputSchema(getPlansWithFeaturesSchema)
  .action(async (): Promise<PlanWithFeatures[]> => {
    try {
      const plans = await prisma.plan.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
        include: {
          features: {
            include: {
              feature: true,
            },
            orderBy: {
              feature: {
                displayOrder: 'asc',
              },
            },
          },
        },
      });

      return plans.map(plan => ({
        id: plan.id,
        type: plan.type,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxQuizzes: plan.maxQuizzes,
        maxMembers: plan.maxMembers,
        maxQuestionsPerQuiz: plan.maxQuestionsPerQuiz,
        maxResponsesPerMonth: plan.maxResponsesPerMonth,
        maxStorageMB: plan.maxStorageMB,
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
        features: plan.features.map(pf => ({
          id: pf.feature.id,
          type: pf.feature.type,
          name: pf.feature.name,
          nameEn: pf.feature.nameEn,
          description: pf.feature.description,
          descriptionEn: pf.feature.descriptionEn,
          category: pf.feature.category,
          displayOrder: pf.feature.displayOrder,
          isEnabled: pf.isEnabled,
          limit: pf.limit,
        })),
      }));
    } catch (error) {
      console.error('Error fetching plans with features:', error);
      throw new Error('Failed to fetch plans with features');
    }
  });

const getAllFeaturesSchema = z.object({});

export const getAllFeatures = actionClient
  .inputSchema(getAllFeaturesSchema)
  .action(async () => {
    try {
      const features = await prisma.feature.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      });

      return features;
    } catch (error) {
      console.error('Error fetching features:', error);
      throw new Error('Failed to fetch features');
    }
  });
