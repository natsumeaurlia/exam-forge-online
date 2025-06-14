'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Users,
  ClipboardList,
  TrendingUp,
  Target,
  HelpCircle,
} from 'lucide-react';

interface TeamAnalyticsData {
  overview: {
    totalQuizzes: number;
    totalParticipants: number;
    totalResponses: number;
    averageScore: number;
    overallPassRate: number;
    totalQuestions: number;
  };
  trends: {
    daily: Array<{ date: string; count: number; averageScore: number }>;
    weekly: Array<{ date: string; count: number; averageScore: number }>;
    monthly: Array<{ date: string; count: number; averageScore: number }>;
  };
  rankings: {
    popularQuizzes: Array<{
      id: string;
      title: string;
      responseCount: number;
      averageScore: number;
    }>;
    highScoreQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
    challengingQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
  };
  statistics: {
    quizzesByStatus: {
      published: number;
      draft: number;
      archived: number;
    };
    responsesByMonth: Array<{ month: string; count: number }>;
    topPerformers: Array<{
      name: string;
      averageScore: number;
      completedQuizzes: number;
    }>;
  };
}

interface TeamAnalyticsOverviewProps {
  data: TeamAnalyticsData;
  lng: string;
}

export function TeamAnalyticsOverview({
  data,
  lng,
}: TeamAnalyticsOverviewProps) {
  const t = useTranslations('dashboard.analytics');

  if (!data || data.overview.totalQuizzes === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p>{t('noDataAvailable')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overview } = data;

  const statCards = [
    {
      title: t('totalQuizzes'),
      value: overview.totalQuizzes.toLocaleString(),
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: t('totalParticipants'),
      value: overview.totalParticipants.toLocaleString(),
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: t('totalResponses'),
      value: overview.totalResponses.toLocaleString(),
      icon: BarChart3,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: t('averageScore'),
      value: `${overview.averageScore}%`,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      title: t('overallPassRate'),
      value: `${overview.overallPassRate}%`,
      icon: Target,
      color: 'text-red-600 bg-red-50',
    },
    {
      title: t('totalQuestions'),
      value: overview.totalQuestions.toLocaleString(),
      icon: HelpCircle,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const [textColor, bgColor] = stat.color.split(' ');

        return (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
