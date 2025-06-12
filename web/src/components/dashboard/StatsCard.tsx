import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
  FileText,
  Users,
  TrendingUp,
  Activity,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '@/lib/actions/analytics';

interface StatItem {
  key: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface StatsCardProps {
  lng: string;
}

export async function StatsCard({ lng }: StatsCardProps) {
  const t = await getTranslations('dashboard.stats');

  // Fetch real data from database
  const result = await getDashboardStats();

  if (!result.success || !result.data) {
    // Return empty state or error message
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="py-8 text-center text-gray-500">
            {t('noData')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data } = result;

  const stats: StatItem[] = [
    {
      key: 'totalQuizzes',
      value: data.totalQuizzes,
      change: data.percentageChanges.totalQuizzes,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'monthlyParticipants',
      value: data.monthlyParticipants,
      change: data.percentageChanges.monthlyParticipants,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      key: 'averageScore',
      value: data.averageScore,
      change: data.percentageChanges.averageScore,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'activeQuizzes',
      value: data.activeQuizzes,
      change: data.percentageChanges.activeQuizzes,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const formatValue = (key: string, value: number) => {
    if (key === 'averageScore') {
      return `${value.toFixed(1)}%`;
    }
    if (key === 'monthlyParticipants') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return {
      value: Math.abs(change),
      isPositive,
      text: isPositive ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`,
    };
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        const change = formatChange(stat.change);

        return (
          <Card key={stat.key} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t(stat.key as any)}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(stat.key, stat.value)}
                </div>
                <div className="flex items-center space-x-1">
                  {change.isPositive ? (
                    <ArrowUpIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-red-500" />
                  )}
                  <Badge
                    variant={change.isPositive ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {change.text}
                  </Badge>
                  <span className="text-xs text-gray-500">前月比</span>
                </div>
              </div>

              {/* アニメーション用のプログレスバー */}
              <div className="mt-3">
                <div className="h-1 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-1 rounded-full transition-all duration-1000 ease-out ${stat.color.replace(
                      'text-',
                      'bg-'
                    )}`}
                    style={{
                      width: `${Math.min((stat.value / (stat.key === 'averageScore' ? 100 : Math.max(...stats.map(s => s.value)))) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
