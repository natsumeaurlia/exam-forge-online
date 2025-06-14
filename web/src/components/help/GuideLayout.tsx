'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Book, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GuideLayoutProps {
  lng: string;
  guideId: string;
  title: string;
}

interface GuideStep {
  id: string;
  titleKey: string;
  contentKey: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const guideSteps: Record<string, GuideStep[]> = {
  'getting-started': [
    {
      id: 'account',
      titleKey: 'help.guides.gettingStarted.steps.account.title',
      contentKey: 'help.guides.gettingStarted.steps.account.content',
      icon: Users,
    },
    {
      id: 'first-quiz',
      titleKey: 'help.guides.gettingStarted.steps.firstQuiz.title',
      contentKey: 'help.guides.gettingStarted.steps.firstQuiz.content',
      icon: Book,
    },
    {
      id: 'publish',
      titleKey: 'help.guides.gettingStarted.steps.publish.title',
      contentKey: 'help.guides.gettingStarted.steps.publish.content',
      icon: CheckCircle,
    },
  ],
  'quiz-creation': [
    {
      id: 'planning',
      titleKey: 'help.guides.quizCreation.steps.planning.title',
      contentKey: 'help.guides.quizCreation.steps.planning.content',
      icon: Book,
    },
    {
      id: 'questions',
      titleKey: 'help.guides.quizCreation.steps.questions.title',
      contentKey: 'help.guides.quizCreation.steps.questions.content',
      icon: CheckCircle,
    },
    {
      id: 'settings',
      titleKey: 'help.guides.quizCreation.steps.settings.title',
      contentKey: 'help.guides.quizCreation.steps.settings.content',
      icon: Clock,
    },
  ],
  'team-setup': [
    {
      id: 'create-team',
      titleKey: 'help.guides.teamSetup.steps.createTeam.title',
      contentKey: 'help.guides.teamSetup.steps.createTeam.content',
      icon: Users,
    },
    {
      id: 'invite-members',
      titleKey: 'help.guides.teamSetup.steps.inviteMembers.title',
      contentKey: 'help.guides.teamSetup.steps.inviteMembers.content',
      icon: Users,
    },
    {
      id: 'manage-roles',
      titleKey: 'help.guides.teamSetup.steps.manageRoles.title',
      contentKey: 'help.guides.teamSetup.steps.manageRoles.content',
      icon: CheckCircle,
    },
  ],
  analytics: [
    {
      id: 'overview',
      titleKey: 'help.guides.analytics.steps.overview.title',
      contentKey: 'help.guides.analytics.steps.overview.content',
      icon: Book,
    },
    {
      id: 'detailed-analysis',
      titleKey: 'help.guides.analytics.steps.detailedAnalysis.title',
      contentKey: 'help.guides.analytics.steps.detailedAnalysis.content',
      icon: CheckCircle,
    },
    {
      id: 'export-data',
      titleKey: 'help.guides.analytics.steps.exportData.title',
      contentKey: 'help.guides.analytics.steps.exportData.content',
      icon: Clock,
    },
  ],
  billing: [
    {
      id: 'plans',
      titleKey: 'help.guides.billing.steps.plans.title',
      contentKey: 'help.guides.billing.steps.plans.content',
      icon: Book,
    },
    {
      id: 'upgrade',
      titleKey: 'help.guides.billing.steps.upgrade.title',
      contentKey: 'help.guides.billing.steps.upgrade.content',
      icon: CheckCircle,
    },
    {
      id: 'manage-subscription',
      titleKey: 'help.guides.billing.steps.manageSubscription.title',
      contentKey: 'help.guides.billing.steps.manageSubscription.content',
      icon: Clock,
    },
  ],
  security: [
    {
      id: 'password-security',
      titleKey: 'help.guides.security.steps.passwordSecurity.title',
      contentKey: 'help.guides.security.steps.passwordSecurity.content',
      icon: Users,
    },
    {
      id: 'data-protection',
      titleKey: 'help.guides.security.steps.dataProtection.title',
      contentKey: 'help.guides.security.steps.dataProtection.content',
      icon: CheckCircle,
    },
    {
      id: 'privacy-settings',
      titleKey: 'help.guides.security.steps.privacySettings.title',
      contentKey: 'help.guides.security.steps.privacySettings.content',
      icon: Clock,
    },
  ],
};

export function GuideLayout({ lng, guideId, title }: GuideLayoutProps) {
  const t = useTranslations();
  const steps = guideSteps[guideId] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${lng}/help`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('help.backToHelp')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t(title)}</h1>
          <p className="mt-2 text-gray-600">
            {t(`${title.replace('.title', '.description')}`)}
          </p>
        </div>

        {/* Guide Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon || Book;
                return (
                  <Card key={step.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <Icon className="h-5 w-5 text-blue-600" />
                        {t(step.titleKey)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-gray max-w-none">
                        <p>{t(step.contentKey)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Next Steps */}
            <Card className="mt-8 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">
                  {t('help.guides.nextSteps.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-blue-800">
                  {t('help.guides.nextSteps.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${lng}/dashboard`}>
                    <Badge variant="secondary" className="hover:bg-blue-200">
                      {t('help.guides.nextSteps.dashboard')}
                    </Badge>
                  </Link>
                  <Link href={`/${lng}/help`}>
                    <Badge variant="secondary" className="hover:bg-blue-200">
                      {t('help.guides.nextSteps.moreHelp')}
                    </Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {t('help.guides.onThisPage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {steps.map((step, index) => (
                    <a
                      key={step.id}
                      href={`#step-${step.id}`}
                      className="block text-sm text-gray-600 hover:text-blue-600"
                    >
                      {index + 1}. {t(step.titleKey)}
                    </a>
                  ))}
                </nav>
                <Separator className="my-4" />
                <div className="text-sm text-gray-500">
                  <Clock className="mr-2 inline h-4 w-4" />
                  {t('help.guides.estimatedTime')}: 5-10{' '}
                  {t('help.guides.minutes')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
