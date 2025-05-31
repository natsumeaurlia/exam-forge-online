import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

export interface CallToActionProps {
  lng: string;
}

export async function CallToAction({ lng }: CallToActionProps) {
  const t = await getTranslations();

  return (
    <div className="from-examforge-blue to-examforge-blue-dark bg-gradient-to-br py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">{t('cta.title')}</h2>
          <p className="mb-8 text-lg opacity-[0.9]">{t('cta.description')}</p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="text-examforge-blue-dark"
            >
              {t('cta.buttons.demo')}
            </Button>
            <Button
              size="lg"
              className="text-examforge-blue-dark bg-white hover:bg-white/90"
            >
              {t('cta.buttons.signup')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
