'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { useTranslations } from 'next-intl';
import { Crown, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserPlanStatus() {
  const { data, loading, isPro, isPremium } = useUserPlan();
  const t = useTranslations('dashboard.planStatus');
  const router = useRouter();

  if (loading) {
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

  const planLimits = {
    FREE: { quizzes: 5, responses: 100, questions: 10 },
    PRO: { quizzes: 50, responses: 5000, questions: 100 },
    PREMIUM: { quizzes: null, responses: null, questions: null },
  };

  const limits = planLimits[data?.planType || 'FREE'];
  const usage = {
    quizzes: 3, // This should come from actual data
    responses: 45,
    questions: 7,
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((used / limit) * 100, 100);
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
    <Card>
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
        {/* 使用状況 */}
        <div className="space-y-3">
          {/* クイズ数 */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t('usage.quizzes')}</span>
              <span className="font-medium">
                {usage.quizzes} / {limits.quizzes || '∞'}
              </span>
            </div>
            {limits.quizzes && (
              <Progress
                value={getUsagePercentage(usage.quizzes, limits.quizzes)}
              />
            )}
          </div>

          {/* 回答数 */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t('usage.responses')}</span>
              <span className="font-medium">
                {usage.responses} / {limits.responses || '∞'}
              </span>
            </div>
            {limits.responses && (
              <Progress
                value={getUsagePercentage(usage.responses, limits.responses)}
              />
            )}
          </div>

          {/* 質問数 */}
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{t('usage.questionsPerQuiz')}</span>
              <span className="font-medium">
                {t('usage.upTo')} {limits.questions || '∞'}
              </span>
            </div>
          </div>
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

        {/* アップグレードボタン */}
        {!isPro && !isPremium && (
          <Button className="w-full" onClick={() => router.push('/plans')}>
            {t('upgradeButton')}
          </Button>
        )}

        {/* サブスクリプション管理 */}
        {(isPro || isPremium) && data?.subscription && (
          <div className="text-center text-xs text-gray-500">
            {t('subscription.nextBilling')}:{' '}
            {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
