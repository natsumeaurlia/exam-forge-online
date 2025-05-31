import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useTranslation } from '../../i18n';

export interface PricingPlansProps {
  lng: string;
}

export async function PricingPlans({ lng }: PricingPlansProps) {
  const { t } = await useTranslation(lng);
  const currentLanguage = lng;
  
  const plans = [
    {
      name: t('pricing.plans.free.name'),
      price: currentLanguage === 'en' ? "$0" : "¥0",
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
        t('pricing.plans.features.sections')
      ],
      color: "examforge-blue",
      popular: false,
      cta: t('pricing.plans.free.cta')
    },
    {
      name: t('pricing.plans.pro.name'),
      price: currentLanguage === 'en' ? "$29" : "¥2,980",
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
        t('pricing.plans.features.sla')
      ],
      color: "examforge-orange",
      popular: true,
      cta: t('pricing.plans.pro.cta')
    },
    {
      name: t('pricing.plans.enterprise.name'),
      price: t('pricing.plans.enterprise.price'),
      period: t('pricing.plans.enterprise.period'),
      description: t('pricing.plans.enterprise.description'),
      features: [
        t('pricing.plans.features.quizzes.enterprise'),
        t('pricing.plans.features.members.enterprise'),
        t('pricing.plans.features.questions.enterprise'),
        t('pricing.plans.features.responses.enterprise'),
        t('pricing.plans.features.storage.enterprise'),
        t('pricing.plans.features.allpro'),
        t('pricing.plans.features.permissions'),
        t('pricing.plans.features.audit'),
        t('pricing.plans.features.sla'),
        t('pricing.plans.features.customdev'),
        t('pricing.plans.features.onpremise'),
        t('pricing.plans.features.support'),
      ],
      notIncluded: [],
      color: "examforge-blue-dark",
      popular: false,
      cta: t('pricing.plans.enterprise.cta')
    }
  ];

  return (
    <div id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">
            <span className="heading-gradient">{t('pricing.title')}</span>
          </h2>
          <p className="text-lg text-gray-600">
            {t('pricing.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl border-2 ${
                plan.popular 
                  ? `border-examforge-${plan.color} shadow-lg` 
                  : 'border-gray-200'
              } p-6 flex flex-col relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-examforge-orange text-white text-xs font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg">
                  {t('pricing.plans.pro.popular')}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex-1">
                <div className="border-t pt-4 mb-4">
                  <span className="font-semibold">{t('pricing.plans.features.included')}:</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className={`h-5 w-5 text-examforge-${plan.color} mr-2 shrink-0 mt-0.5`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <li key={`not-${featureIndex}`} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? `bg-examforge-${plan.color} hover:bg-examforge-${plan.color}/90` 
                    : ''
                }`}
                variant={plan.name === t('pricing.plans.enterprise.name') ? "outline" : "default"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            {t('pricing.guarantee')}
          </p>
        </div>
      </div>
    </div>
  );
}
