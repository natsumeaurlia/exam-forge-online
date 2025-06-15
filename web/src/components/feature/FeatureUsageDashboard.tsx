'use client';

import React from 'react';
import { FeatureType } from '@prisma/client';
import { useMultipleFeatureFlags } from '@/hooks/useFeatureFlag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  FileText,
  HardDrive,
  Crown,
  TrendingUp,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface FeatureUsageDashboardProps {
  teamId?: string;
  className?: string;
}

const TRACKED_FEATURES: FeatureType[] = [
  FeatureType.QUIZ_CREATION_LIMIT,
  FeatureType.RESPONDENT_LIMIT,
  FeatureType.STORAGE_LIMIT,
];

const FEATURE_ICONS: Record<FeatureType, React.ComponentType<any>> = {
  [FeatureType.QUIZ_CREATION_LIMIT]: FileText,
  [FeatureType.RESPONDENT_LIMIT]: Users,
  [FeatureType.STORAGE_LIMIT]: HardDrive,
  [FeatureType.ANALYTICS]: BarChart3,
  [FeatureType.AI_QUIZ_GENERATION]: Crown,
  [FeatureType.CERTIFICATES]: Crown,
  [FeatureType.QUESTION_BANK]: FileText,
  [FeatureType.EXCEL_EXPORT]: FileText,
  [FeatureType.SECTIONS]: FileText,
  [FeatureType.PASSWORD_PROTECTION]: Crown,
  [FeatureType.CUSTOM_DESIGN]: Crown,
  [FeatureType.TEAM_MANAGEMENT]: Users,
  [FeatureType.PRIORITY_SUPPORT]: Crown,
  [FeatureType.TRUE_FALSE_QUESTION]: Check,
  [FeatureType.SINGLE_CHOICE_QUESTION]: Check,
  [FeatureType.MULTIPLE_CHOICE_QUESTION]: Check,
  [FeatureType.FREE_TEXT_QUESTION]: Crown,
  [FeatureType.ADVANCED_QUESTION_TYPES]: Crown,
  [FeatureType.AUTO_GRADING]: Crown,
  [FeatureType.MANUAL_GRADING]: Crown,
  [FeatureType.PERMISSIONS_MANAGEMENT]: Crown,
  [FeatureType.AUDIT_LOG]: Crown,
  [FeatureType.SUBDOMAIN]: Crown,
  [FeatureType.CUSTOM_DEVELOPMENT]: Crown,
  [FeatureType.MEDIA_UPLOAD]: Crown,
  [FeatureType.SLA_GUARANTEE]: Crown,
  [FeatureType.ON_PREMISE]: Crown,
};

