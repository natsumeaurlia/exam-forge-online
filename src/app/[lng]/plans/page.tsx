import { DefaultLayout } from '@/components/layout/DefaultLayout';
import { FeatureComparisonTable } from '@/components/plan/FeatureComparisonTable';
import { getTranslations } from 'next-intl/server';

export interface PlansPageProps {
  params: { lng: string };
}

export default async function PlansPage({ params }: PlansPageProps) {
  const { lng } = params;
  const t = await getTranslations();

  return (
    <DefaultLayout lng={lng}>
      <div className="container mx-auto px-4 py-12" data-testid="plans-page">
        <h1 className="mb-6 text-3xl font-bold" data-testid="plans-title">
          {t('pages.plans.title')}
        </h1>
        <p className="mb-8" data-testid="plans-description">
          {t('pages.plans.description')}
        </p>
        <FeatureComparisonTable lng={lng} />
      </div>
    </DefaultLayout>
  );
}
