'use client';

import { Badge } from '@/components/ui/badge';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { Crown, Sparkles, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PlanBadge() {
  const { data, loading, isPro, isEnterprise, isFree } = useUserPlan();
  const t = useTranslations('common.plans');

  if (loading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        <div className="h-4 w-16 rounded bg-gray-300" />
      </Badge>
    );
  }

  if (isEnterprise) {
    return (
      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
        <Sparkles className="mr-1 h-3 w-3" />
        {t('enterprise')}
      </Badge>
    );
  }

  if (isPro) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
        <Crown className="mr-1 h-3 w-3" />
        {t('pro')}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <User className="mr-1 h-3 w-3" />
      {t('free')}
    </Badge>
  );
}
