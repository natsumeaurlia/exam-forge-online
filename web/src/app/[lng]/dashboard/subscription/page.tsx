import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  CreditCard,
  Calendar,
  Users,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { getUserPlanData } from '@/lib/actions/helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionPageProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({ params }: SubscriptionPageProps) {
  const { lng } = await params;
  const t = await getTranslations('subscription');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SubscriptionPage({
  params,
}: SubscriptionPageProps) {
  const { lng } = await params;
  const t = await getTranslations('subscription');

  // Get session and redirect if not authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get current user plan and subscription data
  const userPlanData = await getUserPlanData(session.user.id);

  if (!userPlanData) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">
            {t('error.title', {
              default: 'サブスクリプション情報を取得できませんでした',
            })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('error.description', {
              default: 'しばらく時間をおいて再度お試しください。',
            })}
          </p>
        </div>
      </div>
    );
  }

  const { plan, subscription, features } = userPlanData;

  // Null check for plan
  if (!plan) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">
            {t('error.title', {
              default: 'プラン情報を取得できませんでした',
            })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('error.description', {
              default: 'しばらく時間をおいて再度お試しください。',
            })}
          </p>
        </div>
      </div>
    );
  }

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case 'PRO':
        return 'default';
      case 'PREMIUM':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          label: t('status.active', { default: 'アクティブ' }),
        };
      case 'TRIALING':
        return {
          variant: 'secondary' as const,
          label: t('status.trialing', { default: 'トライアル中' }),
        };
      case 'PAST_DUE':
        return {
          variant: 'destructive' as const,
          label: t('status.pastDue', { default: '支払い延滞' }),
        };
      case 'CANCELED':
        return {
          variant: 'outline' as const,
          label: t('status.canceled', { default: 'キャンセル済み' }),
        };
      default:
        return {
          variant: 'outline' as const,
          label: t('status.free', { default: 'フリープラン' }),
        };
    }
  };

  const statusBadge = getSubscriptionStatusBadge(subscription?.status);

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title', { default: 'サブスクリプション管理' })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('description', {
              default: 'プランの管理と請求情報を確認できます',
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span>
                  {t('currentPlan.title', { default: '現在のプラン' })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={getPlanBadgeVariant(plan.type)}
                    className="px-4 py-2 text-lg"
                  >
                    {plan.name}
                  </Badge>
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ¥{(subscription?.plan?.monthlyPrice || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('billing.perMonth', { default: '/ 月' })}
                  </p>
                </div>
              </div>

              {/* Subscription Details */}
              {subscription && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {t('billing.nextBilling', { default: '次回請求日' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          subscription.currentPeriodEnd
                        ).toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {t('team.members', { default: 'チームメンバー' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {subscription.memberCount}{' '}
                        {t('team.membersUnit', { default: '人' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Features */}
              <div>
                <h4 className="mb-3 font-medium">
                  {t('features.title', { default: 'プラン機能' })}
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {plan.type === 'FREE' ? (
                  <Link href={`/${lng}/plans`}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="mr-2 h-4 w-4" />
                      {t('actions.upgrade', {
                        default: 'プランをアップグレード',
                      })}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex space-x-3">
                    <Button variant="outline" asChild>
                      <Link href={`/${lng}/plans`}>
                        {t('actions.changePlan', { default: 'プラン変更' })}
                      </Link>
                    </Button>
                    {subscription && (
                      <form action="/api/stripe/portal" method="POST">
                        <Button variant="outline">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('actions.manageSubscription', {
                            default: 'サブスクリプション管理',
                          })}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Summary Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>{t('billing.title', { default: '請求情報' })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t('billing.cycle', { default: '請求サイクル' })}
                    </p>
                    <p className="text-lg font-semibold">
                      {subscription.billingCycle === 'MONTHLY'
                        ? t('billing.monthly', { default: '月次' })
                        : t('billing.yearly', { default: '年次' })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t('billing.amount', { default: '請求金額' })}
                    </p>
                    <p className="text-lg font-semibold">
                      ¥
                      {(
                        subscription.memberCount *
                        (subscription.plan?.monthlyPrice || 0)
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {subscription.memberCount} × ¥
                      {(subscription.plan?.monthlyPrice || 0).toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('billing.downloadInvoice', {
                        default: '請求書をダウンロード',
                      })}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {t('billing.viewHistory', { default: '請求履歴を見る' })}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">
                    {t('billing.noSubscription', {
                      default: 'アクティブなサブスクリプションがありません',
                    })}
                  </p>
                  <Link href={`/${lng}/plans`}>
                    <Button className="mt-4" size="sm">
                      {t('actions.subscribeToPro', {
                        default: 'Proプランに申し込む',
                      })}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Information */}
      {plan.type !== 'FREE' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('usage.title', { default: '使用状況' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t('usage.quizzes', { default: '作成したクイズ数' })}
                </p>
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-xs text-gray-500">
                  {plan.maxQuizzes === null
                    ? t('usage.unlimited', { default: '無制限' })
                    : `${plan.maxQuizzes} ${t('usage.quizzesLimit', { default: 'クイズまで' })}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t('usage.members', { default: 'チームメンバー数' })}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {subscription?.memberCount || 1}
                </p>
                <p className="text-xs text-gray-500">
                  {plan.maxMembers === null
                    ? t('usage.unlimited', { default: '無制限' })
                    : `${plan.maxMembers} ${t('usage.membersLimit', { default: '人まで' })}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t('usage.storage', { default: 'ストレージ使用量' })}
                </p>
                <p className="text-2xl font-bold text-purple-600">0.0 MB</p>
                <p className="text-xs text-gray-500">
                  {plan.maxStorageMB === null
                    ? t('usage.unlimited', { default: '無制限' })
                    : `${plan.maxStorageMB} MB ${t('usage.storageLimit', { default: 'まで' })}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
