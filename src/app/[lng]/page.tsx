import { Hero } from '../../components/landing/Hero';
import { Features } from '../../components/landing/Features';
import { UseCaseTabs } from '../../components/landing/UseCaseTabs';
import { PricingPlans } from '../../components/landing/PricingPlans';
import { CallToAction } from '../../components/landing/CallToAction';
import { getTranslations } from 'next-intl/server';

export interface PageProps {
  params: {
    lng: string;
  };
}

export default async function Home({ params }: PageProps) {
  // In Next.js 15, params is a promise that needs to be awaited
  const resolvedParams = await Promise.resolve(params);
  const lng = resolvedParams.lng;

  const t = await getTranslations();

  return (
    <>
      <Hero lng={lng} />
      <Features lng={lng} />
      <UseCaseTabs lng={lng} />
      <PricingPlans lng={lng} />
      <CallToAction lng={lng} />
    </>
  );
}
