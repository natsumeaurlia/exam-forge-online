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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Database,
  HardDrive,
} from 'lucide-react';
import { UsageChart } from '@/components/usage/UsageChart';
import { UsageMetrics } from '@/components/usage/UsageMetrics';
import { TeamPlanCard } from '@/components/usage/TeamPlanCard';
import { UsageAlerts } from '@/components/usage/UsageAlerts';
import { UsageExport } from '@/components/usage/UsageExport';
import { UsageNotifications } from '@/components/usage/UsageNotifications';

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

interface UsageMonitoringClientProps {
  lng: string;
  team: Team;
  usageData: UsageData;
  quizStats: QuizStats;
}

export function UsageMonitoringClient({
  lng,
  team,
  usageData,
  quizStats,
}: UsageMonitoringClientProps) {
  const t = useTranslations('dashboard.usage');

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
  const currentQuizzes = getCurrentUsage('QUIZ') || quizStats.totalQuizzes;
  const currentMembers = getCurrentUsage('MEMBER') || 1;
  const currentStorage = getCurrentUsage('STORAGE') || 0;
  const currentResponses =
    getCurrentUsage('RESPONSE') || quizStats.thisMonthResponses;

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex gap-3">
          <UsageExport
            team={team}
            usageData={usageData}
            quizStats={quizStats}
            lng={lng}
          />
          <TeamPlanCard team={team} />
        </div>
      </div>

      {/* Usage Alerts */}
      <UsageAlerts
        team={team}
        currentQuizzes={currentQuizzes}
        currentMembers={currentMembers}
        currentStorage={currentStorage}
        currentResponses={currentResponses}
        lng={lng}
      />

      {/* Real-time Usage Notifications */}
      <UsageNotifications teamId={team.id} lng={lng} />

      {/* Usage Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.quizzes')}
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentQuizzes}</div>
            {plan?.maxQuizzes && (
              <>
                <p className="text-muted-foreground text-xs">
                  {t('of')} {plan.maxQuizzes} {t('maximum')}
                </p>
                <Progress
                  value={getUsagePercentage(currentQuizzes, plan.maxQuizzes)}
                  className="mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.responses')}
            </CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentResponses}</div>
            {plan?.maxResponsesPerMonth && (
              <>
                <p className="text-muted-foreground text-xs">
                  {t('thisMonth')} / {plan.maxResponsesPerMonth} {t('maximum')}
                </p>
                <Progress
                  value={getUsagePercentage(
                    currentResponses,
                    plan.maxResponsesPerMonth
                  )}
                  className="mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.members')}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMembers}</div>
            {plan?.maxMembers && (
              <>
                <p className="text-muted-foreground text-xs">
                  {t('of')} {plan.maxMembers} {t('maximum')}
                </p>
                <Progress
                  value={getUsagePercentage(currentMembers, plan.maxMembers)}
                  className="mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('metrics.storage')}
            </CardTitle>
            <HardDrive className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(currentStorage / 1024 / 1024)}MB
            </div>
            {plan?.maxStorageMB && (
              <>
                <p className="text-muted-foreground text-xs">
                  {t('of')} {plan.maxStorageMB}MB {t('maximum')}
                </p>
                <Progress
                  value={getUsagePercentage(
                    currentStorage / 1024 / 1024,
                    plan.maxStorageMB
                  )}
                  className="mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Trends */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">{t('tabs.trends')}</TabsTrigger>
          <TabsTrigger value="metrics">{t('tabs.detailed')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('charts.weeklyTrend')}
                </CardTitle>
                <CardDescription>
                  {t('charts.weeklyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsageChart
                  data={usageData.weeklyTrends}
                  timeframe="weekly"
                  lng={lng}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('charts.monthlyTrend')}
                </CardTitle>
                <CardDescription>
                  {t('charts.monthlyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsageChart
                  data={usageData.monthlyTrends}
                  timeframe="monthly"
                  lng={lng}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <UsageMetrics
            usageData={usageData}
            quizStats={quizStats}
            team={team}
            lng={lng}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
