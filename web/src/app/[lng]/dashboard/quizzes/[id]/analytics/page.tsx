import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getQuizAnalytics } from '@/lib/actions/analytics';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';

interface AnalyticsPageProps {
  params: { id: string; lng: string };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const t = await getTranslations('dashboard.quizzes.analytics');

  const { data, error } = await getQuizAnalytics(params.id);
  if (error || !data) {
    notFound();
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <AnalyticsOverview data={data} lng={params.lng} />
    </div>
  );
}

export async function generateMetadata({ params }: AnalyticsPageProps) {
  const t = await getTranslations('dashboard.quizzes.analytics');
  return { title: t('title') };
}
