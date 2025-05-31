'use client';

import { Button } from "@/components/ui/button";
import { useTranslation } from '../../i18n/client';

export interface CallToActionProps {
  lng: string;
}

export function CallToAction({ lng }: CallToActionProps) {
  const { t } = useTranslation(lng);
  
  return (
    <div className="bg-gradient-to-br from-examforge-blue to-examforge-blue-dark py-16 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-lg opacity-[0.9] mb-8">
            {t('cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-examforge-blue-dark">
              {t('cta.buttons.demo')}
            </Button>
            <Button size="lg" className="bg-white text-examforge-blue-dark hover:bg-white/90">
              {t('cta.buttons.signup')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
