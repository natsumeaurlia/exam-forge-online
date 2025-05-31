import { Hero } from '../../components/landing/Hero';
import { Features } from '../../components/landing/Features';
import { PricingPlans } from '../../components/landing/PricingPlans';
import { CallToAction } from '../../components/landing/CallToAction';
import { useTranslation } from '../../i18n';

export interface PageProps {
  params: {
    lng: string;
  };
}

export default async function Home({ params }: PageProps) {
  // In Next.js 15, params is a promise that needs to be awaited
  const resolvedParams = await Promise.resolve(params);
  const lng = resolvedParams.lng;
  
  const { t } = await useTranslation(lng);

  return (
    <>
      <Hero lng={lng} />
      <Features lng={lng} />
      <PricingPlans lng={lng} />
      <CallToAction lng={lng} />
    </>
  );
}