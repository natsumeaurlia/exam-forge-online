'use client';

import React from 'react';
import { FeatureType } from '@prisma/client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Crown, Sparkles, ArrowRight, Check, X, Zap } from 'lucide-react';

interface UpgradePromptProps {
  featureType: FeatureType;
  teamId?: string;
  variant?: 'card' | 'banner' | 'modal';
  className?: string;
  onUpgradeClick?: () => void;
}

export function UpgradePrompt({
  featureType,
  teamId,
  variant = 'card',
  className,
  onUpgradeClick,
}: UpgradePromptProps) {
  const { hasAccess, limit, currentUsage, remainingUsage } = useFeatureFlag(
    featureType,
    teamId
  );
  const { isPro, isPremium, currentPlan } = useUserPlan();
  const t = useTranslations('common');
  const router = useRouter();

  const handleUpgradeClick = onUpgradeClick || (() => router.push('/plans'));

  // Don't show if user already has access
  if (hasAccess && (remainingUsage === undefined || remainingUsage > 2)) {
    return null;
  }

  const requiredPlan = getRequiredPlan(featureType);
  const isLimitReached = limit && currentUsage && currentUsage >= limit;
  const isNearLimit = remainingUsage !== undefined && remainingUsage <= 2;

  const planInfo = getPlanInfo(requiredPlan);

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Crown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                {isLimitReached
                  ? 'Feature limit reached'
                  : isNearLimit
                    ? 'Approaching limit'
                    : 'Upgrade required'}
              </p>
              <p className="text-sm text-blue-700">
                {getFeatureMessage(
                  featureType,
                  requiredPlan,
                  isLimitReached,
                  isNearLimit
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpgradeClick}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50 ${className}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              Upgrade to {planInfo.name}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {planInfo.badge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">
            {getFeatureDisplayName(featureType)}
          </h4>
          <p className="text-sm text-gray-600">
            {getFeatureMessage(
              featureType,
              requiredPlan,
              isLimitReached,
              isNearLimit
            )}
          </p>
        </div>

        {/* Usage indicator if applicable */}
        {limit && currentUsage !== undefined && (
          <div className="rounded-lg border bg-white/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Current Usage</span>
              <span className="text-sm text-gray-600">
                {currentUsage} / {limit}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  isLimitReached
                    ? 'bg-red-500'
                    : isNearLimit
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min((currentUsage / limit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Plan benefits */}
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900">
            {planInfo.name} includes:
          </h5>
          <div className="space-y-1">
            {planInfo.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Check className="h-3 w-3 flex-shrink-0 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpgradeClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to {planInfo.name}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/plans')}
            className="flex-1"
          >
            Compare Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getRequiredPlan(featureType: FeatureType): 'PRO' | 'PREMIUM' {
  const premiumFeatures = [
    FeatureType.CUSTOM_DESIGN,
    FeatureType.CUSTOM_DEVELOPMENT,
    FeatureType.PRIORITY_SUPPORT,
    FeatureType.SLA_GUARANTEE,
    FeatureType.ON_PREMISE,
  ];

  return premiumFeatures.includes(featureType) ? 'PREMIUM' : 'PRO';
}

function getPlanInfo(plan: 'PRO' | 'PREMIUM') {
  if (plan === 'PREMIUM') {
    return {
      name: 'Premium',
      badge: 'PREMIUM',
      features: [
        'Unlimited everything from Pro',
        'Custom branding & design',
        'Priority support',
        'SLA guarantee',
        'On-premise deployment',
        'Custom development',
      ],
    };
  }

  return {
    name: 'Pro',
    badge: 'PRO',
    features: [
      'Unlimited quizzes & respondents',
      'Advanced question types',
      'Analytics & reporting',
      'Team management',
      'Question bank',
      'Certificate generation',
    ],
  };
}

function getFeatureDisplayName(featureType: FeatureType): string {
  const names: Record<FeatureType, string> = {
    [FeatureType.QUIZ_CREATION_LIMIT]: 'Unlimited Quiz Creation',
    [FeatureType.RESPONDENT_LIMIT]: 'Unlimited Respondents',
    [FeatureType.STORAGE_LIMIT]: 'Expanded Storage',
    [FeatureType.FREE_TEXT_QUESTION]: 'Free Text Questions',
    [FeatureType.ADVANCED_QUESTION_TYPES]: 'Advanced Question Types',
    [FeatureType.AUTO_GRADING]: 'Automatic Grading',
    [FeatureType.MANUAL_GRADING]: 'Manual Grading Tools',
    [FeatureType.PASSWORD_PROTECTION]: 'Password Protection',
    [FeatureType.PERMISSIONS_MANAGEMENT]: 'Team Permissions',
    [FeatureType.AUDIT_LOG]: 'Activity Audit Logs',
    [FeatureType.SUBDOMAIN]: 'Custom Subdomain',
    [FeatureType.CUSTOM_DESIGN]: 'Custom Branding',
    [FeatureType.CUSTOM_DEVELOPMENT]: 'Custom Development',
    [FeatureType.MEDIA_UPLOAD]: 'Media Upload',
    [FeatureType.QUESTION_BANK]: 'Question Bank',
    [FeatureType.SECTIONS]: 'Quiz Sections',
    [FeatureType.ANALYTICS]: 'Advanced Analytics',
    [FeatureType.EXCEL_EXPORT]: 'Excel Export',
    [FeatureType.CERTIFICATES]: 'Certificate Generation',
    [FeatureType.AI_QUIZ_GENERATION]: 'AI Quiz Generation',
    [FeatureType.TEAM_MANAGEMENT]: 'Team Management',
    [FeatureType.PRIORITY_SUPPORT]: 'Priority Support',
    [FeatureType.SLA_GUARANTEE]: 'SLA Guarantee',
    [FeatureType.ON_PREMISE]: 'On-Premise Deployment',
    [FeatureType.TRUE_FALSE_QUESTION]: 'True/False Questions',
    [FeatureType.SINGLE_CHOICE_QUESTION]: 'Single Choice Questions',
    [FeatureType.MULTIPLE_CHOICE_QUESTION]: 'Multiple Choice Questions',
  };

  return names[featureType] || featureType.replace(/_/g, ' ');
}

function getFeatureMessage(
  featureType: FeatureType,
  requiredPlan: 'PRO' | 'PREMIUM',
  isLimitReached: boolean,
  isNearLimit: boolean
): string {
  if (isLimitReached) {
    return `You've reached your ${getFeatureDisplayName(featureType).toLowerCase()} limit. Upgrade to ${requiredPlan} for unlimited access.`;
  }

  if (isNearLimit) {
    return `You're approaching your ${getFeatureDisplayName(featureType).toLowerCase()} limit. Upgrade to ${requiredPlan} to avoid interruption.`;
  }

  return `Unlock ${getFeatureDisplayName(featureType).toLowerCase()} with ${requiredPlan} plan and take your quizzes to the next level.`;
}
