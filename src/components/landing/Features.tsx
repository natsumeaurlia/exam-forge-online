import { getTranslations } from 'next-intl/server';
import {
  Award,
  BarChartBig,
  FileStack,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Timer,
  Upload,
} from 'lucide-react';
import { AnimatedSection } from '@/components/common/AnimatedSection';

export interface FeaturesProps {
  lng: string;
}

export async function Features({ lng }: FeaturesProps) {
  const t = await getTranslations();

  const features = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: t('features.list.builder.title'),
      description: t('features.list.builder.description'),
    },
    {
      icon: <FileStack className="h-6 w-6" />,
      title: t('features.list.questionTypes.title'),
      description: t('features.list.questionTypes.description'),
    },
    {
      icon: <BarChartBig className="h-6 w-6" />,
      title: t('features.list.analytics.title'),
      description: t('features.list.analytics.description'),
    },
    {
      icon: <Timer className="h-6 w-6" />,
      title: t('features.list.scoring.title'),
      description: t('features.list.scoring.description'),
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: t('features.list.import.title'),
      description: t('features.list.import.description'),
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: t('features.list.certificates.title'),
      description: t('features.list.certificates.description'),
    },
    {
      icon: <LockKeyhole className="h-6 w-6" />,
      title: t('features.list.security.title'),
      description: t('features.list.security.description'),
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: t('features.list.feedback.title'),
      description: t('features.list.feedback.description'),
    },
  ];

  return (
    <div
      id="features"
      className="bg-examforge-gray-light py-24"
      data-testid="features-section"
    >
      <div className="container mx-auto px-4">
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto mb-16 max-w-3xl text-center"
          data-testid="features-header"
        >
          <h2 className="mb-4 text-3xl font-bold" data-testid="features-title">
            <span className="heading-gradient">{t('features.title')}</span>
          </h2>
          <p
            className="text-lg text-gray-600"
            data-testid="features-description"
          >
            {t('features.description')}
          </p>
        </AnimatedSection>

        <AnimatedSection
          animation="fadeInUp"
          delay={300}
          staggerChildren={0.1}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
          data-testid="features-grid"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              data-testid={`feature-item-${index}`}
            >
              <div
                className="feature-icon-container mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-examforge-blue/10 text-examforge-blue"
                data-testid={`feature-icon-${index}`}
              >
                {feature.icon}
              </div>
              <h3
                className="mb-2 text-lg font-semibold"
                data-testid={`feature-title-${index}`}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm text-gray-600"
                data-testid={`feature-description-${index}`}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </AnimatedSection>
      </div>
    </div>
  );
}
