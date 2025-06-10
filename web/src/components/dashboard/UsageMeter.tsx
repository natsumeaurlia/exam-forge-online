'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UsageItem {
  key: string;
  current: number;
  limit: number;
  unit: string;
  color: string;
}

interface UsageMeterProps {
  lng: string;
}

export function UsageMeter({ lng }: UsageMeterProps) {
  const t = useTranslations('dashboard.usage');

  // モックデータ - 実際のプロジェクトではAPIから取得
  const currentPlan = 'free'; // 'free' | 'pro' | 'premium'

  const usageData: UsageItem[] = [
    {
      key: 'quizzes',
      current: 3,
      limit: 5,
      unit: t('units.items'),
      color: 'bg-blue-500',
    },
    {
      key: 'participants',
      current: 247,
      limit: 300,
      unit: t('units.peoplePerMonth'),
      color: 'bg-green-500',
    },
    {
      key: 'storage',
      current: 45,
      limit: 100,
      unit: t('units.mb'),
      color: 'bg-purple-500',
    },
    {
      key: 'members',
      current: 2,
      limit: 3,
      unit: t('units.people'),
      color: 'bg-orange-500',
    },
  ];

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90)
      return {
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: t('status.nearLimit'),
      };
    if (percentage >= 70)
      return {
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        label: t('status.warning'),
      };
    return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: t('status.normal'),
    };
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free':
        return t('plans.free');
      case 'pro':
        return t('plans.pro');
      case 'premium':
        return t('plans.premium');
      default:
        return plan;
    }
  };

  const getUsageLabel = (key: string) => {
    switch (key) {
      case 'quizzes':
        return t('metrics.quizzes');
      case 'participants':
        return t('metrics.participants');
      case 'storage':
        return t('metrics.storage');
      case 'members':
        return t('metrics.members');
      default:
        return key;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('title')}</span>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Crown className="h-3 w-3" />
            <span>{getPlanName(currentPlan)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 使用状況一覧 */}
        <div className="space-y-4">
          {usageData.map(item => {
            const percentage = getUsagePercentage(item.current, item.limit);
            const status = getUsageStatus(percentage);

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {getUsageLabel(item.key)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">
                      {item.current.toLocaleString()} /{' '}
                      {item.limit.toLocaleString()} {item.unit}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${status.bg} ${status.color} text-xs`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {t('percentUsed', { percent: percentage.toFixed(1) })}
                  </span>
                  <span>
                    {t('remaining', {
                      amount: (item.limit - item.current).toLocaleString(),
                      unit: item.unit,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* プラン情報とアップグレード */}
        <div className="border-t pt-4">
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {t('upgradePrompt')}
                </span>
              </div>
            </div>

            <p className="mb-4 text-sm text-blue-700">
              {t('upgradeDescription')}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600">
                <span className="font-semibold">{t('priceFrom')}</span>
                <span className="ml-1">{t('from')}</span>
              </div>

              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <ArrowUp className="mr-1 h-4 w-4" />
                {t('upgrade')}
              </Button>
            </div>
          </div>
        </div>

        {/* 使用量の詳細リンク */}
        <div className="text-center">
          <button className="text-sm text-gray-600 underline hover:text-gray-800">
            {t('showDetails')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
