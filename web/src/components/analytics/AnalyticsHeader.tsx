'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';

interface AnalyticsHeaderProps {
  quizId: string;
  lng: string;
}

export function AnalyticsHeader({ quizId, lng }: AnalyticsHeaderProps) {
  const t = useTranslations('dashboard.quizzes.analytics');
  const { range, setRange } = useAnalyticsStore();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Link href={`/${lng}/dashboard/quizzes/${quizId}/preview`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Select value={range} onValueChange={val => setRange(val as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            <SelectItem value="30d">{t('filter30d')}</SelectItem>
            <SelectItem value="7d">{t('filter7d')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('export')}
        </Button>
      </div>
    </div>
  );
}