export function FeatureUsageDashboard({
  teamId,
  className,
}: FeatureUsageDashboardProps) {
  const { featureChecks, loading, error, hasFeature } = useMultipleFeatureFlags(
    TRACKED_FEATURES,
    teamId
  );
  const t = useTranslations('dashboard');
  const router = useRouter();

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {TRACKED_FEATURES.map(feature => (
          <Card key={feature}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load feature usage: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const getUsageStatus = (currentUsage: number = 0, limit?: number) => {
    if (!limit || limit === -1) return 'unlimited';
    const percentage = (currentUsage / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'unlimited':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Feature Usage</h2>
        <Button variant="outline" onClick={() => router.push('/plans')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TRACKED_FEATURES.map(featureType => {
          const feature = featureChecks?.[featureType];
          if (!feature) return null;

          const Icon = FEATURE_ICONS[featureType];
          const status = getUsageStatus(feature.currentUsage, feature.limit);
          const usagePercentage =
            feature.limit && feature.limit > 0
              ? Math.min(
                  ((feature.currentUsage || 0) / feature.limit) * 100,
                  100
                )
              : 0;

          return (
            <Card key={featureType} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getFeatureName(featureType)}
                </CardTitle>
                <Icon className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {feature.currentUsage || 0}
                      {feature.limit && feature.limit > 0 && (
                        <span className="text-muted-foreground text-sm font-normal">
                          /{feature.limit}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={status === 'unlimited' ? 'default' : 'secondary'}
                      className={getStatusColor(status)}
                    >
                      {feature.isUnlimited
                        ? 'Unlimited'
                        : `${usagePercentage.toFixed(0)}%`}
                    </Badge>
                  </div>

                  {feature.limit && feature.limit > 0 && (
                    <div className="space-y-1">
                      <Progress value={usagePercentage} className="h-2" />
                      <div className="text-muted-foreground flex justify-between text-xs">
                        <span>Used: {feature.currentUsage || 0}</span>
                        <span>Remaining: {feature.remainingUsage || 0}</span>
                      </div>
                    </div>
                  )}

                  {status === 'critical' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Limit almost reached. Consider upgrading.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === 'warning' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Approaching usage limit.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Features Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Available Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(FeatureType).map(featureType => {
              const hasAccess = hasFeature(featureType);
              const Icon = FEATURE_ICONS[featureType] || Crown;

              return (
                <div
                  key={featureType}
                  className="flex items-center gap-3 rounded-lg border p-2"
                >
                  <Icon
                    className={`h-4 w-4 ${hasAccess ? 'text-green-600' : 'text-gray-400'}`}
                  />
                  <span
                    className={`text-sm ${hasAccess ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {getFeatureName(featureType)}
                  </span>
                  <Badge
                    variant={hasAccess ? 'default' : 'secondary'}
                    className="ml-auto"
                  >
                    {hasAccess ? 'Available' : 'Upgrade'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getFeatureName(featureType: FeatureType): string {
  const featureNames: Record<FeatureType, string> = {
    [FeatureType.QUIZ_CREATION_LIMIT]: 'Quiz Creation',
    [FeatureType.RESPONDENT_LIMIT]: 'Respondents',
    [FeatureType.STORAGE_LIMIT]: 'Storage',
    [FeatureType.TRUE_FALSE_QUESTION]: 'True/False Questions',
    [FeatureType.SINGLE_CHOICE_QUESTION]: 'Single Choice',
    [FeatureType.MULTIPLE_CHOICE_QUESTION]: 'Multiple Choice',
    [FeatureType.FREE_TEXT_QUESTION]: 'Free Text Questions',
    [FeatureType.ADVANCED_QUESTION_TYPES]: 'Advanced Questions',
    [FeatureType.AUTO_GRADING]: 'Auto Grading',
    [FeatureType.MANUAL_GRADING]: 'Manual Grading',
    [FeatureType.PASSWORD_PROTECTION]: 'Password Protection',
    [FeatureType.PERMISSIONS_MANAGEMENT]: 'Team Permissions',
    [FeatureType.AUDIT_LOG]: 'Audit Logs',
    [FeatureType.SUBDOMAIN]: 'Custom Subdomain',
    [FeatureType.CUSTOM_DESIGN]: 'Custom Design',
    [FeatureType.CUSTOM_DEVELOPMENT]: 'Custom Development',
    [FeatureType.MEDIA_UPLOAD]: 'Media Upload',
    [FeatureType.QUESTION_BANK]: 'Question Bank',
    [FeatureType.SECTIONS]: 'Quiz Sections',
    [FeatureType.ANALYTICS]: 'Analytics',
    [FeatureType.EXCEL_EXPORT]: 'Excel Export',
    [FeatureType.CERTIFICATES]: 'Certificates',
    [FeatureType.AI_QUIZ_GENERATION]: 'AI Generation',
    [FeatureType.TEAM_MANAGEMENT]: 'Team Management',
    [FeatureType.PRIORITY_SUPPORT]: 'Priority Support',
    [FeatureType.SLA_GUARANTEE]: 'SLA Guarantee',
    [FeatureType.ON_PREMISE]: 'On-Premise',
  };

  return featureNames[featureType] || featureType.replace(/_/g, ' ');
}
