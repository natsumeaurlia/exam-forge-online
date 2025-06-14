import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { getUsageData } from '@/lib/actions/analytics';

interface UsageMeterProps {
  lng: string;
}

export async function UsageMeter({ lng }: UsageMeterProps) {
  const t = await getTranslations('dashboard.usage');

  // Fetch real data from database
  const result = await getUsageData({});

  if (!result || !result.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-gray-500">{t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  const { data } = result;

  const usageItems = [
    {
      label: t('quizzes'),
      current: data.usage.quizzes.current,
      limit: data.usage.quizzes.limit,
      unit: '',
    },
    {
      label: t('participants'),
      current: data.usage.participants.current,
      limit: data.usage.participants.limit,
      unit: '',
    },
    {
      label: t('storage'),
      current: Math.round(data.usage.storage.current),
      limit: data.usage.storage.limit,
      unit: 'MB',
    },
    {
      label: t('members'),
      current: data.usage.members.current,
      limit: data.usage.members.limit,
      unit: '',
    },
  ];

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            {t('currentPlan')}:{' '}
            <span className="font-medium capitalize">{data.currentPlan}</span>
          </p>
        </div>
        {data.currentPlan === 'free' && (
          <Button asChild size="sm">
            <Link href={`/${lng}/plans`}>
              {t('upgrade')}
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usageItems.map(item => {
            const percentage = getUsagePercentage(item.current, item.limit);
            const isUnlimited = item.limit === -1;

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-gray-500">
                    {item.current}
                    {item.unit && ` ${item.unit}`}
                    {!isUnlimited && (
                      <>
                        {' / '}
                        {item.limit}
                        {item.unit && ` ${item.unit}`}
                      </>
                    )}
                    {isUnlimited && ` / ${t('unlimited')}`}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${isUnlimited ? 0 : percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
