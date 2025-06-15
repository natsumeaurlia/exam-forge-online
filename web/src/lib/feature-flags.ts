/**
 * Feature Flag System - Client-side utilities and types
 *
 * This module provides runtime feature flag checking and usage tracking
 * for the ExamForge application.
 */

import { FeatureType } from '@prisma/client';
import {
  checkTeamFeatureAccess,
  updateFeatureUsage,
  type FeatureCheck,
} from '@/lib/actions/feature';

/**
 * Feature flag runtime class for managing feature access
 */
export class FeatureFlagSystem {
  private static instance: FeatureFlagSystem;
  private cache: Map<string, { data: FeatureCheck; expires: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): FeatureFlagSystem {
    if (!FeatureFlagSystem.instance) {
      FeatureFlagSystem.instance = new FeatureFlagSystem();
    }
    return FeatureFlagSystem.instance;
  }

  /**
   * Check if a team has access to a feature with caching
   */
  async checkFeature(
    teamId: string,
    featureType: FeatureType
  ): Promise<FeatureCheck> {
    const cacheKey = `${teamId}-${featureType}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const result = await checkTeamFeatureAccess(teamId, featureType);

    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + this.CACHE_TTL,
    });

    return result;
  }

  /**
   * Update feature usage and invalidate cache
   */
  async incrementUsage(
    teamId: string,
    featureType: FeatureType,
    amount: number = 1
  ): Promise<boolean> {
    try {
      const result = await updateFeatureUsage({
        teamId,
        featureType,
        increment: amount,
      });

      if (result?.data?.success) {
        // Invalidate cache for this feature
        const cacheKey = `${teamId}-${featureType}`;
        this.cache.delete(cacheKey);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to increment feature usage:', error);
      return false;
    }
  }

  /**
   * Check if feature can be used (has access and within limits)
   */
  async canUseFeature(
    teamId: string,
    featureType: FeatureType
  ): Promise<boolean> {
    const check = await this.checkFeature(teamId, featureType);

    if (!check.hasAccess) {
      return false;
    }

    // If no limit, always allowed
    if (check.isUnlimited || !check.limit) {
      return true;
    }

    // Check if within limits
    return (check.remainingUsage || 0) > 0;
  }

  /**
   * Use a feature (check access and increment usage)
   */
  async useFeature(
    teamId: string,
    featureType: FeatureType
  ): Promise<{ success: boolean; error?: string }> {
    const canUse = await this.canUseFeature(teamId, featureType);

    if (!canUse) {
      const check = await this.checkFeature(teamId, featureType);

      if (!check.hasAccess) {
        return { success: false, error: 'Feature access denied' };
      }

      if (check.limit && (check.remainingUsage || 0) <= 0) {
        return { success: false, error: 'Feature usage limit exceeded' };
      }
    }

    const success = await this.incrementUsage(teamId, featureType);

    if (!success) {
      return { success: false, error: 'Failed to update usage' };
    }

    return { success: true };
  }

  /**
   * Clear cache for a team or specific feature
   */
  clearCache(teamId?: string, featureType?: FeatureType): void {
    if (!teamId) {
      this.cache.clear();
      return;
    }

    if (featureType) {
      const cacheKey = `${teamId}-${featureType}`;
      this.cache.delete(cacheKey);
      return;
    }

    // Clear all cache entries for the team
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(`${teamId}-`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagSystem.getInstance();

/**
 * Feature definitions for easy reference
 */
export const FEATURES = {
  // Limits
  QUIZ_CREATION: FeatureType.QUIZ_CREATION_LIMIT,
  RESPONDENTS: FeatureType.RESPONDENT_LIMIT,
  STORAGE: FeatureType.STORAGE_LIMIT,

  // Question Types
  TRUE_FALSE: FeatureType.TRUE_FALSE_QUESTION,
  SINGLE_CHOICE: FeatureType.SINGLE_CHOICE_QUESTION,
  MULTIPLE_CHOICE: FeatureType.MULTIPLE_CHOICE_QUESTION,
  FREE_TEXT: FeatureType.FREE_TEXT_QUESTION,
  ADVANCED_QUESTIONS: FeatureType.ADVANCED_QUESTION_TYPES,

  // Quiz Features
  AUTO_GRADING: FeatureType.AUTO_GRADING,
  MANUAL_GRADING: FeatureType.MANUAL_GRADING,
  PASSWORD_PROTECTION: FeatureType.PASSWORD_PROTECTION,
  SECTIONS: FeatureType.SECTIONS,

  // Data & Export
  ANALYTICS: FeatureType.ANALYTICS,
  EXCEL_EXPORT: FeatureType.EXCEL_EXPORT,
  CERTIFICATES: FeatureType.CERTIFICATES,

  // Advanced
  AI_GENERATION: FeatureType.AI_QUIZ_GENERATION,
  QUESTION_BANK: FeatureType.QUESTION_BANK,
  MEDIA_UPLOAD: FeatureType.MEDIA_UPLOAD,
  CUSTOM_SUBDOMAIN: FeatureType.SUBDOMAIN,

  // Team & Management
  TEAM_MANAGEMENT: FeatureType.TEAM_MANAGEMENT,
  PERMISSIONS: FeatureType.PERMISSIONS_MANAGEMENT,
  AUDIT_LOG: FeatureType.AUDIT_LOG,

  // Premium
  CUSTOM_DESIGN: FeatureType.CUSTOM_DESIGN,
  CUSTOM_DEVELOPMENT: FeatureType.CUSTOM_DEVELOPMENT,
  PRIORITY_SUPPORT: FeatureType.PRIORITY_SUPPORT,
  SLA_GUARANTEE: FeatureType.SLA_GUARANTEE,
  ON_PREMISE: FeatureType.ON_PREMISE,
} as const;

/**
 * Plan-based feature access mapping
 */
const FREE_FEATURES: FeatureType[] = [
  FEATURES.TRUE_FALSE,
  FEATURES.SINGLE_CHOICE,
  FEATURES.MULTIPLE_CHOICE,
];

const PRO_FEATURES: FeatureType[] = [
  ...FREE_FEATURES,
  FEATURES.FREE_TEXT,
  FEATURES.ADVANCED_QUESTIONS,
  FEATURES.AUTO_GRADING,
  FEATURES.MANUAL_GRADING,
  FEATURES.PASSWORD_PROTECTION,
  FEATURES.SECTIONS,
  FEATURES.ANALYTICS,
  FEATURES.EXCEL_EXPORT,
  FEATURES.CERTIFICATES,
  FEATURES.AI_GENERATION,
  FEATURES.QUESTION_BANK,
  FEATURES.MEDIA_UPLOAD,
  FEATURES.CUSTOM_SUBDOMAIN,
  FEATURES.TEAM_MANAGEMENT,
  FEATURES.PERMISSIONS,
  FEATURES.AUDIT_LOG,
];

export const PLAN_FEATURES: Record<string, FeatureType[]> = {
  FREE: FREE_FEATURES,
  PRO: PRO_FEATURES,
  PREMIUM: [
    ...PRO_FEATURES,
    FEATURES.CUSTOM_DESIGN,
    FEATURES.CUSTOM_DEVELOPMENT,
    FEATURES.PRIORITY_SUPPORT,
    FEATURES.SLA_GUARANTEE,
    FEATURES.ON_PREMISE,
  ],
};

/**
 * Default limits for free plan
 */
export const FREE_PLAN_LIMITS = {
  [FEATURES.QUIZ_CREATION]: 5,
  [FEATURES.RESPONDENTS]: 100,
  [FEATURES.STORAGE]: 100, // MB
} as const;

/**
 * Helper function to check if a feature requires upgrade
 */
export function requiresUpgrade(
  featureType: FeatureType,
  currentPlan: 'FREE' | 'PRO' | 'PREMIUM'
): boolean {
  const planFeatures = PLAN_FEATURES[currentPlan] || [];
  return !planFeatures.includes(featureType);
}

/**
 * Get required plan for a feature
 */
export function getRequiredPlan(
  featureType: FeatureType
): 'FREE' | 'PRO' | 'PREMIUM' {
  if (PLAN_FEATURES.FREE?.includes(featureType)) return 'FREE';
  if (PLAN_FEATURES.PRO?.includes(featureType)) return 'PRO';
  return 'PREMIUM';
}

/**
 * Feature usage tracking wrapper
 */
export async function withFeatureTracking<T>(
  teamId: string,
  featureType: FeatureType,
  operation: () => Promise<T>
): Promise<T> {
  const result = await featureFlags.useFeature(teamId, featureType);

  if (!result.success) {
    throw new Error(result.error || 'Feature access denied');
  }

  return await operation();
}
