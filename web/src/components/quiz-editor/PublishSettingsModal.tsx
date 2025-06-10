'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { publishQuiz, checkSubdomainAvailability } from '@/lib/actions/quiz';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';

interface PublishSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
}

export function PublishSettingsModal({
  isOpen,
  onClose,
  quizId,
}: PublishSettingsModalProps) {
  const { quiz } = useQuizEditorStore();
  const [subdomain, setSubdomain] = useState(quiz?.subdomain || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const t = useTranslations('quizManagement.editor.publish');

  const { execute: executePublish, isExecuting: isPublishing } = useAction(
    publishQuiz,
    {
      onSuccess: () => {
        toast.success(t('publishSuccess'));
        onClose();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t('publishError'));
      },
    }
  );

  const { execute: executeCheck } = useAction(checkSubdomainAvailability, {
    onSuccess: ({ data }) => {
      setIsAvailable(data?.available || false);
      setIsChecking(false);
    },
    onError: () => {
      setIsChecking(false);
    },
  });

  const handleSubdomainChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(formatted);
    setIsAvailable(null);

    if (formatted.length >= 3) {
      setIsChecking(true);
      executeCheck({ subdomain: formatted });
    }
  };

  const handlePublish = () => {
    if (!subdomain || !isAvailable) return;
    executePublish({ id: quizId, subdomain });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="subdomain">{t('subdomain')}</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={e => handleSubdomainChange(e.target.value)}
                placeholder={t('subdomainPlaceholder')}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">{t('domainSuffix')}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('subdomainHelp')}</p>

            {isChecking && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('checking')}
              </div>
            )}

            {!isChecking && isAvailable !== null && subdomain.length >= 3 && (
              <div
                className={`mt-2 flex items-center gap-2 text-sm ${
                  isAvailable ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {t('available')}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {t('unavailable')}
                  </>
                )}
              </div>
            )}
          </div>

          {quiz?.password && (
            <Alert>
              <AlertDescription>
                {t('passwordProtectionInfo', { password: quiz.password })}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              {t('publicUrlInfo')}
              <br />
              <strong>https://{subdomain || 'my-quiz'}.quizservice.com</strong>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              !subdomain ||
              subdomain.length < 3 ||
              !isAvailable ||
              isChecking ||
              isPublishing
            }
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('publishButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
