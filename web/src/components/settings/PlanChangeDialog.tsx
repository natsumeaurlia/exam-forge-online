'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Star, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

export interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: 'FREE' | 'PRO' | 'PREMIUM';
  memberCount: number;
  onPlanChanged: () => void;
  lng: string;
}

interface PlanOption {
  type: 'FREE' | 'PRO' | 'PREMIUM';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
}

export const PlanChangeDialog = ({
  open,
  onOpenChange,
  currentPlan,
  memberCount,
  onPlanChanged,
  lng,
}: PlanChangeDialogProps) => {
  const t = useTranslations();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'PREMIUM'>(
    currentPlan
  );
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);

  const planOptions: PlanOption[] = [
    {
      type: 'FREE',
      name: t('settings.planChange.plans.free.name'),
      description: t('settings.planChange.plans.free.description'),
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        t('settings.planChange.plans.free.features.quizzes'),
        t('settings.planChange.plans.free.features.questions'),
        t('settings.planChange.plans.free.features.responses'),
        t('settings.planChange.plans.free.features.basicSupport'),
      ],
    },
    {
      type: 'PRO',
      name: t('settings.planChange.plans.pro.name'),
      description: t('settings.planChange.plans.pro.description'),
      monthlyPrice: 2980,
      yearlyPrice: 2980 * 10, // 17% discount
      features: [
        t('settings.planChange.plans.pro.features.unlimitedQuizzes'),
        t('settings.planChange.plans.pro.features.advancedQuestions'),
        t('settings.planChange.plans.pro.features.analytics'),
        t('settings.planChange.plans.pro.features.teamMembers'),
        t('settings.planChange.plans.pro.features.prioritySupport'),
      ],
      recommended: true,
    },
    {
      type: 'PREMIUM',
      name: t('settings.planChange.plans.premium.name'),
      description: t('settings.planChange.plans.premium.description'),
      monthlyPrice: 4980,
      yearlyPrice: 4980 * 10, // 17% discount
      features: [
        t('settings.planChange.plans.premium.features.allPro'),
        t('settings.planChange.plans.premium.features.aiGeneration'),
        t('settings.planChange.plans.premium.features.lmsMode'),
        t('settings.planChange.plans.premium.features.customBranding'),
        t('settings.planChange.plans.premium.features.dedicatedSupport'),
      ],
    },
  ];

  const handlePlanChange = async () => {
    if (selectedPlan === currentPlan) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      if (selectedPlan === 'FREE') {
        // Handle downgrade to free plan
        await handleDowngradeToFree();
      } else {
        // Handle upgrade to paid plan
        await handleUpgradeToPaidPlan();
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        title: t('settings.planChange.error'),
        description: t('settings.planChange.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPaidPlan = async () => {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: selectedPlan,
        billingCycle: isYearly ? 'YEARLY' : 'MONTHLY',
        teamId: 'current-team-id', // This should be fetched from context
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    window.location.href = url;
  };

  const handleDowngradeToFree = async () => {
    const response = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        immediately: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to downgrade to free plan');
    }

    toast({
      title: t('settings.planChange.success'),
      description: t('settings.planChange.downgradedToFree'),
    });

    onPlanChanged();
    onOpenChange(false);
  };

  const calculatePrice = (plan: PlanOption) => {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    return price * memberCount;
  };

  const calculateSavings = (plan: PlanOption) => {
    const monthlyTotal = plan.monthlyPrice * memberCount * 12;
    const yearlyTotal = plan.yearlyPrice * memberCount;
    return monthlyTotal - yearlyTotal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settings.planChange.title')}</DialogTitle>
          <DialogDescription>
            {t('settings.planChange.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          {selectedPlan !== 'FREE' && (
            <div className="flex items-center justify-center space-x-4 rounded-lg bg-gray-50 p-4">
              <Label
                htmlFor="billing-cycle"
                className={!isYearly ? 'font-semibold' : ''}
              >
                {t('settings.planChange.monthly')}
              </Label>
              <Switch
                id="billing-cycle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label
                htmlFor="billing-cycle"
                className={isYearly ? 'font-semibold' : ''}
              >
                {t('settings.planChange.yearly')}
                <Badge variant="secondary" className="ml-2">
                  {t('settings.planChange.save17Percent')}
                </Badge>
              </Label>
            </div>
          )}

          {/* Plan Selection */}
          <RadioGroup
            value={selectedPlan}
            onValueChange={value =>
              setSelectedPlan(value as 'FREE' | 'PRO' | 'PREMIUM')
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {planOptions.map(plan => (
                <Card
                  key={plan.type}
                  className={`relative cursor-pointer transition-all ${
                    selectedPlan === plan.type
                      ? 'shadow-lg ring-2 ring-blue-500'
                      : 'hover:shadow-md'
                  } ${plan.type === currentPlan ? 'border-green-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.type)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <RadioGroupItem value={plan.type} id={plan.type} />
                      <div className="flex space-x-2">
                        {plan.recommended && (
                          <Badge>
                            <Star className="mr-1 h-3 w-3" />
                            {t('settings.planChange.recommended')}
                          </Badge>
                        )}
                        {plan.type === currentPlan && (
                          <Badge variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t('settings.planChange.current')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      {plan.type === 'FREE' ? (
                        <div className="text-2xl font-bold">
                          {t('settings.planChange.free')}
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl font-bold">
                            {formatPrice(calculatePrice(plan))}
                            <span className="text-sm font-normal text-gray-500">
                              /
                              {isYearly
                                ? t('settings.planChange.year')
                                : t('settings.planChange.month')}
                            </span>
                          </div>
                          {isYearly && (
                            <div className="text-sm text-green-600">
                              {t('settings.planChange.saveAmount', {
                                amount: formatPrice(calculateSavings(plan)),
                              })}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-gray-500">
                            {formatPrice(
                              isYearly ? plan.yearlyPrice : plan.monthlyPrice
                            )}{' '}
                            × {memberCount} {t('settings.planChange.members')}
                          </div>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>

          {/* Change Warning */}
          {selectedPlan !== currentPlan && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedPlan === 'FREE'
                  ? t('settings.planChange.downgradeWarning')
                  : t('settings.planChange.upgradeInfo')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('settings.planChange.cancel')}
          </Button>
          <Button
            onClick={handlePlanChange}
            disabled={loading || selectedPlan === currentPlan}
          >
            {loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            )}
            {selectedPlan === 'FREE'
              ? t('settings.planChange.downgrade')
              : t('settings.planChange.upgrade')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
