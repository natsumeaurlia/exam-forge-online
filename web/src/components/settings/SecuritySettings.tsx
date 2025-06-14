'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

export interface SecuritySettingsProps {
  lng: string;
}

export const SecuritySettings = ({ lng }: SecuritySettingsProps) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          {t('settings.security.title')}
        </CardTitle>
        <CardDescription>{t('settings.security.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">{t('settings.security.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};
