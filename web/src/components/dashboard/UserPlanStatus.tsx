'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { useTranslations } from 'next-intl';
import {
  Crown,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCurrentUserTeamUsage } from '@/lib/actions/usage';
import type { TeamUsageData } from '@/lib/actions/usage';
import { PlanChangeModal } from '@/components/subscription/PlanChangeModal';

export function UserPlanStatus() {
  const { data, loading, isPro, isPremium } = useUserPlan();
  const t = useTranslations('dashboard.planStatus');
  const router = useRouter();

  const [usageData, setUsageData] = useState<TeamUsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [teamData, setTeamData] = useState<{ id: string; name: string } | null>(
    null
  );

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setUsageLoading(true);
        const result = await getCurrentUserTeamUsage();
        if (result?.data?.usage) {
          setUsageData(result.data.usage);
          setTeamData({
            id: result.data.teamId,
            name: result.data.teamName,
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
        setUsageError(
          error instanceof Error ? error.message : 'Failed to load usage data'
        );
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  if (loading || usageLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="mb-2 h-2 w-full rounded bg-gray-200"></div>
            <div className="h-2 w-2/3 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (usageError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{t('usage.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planLimits = {
    FREE: { quizzes: 5, responses: 100, questions: 10 },
    PRO: { quizzes: 50, responses: 5000, questions: 100 },
    PREMIUM: { quizzes: null, responses: null, questions: null },
  };

  const limits = planLimits[data?.planType || 'FREE'];

  // Use real usage data if available, fallback to mock data
  const usage = usageData
    ? {
        quizzes: usageData.quizzes.total,
        responses: usageData.responses.total,
        questions: usageData.questions.maxPerQuiz,
      }
    : {
        quizzes: 3,
        responses: 45,
        questions: 7,
      };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const shouldShowAlert = (used: number, limit: number | null) => {
    if (!limit) return false;
    return used / limit >= 0.9; // Show alert at 90% usage
  };

  const getIcon = () => {
    if (isPremium) return <Sparkles className="h-5 w-5 text-purple-600" />;
    if (isPro) return <Crown className="h-5 w-5 text-blue-600" />;
    return <TrendingUp className="h-5 w-5 text-gray-600" />;
  };

  const getPlanColor = () => {
    if (isPremium) return 'bg-purple-100 text-purple-700';
    if (isPro) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <Card data-testid="user-plan-status">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span>{t('title')}</span>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getPlanColor()}`}
          >
            {t(`plans.${data?.planType.toLowerCase()}`)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Alerts */}
        {(shouldShowAlert(usage.quizzes, limits.quizzes) ||
          shouldShowAlert(usage.responses, limits.responses)) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {t('usage.nearLimit')}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-700">
              {t('usage.upgradeRecommendation')}
            </p>
          </div>
        )}

        {/* 使用状況 */}
        <div className="space-y-4">
          {/* クイズ数 */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {t('usage.quizzes')}
                {shouldShowAlert(usage.quizzes, limits.quizzes) && (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
              </span>
              <span className="font-medium">
                {usage.quizzes.toLocaleString()} /{' '}
                {limits.quizzes?.toLocaleString() || '∞'}
              </span>
            </div>
            {limits.quizzes && (
              <div className="relative">
                <Progress
                  value={getUsagePercentage(usage.quizzes, limits.quizzes)}
                  className="h-2"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(usage.quizzes, limits.quizzes)
                  )}`}
                  style={{
                    width: `${getUsagePercentage(usage.quizzes, limits.quizzes)}%`,
                  }}
                />
              </div>
            )}
            {usageData && (
              <div className="mt-1 text-xs text-gray-500">
                {t('usage.thisMonth')}: {usageData.quizzes.thisMonth}
              </div>
            )}
          </div>

          {/* 回答数 */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {t('usage.responses')}
                {shouldShowAlert(usage.responses, limits.responses) && (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
              </span>
              <span className="font-medium">
                {usage.responses.toLocaleString()} /{' '}
                {limits.responses?.toLocaleString() || '∞'}
              </span>
            </div>
            {limits.responses && (
              <div className="relative">
                <Progress
                  value={getUsagePercentage(usage.responses, limits.responses)}
                  className="h-2"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(usage.responses, limits.responses)
                  )}`}
                  style={{
                    width: `${getUsagePercentage(usage.responses, limits.responses)}%`,
                  }}
                />
              </div>
            )}
            {usageData && (
              <div className="mt-1 text-xs text-gray-500">
                {t('usage.thisMonth')}: {usageData.responses.thisMonth}
              </div>
            )}
          </div>

          {/* 質問数 */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t('usage.questionsPerQuiz')}</span>
              <span className="font-medium">
                {t('usage.upTo')} {limits.questions?.toLocaleString() || '∞'}
              </span>
            </div>
            {usageData && (
              <div className="text-xs text-gray-500">
                {t('usage.currentMax')}: {usageData.questions.maxPerQuiz}
              </div>
            )}
          </div>

          {/* ストレージ使用量 */}
          {usageData && (
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>{t('usage.storage')}</span>
                <span className="font-medium">
                  {(usageData.storage.usedBytes / 1024 / 1024 / 1024).toFixed(
                    1
                  )}{' '}
                  GB /
                  {(usageData.storage.maxBytes / 1024 / 1024 / 1024).toFixed(0)}{' '}
                  GB
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={getUsagePercentage(
                    usageData.storage.usedBytes,
                    usageData.storage.maxBytes
                  )}
                  className="h-2"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getUsageColor(
                    getUsagePercentage(
                      usageData.storage.usedBytes,
                      usageData.storage.maxBytes
                    )
                  )}`}
                  style={{
                    width: `${getUsagePercentage(usageData.storage.usedBytes, usageData.storage.maxBytes)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* プラン特典 */}
        {isPro && (
          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-semibold">
              {t('features.title')}
            </h4>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {t('features.aiGeneration')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {t('features.advancedAnalytics')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {t('features.excelImport')}
              </li>
            </ul>
          </div>
        )}

        {/* プラン管理ボタン */}
        <div className="flex gap-2">
          {!isPro && !isPremium && (
            <Button className="flex-1" onClick={() => router.push('/plans')}>
              {t('upgradeButton')}
            </Button>
          )}
          {teamData && (
            <Button
              variant={isPro || isPremium ? 'default' : 'outline'}
              className={isPro || isPremium ? 'flex-1' : ''}
              onClick={() => setShowPlanChangeModal(true)}
              data-testid="manage-plan-button"
            >
              {t('managePlan')}
            </Button>
          )}
        </div>

        {/* サブスクリプション管理 */}
        {(isPro || isPremium) && data?.subscription && (
          <div className="text-center text-xs text-gray-500">
            {t('subscription.nextBilling')}:{' '}
            {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}

        {/* Plan Change Modal */}
        {teamData && usageData && (
          <PlanChangeModal
            isOpen={showPlanChangeModal}
            onClose={() => setShowPlanChangeModal(false)}
            currentPlan={data?.planType || 'FREE'}
            teamId={teamData.id}
            teamName={teamData.name}
            usage={{
              quizzes: usageData.quizzes.total,
              responses: usageData.responses.total,
              members: usageData.members.total,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
