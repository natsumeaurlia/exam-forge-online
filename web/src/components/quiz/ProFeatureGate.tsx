'use client';

import React from 'react';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import type { FeatureType } from '@prisma/client';

interface ProFeatureGateProps {
  children: React.ReactNode;
  featureType?: FeatureType;
  requiredPlan?: 'PRO' | 'PREMIUM';
  className?: string;
}

export function ProFeatureGate({
  children,
  featureType,
  requiredPlan = 'PRO',
  className,
}: ProFeatureGateProps) {
  const { isPro, isPremium, hasFeature, loading } = useUserPlan();
  const t = useTranslations('common');
  const router = useRouter();

  if (loading) {
    return <div className="h-32 animate-pulse rounded bg-gray-200" />;
  }

  // Check if user has required plan
  let hasAccess = requiredPlan === 'PRO' ? isPro || isPremium : isPremium;

  // Check specific feature if provided
  if (featureType && !hasFeature(featureType)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold">
              {requiredPlan === 'PREMIUM'
                ? t('upgradeToPremium')
                : t('upgradeToPro')}
            </h3>
            <p className="max-w-md text-sm text-gray-600">
              {t('featureLocked')}
            </p>
            <Button onClick={() => router.push('/plans')} className="mt-2">
              {t('viewPlans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
