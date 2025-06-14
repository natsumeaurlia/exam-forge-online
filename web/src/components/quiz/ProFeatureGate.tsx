'use client';

import React from 'react';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { FeatureGate } from '@/components/feature/FeatureGate';
import type { FeatureType } from '@prisma/client';

interface ProFeatureGateProps {
  children: React.ReactNode;
  featureType?: FeatureType;
  requiredPlan?: 'PRO' | 'PREMIUM';
  className?: string;
  showUsage?: boolean;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
}

/**
 * @deprecated Use FeatureGate instead. This component is kept for backward compatibility.
 */
export function ProFeatureGate({
  children,
  featureType,
  requiredPlan = 'PRO',
  className,
  showUsage = false,
  fallback,
  onUpgradeClick,
}: ProFeatureGateProps) {
  const { isPro, isPremium, loading } = useUserPlan();
  const currentTeamId = 'default-team'; // TODO: Get from user plan

  // If no specific feature type provided, use legacy plan-based checking
  if (!featureType) {
    if (loading) {
      return <div className="h-32 animate-pulse rounded bg-gray-200" />;
    }

    const hasAccess = requiredPlan === 'PRO' ? isPro || isPremium : isPremium;

    if (!hasAccess) {
      return (
        fallback || (
          <div className="p-4 text-center">Feature requires upgrade</div>
        )
      );
    }

    return <>{children}</>;
  }

  // Use new feature flag system
  return (
    <FeatureGate
      featureType={featureType}
      teamId={currentTeamId}
      className={className}
      showUsage={showUsage}
      fallback={fallback}
      onUpgradeClick={onUpgradeClick}
    >
      {children}
    </FeatureGate>
  );
}
