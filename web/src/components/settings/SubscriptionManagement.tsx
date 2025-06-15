'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Download,
  Settings,
} from 'lucide-react';
import { formatPrice } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { PlanChangeDialog } from '@/components/settings/PlanChangeDialog';
import { CancelSubscriptionDialog } from '@/components/settings/CancelSubscriptionDialog';
import { PaymentHistory } from '@/components/settings/PaymentHistory';

export interface SubscriptionManagementProps {
  lng: string;
}

interface SubscriptionData {
  id: string;
  status: 'ACTIVE' | 'CANCELED' | 'TRIALING' | 'PAST_DUE' | 'UNPAID';
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  billingCycle: 'MONTHLY' | 'YEARLY';
  memberCount: number;
  pricePerMember: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
}

export const SubscriptionManagement = ({
  lng,
}: SubscriptionManagementProps) => {
  const t = useTranslations();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError(t('settings.subscription.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: subscriptionData?.id, // This should be the team ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: t('settings.subscription.error'),
        description: t('settings.subscription.billingPortalError'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'TRIALING':
        return 'secondary';
      case 'CANCELED':
        return 'outline';
      case 'PAST_DUE':
      case 'UNPAID':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'TRIALING':
        return 'text-blue-600';
      case 'CANCELED':
        return 'text-gray-600';
      case 'PAST_DUE':
      case 'UNPAID':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.subscription.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.subscription.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchSubscriptionData} className="mt-4">
            {t('settings.subscription.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.subscription.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('settings.subscription.noSubscription')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isFreePlan = subscriptionData.planType === 'FREE';
  const totalMonthlyPrice =
    subscriptionData.memberCount * subscriptionData.pricePerMember;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            {t('settings.subscription.currentPlan')}
          </CardTitle>
          <CardDescription>
            {t('settings.subscription.currentPlanDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {t(
                    `settings.subscription.plans.${subscriptionData.planType.toLowerCase()}`
                  )}
                </h3>
                <div className="mt-1 flex items-center space-x-2">
                  <Badge
                    variant={getStatusBadgeVariant(subscriptionData.status)}
                  >
                    {t(
                      `settings.subscription.status.${subscriptionData.status.toLowerCase()}`
                    )}
                  </Badge>
                  {subscriptionData.cancelAtPeriodEnd && (
                    <Badge variant="outline">
                      {t('settings.subscription.cancelingAtPeriodEnd')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isFreePlan && (
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatPrice(totalMonthlyPrice)}
                  <span className="text-sm font-normal text-gray-500">
                    /
                    {t(
                      `settings.subscription.billingCycle.${subscriptionData.billingCycle.toLowerCase()}`
                    )}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {subscriptionData.memberCount}{' '}
                  {t('settings.subscription.members')} ×{' '}
                  {formatPrice(subscriptionData.pricePerMember)}
                </p>
              </div>
            )}
          </div>

          {/* Billing Period */}
          {!isFreePlan && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t('settings.subscription.currentPeriod')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(
                      subscriptionData.currentPeriodStart
                    ).toLocaleDateString(lng)}{' '}
                    -{' '}
                    {new Date(
                      subscriptionData.currentPeriodEnd
                    ).toLocaleDateString(lng)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t('settings.subscription.teamMembers')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscriptionData.memberCount}{' '}
                    {t('settings.subscription.activeMembers')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Information */}
          {subscriptionData.status === 'TRIALING' &&
            subscriptionData.trialEnd && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('settings.subscription.trialEnds', {
                    date: new Date(
                      subscriptionData.trialEnd
                    ).toLocaleDateString(lng),
                  })}
                </AlertDescription>
              </Alert>
            )}

          {/* Cancellation Notice */}
          {subscriptionData.cancelAtPeriodEnd && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('settings.subscription.cancelationNotice', {
                  date: new Date(
                    subscriptionData.currentPeriodEnd
                  ).toLocaleDateString(lng),
                })}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {!isFreePlan && !subscriptionData.cancelAtPeriodEnd && (
              <>
                <Button onClick={() => setShowPlanChangeDialog(true)}>
                  {t('settings.subscription.changePlan')}
                </Button>
                <Button variant="outline" onClick={handleManageBilling}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('settings.subscription.manageBilling')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                >
                  {t('settings.subscription.cancelSubscription')}
                </Button>
              </>
            )}
            {isFreePlan && (
              <Button onClick={() => setShowPlanChangeDialog(true)}>
                {t('settings.subscription.upgradePlan')}
              </Button>
            )}
            {subscriptionData.cancelAtPeriodEnd && (
              <Button
                onClick={() => {
                  // Reactivate subscription logic
                }}
              >
                {t('settings.subscription.reactivate')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <PaymentHistory lng={lng} />

      {/* Dialogs */}
      <PlanChangeDialog
        open={showPlanChangeDialog}
        onOpenChange={setShowPlanChangeDialog}
        currentPlan={subscriptionData.planType}
        memberCount={subscriptionData.memberCount}
        onPlanChanged={fetchSubscriptionData}
        lng={lng}
      />

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        subscriptionData={subscriptionData}
        onCanceled={fetchSubscriptionData}
        lng={lng}
      />
    </div>
  );
};
