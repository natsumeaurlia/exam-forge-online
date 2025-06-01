import { getTranslations } from 'next-intl/server';
import { GraduationCap, Building, Award, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/common/AnimatedSection';

export interface UseCaseTabsProps {
  lng: string;
}

export async function UseCaseTabs({ lng }: UseCaseTabsProps) {
  const t = await getTranslations();

  const useCases = [
    {
      id: 'education',
      icon: <GraduationCap className="h-8 w-8" />,
      title: t('usecases.tabs.education.title'),
      description: t('usecases.tabs.education.description'),
      benefits: [
        t('usecases.tabs.education.benefits.0'),
        t('usecases.tabs.education.benefits.1'),
        t('usecases.tabs.education.benefits.2'),
        t('usecases.tabs.education.benefits.3'),
      ],
    },
    {
      id: 'corporate',
      icon: <Building className="h-8 w-8" />,
      title: t('usecases.tabs.corporate.title'),
      description: t('usecases.tabs.corporate.description'),
      benefits: [
        t('usecases.tabs.corporate.benefits.0'),
        t('usecases.tabs.corporate.benefits.1'),
        t('usecases.tabs.corporate.benefits.2'),
        t('usecases.tabs.corporate.benefits.3'),
      ],
    },
    {
      id: 'certification',
      icon: <Award className="h-8 w-8" />,
      title: t('usecases.tabs.certification.title'),
      description: t('usecases.tabs.certification.description'),
      benefits: [
        t('usecases.tabs.certification.benefits.0'),
        t('usecases.tabs.certification.benefits.1'),
        t('usecases.tabs.certification.benefits.2'),
        t('usecases.tabs.certification.benefits.3'),
      ],
    },
  ];

  return (
    <div id="usecases" className="py-24" data-testid="usecases-section">
      <div className="container mx-auto px-4">
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto mb-16 max-w-3xl text-center"
          data-testid="usecases-header"
        >
          <h2 className="mb-4 text-3xl font-bold" data-testid="usecases-title">
            <span className="heading-gradient">{t('usecases.title')}</span>
          </h2>
          <p
            className="text-lg text-gray-600"
            data-testid="usecases-description"
          >
            {t('usecases.description')}
          </p>
        </AnimatedSection>

        <AnimatedSection
          animation="fadeInUp"
          delay={300}
          className="mx-auto max-w-6xl"
        >
          <Tabs
            defaultValue="education"
            className="mx-auto max-w-6xl"
            data-testid="usecases-tabs"
          >
            <TabsList
              className="bg-examforge-gray-light grid w-full grid-cols-3 p-2"
              data-testid="usecases-tabs-list"
            >
              {useCases.map(useCase => (
                <TabsTrigger
                  key={useCase.id}
                  value={useCase.id}
                  className="data-[state=active]:text-examforge-blue flex items-center gap-2 py-3 text-sm font-medium transition-all duration-200 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  data-testid={`usecase-tab-${useCase.id}`}
                >
                  <span className="hidden sm:inline">{useCase.icon}</span>
                  <span>{useCase.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {useCases.map(useCase => (
              <TabsContent
                key={useCase.id}
                value={useCase.id}
                className="mt-8"
                data-testid={`usecase-content-${useCase.id}`}
              >
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="bg-examforge-blue flex h-16 w-16 items-center justify-center rounded-full text-white"
                        data-testid={`usecase-icon-${useCase.id}`}
                      >
                        {useCase.icon}
                      </div>
                      <div>
                        <h3
                          className="text-2xl font-bold text-gray-900"
                          data-testid={`usecase-title-${useCase.id}`}
                        >
                          {useCase.title}
                        </h3>
                      </div>
                    </div>

                    <p
                      className="text-lg text-gray-600"
                      data-testid={`usecase-description-${useCase.id}`}
                    >
                      {useCase.description}
                    </p>

                    <ul
                      className="space-y-4"
                      data-testid={`usecase-benefits-${useCase.id}`}
                    >
                      {useCase.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3"
                          data-testid={`usecase-benefit-${useCase.id}-${index}`}
                        >
                          <CheckCircle className="text-examforge-blue mt-1 h-5 w-5 shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className="from-examforge-blue/10 to-examforge-orange/10 rounded-2xl bg-gradient-to-br p-8"
                    data-testid={`usecase-visual-${useCase.id}`}
                  >
                    <div className="flex aspect-square items-center justify-center rounded-xl border border-white/20 bg-white/50 backdrop-blur-sm">
                      <div className="text-examforge-blue/30 text-6xl">
                        {useCase.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
}
