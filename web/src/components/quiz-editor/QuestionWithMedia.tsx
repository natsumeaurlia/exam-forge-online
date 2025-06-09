'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUserPlan } from '@/hooks/use-user-plan';
import { MultiMediaUpload } from './MultiMediaUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
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
  const { isPro, isEnterprise } = useUserPlan();
  const hasPaidPlan = isPro || isEnterprise;
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    max: number;
  } | null>(null);

  useEffect(() => {
    if (hasPaidPlan) {
      getUserStorage().then(result => {
        if (result.success && result.data) {
          setStorageInfo({
            used: result.data.usedBytes,
            max: result.data.maxBytes,
          });
        }
      });
    }
  }, [hasPaidPlan]);

  return (
    <div className="space-y-6">
      {children}

      {hasPaidPlan && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-4">
            <div className="mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-900">{t('title')}</span>
              <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                {t('proBadge')}
              </Badge>
            </div>
            <MultiMediaUpload
              questionId={questionId}
              media={media}
              onChange={onMediaChange}
              storageUsed={storageInfo?.used}
              storageMax={storageInfo?.max}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
