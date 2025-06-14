'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageNotification {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  resourceType: 'QUIZ' | 'RESPONSE' | 'MEMBER' | 'STORAGE';
  threshold: number;
  currentUsage: number;
  maxLimit: number;
  timestamp: Date;
  dismissed: boolean;
}

interface UsageNotificationsProps {
  teamId: string;
  lng: string;
}

interface NotificationSettings {
  enabled: boolean;
  warningThreshold: number; // 75%
  criticalThreshold: number; // 90%
  emailNotifications: boolean;
  pushNotifications: boolean;
  resourceTypes: {
    quiz: boolean;
    response: boolean;
    member: boolean;
    storage: boolean;
  };
}

export function UsageNotifications({ teamId, lng }: UsageNotificationsProps) {
  const t = useTranslations('dashboard.usage');
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<UsageNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    warningThreshold: 75,
    criticalThreshold: 90,
    emailNotifications: true,
    pushNotifications: true,
    resourceTypes: {
      quiz: true,
      response: true,
      member: true,
      storage: true,
    },
  });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleRealtimeUpdate = useCallback(
    (data: any) => {
      switch (data.type) {
        case 'usage_threshold_exceeded':
          const newNotification: UsageNotification = {
            id: data.id,
            type: data.severity,
            title: data.title,
            message: data.message,
            resourceType: data.resourceType,
            threshold: data.threshold,
            currentUsage: data.currentUsage,
            maxLimit: data.maxLimit,
            timestamp: new Date(data.timestamp),
            dismissed: false,
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep latest 10

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant:
              newNotification.type === 'critical' ? 'destructive' : 'default',
          });
          break;

        case 'usage_updated':
          // Update existing notifications with new usage data
          setNotifications(prev =>
            prev.map(notification =>
              notification.resourceType === data.resourceType
                ? { ...notification, currentUsage: data.currentUsage }
                : notification
            )
          );
          break;
      }
    },
    [toast]
  );

  // Initialize real-time connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const initializeNotifications = async () => {
      try {
        // Load existing notifications
        const response = await fetch(
          `/api/usage/notifications?teamId=${teamId}`
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setSettings(prevSettings => ({ ...prevSettings, ...data.settings }));
        }

        // Setup Server-Sent Events for real-time updates
        eventSource = new EventSource(
          `/api/usage/notifications/stream?teamId=${teamId}`
        );

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        };

        eventSource.onerror = error => {
          console.error('SSE connection error:', error);
          // Retry connection after 5 seconds
          setTimeout(initializeNotifications, 5000);
        };
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (settings.enabled) {
      initializeNotifications();
    } else {
      setLoading(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [teamId, settings.enabled, handleRealtimeUpdate]);

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/usage/notifications/${notificationId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, dismissed: true } : n))
      );
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };

      const response = await fetch(`/api/usage/notifications/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, settings: updatedSettings }),
      });

      if (response.ok) {
        setSettings(updatedSettings);
        toast({
          title: t('notifications.settings.updated'),
          description: t('notifications.settings.updatedDescription'),
        });
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: t('notifications.settings.error'),
        description: t('notifications.settings.errorDescription'),
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            <span className="text-sm text-gray-600">
              {t('notifications.loading')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('notifications.title')}</h3>
          {activeNotifications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {activeNotifications.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="mr-1 h-4 w-4" />
            {t('notifications.settings.title')}
          </Button>
          <div className="flex items-center space-x-2">
            <Label htmlFor="notifications-enabled" className="text-sm">
              {settings.enabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Label>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={enabled => updateSettings({ enabled })}
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t('notifications.settings.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  {t('notifications.settings.thresholds')}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t('notifications.settings.warning')}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={settings.warningThreshold}
                        onChange={e =>
                          updateSettings({
                            warningThreshold: Number(e.target.value),
                          })
                        }
                        className="w-20"
                      />
                      <span className="w-10 text-sm">
                        {settings.warningThreshold}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t('notifications.settings.critical')}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="80"
                        max="100"
                        step="5"
                        value={settings.criticalThreshold}
                        onChange={e =>
                          updateSettings({
                            criticalThreshold: Number(e.target.value),
                          })
                        }
                        className="w-20"
                      />
                      <span className="w-10 text-sm">
                        {settings.criticalThreshold}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  {t('notifications.settings.channels')}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t('notifications.settings.email')}
                    </Label>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={emailNotifications =>
                        updateSettings({ emailNotifications })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t('notifications.settings.push')}
                    </Label>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={pushNotifications =>
                        updateSettings({ pushNotifications })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Notifications */}
      {!settings.enabled ? (
        <Alert>
          <BellOff className="h-4 w-4" />
          <AlertDescription>{t('notifications.disabled')}</AlertDescription>
        </Alert>
      ) : activeNotifications.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{t('notifications.noActive')}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {activeNotifications.map(notification => (
            <Alert
              key={notification.id}
              variant={
                notification.type === 'critical' ? 'destructive' : 'default'
              }
              className="relative"
            >
              {getNotificationIcon(notification.type)}
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="mt-1 text-sm">{notification.message}</div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {notification.currentUsage} / {notification.maxLimit}(
                        {Math.round(
                          (notification.currentUsage / notification.maxLimit) *
                            100
                        )}
                        %)
                      </span>
                      <span>{notification.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Zap className="h-3 w-3 text-green-500" />
          <span>{t('notifications.realtime')}</span>
        </div>
      </div>
    </div>
  );
}
