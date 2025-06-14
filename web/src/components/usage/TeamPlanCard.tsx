'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Star } from 'lucide-react';
import Link from 'next/link';

interface TeamPlan {
  name: string;
  type: string;
  maxQuizzes?: number | null;
  maxMembers?: number | null;
  maxResponsesPerMonth?: number | null;
  maxStorageMB?: number | null;
}

interface Team {
  id: string;
  name: string;
  subscription?: {
    plan: TeamPlan;
  } | null;
}

interface TeamPlanCardProps {
  team: Team;
}

export function TeamPlanCard({ team }: TeamPlanCardProps) {
  const t = useTranslations('dashboard.usage');

  const plan = team.subscription?.plan;
  const planType = plan?.type || 'FREE';

  const getPlanIcon = () => {
    switch (planType) {
      case 'PREMIUM':
        return <Crown className="h-4 w-4" />;
      case 'PRO':
        return <Zap className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getPlanColor = () => {
    switch (planType) {
      case 'PREMIUM':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'PRO':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <Card className="w-full md:w-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-full p-2 text-white ${getPlanColor()}`}>
              {getPlanIcon()}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{team.name}</CardTitle>
              <CardDescription className="text-xs">
                {t('teamPlan.currentPlan')}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={planType === 'FREE' ? 'secondary' : 'default'}
            className={
              planType !== 'FREE' ? getPlanColor() + ' border-0 text-white' : ''
            }
          >
            {plan?.name || t('plans.free')}
          </Badge>
        </div>
      </CardHeader>

      {planType === 'FREE' && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              {t('teamPlan.upgradePrompt')}
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/plans">{t('teamPlan.upgrade')}</Link>
            </Button>
          </div>
        </CardContent>
      )}

      {plan && planType !== 'FREE' && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {plan.maxQuizzes && (
              <div>
                <div className="font-medium">{t('limits.quizzes')}</div>
                <div className="text-muted-foreground">{plan.maxQuizzes}</div>
              </div>
            )}
            {plan.maxMembers && (
              <div>
                <div className="font-medium">{t('limits.members')}</div>
                <div className="text-muted-foreground">{plan.maxMembers}</div>
              </div>
            )}
            {plan.maxResponsesPerMonth && (
              <div>
                <div className="font-medium">{t('limits.responses')}</div>
                <div className="text-muted-foreground">
                  {plan.maxResponsesPerMonth}/月
                </div>
              </div>
            )}
            {plan.maxStorageMB && (
              <div>
                <div className="font-medium">{t('limits.storage')}</div>
                <div className="text-muted-foreground">
                  {plan.maxStorageMB}MB
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
