'use client';

import React from 'react';
import { FeatureType } from '@prisma/client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface FeatureGateProps {
  children: React.ReactNode;
  featureType: FeatureType;
  teamId?: string;
  className?: string;
  showUsage?: boolean;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
}

export function FeatureGate({
  children,
  featureType,
  teamId,
  className,
  showUsage = false,
  fallback,
  onUpgradeClick,
}: FeatureGateProps) {
  const {
    hasAccess,
    limit,
    currentUsage,
    remainingUsage,
    isUnlimited,
    loading,
    error,
    refresh,
  } = useFeatureFlag(featureType, teamId);
  const { isPro, isPremium } = useUserPlan();
  const t = useTranslations('common');
  const router = useRouter();

  const handleUpgradeClick = onUpgradeClick || (() => router.push('/plans'));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Feature check failed: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={refresh}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show upgrade prompt if no access
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const requiredPlan = isPro ? 'PREMIUM' : 'PRO';

    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold">
              {requiredPlan === 'PREMIUM'
                ? t('upgradeToPremium')
                : t('upgradeToPro')}
            </h3>
            <p className="max-w-md text-sm text-gray-600">
              {getFeatureDescription(featureType, t)}
            </p>
            <Button onClick={handleUpgradeClick} className="mt-2">
              {t('viewPlans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show usage warning if close to limit
  const shouldShowWarning =
    limit &&
    currentUsage &&
    remainingUsage !== undefined &&
    remainingUsage <= 2;
  const usagePercentage =
    limit && currentUsage ? (currentUsage / limit) * 100 : 0;

  return (
    <div className={className}>
      {shouldShowWarning && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching your {getFeatureName(featureType, t)} limit.
            {remainingUsage === 0
              ? ' Limit reached.'
              : ` ${remainingUsage} remaining.`}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={handleUpgradeClick}
            >
              Upgrade
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showUsage && limit && !isUnlimited && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getFeatureName(featureType, t)} Usage</span>
            <span>
              {currentUsage || 0} / {limit}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>
      )}

      {children}
    </div>
  );
}

// Helper functions for feature names and descriptions
function getFeatureName(featureType: FeatureType, t: any): string {
  const featureNames: Record<FeatureType, string> = {
    [FeatureType.QUIZ_CREATION_LIMIT]: 'Quiz Creation',
    [FeatureType.RESPONDENT_LIMIT]: 'Respondents',
    [FeatureType.STORAGE_LIMIT]: 'Storage',
    [FeatureType.TRUE_FALSE_QUESTION]: 'True/False Questions',
    [FeatureType.SINGLE_CHOICE_QUESTION]: 'Single Choice Questions',
    [FeatureType.MULTIPLE_CHOICE_QUESTION]: 'Multiple Choice Questions',
    [FeatureType.FREE_TEXT_QUESTION]: 'Free Text Questions',
    [FeatureType.ADVANCED_QUESTION_TYPES]: 'Advanced Question Types',
    [FeatureType.AUTO_GRADING]: 'Auto Grading',
    [FeatureType.MANUAL_GRADING]: 'Manual Grading',
    [FeatureType.PASSWORD_PROTECTION]: 'Password Protection',
    [FeatureType.PERMISSIONS_MANAGEMENT]: 'Permissions Management',
    [FeatureType.AUDIT_LOG]: 'Audit Log',
    [FeatureType.SUBDOMAIN]: 'Custom Subdomain',
    [FeatureType.CUSTOM_DESIGN]: 'Custom Design',
    [FeatureType.CUSTOM_DEVELOPMENT]: 'Custom Development',
    [FeatureType.MEDIA_UPLOAD]: 'Media Upload',
    [FeatureType.QUESTION_BANK]: 'Question Bank',
    [FeatureType.SECTIONS]: 'Quiz Sections',
    [FeatureType.ANALYTICS]: 'Advanced Analytics',
    [FeatureType.EXCEL_EXPORT]: 'Excel Export',
    [FeatureType.CERTIFICATES]: 'Certificates',
    [FeatureType.AI_QUIZ_GENERATION]: 'AI Quiz Generation',
    [FeatureType.TEAM_MANAGEMENT]: 'Team Management',
    [FeatureType.PRIORITY_SUPPORT]: 'Priority Support',
    [FeatureType.SLA_GUARANTEE]: 'SLA Guarantee',
    [FeatureType.ON_PREMISE]: 'On-Premise Deployment',
  };

  return featureNames[featureType] || featureType.replace(/_/g, ' ');
}

function getFeatureDescription(featureType: FeatureType, t: any): string {
  const descriptions: Record<FeatureType, string> = {
    [FeatureType.QUIZ_CREATION_LIMIT]: 'Create unlimited quizzes with Pro plan',
    [FeatureType.RESPONDENT_LIMIT]: 'Get unlimited respondents with Pro plan',
    [FeatureType.STORAGE_LIMIT]: 'Get more storage space with Pro plan',
    [FeatureType.TRUE_FALSE_QUESTION]:
      'Basic question type available in Free plan',
    [FeatureType.SINGLE_CHOICE_QUESTION]:
      'Basic question type available in Free plan',
    [FeatureType.MULTIPLE_CHOICE_QUESTION]:
      'Basic question type available in Free plan',
    [FeatureType.FREE_TEXT_QUESTION]: 'Text questions require Pro plan',
    [FeatureType.ADVANCED_QUESTION_TYPES]:
      'Advanced question formats require Pro plan',
    [FeatureType.AUTO_GRADING]: 'Automatic grading requires Pro plan',
    [FeatureType.MANUAL_GRADING]: 'Manual grading features require Pro plan',
    [FeatureType.PASSWORD_PROTECTION]: 'Password protection requires Pro plan',
    [FeatureType.PERMISSIONS_MANAGEMENT]: 'Team permissions require Pro plan',
    [FeatureType.AUDIT_LOG]: 'Activity logs require Pro plan',
    [FeatureType.SUBDOMAIN]: 'Custom subdomains require Pro plan',
    [FeatureType.CUSTOM_DESIGN]: 'Custom branding requires Premium plan',
    [FeatureType.CUSTOM_DEVELOPMENT]:
      'Custom development requires Premium plan',
    [FeatureType.MEDIA_UPLOAD]: 'Media uploads require Pro plan',
    [FeatureType.QUESTION_BANK]: 'Question bank requires Pro plan',
    [FeatureType.SECTIONS]: 'Quiz sections require Pro plan',
    [FeatureType.ANALYTICS]: 'Advanced analytics require Pro plan',
    [FeatureType.EXCEL_EXPORT]: 'Excel export requires Pro plan',
    [FeatureType.CERTIFICATES]: 'Certificate generation requires Pro plan',
    [FeatureType.AI_QUIZ_GENERATION]: 'AI quiz generation requires Pro plan',
    [FeatureType.TEAM_MANAGEMENT]: 'Team management requires Pro plan',
    [FeatureType.PRIORITY_SUPPORT]: 'Priority support requires Premium plan',
    [FeatureType.SLA_GUARANTEE]: 'SLA guarantee requires Premium plan',
    [FeatureType.ON_PREMISE]: 'On-premise deployment requires Premium plan',
  };

  return descriptions[featureType] || `This feature requires a plan upgrade.`;
}
