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
import { exportAnalyticsToCSV } from '@/lib/actions/export';
import { toast } from 'sonner';
import { useState } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';

interface AnalyticsHeaderProps {
  quizId: string;
  lng: string;
}

export function AnalyticsHeader({ quizId, lng }: AnalyticsHeaderProps) {
  const t = useTranslations('dashboard.quizzes.analytics');
  const { range, setRange } = useAnalyticsStore();
  const [isExporting, setIsExporting] = useState(false);
  const userPlan = useUserPlan();

  const handleExport = async () => {
    if (userPlan.isFree) {
      toast.error(t('exportRequiresPro'));
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportAnalyticsToCSV(quizId, range, lng);

      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data.content], {
          type: result.data.mimeType,
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(t('exportSuccess'));
      } else {
        toast.error(result.error || t('exportFailed'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

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
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? t('exporting') : t('export')}
        </Button>
      </div>
    </div>
  );
}
