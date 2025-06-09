import { getTranslations } from 'next-intl/server';
import {
  GraduationCap,
  Building,
  Award,
  CheckCircle,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  FileCheck,
  ChevronRight,
  Play,
  Eye,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/common/AnimatedSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface UseCaseTabsProps {
  lng: string;
}

export async function UseCaseTabs({ lng }: UseCaseTabsProps) {
  const t = await getTranslations();

  const useCases = [
    {
      id: 'education',
      icon: <GraduationCap className="h-5 w-5" />,
      largeIcon: <GraduationCap className="h-12 w-12 text-indigo-600" />,
      title: t('usecases.tabs.education.title'),
      description: t('usecases.tabs.education.description'),
      benefits: [
        t('usecases.tabs.education.benefits.0'),
        t('usecases.tabs.education.benefits.1'),
        t('usecases.tabs.education.benefits.2'),
        t('usecases.tabs.education.benefits.3'),
      ],
      mockup: {
        title: t('usecases.mockup.education.title'),
        badge: t('usecases.mockup.badge'),
        stats: [
          {
            icon: <Users className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.education.stats.students'),
            value: '156',
          },
          {
            icon: <Clock className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.education.stats.avgTime'),
            value: '45m',
          },
          {
            icon: <Target className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.education.stats.avgScore'),
            value: '78%',
          },
        ],
        content: {
          title: t('usecases.mockup.education.content.title'),
          items: [
            {
              label: t('usecases.mockup.education.content.multipleChoice'),
              value: 20,
            },
            { label: t('usecases.mockup.education.content.essay'), value: 5 },
            {
              label: t('usecases.mockup.education.content.calculation'),
              value: 10,
            },
          ],
        },
      },
    },
    {
      id: 'corporate',
      icon: <Building className="h-5 w-5" />,
      largeIcon: <Building className="h-12 w-12 text-indigo-600" />,
      title: t('usecases.tabs.corporate.title'),
      description: t('usecases.tabs.corporate.description'),
      benefits: [
        t('usecases.tabs.corporate.benefits.0'),
        t('usecases.tabs.corporate.benefits.1'),
        t('usecases.tabs.corporate.benefits.2'),
        t('usecases.tabs.corporate.benefits.3'),
      ],
      mockup: {
        title: t('usecases.mockup.corporate.title'),
        badge: t('usecases.mockup.badge'),
        stats: [
          {
            icon: <Users className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.corporate.stats.trainees'),
            value: '89',
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.corporate.stats.completion'),
            value: '94%',
          },
          {
            icon: <Award className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.corporate.stats.passRate'),
            value: '88%',
          },
        ],
        content: {
          title: t('usecases.mockup.corporate.content.title'),
          modules: [
            {
              name: t('usecases.mockup.corporate.content.ethics'),
              progress: 100,
            },
            {
              name: t('usecases.mockup.corporate.content.security'),
              progress: 85,
            },
            {
              name: t('usecases.mockup.corporate.content.harassment'),
              progress: 70,
            },
          ],
        },
      },
    },
    {
      id: 'certification',
      icon: <Award className="h-5 w-5" />,
      largeIcon: <Award className="h-12 w-12 text-indigo-600" />,
      title: t('usecases.tabs.certification.title'),
      description: t('usecases.tabs.certification.description'),
      benefits: [
        t('usecases.tabs.certification.benefits.0'),
        t('usecases.tabs.certification.benefits.1'),
        t('usecases.tabs.certification.benefits.2'),
        t('usecases.tabs.certification.benefits.3'),
      ],
      mockup: {
        title: t('usecases.mockup.certification.title'),
        badge: t('usecases.mockup.badge'),
        stats: [
          {
            icon: <FileCheck className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.certification.stats.questions'),
            value: '80',
          },
          {
            icon: <Clock className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.certification.stats.timeLimit'),
            value: '150m',
          },
          {
            icon: <BarChart3 className="h-4 w-4 text-gray-600" />,
            label: t('usecases.mockup.certification.stats.passScore'),
            value: '60%',
          },
        ],
        content: {
          title: t('usecases.mockup.certification.content.title'),
          features: [
            {
              text: t('usecases.mockup.certification.content.realExam'),
              active: true,
            },
            {
              text: t('usecases.mockup.certification.content.instantScoring'),
              active: true,
            },
            {
              text: t('usecases.mockup.certification.content.certificate'),
              active: false,
            },
          ],
        },
      },
    },
  ];

  return (
    <div
      id="usecases"
      className="bg-gradient-to-b from-white to-gray-50 py-24"
      data-testid="usecases-section"
    >
      <div className="container mx-auto px-4">
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto mb-16 max-w-3xl text-center"
          data-testid="usecases-header"
        >
          <h2 className="mb-4 text-3xl font-bold" data-testid="usecases-title">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('usecases.title')}
            </span>
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
              className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-2"
              data-testid="usecases-tabs-list"
            >
              {useCases.map(useCase => (
                <TabsTrigger
                  key={useCase.id}
                  value={useCase.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-6 py-4 text-sm font-medium transition-all duration-200 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg"
                  data-testid={`usecase-tab-${useCase.id}`}
                >
                  {useCase.icon}
                  <span className="hidden sm:inline">{useCase.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-h-[600px]">
              {useCases.map(useCase => (
                <TabsContent
                  key={useCase.id}
                  value={useCase.id}
                  className="mt-12"
                  data-testid={`usecase-content-${useCase.id}`}
                >
                  <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                    {/* Left content */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        {useCase.largeIcon}
                        <div>
                          <h3
                            className="text-3xl font-bold text-gray-900"
                            data-testid={`usecase-title-${useCase.id}`}
                          >
                            {useCase.title}
                          </h3>
                        </div>
                      </div>

                      <p
                        className="text-lg leading-relaxed text-gray-600"
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
                            className="group flex items-start gap-3"
                            data-testid={`usecase-benefit-${useCase.id}-${index}`}
                          >
                            <div className="mt-1 rounded-full bg-green-100 p-1 transition-colors group-hover:bg-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-4">
                        <Button size="lg" className="cursor-pointer gap-2">
                          {t('usecases.cta.tryFree')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="cursor-pointer gap-2"
                        >
                          <Play className="h-4 w-4" />
                          {t('usecases.cta.watchDemo')}
                        </Button>
                      </div>
                    </div>

                    {/* Right visual mockup */}
                    <div
                      className="relative"
                      data-testid={`usecase-visual-${useCase.id}`}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 opacity-30 blur-3xl" />

                      <div className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
                        {/* Mockup header */}
                        <div className="mb-6 flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-900">
                            {useCase.mockup.title}
                          </h4>
                          <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700">
                            {useCase.mockup.badge}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="mb-8 grid grid-cols-3 gap-4">
                          {useCase.mockup.stats.map((stat, index) => (
                            <div
                              key={index}
                              className="rounded-xl bg-gray-50 p-4"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                {stat.icon}
                                <span className="text-xs text-gray-600">
                                  {stat.label}
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Content specific to each use case */}
                        {useCase.id === 'education' && (
                          <div className="space-y-3">
                            <div className="mb-3 font-medium text-gray-700">
                              {useCase.mockup.content.title}
                            </div>
                            {useCase.mockup.content.items?.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded-lg bg-indigo-50 p-3"
                                >
                                  <span className="text-sm font-medium text-gray-700">
                                    {item.label}
                                  </span>
                                  <Badge variant="secondary">
                                    {item.value}
                                    {t(
                                      'usecases.mockup.education.questionUnit'
                                    )}
                                  </Badge>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {useCase.id === 'corporate' && (
                          <div className="space-y-3">
                            <div className="mb-3 font-medium text-gray-700">
                              {useCase.mockup.content.title}
                            </div>
                            {useCase.mockup.content.modules?.map(
                              (module, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                      {module.name}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {module.progress}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                      style={{ width: `${module.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {useCase.id === 'certification' && (
                          <div className="space-y-3">
                            <div className="mb-3 font-medium text-gray-700">
                              {useCase.mockup.content.title}
                            </div>
                            {useCase.mockup.content.features?.map(
                              (feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                                >
                                  <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                      feature.active
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                    }`}
                                  >
                                    {feature.active && (
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {feature.text}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* Preview button with better description */}
                        <div className="mt-6 border-t border-gray-200 pt-6">
                          <div className="mb-2 text-center text-xs text-gray-500">
                            {t('usecases.mockup.previewDescription')}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full cursor-pointer gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {t('usecases.mockup.previewButton')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
}
