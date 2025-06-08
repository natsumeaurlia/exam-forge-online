import { getTranslations } from 'next-intl/server';
import { PlanComparison } from '@/components/plans/PlanComparison';
import { LandingNavbar } from '@/components/layout/LandingNavbar';
import { Footer } from '@/components/layout/Footer';

interface PlansPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export async function generateMetadata({ params }: PlansPageProps) {
  const { lng } = await params;
  const t = await getTranslations({ locale: lng });

  return {
    title: t('plans.meta.title'),
    description: t('plans.meta.description'),
  };
}

export default async function PlansPage({ params }: PlansPageProps) {
  const { lng } = await params;
  return (
    <>
      <LandingNavbar lng={lng} />
      <main className="min-h-screen bg-gray-50 pt-20">
        <PlanComparison lng={lng} />
      </main>
      <Footer lng={lng} />
    </>
  );
}
