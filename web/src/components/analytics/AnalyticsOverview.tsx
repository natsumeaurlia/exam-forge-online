'use client';

import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslations } from 'next-intl';
import type { QuizAnalytics } from '@/lib/actions/analytics';

interface AnalyticsOverviewProps {
  data: QuizAnalytics;
  lng: string;
}

export function AnalyticsOverview({ data, lng }: AnalyticsOverviewProps) {
  const t = useTranslations('dashboard.quizzes.analytics');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">{t('totalResponses')}</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.totalResponses}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">{t('avgScore')}</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.averageScore.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">{t('completionRate')}</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.passRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">{t('realtime')}</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(data.averageTime)}s
          </div>
        </div>
      </div>
      {data.trend.length > 0 && (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.trend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                name={t('totalResponses')}
              />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#82ca9d"
                name={t('avgScore')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
