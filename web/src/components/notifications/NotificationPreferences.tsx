'use client';

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  updateNotificationPreferences,
  getNotificationPreferences,
} from '@/lib/actions/notification';

interface NotificationPreferencesProps {
  userId: string;
}

interface Preferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  quizCompletion: boolean;
  teamInvitation: boolean;
  quizShared: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

const defaultPreferences: Preferences = {
  emailNotifications: true,
  inAppNotifications: true,
  quizCompletion: true,
  teamInvitation: true,
  quizShared: true,
  systemUpdates: true,
  marketingEmails: false,
  weeklyDigest: true,
};

export function NotificationPreferences({
  userId,
}: NotificationPreferencesProps) {
  const t = useTranslations('notifications.preferences');
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getNotificationPreferences(userId);
      if (result.success && result.preferences) {
        setPreferences({
          emailNotifications: result.preferences.emailNotifications,
          inAppNotifications: result.preferences.inAppNotifications,
          quizCompletion: result.preferences.quizCompletion,
          teamInvitation: result.preferences.teamInvitation,
          quizShared: result.preferences.quizShared,
          systemUpdates: result.preferences.systemUpdates,
          marketingEmails: result.preferences.marketingEmails,
          weeklyDigest: result.preferences.weeklyDigest,
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handlePreferenceChange = (key: keyof Preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await updateNotificationPreferences(preferences);
      if (result.data?.success) {
        toast.success(t('saveSuccess'));
      } else {
        toast.error(result.data?.error || t('saveError'));
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-10 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-medium">{t('delivery.title')}</h4>
            <div className="space-y-4">
              <PreferenceItem
                id="emailNotifications"
                label={t('delivery.email')}
                description={t('delivery.emailDescription')}
                checked={preferences.emailNotifications}
                onChange={value =>
                  handlePreferenceChange('emailNotifications', value)
                }
              />
              <PreferenceItem
                id="inAppNotifications"
                label={t('delivery.inApp')}
                description={t('delivery.inAppDescription')}
                checked={preferences.inAppNotifications}
                onChange={value =>
                  handlePreferenceChange('inAppNotifications', value)
                }
              />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">
              {t('categories.title')}
            </h4>
            <div className="space-y-4">
              <PreferenceItem
                id="quizCompletion"
                label={t('categories.quizCompletion')}
                description={t('categories.quizCompletionDescription')}
                checked={preferences.quizCompletion}
                onChange={value =>
                  handlePreferenceChange('quizCompletion', value)
                }
              />
              <PreferenceItem
                id="teamInvitation"
                label={t('categories.teamInvitation')}
                description={t('categories.teamInvitationDescription')}
                checked={preferences.teamInvitation}
                onChange={value =>
                  handlePreferenceChange('teamInvitation', value)
                }
              />
              <PreferenceItem
                id="quizShared"
                label={t('categories.quizShared')}
                description={t('categories.quizSharedDescription')}
                checked={preferences.quizShared}
                onChange={value => handlePreferenceChange('quizShared', value)}
              />
              <PreferenceItem
                id="systemUpdates"
                label={t('categories.systemUpdates')}
                description={t('categories.systemUpdatesDescription')}
                checked={preferences.systemUpdates}
                onChange={value =>
                  handlePreferenceChange('systemUpdates', value)
                }
              />
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">{t('marketing.title')}</h4>
            <div className="space-y-4">
              <PreferenceItem
                id="marketingEmails"
                label={t('marketing.emails')}
                description={t('marketing.emailsDescription')}
                checked={preferences.marketingEmails}
                onChange={value =>
                  handlePreferenceChange('marketingEmails', value)
                }
              />
              <PreferenceItem
                id="weeklyDigest"
                label={t('marketing.weeklyDigest')}
                description={t('marketing.weeklyDigestDescription')}
                checked={preferences.weeklyDigest}
                onChange={value =>
                  handlePreferenceChange('weeklyDigest', value)
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PreferenceItemProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function PreferenceItem({
  id,
  label,
  description,
  checked,
  onChange,
}: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
