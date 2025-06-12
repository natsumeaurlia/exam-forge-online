'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUserPlan } from '@/hooks/use-user-plan';
import { MultiMediaUpload } from './MultiMediaUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { getUserStorage } from '@/lib/actions/storage';

interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  fileName: string;
  fileSize: number;
  mimeType: string;
  order: number;
}

interface QuestionWithMediaProps {
  children: ReactNode;
  questionId: string;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
}

export function QuestionWithMedia({
  children,
  questionId,
  media,
  onMediaChange,
}: QuestionWithMediaProps) {
  const t = useTranslations('quizManagement.editor.questionMedia');
  const { isPro, isPremium } = useUserPlan();
  const hasPaidPlan = isPro || isPremium;
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    max: number;
  } | null>(null);

  const { execute: executeGetUserStorage } = useAction(getUserStorage, {
    onSuccess: ({ data }) => {
      if (data) {
        setStorageInfo({
          used: data.storageUsed,
          max: data.storageLimit,
        });
      }
    },
    onError: ({ error }) => {
      console.error('Failed to get storage info:', error);
    },
  });

  useEffect(() => {
    if (hasPaidPlan) {
      executeGetUserStorage({});
    }
  }, [hasPaidPlan, executeGetUserStorage]);

  return (
    <div className="space-y-6">
      {children}

      <Card
        className={
          hasPaidPlan
            ? 'border-gray-200'
            : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
        }
      >
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center gap-2">
            {!hasPaidPlan && <Crown className="h-5 w-5 text-amber-600" />}
            <span
              className={
                hasPaidPlan ? 'font-medium' : 'font-medium text-amber-900'
              }
            >
              {t('title')}
            </span>
            {!hasPaidPlan && (
              <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                {t('proBadge')}
              </Badge>
            )}
          </div>
          {hasPaidPlan ? (
            <MultiMediaUpload
              questionId={questionId}
              media={media}
              onChange={onMediaChange}
              storageUsed={storageInfo?.used}
              storageMax={storageInfo?.max}
            />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
              <Crown className="mx-auto mb-3 h-12 w-12 text-amber-600" />
              <p className="mb-2 text-sm font-medium text-amber-900">
                {t('upgradeTitle')}
              </p>
              <p className="text-xs text-amber-700">
                {t('upgradeDescription')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
