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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Activity,
} from 'lucide-react';

interface UsageTrend {
  id: string;
  resourceType: string;
  count: number;
  periodStart: Date;
  periodEnd: Date;
}

interface TeamPlan {
  maxQuizzes?: number | null;
  maxMembers?: number | null;
  maxResponsesPerMonth?: number | null;
  maxStorageMB?: number | null;
}

interface UsageForecastProps {
  trends: UsageTrend[];
  currentUsage: { [key: string]: number };
  plan?: TeamPlan | null;
  lng: string;
}

interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  confidence: number;
}

// Simple linear regression for usage prediction
function calculateLinearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const totalSumSquares = data.reduce(
    (sum, point) => sum + Math.pow(point.y - meanY, 2),
    0
  );
  const residualSumSquares = data.reduce(
    (sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2),
    0
  );
  const r2 = 1 - residualSumSquares / totalSumSquares;

  return { slope, intercept, r2: Math.max(0, r2) };
}

function generateForecast(
  trends: UsageTrend[],
  resourceType: string,
  currentValue: number
): ForecastData[] {
  const resourceTrends = trends
    .filter(trend => trend.resourceType === resourceType)
    .sort(
      (a, b) =>
        new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );

  if (resourceTrends.length < 3) {
    // Not enough data for meaningful prediction
    return [];
  }

  // Prepare data for regression
  const regressionData = resourceTrends.map((trend, index) => ({
    x: index,
    y: trend.count,
  }));

  const { slope, intercept, r2 } = calculateLinearRegression(regressionData);

  // Generate forecast for next 30 days
  const forecastData: ForecastData[] = [];
  const startDate = new Date();

  // Add historical data
  resourceTrends.slice(-7).forEach((trend, index) => {
    const date = new Date(trend.periodStart);
    forecastData.push({
      date: date.toISOString().split('T')[0],
      actual: trend.count,
      predicted: slope * (resourceTrends.length - 7 + index) + intercept,
      confidence: r2 * 100,
    });
  });

  // Add predictions
  for (let i = 1; i <= 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const predicted = Math.max(
      0,
      slope * (resourceTrends.length + i - 1) + intercept
    );
    const confidence = Math.max(0, r2 * 100 - i * 2); // Confidence decreases over time

    forecastData.push({
      date: date.toISOString().split('T')[0],
      predicted: Math.round(predicted),
      confidence: Math.round(confidence),
    });
  }

  return forecastData;
}

function calculateDaysToLimit(
  currentValue: number,
  limit: number,
  growthRate: number
): number {
  if (growthRate <= 0 || currentValue >= limit) return -1;
  return Math.ceil((limit - currentValue) / growthRate);
}

export function UsageForecast({
  trends,
  currentUsage,
  plan,
  lng,
}: UsageForecastProps) {
  const t = useTranslations('dashboard.usage.forecast');

  // Generate forecasts for different resource types
  const responsesForecast = generateForecast(
    trends,
    'RESPONSE',
    currentUsage.RESPONSE || 0
  );
  const quizzesForecast = generateForecast(
    trends,
    'QUIZ',
    currentUsage.QUIZ || 0
  );
  const storageForecast = generateForecast(
    trends,
    'STORAGE',
    currentUsage.STORAGE || 0
  );

  // Calculate growth rates and days to limits
  const responsesGrowthRate =
    responsesForecast.length > 1
      ? (responsesForecast[responsesForecast.length - 1].predicted -
          responsesForecast[0].predicted) /
        responsesForecast.length
      : 0;

  const quizzesGrowthRate =
    quizzesForecast.length > 1
      ? (quizzesForecast[quizzesForecast.length - 1].predicted -
          quizzesForecast[0].predicted) /
        quizzesForecast.length
      : 0;

  const daysToResponseLimit = plan?.maxResponsesPerMonth
    ? calculateDaysToLimit(
        currentUsage.RESPONSE || 0,
        plan.maxResponsesPerMonth,
        responsesGrowthRate
      )
    : -1;

  const daysToQuizLimit = plan?.maxQuizzes
    ? calculateDaysToLimit(
        currentUsage.QUIZ || 0,
        plan.maxQuizzes,
        quizzesGrowthRate
      )
    : -1;

  const formatChartData = (forecast: ForecastData[]) => {
    return forecast.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString(
        lng === 'ja' ? 'ja-JP' : 'en-US',
        {
          month: 'short',
          day: 'numeric',
        }
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Forecast Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Response Forecast */}
        {responsesForecast.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                {t('responses.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t('nextMonth')}
                  </span>
                  <span className="font-semibold">
                    {responsesForecast[responsesForecast.length - 1]
                      ?.predicted || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {responsesGrowthRate > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {responsesGrowthRate > 0 ? '+' : ''}
                    {Math.round(responsesGrowthRate * 30)}{' '}
                    {t('responses.perMonth')}
                  </span>
                </div>
                {daysToResponseLimit > 0 && daysToResponseLimit < 60 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      {t('limitReached', { days: daysToResponseLimit })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Forecast */}
        {quizzesForecast.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t('quizzes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t('nextMonth')}
                  </span>
                  <span className="font-semibold">
                    {quizzesForecast[quizzesForecast.length - 1]?.predicted ||
                      0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {quizzesGrowthRate > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {quizzesGrowthRate > 0 ? '+' : ''}
                    {Math.round(quizzesGrowthRate * 30)} {t('quizzes.perMonth')}
                  </span>
                </div>
                {daysToQuizLimit > 0 && daysToQuizLimit < 60 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      {t('limitReached', { days: daysToQuizLimit })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confidence Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('confidence.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responsesForecast.length > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t('responses.title')}</span>
                    <span>
                      {Math.round(responsesForecast[0]?.confidence || 0)}%
                    </span>
                  </div>
                  <Progress
                    value={responsesForecast[0]?.confidence || 0}
                    className="h-2"
                  />
                </div>
              )}
              {quizzesForecast.length > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t('quizzes.title')}</span>
                    <span>
                      {Math.round(quizzesForecast[0]?.confidence || 0)}%
                    </span>
                  </div>
                  <Progress
                    value={quizzesForecast[0]?.confidence || 0}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Charts */}
      {responsesForecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('chart.title')}</CardTitle>
            <CardDescription>{t('chart.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatChartData(responsesForecast)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    labelClassName="text-foreground"
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                    name={t('chart.actual')}
                  />

                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{
                      fill: 'hsl(var(--muted-foreground))',
                      strokeWidth: 2,
                      r: 3,
                    }}
                    name={t('chart.predicted')}
                  />

                  {plan?.maxResponsesPerMonth && (
                    <ReferenceLine
                      y={plan.maxResponsesPerMonth}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="3 3"
                      label={t('chart.limit')}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
