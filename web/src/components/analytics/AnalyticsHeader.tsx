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
import { useAction } from 'next-safe-action/hooks';
import {
  exportAnalyticsToCSV,
  exportTeamAnalyticsToCSV,
} from '@/lib/actions/export';
import { toast } from 'sonner';
import { useUserPlan } from '@/hooks/use-user-plan';

interface AnalyticsHeaderProps {
  quizId?: string;
  lng: string;
  currentRange?: string;
  exportData?: any;
  exportType?: 'quiz' | 'team';
}

export function AnalyticsHeader({
  quizId,
  lng,
  currentRange,
  exportData,
  exportType = 'quiz',
}: AnalyticsHeaderProps) {
  const t = useTranslations(
    exportType === 'team'
      ? 'dashboard.analytics'
      : 'dashboard.quizzes.analytics'
  );
  const { range, setRange } = useAnalyticsStore();
  const userPlan = useUserPlan();

  // Use currentRange prop if provided (for team analytics), otherwise use store
  const activeRange = currentRange || range;

  const { execute: executeExportAnalytics, isExecuting: isExporting } =
    useAction(exportAnalyticsToCSV, {
      onSuccess: ({ data }) => {
        if (
          data &&
          typeof data === 'object' &&
          'content' in data &&
          'mimeType' in data &&
          'filename' in data
        ) {
          // Create download link
          const blob = new Blob([data.content as string], {
            type: data.mimeType as string,
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.filename as string;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success(t('exportSuccess'));
        }
      },
      onError: ({ error }) => {
        console.error('Export failed:', error);
        toast.error(t('exportFailed'));
      },
    });

  const { execute: executeExportTeamAnalytics, isExecuting: isExportingTeam } =
    useAction(exportTeamAnalyticsToCSV, {
      onSuccess: ({ data }) => {
        if (
          data &&
          typeof data === 'object' &&
          'content' in data &&
          'mimeType' in data &&
          'filename' in data
        ) {
          // Create download link
          const blob = new Blob([data.content as string], {
            type: data.mimeType as string,
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.filename as string;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success(t('exportSuccess'));
        }
      },
      onError: ({ error }) => {
        console.error('Export failed:', error);
        toast.error(t('exportFailed'));
      },
    });

  const handleExport = () => {
    if (userPlan.isFree) {
      toast.error(t('exportRequiresPro'));
      return;
    }

    if (exportType === 'team') {
      executeExportTeamAnalytics({
        range: activeRange as any,
        language: lng,
        exportType: 'overview',
      });
    } else if (quizId) {
      executeExportAnalytics({
        quizId,
        range: activeRange as any,
        language: lng,
      });
    }
  };

  const isCurrentlyExporting = isExporting || isExportingTeam;

  const handleRangeChange = (value: string) => {
    if (exportType === 'team') {
      // For team analytics, we'll handle this via URL params
      const url = new URL(window.location.href);
      url.searchParams.set('range', value);
      window.location.href = url.toString();
    } else {
      setRange(value as any);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {exportType === 'quiz' && quizId && (
          <Link href={`/${lng}/dashboard/quizzes/${quizId}/preview`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          </Link>
        )}
        {exportType === 'team' && (
          <Link href={`/${lng}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToDashboard')}
            </Button>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={activeRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {exportType === 'team' ? (
              <>
                <SelectItem value="7d">{t('filter7d')}</SelectItem>
                <SelectItem value="30d">{t('filter30d')}</SelectItem>
                <SelectItem value="90d">{t('filter90d')}</SelectItem>
                <SelectItem value="all">{t('filterAll')}</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="all">{t('filterAll')}</SelectItem>
                <SelectItem value="30d">{t('filter30d')}</SelectItem>
                <SelectItem value="7d">{t('filter7d')}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isCurrentlyExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isCurrentlyExporting ? t('exporting') : t('export')}
        </Button>
      </div>
    </div>
  );
}
