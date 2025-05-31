import { Plan } from '@/types/plan';

/**
 * Plan data constants for the exam forge application
 * Defines the three available plans: Free, Pro, and Enterprise
 * Supports i18n through translation keys in includedFeatures
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with basic quiz functionality',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isPopular: false,
    features: {
      members: 3,
      quizzes: 5,
      questionsPerQuiz: 20,
      responsesPerMonth: 100,
      storage: '100MB',
    },
    includedFeatures: [
      'pricing.plans.features.truefalse',
      'pricing.plans.features.singlechoice',
      'pricing.plans.features.multiplechoice',
      'pricing.plans.features.freetext',
      'pricing.plans.features.autograding',
      'pricing.plans.features.manualgrading',
      'pricing.plans.features.password',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for professional quiz creators',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~17% discount
    isPopular: true,
    features: {
      members: 20,
      quizzes: 'unlimited',
      questionsPerQuiz: 200,
      responsesPerMonth: 3000,
      storage: '10GB',
    },
    includedFeatures: [
      'pricing.plans.features.truefalse',
      'pricing.plans.features.singlechoice',
      'pricing.plans.features.multiplechoice',
      'pricing.plans.features.freetext',
      'pricing.plans.features.autograding',
      'pricing.plans.features.manualgrading',
      'pricing.plans.features.password',
      'pricing.plans.features.subdomain',
      'pricing.plans.features.media',
      'pricing.plans.features.questionbank',
      'pricing.plans.features.advancedtypes',
      'pricing.plans.features.analytics',
      'pricing.plans.features.sections',
      'pricing.plans.features.certificates',
      'pricing.plans.features.excel',
      'pricing.plans.features.teams',
      'pricing.plans.features.customdesign',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations and educational institutions',
    monthlyPrice: 0, // Custom pricing - contact for quote
    yearlyPrice: 0, // Custom pricing - contact for quote
    isPopular: false,
    features: {
      members: 'unlimited',
      quizzes: 'unlimited',
      questionsPerQuiz: 'unlimited',
      responsesPerMonth: 'unlimited',
      storage: 'unlimited',
    },
    includedFeatures: [
      'pricing.plans.features.allpro',
      'pricing.plans.features.permissions',
      'pricing.plans.features.audit',
      'pricing.plans.features.sla',
      'pricing.plans.features.customdev',
      'pricing.plans.features.onpremise',
      'pricing.plans.features.support',
    ],
  },
];

/**
 * Helper function to get a plan by ID
 */
export const getPlanById = (id: string): Plan | undefined => {
  return PLANS.find(plan => plan.id === id);
};

/**
 * Helper function to get the popular plan
 */
export const getPopularPlan = (): Plan | undefined => {
  return PLANS.find(plan => plan.isPopular);
};
