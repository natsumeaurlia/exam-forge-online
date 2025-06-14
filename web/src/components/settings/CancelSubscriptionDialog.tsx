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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionData: {
    id: string;
    planType: 'FREE' | 'PRO' | 'PREMIUM';
    currentPeriodEnd: string;
  };
  onCanceled: () => void;
  lng: string;
}

export const CancelSubscriptionDialog = ({
  open,
  onOpenChange,
  subscriptionData,
  onCanceled,
  lng,
}: CancelSubscriptionDialogProps) => {
  const t = useTranslations();
  const { toast } = useToast();
  const [cancelType, setCancelType] = useState<'immediate' | 'period_end'>(
    'period_end'
  );
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediately: cancelType === 'immediate',
          reason,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: t('settings.cancelSubscription.success'),
        description:
          cancelType === 'immediate'
            ? t('settings.cancelSubscription.canceledImmediately')
            : t('settings.cancelSubscription.canceledAtPeriodEnd', {
                date: new Date(
                  subscriptionData.currentPeriodEnd
                ).toLocaleDateString(lng),
              }),
      });

      onCanceled();
      onOpenChange(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: t('settings.cancelSubscription.error'),
        description: t('settings.cancelSubscription.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {t('settings.cancelSubscription.title')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.cancelSubscription.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cancellation Type */}
          <div>
            <Label className="mb-3 block text-base font-medium">
              {t('settings.cancelSubscription.whenToCancel')}
            </Label>
            <RadioGroup
              value={cancelType}
              onValueChange={value =>
                setCancelType(value as 'immediate' | 'period_end')
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <RadioGroupItem
                    value="period_end"
                    id="period_end"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="period_end"
                      className="cursor-pointer font-medium"
                    >
                      {t('settings.cancelSubscription.atPeriodEnd')}
                    </Label>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('settings.cancelSubscription.atPeriodEndDescription', {
                        date: new Date(
                          subscriptionData.currentPeriodEnd
                        ).toLocaleDateString(lng),
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <RadioGroupItem
                    value="immediate"
                    id="immediate"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="immediate"
                      className="cursor-pointer font-medium"
                    >
                      {t('settings.cancelSubscription.immediately')}
                    </Label>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('settings.cancelSubscription.immediatelyDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Reason Selection */}
          <div>
            <Label className="mb-3 block text-base font-medium">
              {t('settings.cancelSubscription.reasonLabel')}
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="space-y-2">
                {[
                  'tooExpensive',
                  'notUsing',
                  'missingFeatures',
                  'foundAlternative',
                  'technicalIssues',
                  'other',
                ].map(reasonKey => (
                  <div key={reasonKey} className="flex items-center space-x-2">
                    <RadioGroupItem value={reasonKey} id={reasonKey} />
                    <Label htmlFor={reasonKey} className="cursor-pointer">
                      {t(`settings.cancelSubscription.reasons.${reasonKey}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Feedback */}
          <div>
            <Label
              htmlFor="feedback"
              className="mb-2 block text-base font-medium"
            >
              {t('settings.cancelSubscription.feedbackLabel')}
              <span className="ml-1 font-normal text-gray-500">
                ({t('settings.cancelSubscription.optional')})
              </span>
            </Label>
            <Textarea
              id="feedback"
              placeholder={t('settings.cancelSubscription.feedbackPlaceholder')}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning */}
          {cancelType === 'immediate' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('settings.cancelSubscription.immediateWarning')}
              </AlertDescription>
            </Alert>
          )}

          {cancelType === 'period_end' && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                {t('settings.cancelSubscription.periodEndWarning', {
                  date: new Date(
                    subscriptionData.currentPeriodEnd
                  ).toLocaleDateString(lng),
                })}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('settings.cancelSubscription.keepSubscription')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || !reason}
          >
            {loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            )}
            {cancelType === 'immediate'
              ? t('settings.cancelSubscription.cancelNow')
              : t('settings.cancelSubscription.cancelAtPeriodEnd')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
