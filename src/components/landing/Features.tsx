import { getTranslations } from 'next-intl/server';
import { FeatureCard } from './FeatureCard';
import { getFeaturesData } from '@/data/features';

export interface FeaturesProps {
  lng: string;
}

export async function Features({ lng }: FeaturesProps) {
  const t = await getTranslations();
  const features = getFeaturesData(t);

  return (
    <div
      id="features"
      className="bg-examforge-gray-light py-24"
      data-testid="features-section"
    >
      <div className="container mx-auto px-4">
        <div
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
        </div>

        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
          data-testid="features-grid"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
