'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';

export interface TeamSettingsProps {
  lng: string;
}

export const TeamSettings = ({ lng }: TeamSettingsProps) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          {t('settings.team.title')}
        </CardTitle>
        <CardDescription>{t('settings.team.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">{t('settings.team.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};
