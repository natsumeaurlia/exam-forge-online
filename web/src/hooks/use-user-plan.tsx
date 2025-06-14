'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { getUserPlan } from '@/lib/actions/user';
import type { Plan, Subscription, PlanType, FeatureType } from '@prisma/client';

interface UserPlanData {
  planType: PlanType;
  plan: Plan | null;
  subscription: Subscription | null;
  features: FeatureType[];
}

interface UseUserPlanReturn {
  data: UserPlanData | null;
  loading: boolean;
  error: string | null;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  hasFeature: (featureType: FeatureType) => boolean;
  refetch: () => Promise<void>;
}

export function useUserPlan(): UseUserPlanReturn {
  const [data, setData] = useState<UserPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { execute: executeGetUserPlan, isExecuting: loading } = useAction(
    getUserPlan,
    {
      onSuccess: ({ data: planData }) => {
        if (
          planData &&
          typeof planData === 'object' &&
          'planType' in planData
        ) {
          setData(planData as UserPlanData);
          setError(null);
        }
      },
      onError: ({ error: actionError }) => {
        setError('Failed to fetch user plan');
        console.error(actionError);
      },
    }
  );

  const fetchPlan = useCallback(async () => {
    executeGetUserPlan({});
  }, [executeGetUserPlan]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const isPro = data?.planType === 'PRO';
  const isPremium = data?.planType === 'PREMIUM';
  const isFree = data?.planType === 'FREE' || !data;

  const hasFeature = (featureType: FeatureType): boolean => {
    if (!data) return false;
    return data.features.includes(featureType);
  };

  return {
    data,
    loading,
    error,
    isPro,
    isPremium,
    isFree,
    hasFeature,
    refetch: fetchPlan,
  };
}
