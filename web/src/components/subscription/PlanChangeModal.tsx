'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Crown,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { createCheckoutSession } from '@/lib/actions/stripe';
import { toast } from 'sonner';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'FREE' | 'PRO' | 'PREMIUM';
  teamId: string;
  teamName: string;
  usage: {
    quizzes: number;
    responses: number;
    members: number;
  };
}

const planConfigs = {
  FREE: {
    name: 'Free',
    icon: TrendingUp,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    limits: { quizzes: 5, responses: 100, questions: 10 },
    price: 0,
    features: ['Basic quiz creation', 'Email support', 'Basic analytics'],
  },
  PRO: {
    name: 'Pro',
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    limits: { quizzes: 50, responses: 5000, questions: 100 },
    price: 2980,
    features: [
      'Advanced question types',
      'AI generation',
      'Excel import',
      'Advanced analytics',
      'Priority support',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    limits: { quizzes: null, responses: null, questions: null },
    price: 9800,
    features: [
      'Unlimited everything',
      'Custom branding',
      'API access',
      'SLA guarantee',
      'Dedicated support',
    ],
  },
};

export function PlanChangeModal({
  isOpen,
  onClose,
  currentPlan,
  teamId,
  teamName,
  usage,
}: PlanChangeModalProps) {
  const t = useTranslations('subscription.planChange');
  const [selectedPlan, setSelectedPlan] = useState<
    'FREE' | 'PRO' | 'PREMIUM' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlanChange = async (newPlan: 'PRO' | 'PREMIUM') => {
    if (newPlan === currentPlan) return;

    setIsProcessing(true);
    try {
      if (newPlan === 'FREE') {
        // Handle downgrade - redirect to Stripe portal for cancellation
        window.location.href = '/api/stripe/portal';
        return;
      }

      // Create checkout session for upgrade
      const result = await createCheckoutSession({
        teamId,
        planType: newPlan,
        billingCycle: 'MONTHLY',
      });

      if (result?.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Plan change failed:', error);
      toast.error(t('changeError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const canUpgradeTo = (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
    const planOrder = { FREE: 0, PRO: 1, PREMIUM: 2 };
    return planOrder[plan] > planOrder[currentPlan];
  };

  const canDowngradeTo = (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
    const planOrder = { FREE: 0, PRO: 1, PREMIUM: 2 };
    return planOrder[plan] < planOrder[currentPlan];
  };

  const wouldExceedLimits = (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
    const limits = planConfigs[plan].limits;
    return (
      (limits.quizzes && usage.quizzes > limits.quizzes) ||
      (limits.responses && usage.responses > limits.responses)
    );
  };

  const renderPlanCard = (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
    const config = planConfigs[plan];
    const Icon = config.icon;
    const isCurrentPlan = plan === currentPlan;
    const isUpgrade = canUpgradeTo(plan);
    const isDowngrade = canDowngradeTo(plan);
    const exceedsLimits = wouldExceedLimits(plan);

    return (
      <Card
        key={plan}
        className={`cursor-pointer transition-all ${
          selectedPlan === plan ? 'ring-2 ring-blue-500' : ''
        } ${isCurrentPlan ? 'border-green-500 bg-green-50' : ''} ${
          exceedsLimits ? 'border-red-300 bg-red-50' : ''
        }`}
        onClick={() => setSelectedPlan(plan)}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <span className="font-semibold">{config.name}</span>
              {isCurrentPlan && (
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-600"
                >
                  {t('current')}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold">
                {plan === 'FREE' ? (
                  t('free')
                ) : (
                  <>
                    ¥{config.price.toLocaleString()}
                    <span className="text-sm font-normal">/月</span>
                  </>
                )}
              </div>
              {plan !== 'FREE' && (
                <div className="text-xs text-gray-500">{t('perMember')}</div>
              )}
            </div>
          </div>

          {/* Usage vs Limits */}
          {plan !== 'PREMIUM' && (
            <div className="mb-3 space-y-2">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{t('quizzes')}</span>
                  <span>
                    {usage.quizzes} / {config.limits.quizzes}
                  </span>
                </div>
                <Progress
                  value={(usage.quizzes / (config.limits.quizzes || 1)) * 100}
                  className="h-1"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{t('responses')}</span>
                  <span>
                    {usage.responses} / {config.limits.responses}
                  </span>
                </div>
                <Progress
                  value={
                    (usage.responses / (config.limits.responses || 1)) * 100
                  }
                  className="h-1"
                />
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-1">
            {config.features.slice(0, 3).map(feature => (
              <div key={feature} className="flex items-center gap-2 text-xs">
                <Check className="h-3 w-3 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
            {config.features.length > 3 && (
              <div className="text-xs text-gray-500">
                +{config.features.length - 3} {t('moreFeatures')}
              </div>
            )}
          </div>

          {/* Warning for downgrades */}
          {exceedsLimits && (
            <div className="mt-3 flex items-start gap-2 rounded border border-red-200 bg-red-100 p-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <div className="text-xs text-red-700">{t('exceedsLimits')}</div>
            </div>
          )}

          {/* Action indicators */}
          {!isCurrentPlan && (
            <div className="mt-3 flex items-center justify-center">
              {isUpgrade && (
                <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                  {t('upgrade')}
                </div>
              )}
              {isDowngrade && (
                <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('downgrade')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { teamName })}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['FREE', 'PRO', 'PREMIUM'] as const).map(renderPlanCard)}
        </div>

        {selectedPlan && selectedPlan !== currentPlan && (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <div className="font-medium">
                {canUpgradeTo(selectedPlan)
                  ? t('confirmUpgrade')
                  : t('confirmDowngrade')}
              </div>
              <div className="text-sm text-gray-600">
                {currentPlan} → {selectedPlan}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                {t('cancel')}
              </Button>
              <Button
                onClick={() =>
                  handlePlanChange(selectedPlan as 'PRO' | 'PREMIUM')
                }
                disabled={isProcessing || wouldExceedLimits(selectedPlan)}
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {canUpgradeTo(selectedPlan)
                  ? t('upgradeNow')
                  : t('downgradeNow')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
