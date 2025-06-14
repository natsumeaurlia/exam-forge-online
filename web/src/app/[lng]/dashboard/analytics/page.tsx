import React from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTeamAnalytics } from '@/lib/actions/analytics';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { TeamAnalyticsOverview } from '@/components/analytics/TeamAnalyticsOverview';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import { QuizRankings } from '@/components/analytics/QuizRankings';

interface TeamAnalyticsPageProps {
  params: Promise<{ lng: string }>;
  searchParams: Promise<{ range?: string }>;
}

export async function generateMetadata({ params }: TeamAnalyticsPageProps) {
  const { lng } = await params;
  const t = await getTranslations('dashboard.analytics');

  return {
    title: `${t('teamAnalytics')} - ExamForge`,
    description: t('teamAnalyticsDescription'),
  };
}

export default async function TeamAnalyticsPage({
  params,
  searchParams,
}: TeamAnalyticsPageProps) {
  const { lng } = await params;
  const { range = '30d' } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    redirect(`/${lng}/auth/signin`);
  }

  const t = await getTranslations('dashboard.analytics');

  // チーム全体の分析データを取得
  const validRange = ['7d', '30d', '90d', 'all'].includes(range)
    ? (range as '7d' | '30d' | '90d' | 'all')
    : '30d';
  const analyticsResult = await getTeamAnalytics({ range: validRange });

  if (!analyticsResult?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            {t('errorTitle')}
          </h2>
          <p className="mt-2 text-red-600">{t('errorMessage')}</p>
        </div>
      </div>
    );
  }

  const analyticsData = analyticsResult.data;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* ページヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t('teamAnalytics')}
          </h1>
          <p className="mt-2 text-gray-600">{t('teamAnalyticsDescription')}</p>
        </div>
        <AnalyticsHeader
          lng={lng}
          currentRange={range}
          exportData={analyticsData}
          exportType="team"
        />
      </div>

      {/* 全体統計概要 */}
      <section>
        <TeamAnalyticsOverview data={analyticsData} lng={lng} />
      </section>

      {/* グラフ表示セクション */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {t('trendsAndInsights')}
        </h2>
        <AnalyticsCharts data={analyticsData} lng={lng} />
      </section>

      {/* クイズランキングセクション */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {t('quizRankings')}
        </h2>
        <QuizRankings data={analyticsData} lng={lng} />
      </section>
    </div>
  );
}
