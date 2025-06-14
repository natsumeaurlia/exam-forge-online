'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Calendar,
  Users,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export interface SubscriptionData {
  plan: {
    type: 'FREE' | 'PRO' | 'PREMIUM';
    name: string;
    monthlyPrice?: number;
    yearlyPrice?: number;
  };
  subscription?: {
    status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
    currentPeriodEnd: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    memberCount: number;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface SubscriptionStatusCardProps {
  data: SubscriptionData;
  lng: string;
  compact?: boolean;
}

export function SubscriptionStatusCard({
  data,
  lng,
  compact = false,
}: SubscriptionStatusCardProps) {
  const t = useTranslations('subscription');

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'PRO':
      case 'PREMIUM':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'PRO':
        return 'default';
      case 'PREMIUM':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSubscriptionStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          label: t('status.active', { default: 'アクティブ' }),
          icon: <CheckCircle className="h-3 w-3" />,
          color: 'text-green-600',
        };
      case 'TRIALING':
        return {
          variant: 'secondary' as const,
          label: t('status.trialing', { default: 'トライアル中' }),
          icon: <Calendar className="h-3 w-3" />,
          color: 'text-blue-600',
        };
      case 'PAST_DUE':
        return {
          variant: 'destructive' as const,
          label: t('status.pastDue', { default: '支払い延滞' }),
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-red-600',
        };
      case 'CANCELED':
        return {
          variant: 'outline' as const,
          label: t('status.canceled', { default: 'キャンセル済み' }),
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-gray-600',
        };
      default:
        return {
          variant: 'outline' as const,
          label: t('status.free', { default: 'フリープラン' }),
          icon: <TrendingUp className="h-3 w-3" />,
          color: 'text-gray-600',
        };
    }
  };

  const statusInfo = getSubscriptionStatusInfo(data.subscription?.status);

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPlanIcon(data.plan.type)}
              <div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={getPlanBadgeVariant(data.plan.type)}
                    className="text-xs"
                  >
                    {data.plan.name}
                  </Badge>
                  <Badge variant={statusInfo.variant} className="text-xs">
                    <span className="flex items-center space-x-1">
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </Badge>
                </div>
                {data.subscription && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('billing.nextBilling', { default: '次回請求' })}:{' '}
                    {new Date(
                      data.subscription.currentPeriodEnd
                    ).toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US')}
                  </p>
                )}
              </div>
            </div>
            <Link href={`/${lng}/dashboard/subscription`}>
              <Button variant="ghost" size="sm">
                {t('actions.manage', { default: '管理' })}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getPlanIcon(data.plan.type)}
          <span>{t('currentPlan.title', { default: '現在のプラン' })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge
              variant={getPlanBadgeVariant(data.plan.type)}
              className="px-3 py-1 text-sm"
            >
              {data.plan.name}
            </Badge>
            <Badge variant={statusInfo.variant} className="text-sm">
              <span className="flex items-center space-x-1">
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </Badge>
          </div>
          {data.plan.monthlyPrice && (
            <div className="text-right">
              <p className="text-xl font-bold">
                ¥{data.plan.monthlyPrice.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {t('billing.perMonth', { default: '/ 月' })}
              </p>
            </div>
          )}
        </div>

        {/* Subscription Details */}
        {data.subscription && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">
                  {t('billing.nextBilling', { default: '次回請求日' })}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(
                    data.subscription.currentPeriodEnd
                  ).toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">
                  {t('team.members', { default: 'チームメンバー' })}
                </p>
                <p className="text-sm text-gray-600">
                  {data.subscription.memberCount}{' '}
                  {t('team.membersUnit', { default: '人' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {data.plan.type === 'FREE' ? (
            <Link href={`/${lng}/plans`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Crown className="mr-2 h-3 w-3" />
                {t('actions.upgrade', { default: 'アップグレード' })}
              </Button>
            </Link>
          ) : (
            <>
              <Link href={`/${lng}/dashboard/subscription`}>
                <Button variant="outline" size="sm">
                  {t('actions.viewDetails', { default: '詳細を見る' })}
                </Button>
              </Link>
              {data.subscription && data.team && (
                <form
                  action="/api/stripe/portal"
                  method="POST"
                  className="inline"
                >
                  <input type="hidden" name="teamId" value={data.team.id} />
                  <Button variant="outline" size="sm" type="submit">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    {t('actions.manageSubscription', { default: '管理' })}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
