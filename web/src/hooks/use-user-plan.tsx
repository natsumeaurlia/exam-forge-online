'use client';

import { useState, useEffect } from 'react';
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
  isEnterprise: boolean;
  isFree: boolean;
  hasFeature: (featureType: FeatureType) => boolean;
  refetch: () => Promise<void>;
}

export function useUserPlan(): UseUserPlanReturn {
  const [data, setData] = useState<UserPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserPlan();

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to fetch plan');
        return;
      }

      setData(result.data);
    } catch (err) {
      setError('Failed to fetch user plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const isPro = data?.planType === 'PRO';
  const isEnterprise = data?.planType === 'ENTERPRISE';
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
    isEnterprise,
    isFree,
    hasFeature,
    refetch: fetchPlan,
  };
}
