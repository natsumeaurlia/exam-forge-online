import React from 'react';
import { getTranslations } from 'next-intl/server';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentQuizCard } from '@/components/dashboard/RecentQuizCard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { UsageMeter } from '@/components/dashboard/UsageMeter';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { DashboardRefresher } from '@/components/dashboard/DashboardRefresher';

interface DashboardPageProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { lng } = await params;
  const t = await getTranslations('dashboard');

  return {
    title: `${t('title')} - ExamForge`,
    description: t('overview'),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { lng } = await params;
  const t = await getTranslations('dashboard');

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* リフレッシュボタン */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* ウェルカムセクション */}
          <WelcomeSection lng={lng} />
        </div>
        <DashboardRefresher autoRefreshInterval={60} />
      </div>

      {/* 統計カード */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('overview')}
        </h2>
        <StatsCard lng={lng} />
      </section>

      {/* メインコンテンツグリッド */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左カラム - 最近のクイズとアクティビティ */}
        <div className="space-y-8 lg:col-span-2">
          {/* 最近のクイズ */}
          <section>
            <RecentQuizCard lng={lng} />
          </section>

          {/* アクティビティタイムライン */}
          <section>
            <ActivityTimeline lng={lng} />
          </section>
        </div>

        {/* 右カラム - 使用状況とクイックアクション */}
        <div className="space-y-8">
          {/* 使用状況メーター */}
          <section>
            <UsageMeter lng={lng} />
          </section>

          {/* クイックアクション */}
          <section>
            <QuickActionButton lng={lng} />
          </section>
        </div>
      </div>

      {/* モバイル用追加セクション */}
      <div className="space-y-8 lg:hidden">
        {/* モバイルでは縦に並べる追加のコンテンツ */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {t('recentAchievements')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-green-700">
                {t('weeklyCompletionRate')}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-blue-700">
                {t('newParticipants')}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
