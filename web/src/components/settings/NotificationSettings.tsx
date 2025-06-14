'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell } from 'lucide-react';

export interface NotificationSettingsProps {
  lng: string;
}

export const NotificationSettings = ({ lng }: NotificationSettingsProps) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          {t('settings.notifications.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.notifications.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          {t('settings.notifications.comingSoon')}
        </p>
      </CardContent>
    </Card>
  );
};
