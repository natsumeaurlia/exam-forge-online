'use client';

import { useTranslations } from 'next-intl';
import { PlanToggle } from './PlanToggle';
import { usePlanComparisonStore } from '@/stores/usePlanComparisonStore';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { PlanFaq } from './PlanFaq';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/common/AnimatedSection';
import Link from 'next/link';

interface PlanComparisonProps {
  lng: string;
}

export function PlanComparison({ lng }: PlanComparisonProps) {
  const t = useTranslations();
  const { isAnnual } = usePlanComparisonStore();

  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <h1 className="mb-4 text-4xl font-bold">
            <span className="heading-gradient">{t('plans.title')}</span>
          </h1>
          <p className="text-lg text-gray-600">{t('plans.subtitle')}</p>
        </AnimatedSection>

        {/* Plan Toggle */}
        <AnimatedSection animation="fadeInUp" delay={200} className="mb-16">
          <PlanToggle />
        </AnimatedSection>

        {/* Feature Comparison Table */}
        <AnimatedSection animation="fadeInUp" delay={300} threshold={0.1}>
          <FeatureComparisonTable isAnnual={isAnnual} lng={lng} />
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection animation="fadeInUp" delay={400} className="mt-24">
          <h2 className="mb-8 text-center text-3xl font-bold">
            {t('plans.faq.title')}
          </h2>
          <PlanFaq />
        </AnimatedSection>

        {/* Final CTA */}
        <AnimatedSection
          animation="fadeInUp"
          delay={500}
          className="mt-24 text-center"
        >
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold">{t('plans.cta.title')}</h3>
            <p className="mb-8 text-gray-600">{t('plans.cta.subtitle')}</p>
            <Button
              asChild
              size="lg"
              className="bg-examforge-orange hover:bg-examforge-orange/90 text-white"
            >
              <Link href={`/${lng}/auth/signin`}>{t('plans.cta.button')}</Link>
            </Button>
            <p className="mt-4 text-sm text-gray-500">{t('plans.cta.note')}</p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
