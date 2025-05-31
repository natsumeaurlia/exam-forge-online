import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { AnimatedSection } from '@/components/common/AnimatedSection';

export interface CallToActionProps {
  lng: string;
}

export async function CallToAction({ lng }: CallToActionProps) {
  const t = await getTranslations();

  return (
    <div
      className="from-examforge-blue to-examforge-blue-dark bg-gradient-to-br py-16 text-white"
      data-testid="cta-section"
    >
      <div className="container mx-auto px-4" data-testid="cta-container">
        <AnimatedSection
          animation="fadeInUp"
          delay={100}
          className="mx-auto max-w-3xl text-center"
          data-testid="cta-content"
        >
          <h2 className="mb-4 text-3xl font-bold" data-testid="cta-title">
            {t('cta.title')}
          </h2>
          <p
            className="mb-8 text-lg opacity-[0.9]"
            data-testid="cta-description"
          >
            {t('cta.description')}
          </p>

          <div
            className="flex flex-col justify-center gap-4 sm:flex-row"
            data-testid="cta-buttons"
          >
            <Button
              size="lg"
              variant="secondary"
              className="text-examforge-blue-dark transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              data-testid="cta-demo-button"
            >
              {t('cta.buttons.demo')}
            </Button>
            <Button
              size="lg"
              className="text-examforge-blue-dark bg-white hover:bg-white/90 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              data-testid="cta-signup-button"
            >
              {t('cta.buttons.signup')}
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
