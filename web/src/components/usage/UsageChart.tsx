'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface UsageChartProps {
  data: Array<{
    id: string;
    resourceType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>;
  timeframe: 'weekly' | 'monthly';
  lng: string;
}

export function UsageChart({ data, timeframe, lng }: UsageChartProps) {
  const t = useTranslations('dashboard.usage');
  const locale = lng === 'ja' ? ja : enUS;

  // Process data for chart
  const processedData = React.useMemo(() => {
    const grouped = data.reduce(
      (acc, item) => {
        const dateKey = format(
          new Date(item.periodStart),
          timeframe === 'weekly' ? 'MM/dd' : 'MM/dd',
          { locale }
        );

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            QUIZ: 0,
            RESPONSE: 0,
            MEMBER: 0,
            STORAGE: 0,
          };
        }

        acc[dateKey][item.resourceType as keyof (typeof acc)[string]] +=
          item.count;
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data, timeframe, locale]);

  const colors = {
    QUIZ: '#8884d8',
    RESPONSE: '#82ca9d',
    MEMBER: '#ffc658',
    STORAGE: '#ff7300',
  };

  if (processedData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[300px] items-center justify-center">
        {t('charts.noData')}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={value => `${t('date')}: ${value}`}
            formatter={(value: number, name: string) => [
              value,
              t(`resourceTypes.${name.toLowerCase()}`),
            ]}
          />
          <Line
            type="monotone"
            dataKey="QUIZ"
            stroke={colors.QUIZ}
            strokeWidth={2}
            name={t('resourceTypes.quiz')}
          />
          <Line
            type="monotone"
            dataKey="RESPONSE"
            stroke={colors.RESPONSE}
            strokeWidth={2}
            name={t('resourceTypes.response')}
          />
          <Line
            type="monotone"
            dataKey="MEMBER"
            stroke={colors.MEMBER}
            strokeWidth={2}
            name={t('resourceTypes.member')}
          />
          <Line
            type="monotone"
            dataKey="STORAGE"
            stroke={colors.STORAGE}
            strokeWidth={2}
            name={t('resourceTypes.storage')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
