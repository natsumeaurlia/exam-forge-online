import { Hero } from '../../components/landing/Hero';
import { Features } from '../../components/landing/Features';
import { UseCaseTabs } from '../../components/landing/UseCaseTabs';
import { PricingPlans } from '../../components/landing/PricingPlans';
import { CallToAction } from '../../components/landing/CallToAction';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { Footer } from '../../components/layout/Footer';

export interface PageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default async function Home({ params }: PageProps) {
  const { lng } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar lng={lng} />
      <main className="flex-1">
        <Hero lng={lng} />
        <Features lng={lng} />
        <UseCaseTabs lng={lng} />
        <PricingPlans lng={lng} />
        <CallToAction lng={lng} />
      </main>
      <Footer lng={lng} />
    </div>
  );
}
