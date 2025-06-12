'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { getUserPlan } from '@/lib/actions/user';
import type { Plan, Subscription, PlanType, FeatureType } from '@prisma/client';

interface UserPlanData {
  planType: PlanType;
  plan: Plan | null;
  subscription: Subscription | null;
  features: FeatureType[];
}

interface UserPlanContextType {
  data: UserPlanData | null;
  loading: boolean;
  error: string | null;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  hasFeature: (featureType: FeatureType) => boolean;
  refetch: () => Promise<void>;
}

const UserPlanContext = createContext<UserPlanContextType | undefined>(
  undefined
);

export function UserPlanProvider({ children }: { children: React.ReactNode }) {
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

  const fetchPlan = async () => {
    executeGetUserPlan({});
  };

  useEffect(() => {
    fetchPlan();
  }, [executeGetUserPlan]);

  const isPro = data?.planType === 'PRO';
  const isPremium = data?.planType === 'PREMIUM';
  const isFree = data?.planType === 'FREE' || !data;

  const hasFeature = (featureType: FeatureType): boolean => {
    if (!data) return false;
    return data.features.includes(featureType);
  };

  const value: UserPlanContextType = {
    data,
    loading,
    error,
    isPro,
    isPremium,
    isFree,
    hasFeature,
    refetch: fetchPlan,
  };

  return (
    <UserPlanContext.Provider value={value}>
      {children}
    </UserPlanContext.Provider>
  );
}

export function useUserPlan() {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    // Return a default context when used outside of provider
    // This happens on the landing page where we don't have user data
    return {
      data: null,
      loading: false,
      error: null,
      isPro: false,
      isPremium: false,
      isFree: true,
      hasFeature: () => false,
      refetch: async () => {},
    };
  }
  return context;
}
