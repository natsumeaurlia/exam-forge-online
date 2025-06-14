import {
  Book,
  Settings,
  Users,
  BarChart3,
  CreditCard,
  Shield,
  Zap,
  HelpCircle,
} from 'lucide-react';

export interface HelpFAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  category: string;
}

export interface HelpGuideItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: string;
  icon?: React.ComponentType<any>;
  link: string;
}

export interface HelpTutorialItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  duration: string;
  videoUrl?: string;
}

export interface HelpCategoryItem {
  id: string;
  nameKey: string;
}

export interface HelpData {
  categories: HelpCategoryItem[];
  faq: HelpFAQItem[];
  guides: HelpGuideItem[];
  tutorials: HelpTutorialItem[];
}

export const helpData: HelpData = {
  categories: [
    { id: 'all', nameKey: 'help.categories.all' },
    { id: 'getting-started', nameKey: 'help.categories.gettingStarted' },
    { id: 'quiz-creation', nameKey: 'help.categories.quizCreation' },
    { id: 'team-management', nameKey: 'help.categories.teamManagement' },
    { id: 'billing', nameKey: 'help.categories.billing' },
    { id: 'analytics', nameKey: 'help.categories.analytics' },
    { id: 'security', nameKey: 'help.categories.security' },
    { id: 'troubleshooting', nameKey: 'help.categories.troubleshooting' },
  ],
  faq: [
    // Getting Started
    {
      id: 'account-creation',
      questionKey: 'help.faq.accountCreation.question',
      answerKey: 'help.faq.accountCreation.answer',
      category: 'getting-started',
    },
    {
      id: 'first-quiz',
      questionKey: 'help.faq.firstQuiz.question',
      answerKey: 'help.faq.firstQuiz.answer',
      category: 'getting-started',
    },
    {
      id: 'free-plan-limits',
      questionKey: 'help.faq.freePlanLimits.question',
      answerKey: 'help.faq.freePlanLimits.answer',
      category: 'getting-started',
    },

    // Quiz Creation
    {
      id: 'question-types',
      questionKey: 'help.faq.questionTypes.question',
      answerKey: 'help.faq.questionTypes.answer',
      category: 'quiz-creation',
    },
    {
      id: 'quiz-settings',
      questionKey: 'help.faq.quizSettings.question',
      answerKey: 'help.faq.quizSettings.answer',
      category: 'quiz-creation',
    },
    {
      id: 'media-upload',
      questionKey: 'help.faq.mediaUpload.question',
      answerKey: 'help.faq.mediaUpload.answer',
      category: 'quiz-creation',
    },

    // Team Management
    {
      id: 'invite-members',
      questionKey: 'help.faq.inviteMembers.question',
      answerKey: 'help.faq.inviteMembers.answer',
      category: 'team-management',
    },
    {
      id: 'user-roles',
      questionKey: 'help.faq.userRoles.question',
      answerKey: 'help.faq.userRoles.answer',
      category: 'team-management',
    },

    // Billing
    {
      id: 'upgrade-plan',
      questionKey: 'help.faq.upgradePlan.question',
      answerKey: 'help.faq.upgradePlan.answer',
      category: 'billing',
    },
    {
      id: 'cancel-subscription',
      questionKey: 'help.faq.cancelSubscription.question',
      answerKey: 'help.faq.cancelSubscription.answer',
      category: 'billing',
    },
    {
      id: 'payment-methods',
      questionKey: 'help.faq.paymentMethods.question',
      answerKey: 'help.faq.paymentMethods.answer',
      category: 'billing',
    },

    // Analytics
    {
      id: 'view-results',
      questionKey: 'help.faq.viewResults.question',
      answerKey: 'help.faq.viewResults.answer',
      category: 'analytics',
    },
    {
      id: 'export-data',
      questionKey: 'help.faq.exportData.question',
      answerKey: 'help.faq.exportData.answer',
      category: 'analytics',
    },

    // Security
    {
      id: 'data-security',
      questionKey: 'help.faq.dataSecurity.question',
      answerKey: 'help.faq.dataSecurity.answer',
      category: 'security',
    },
    {
      id: 'password-reset',
      questionKey: 'help.faq.passwordReset.question',
      answerKey: 'help.faq.passwordReset.answer',
      category: 'security',
    },

    // Troubleshooting
    {
      id: 'browser-support',
      questionKey: 'help.faq.browserSupport.question',
      answerKey: 'help.faq.browserSupport.answer',
      category: 'troubleshooting',
    },
    {
      id: 'loading-issues',
      questionKey: 'help.faq.loadingIssues.question',
      answerKey: 'help.faq.loadingIssues.answer',
      category: 'troubleshooting',
    },
  ],
  guides: [
    {
      id: 'getting-started-guide',
      titleKey: 'help.guides.gettingStarted.title',
      descriptionKey: 'help.guides.gettingStarted.description',
      category: 'getting-started',
      icon: Book,
      link: '#',
    },
    {
      id: 'quiz-creation-guide',
      titleKey: 'help.guides.quizCreation.title',
      descriptionKey: 'help.guides.quizCreation.description',
      category: 'quiz-creation',
      icon: Zap,
      link: '#',
    },
    {
      id: 'team-setup-guide',
      titleKey: 'help.guides.teamSetup.title',
      descriptionKey: 'help.guides.teamSetup.description',
      category: 'team-management',
      icon: Users,
      link: '#',
    },
    {
      id: 'analytics-guide',
      titleKey: 'help.guides.analytics.title',
      descriptionKey: 'help.guides.analytics.description',
      category: 'analytics',
      icon: BarChart3,
      link: '#',
    },
    {
      id: 'billing-guide',
      titleKey: 'help.guides.billing.title',
      descriptionKey: 'help.guides.billing.description',
      category: 'billing',
      icon: CreditCard,
      link: '#',
    },
    {
      id: 'security-guide',
      titleKey: 'help.guides.security.title',
      descriptionKey: 'help.guides.security.description',
      category: 'security',
      icon: Shield,
      link: '#',
    },
  ],
  tutorials: [
    {
      id: 'create-first-quiz',
      titleKey: 'help.tutorials.createFirstQuiz.title',
      descriptionKey: 'help.tutorials.createFirstQuiz.description',
      duration: '5:30',
    },
    {
      id: 'advanced-quiz-features',
      titleKey: 'help.tutorials.advancedFeatures.title',
      descriptionKey: 'help.tutorials.advancedFeatures.description',
      duration: '8:45',
    },
    {
      id: 'team-collaboration',
      titleKey: 'help.tutorials.teamCollaboration.title',
      descriptionKey: 'help.tutorials.teamCollaboration.description',
      duration: '6:15',
    },
    {
      id: 'analytics-overview',
      titleKey: 'help.tutorials.analyticsOverview.title',
      descriptionKey: 'help.tutorials.analyticsOverview.description',
      duration: '7:20',
    },
  ],
};
