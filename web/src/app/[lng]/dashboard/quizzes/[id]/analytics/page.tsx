import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getQuizAnalytics } from '@/lib/actions/analytics';
import { AnalyticsOverview, AnalyticsHeader } from '@/components/analytics';

interface AnalyticsPageProps {
  params: { id: string; lng: string };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const t = await getTranslations('dashboard.quizzes.analytics');

  const result = await getQuizAnalytics({ quizId: params.id });
  if (!result || !result.data) {
    notFound();
  }
  const data = result.data;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <AnalyticsHeader quizId={params.id} lng={params.lng} />
      <AnalyticsOverview data={data} lng={params.lng} />
    </div>
  );
}

export async function generateMetadata({ params }: AnalyticsPageProps) {
  const t = await getTranslations('dashboard.quizzes.analytics');
  return { title: t('title') };
}
