'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User } from 'lucide-react';

export interface ProfileSettingsProps {
  lng: string;
}

export const ProfileSettings = ({ lng }: ProfileSettingsProps) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          {t('settings.profile.title')}
        </CardTitle>
        <CardDescription>{t('settings.profile.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">{t('settings.profile.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};
