'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

interface TeamPlan {
  name: string;
  type: string;
  maxQuizzes?: number | null;
  maxMembers?: number | null;
  maxResponsesPerMonth?: number | null;
  maxStorageMB?: number | null;
}

interface Team {
  id: string;
  name: string;
  subscription?: {
    plan: TeamPlan;
  } | null;
}

interface UsageAlertsProps {
  team: Team;
  currentQuizzes: number;
  currentMembers: number;
  currentStorage: number;
  currentResponses: number;
  lng: string;
}

interface AlertItem {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  percentage: number;
  resource: string;
  actionUrl?: string;
  actionText?: string;
}

export function UsageAlerts({
  team,
  currentQuizzes,
  currentMembers,
  currentStorage,
  currentResponses,
  lng,
}: UsageAlertsProps) {
  const t = useTranslations('dashboard.usage');
  const plan = team.subscription?.plan;

  const calculateAlerts = (): AlertItem[] => {
    const alerts: AlertItem[] = [];

    if (!plan) {
      alerts.push({
        type: 'info',
        title: t('alerts.upgrade.title'),
        description: t('alerts.upgrade.description'),
        percentage: 0,
        resource: 'plan',
        actionUrl: `/${lng}/plans`,
        actionText: t('alerts.upgrade.action'),
      });
      return alerts;
    }

    // Quiz usage alerts
    if (plan.maxQuizzes) {
      const quizPercentage = (currentQuizzes / plan.maxQuizzes) * 100;
      if (quizPercentage >= 90) {
        alerts.push({
          type: 'critical',
          title: t('alerts.quiz.critical.title'),
          description: t('alerts.quiz.critical.description', {
            current: currentQuizzes,
            max: plan.maxQuizzes,
          }),
          percentage: quizPercentage,
          resource: 'quiz',
          actionUrl: `/${lng}/plans`,
          actionText: t('alerts.upgrade.action'),
        });
      } else if (quizPercentage >= 75) {
        alerts.push({
          type: 'warning',
          title: t('alerts.quiz.warning.title'),
          description: t('alerts.quiz.warning.description', {
            current: currentQuizzes,
            max: plan.maxQuizzes,
          }),
          percentage: quizPercentage,
          resource: 'quiz',
        });
      }
    }

    // Response usage alerts
    if (plan.maxResponsesPerMonth) {
      const responsePercentage =
        (currentResponses / plan.maxResponsesPerMonth) * 100;
      if (responsePercentage >= 90) {
        alerts.push({
          type: 'critical',
          title: t('alerts.response.critical.title'),
          description: t('alerts.response.critical.description', {
            current: currentResponses,
            max: plan.maxResponsesPerMonth,
          }),
          percentage: responsePercentage,
          resource: 'response',
          actionUrl: `/${lng}/plans`,
          actionText: t('alerts.upgrade.action'),
        });
      } else if (responsePercentage >= 75) {
        alerts.push({
          type: 'warning',
          title: t('alerts.response.warning.title'),
          description: t('alerts.response.warning.description', {
            current: currentResponses,
            max: plan.maxResponsesPerMonth,
          }),
          percentage: responsePercentage,
          resource: 'response',
        });
      }
    }

    // Member usage alerts
    if (plan.maxMembers) {
      const memberPercentage = (currentMembers / plan.maxMembers) * 100;
      if (memberPercentage >= 90) {
        alerts.push({
          type: 'critical',
          title: t('alerts.member.critical.title'),
          description: t('alerts.member.critical.description', {
            current: currentMembers,
            max: plan.maxMembers,
          }),
          percentage: memberPercentage,
          resource: 'member',
          actionUrl: `/${lng}/plans`,
          actionText: t('alerts.upgrade.action'),
        });
      } else if (memberPercentage >= 75) {
        alerts.push({
          type: 'warning',
          title: t('alerts.member.warning.title'),
          description: t('alerts.member.warning.description', {
            current: currentMembers,
            max: plan.maxMembers,
          }),
          percentage: memberPercentage,
          resource: 'member',
        });
      }
    }

    // Storage usage alerts
    if (plan.maxStorageMB) {
      const storagePercentage =
        (currentStorage / 1024 / 1024 / plan.maxStorageMB) * 100;
      if (storagePercentage >= 90) {
        alerts.push({
          type: 'critical',
          title: t('alerts.storage.critical.title'),
          description: t('alerts.storage.critical.description', {
            current: Math.round(currentStorage / 1024 / 1024),
            max: plan.maxStorageMB,
          }),
          percentage: storagePercentage,
          resource: 'storage',
          actionUrl: `/${lng}/plans`,
          actionText: t('alerts.upgrade.action'),
        });
      } else if (storagePercentage >= 75) {
        alerts.push({
          type: 'warning',
          title: t('alerts.storage.warning.title'),
          description: t('alerts.storage.warning.description', {
            current: Math.round(currentStorage / 1024 / 1024),
            max: plan.maxStorageMB,
          }),
          percentage: storagePercentage,
          resource: 'storage',
        });
      }
    }

    return alerts;
  };

  const alerts = calculateAlerts();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string): 'default' | 'destructive' => {
    return type === 'critical' ? 'destructive' : 'default';
  };

  if (alerts.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t('alerts.allGood.title')}</div>
              <div className="text-sm">{t('alerts.allGood.description')}</div>
            </div>
            <Badge
              variant="outline"
              className="border-green-600 text-green-600"
            >
              <TrendingUp className="mr-1 h-3 w-3" />
              {t('status.healthy')}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('alerts.title')}</h3>
        <Badge variant="outline" className="text-xs">
          {alerts.length} {t('alerts.activeAlerts')}
        </Badge>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <Alert key={index} variant={getAlertVariant(alert.type)}>
            {getAlertIcon(alert.type)}
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{alert.title}</div>
                  <div className="mt-1 text-sm">{alert.description}</div>
                  {alert.percentage > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            alert.type === 'critical'
                              ? 'bg-red-500'
                              : alert.type === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(alert.percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="min-w-[40px] text-xs font-medium">
                        {Math.round(alert.percentage)}%
                      </span>
                    </div>
                  )}
                </div>
                {alert.actionUrl && alert.actionText && (
                  <Button
                    size="sm"
                    variant={alert.type === 'critical' ? 'default' : 'outline'}
                    asChild
                    className="ml-4"
                  >
                    <Link href={alert.actionUrl}>
                      <LinkIcon className="mr-1 h-3 w-3" />
                      {alert.actionText}
                    </Link>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}
