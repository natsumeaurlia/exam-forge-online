'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreditCard, User, Bell, Shield, Users } from 'lucide-react';
import { SubscriptionManagement } from '@/components/settings/SubscriptionManagement';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { TeamSettings } from '@/components/settings/TeamSettings';

export interface SettingsClientProps {
  lng: string;
}

export const SettingsClient = ({ lng }: SettingsClientProps) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('subscription');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold" data-testid="settings-title">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600" data-testid="settings-description">
            {t('settings.description')}
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mx-auto max-w-6xl"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="subscription" data-testid="tab-subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              {t('settings.tabs.subscription')}
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="mr-2 h-4 w-4" />
              {t('settings.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="mr-2 h-4 w-4" />
              {t('settings.tabs.team')}
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="mr-2 h-4 w-4" />
              {t('settings.tabs.notifications')}
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="mr-2 h-4 w-4" />
              {t('settings.tabs.security')}
            </TabsTrigger>
          </TabsList>

          {/* Subscription Management Tab */}
          <TabsContent value="subscription" className="mt-8">
            <SubscriptionManagement lng={lng} />
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="mt-8">
            <ProfileSettings lng={lng} />
          </TabsContent>

          {/* Team Settings Tab */}
          <TabsContent value="team" className="mt-8">
            <TeamSettings lng={lng} />
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="mt-8">
            <NotificationSettings lng={lng} />
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="mt-8">
            <SecuritySettings lng={lng} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
