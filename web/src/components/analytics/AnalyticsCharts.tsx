'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

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

interface AnalyticsChartsProps {
  data: TeamAnalyticsData;
  lng: string;
}

type TrendInterval = 'daily' | 'weekly' | 'monthly';

export function AnalyticsCharts({ data, lng }: AnalyticsChartsProps) {
  const t = useTranslations('dashboard.analytics');
  const [selectedInterval, setSelectedInterval] =
    useState<TrendInterval>('daily');
  const locale = lng === 'ja' ? ja : enUS;

  const formatTrendDate = (dateStr: string, interval: TrendInterval) => {
    try {
      const date = new Date(dateStr);
      if (interval === 'daily') {
        return format(date, 'MM/dd', { locale });
      } else if (interval === 'weekly') {
        return format(date, 'MM/dd', { locale });
      } else {
        return format(date, 'yyyy/MM', { locale });
      }
    } catch {
      return dateStr;
    }
  };

  const trendData = data.trends[selectedInterval].map(point => ({
    ...point,
    formattedDate: formatTrendDate(point.date, selectedInterval),
  }));

  // Quiz status distribution data for pie chart
  const statusData = [
    {
      name: t('published'),
      value: data.statistics.quizzesByStatus.published,
      color: '#10B981',
    },
    {
      name: t('draft'),
      value: data.statistics.quizzesByStatus.draft,
      color: '#F59E0B',
    },
    {
      name: t('archived'),
      value: data.statistics.quizzesByStatus.archived,
      color: '#6B7280',
    },
  ].filter(item => item.value > 0);

  // Monthly response data
  const monthlyData = data.statistics.responsesByMonth.map(item => ({
    ...item,
    formattedMonth: format(new Date(item.month), 'yyyy/MM', { locale }),
  }));

  return (
    <div className="space-y-6">
      {/* Response Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {t('responseTrends')}
            </CardTitle>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                <Button
                  key={interval}
                  variant={
                    selectedInterval === interval ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedInterval(interval)}
                >
                  {t(
                    `interval${interval.charAt(0).toUpperCase() + interval.slice(1)}`
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient
                    id="colorResponses"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResponses)"
                  name={t('responseCount')}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name={t('averageScore')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quiz Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t('quizStatusDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Response Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t('monthlyResponseVolume')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="formattedMonth"
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    name={t('responseCount')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
