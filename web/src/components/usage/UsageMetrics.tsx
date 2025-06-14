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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

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

interface UsageData {
  currentUsage: Array<{
    resourceType: string;
    _sum: {
      count: number | null;
    };
  }>;
  weeklyTrends: Array<{
    id: string;
    resourceType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>;
  monthlyTrends: Array<{
    id: string;
    resourceType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>;
}

interface QuizStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalResponses: number;
  thisMonthResponses: number;
}

interface UsageMetricsProps {
  usageData: UsageData;
  quizStats: QuizStats;
  team: Team;
  lng: string;
}

export function UsageMetrics({
  usageData,
  quizStats,
  team,
  lng,
}: UsageMetricsProps) {
  const t = useTranslations('dashboard.usage');
  const locale = lng === 'ja' ? ja : enUS;

  const getCurrentUsage = (resourceType: string) => {
    const usage = usageData.currentUsage.find(
      u => u.resourceType === resourceType
    );
    return usage?._sum.count || 0;
  };

  const getUsagePercentage = (current: number, max?: number | null) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const plan = team.subscription?.plan;

  const usageDetails = [
    {
      resource: t('resourceTypes.quiz'),
      current: getCurrentUsage('QUIZ') || quizStats.totalQuizzes,
      limit: plan?.maxQuizzes,
      unit: t('units.items'),
      status: 'active' as const,
    },
    {
      resource: t('resourceTypes.response'),
      current: getCurrentUsage('RESPONSE') || quizStats.thisMonthResponses,
      limit: plan?.maxResponsesPerMonth,
      unit: t('units.monthly'),
      status: 'active' as const,
    },
    {
      resource: t('resourceTypes.member'),
      current: getCurrentUsage('MEMBER') || 1,
      limit: plan?.maxMembers,
      unit: t('units.users'),
      status: 'active' as const,
    },
    {
      resource: t('resourceTypes.storage'),
      current: Math.round(getCurrentUsage('STORAGE') / 1024 / 1024),
      limit: plan?.maxStorageMB,
      unit: 'MB',
      status: 'active' as const,
    },
  ];

  const getStatusBadge = (current: number, limit?: number | null) => {
    if (!limit)
      return <Badge variant="secondary">{t('status.unlimited')}</Badge>;

    const percentage = (current / limit) * 100;
    if (percentage >= 90)
      return <Badge variant="destructive">{t('status.critical')}</Badge>;
    if (percentage >= 75)
      return <Badge variant="outline">{t('status.warning')}</Badge>;
    return <Badge variant="default">{t('status.normal')}</Badge>;
  };

  const recentActivity = usageData.weeklyTrends
    .slice(-10)
    .sort(
      (a, b) =>
        new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );

  return (
    <div className="space-y-6">
      {/* Detailed Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detailedUsage.title')}</CardTitle>
          <CardDescription>{t('detailedUsage.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.resource')}</TableHead>
                <TableHead>{t('table.current')}</TableHead>
                <TableHead>{t('table.limit')}</TableHead>
                <TableHead>{t('table.usage')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageDetails.map(item => (
                <TableRow key={item.resource}>
                  <TableCell className="font-medium">{item.resource}</TableCell>
                  <TableCell>
                    {item.current} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.limit ? `${item.limit} ${item.unit}` : t('unlimited')}
                  </TableCell>
                  <TableCell className="w-[200px]">
                    {item.limit && (
                      <div className="space-y-1">
                        <Progress
                          value={getUsagePercentage(item.current, item.limit)}
                        />
                        <span className="text-muted-foreground text-xs">
                          {Math.round(
                            getUsagePercentage(item.current, item.limit)
                          )}
                          %
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.current, item.limit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity.title')}</CardTitle>
          <CardDescription>{t('recentActivity.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-muted-foreground flex h-[200px] items-center justify-center">
              {t('recentActivity.noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.type')}</TableHead>
                  <TableHead>{t('table.count')}</TableHead>
                  <TableHead>{t('table.period')}</TableHead>
                  <TableHead>{t('table.timeAgo')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {t(
                          `resourceTypes.${activity.resourceType.toLowerCase()}`
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {activity.count}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(activity.periodStart).toLocaleDateString(
                        lng === 'ja' ? 'ja-JP' : 'en-US'
                      )}
                      {' - '}
                      {new Date(activity.periodEnd).toLocaleDateString(
                        lng === 'ja' ? 'ja-JP' : 'en-US'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(activity.periodStart), {
                        addSuffix: true,
                        locale,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
