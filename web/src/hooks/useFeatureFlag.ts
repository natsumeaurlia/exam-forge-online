'use client';

import { useState, useEffect } from 'react';
import { FeatureType } from '@prisma/client';
import {
  checkFeatureAccess,
  type FeatureCheck,
} from '@/lib/actions/feature-simple';
import { useUserPlan } from '@/components/providers/UserPlanProvider';

/**
 * Hook for checking feature access with real-time updates
 */
export function useFeatureFlag(featureType: FeatureType, teamId?: string) {
  const [featureCheck, setFeatureCheck] = useState<FeatureCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const effectiveTeamId = teamId;

  useEffect(() => {
    async function checkFeature() {
      if (!effectiveTeamId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await checkFeatureAccess(featureType, effectiveTeamId);

        setFeatureCheck(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkFeature();
  }, [featureType, effectiveTeamId]);

  return {
    ...featureCheck,
    loading,
    error,
    refresh: () => {
      if (effectiveTeamId) {
        setLoading(true);
        checkFeatureAccess(featureType, effectiveTeamId).then(result => {
          setFeatureCheck(result);
          setLoading(false);
        });
      }
    },
  };
}

/**
 * Hook for checking multiple features at once
 */
export function useMultipleFeatureFlags(
  featureTypes: FeatureType[],
  teamId?: string
) {
  const [featureChecks, setFeatureChecks] = useState<Record<
    FeatureType,
    FeatureCheck
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const effectiveTeamId = teamId;

  useEffect(() => {
    async function checkFeatures() {
      if (!effectiveTeamId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const results: Record<FeatureType, FeatureCheck> = {} as Record<
          FeatureType,
          FeatureCheck
        >;

        await Promise.all(
          featureTypes.map(async featureType => {
            try {
              const result = await checkFeatureAccess(
                featureType,
                effectiveTeamId
              );
              results[featureType] = result;
            } catch {
              results[featureType] = {
                hasAccess: false,
                limit: 0,
                isUnlimited: false,
              };
            }
          })
        );

        setFeatureChecks(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkFeatures();
  }, [featureTypes, effectiveTeamId]);

  return {
    featureChecks,
    loading,
    error,
    hasFeature: (featureType: FeatureType) =>
      featureChecks?.[featureType]?.hasAccess || false,
    getFeatureLimit: (featureType: FeatureType) =>
      featureChecks?.[featureType]?.limit,
    getFeatureUsage: (featureType: FeatureType) =>
      featureChecks?.[featureType]?.currentUsage,
    getRemainingUsage: (featureType: FeatureType) =>
      featureChecks?.[featureType]?.remainingUsage,
    isUnlimited: (featureType: FeatureType) =>
      featureChecks?.[featureType]?.isUnlimited || false,
  };
}
