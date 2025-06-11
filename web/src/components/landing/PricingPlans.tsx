'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlanToggle } from '@/components/plans/PlanToggle';
import { usePlanComparisonStore } from '@/stores/usePlanComparisonStore';
import { AnimatedSection } from '@/components/common/AnimatedSection';
import Link from 'next/link';

export interface PricingPlansProps {
  lng: string;
}

export function PricingPlans({ lng }: PricingPlansProps) {
  const t = useTranslations();
  const { isAnnual } = usePlanComparisonStore();
  const currentLanguage = lng;

  const plans = [
    {
      name: t('pricing.plans.free.name'),
      priceMonthly: currentLanguage === 'en' ? '$0' : '¥0',
      priceAnnual: currentLanguage === 'en' ? '$0' : '¥0',
      period: t('pricing.plans.free.period'),
      description: t('pricing.plans.free.description'),
      features: [
        t('pricing.plans.features.quizzes.free'),
        t('pricing.plans.features.members.free'),
        t('pricing.plans.features.questions.free'),
        t('pricing.plans.features.responses.free'),
        t('pricing.plans.features.storage.free'),
        t('pricing.plans.features.truefalse'),
        t('pricing.plans.features.singlechoice'),
        t('pricing.plans.features.multiplechoice'),
        t('pricing.plans.features.freetext'),
        t('pricing.plans.features.autograding'),
        t('pricing.plans.features.manualgrading'),
        t('pricing.plans.features.password'),
      ],
      notIncluded: [
        t('pricing.plans.features.subdomain'),
        t('pricing.plans.features.media'),
        t('pricing.plans.features.questionbank'),
        t('pricing.plans.features.advancedtypes'),
        t('pricing.plans.features.analytics'),
        t('pricing.plans.features.sections'),
      ],
      color: 'examforge-blue',
      popular: false,
      cta: t('pricing.plans.free.cta'),
    },
    {
      name: t('pricing.plans.pro.name'),
      priceMonthly: currentLanguage === 'en' ? '$29' : '¥2,980',
      priceAnnual: currentLanguage === 'en' ? '$24' : '¥2,480',
      period: t('pricing.plans.pro.period'),
      description: t('pricing.plans.pro.description'),
      features: [
        t('pricing.plans.features.quizzes.pro'),
        t('pricing.plans.features.members.pro'),
        t('pricing.plans.features.questions.pro'),
        t('pricing.plans.features.responses.pro'),
        t('pricing.plans.features.storage.pro'),
        t('pricing.plans.features.truefalse'),
        t('pricing.plans.features.singlechoice'),
        t('pricing.plans.features.multiplechoice'),
        t('pricing.plans.features.freetext'),
        t('pricing.plans.features.autograding'),
        t('pricing.plans.features.manualgrading'),
        t('pricing.plans.features.password'),
        t('pricing.plans.features.subdomain'),
        t('pricing.plans.features.media'),
        t('pricing.plans.features.questionbank'),
        t('pricing.plans.features.advancedtypes'),
        t('pricing.plans.features.analytics'),
        t('pricing.plans.features.sections'),
        t('pricing.plans.features.certificates'),
        t('pricing.plans.features.excel'),
        t('pricing.plans.features.teams'),
        t('pricing.plans.features.customdesign'),
      ],
      notIncluded: [
        t('pricing.plans.features.permissions'),
        t('pricing.plans.features.audit'),
        t('pricing.plans.features.sla'),
      ],
      color: 'examforge-orange',
      popular: true,
      cta: t('pricing.plans.pro.cta'),
    },
    {
      name: t('pricing.plans.premium.name'),
      priceMonthly: currentLanguage === 'en' ? '$49' : '¥4,980',
      priceAnnual: currentLanguage === 'en' ? '$41' : '¥4,150',
      period: t('pricing.plans.premium.period'),
      description: t('pricing.plans.premium.description'),
      features: [
        t('pricing.plans.features.quizzes.premium'),
        t('pricing.plans.features.members.premium'),
        t('pricing.plans.features.questions.premium'),
        t('pricing.plans.features.responses.premium'),
        t('pricing.plans.features.storage.premium'),
        t('pricing.plans.features.allpro'),
        t('pricing.plans.features.aiquiz'),
        t('pricing.plans.features.aiimprovement'),
        t('pricing.plans.features.aigrading'),
        t('pricing.plans.features.lmsmode'),
        t('pricing.plans.features.pagebuilder'),
        t('pricing.plans.features.customdomain'),
        t('pricing.plans.features.permissions'),
        t('pricing.plans.features.audit'),
        t('pricing.plans.features.apiAccess'),
      ],
      notIncluded: [],
      color: 'examforge-blue-dark',
      popular: false,
      cta: t('pricing.plans.premium.cta'),
    },
  ];

  return (
    <div id="pricing" className="bg-white py-24" data-testid="pricing-section">
      <div className="container mx-auto px-4">
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto mb-16 max-w-3xl text-center"
          data-testid="pricing-header"
        >
          <h2 className="mb-4 text-3xl font-bold" data-testid="pricing-title">
            <span className="heading-gradient">{t('pricing.title')}</span>
          </h2>
          <p
            className="text-lg text-gray-600"
            data-testid="pricing-description"
          >
            {t('pricing.description')}
          </p>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={200}>
          <PlanToggle />
        </AnimatedSection>

        <AnimatedSection
          animation="fadeInUp"
          delay={300}
          staggerChildren={0.15}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          data-testid="pricing-plans"
        >
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex h-full flex-col rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-examforge-orange shadow-xl'
                  : 'border-gray-200'
              }`}
              data-testid={`pricing-plan-${index}`}
            >
              {plan.popular && (
                <div
                  className="bg-examforge-orange absolute top-0 right-0 rounded-tr-lg rounded-bl-lg px-3 py-1 text-xs font-bold text-white"
                  data-testid="popular-badge"
                >
                  {t('pricing.plans.pro.popular')}
                </div>
              )}
              <div className="mb-6" data-testid={`plan-header-${index}`}>
                <h3
                  className="text-xl font-bold"
                  data-testid={`plan-name-${index}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-2" data-testid={`plan-price-${index}`}>
                  <span className="text-4xl font-bold">
                    {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-gray-500">
                    /
                    {plan.name === t('pricing.plans.free.name')
                      ? plan.period
                      : plan.name === t('pricing.plans.premium.name')
                        ? plan.period
                        : isAnnual
                          ? t('pricing.toggle.annually')
                          : t('pricing.toggle.monthly')}
                  </span>
                </div>
                <p
                  className="mt-2 text-gray-600"
                  data-testid={`plan-description-${index}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="flex-1">
                {plan.features.length > 0 && (
                  <>
                    <div className="mb-4 border-t pt-4">
                      <span className="font-semibold">
                        {t('pricing.plans.features.included')}:
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start"
                          data-testid={`plan-feature-${index}-${featureIndex}`}
                        >
                          <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {plan.notIncluded.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {plan.notIncluded.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start"
                        data-testid={`plan-not-included-${index}-${featureIndex}`}
                      >
                        <X className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </AnimatedSection>

        <AnimatedSection
          animation="fadeInUp"
          delay={500}
          className="mt-16 flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-examforge-blue text-examforge-blue hover:bg-examforge-blue hover:text-white"
          >
            <Link href={`/${lng}/plans`}>{t('pricing.viewDetails')}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-examforge-orange hover:bg-examforge-orange/90 text-white"
          >
            <Link href={`/${lng}/auth/signin`}>{t('pricing.cta')}</Link>
          </Button>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={600}>
          <div className="mt-12 text-center" data-testid="pricing-guarantee">
            <p className="text-gray-500">{t('pricing.guarantee')}</p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
