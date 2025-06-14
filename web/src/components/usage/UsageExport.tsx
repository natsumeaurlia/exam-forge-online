'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TeamPlan {
  name: string;
  type: string;
  maxQuizzes?: number | null;
  maxMembers?: number | null;
  maxResponsesPerMonth?: number | null;
  maxStorageMB?: number | null;
}

interface Team {
  id: string;
  name: string;
  subscription?: {
    plan: TeamPlan;
  } | null;
}

interface UsageData {
  currentUsage: Array<{
    resourceType: string;
    _sum: {
      count: number | null;
    };
  }>;
  weeklyTrends: Array<{
    id: string;
    resourceType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>;
  monthlyTrends: Array<{
    id: string;
    resourceType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>;
}

interface QuizStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalResponses: number;
  thisMonthResponses: number;
}

interface UsageExportProps {
  team: Team;
  usageData: UsageData;
  quizStats: QuizStats;
  lng: string;
}

export function UsageExport({
  team,
  usageData,
  quizStats,
  lng,
}: UsageExportProps) {
  const t = useTranslations('dashboard.usage');
  const [isExporting, setIsExporting] = useState(false);

  const generateReport = () => {
    const getCurrentUsage = (resourceType: string) => {
      const usage = usageData.currentUsage.find(
        u => u.resourceType === resourceType
      );
      return usage?._sum.count || 0;
    };

    return {
      team: {
        id: team.id,
        name: team.name,
        plan: team.subscription?.plan?.name || 'Free',
        planType: team.subscription?.plan?.type || 'FREE',
      },
      summary: {
        quizzes: getCurrentUsage('QUIZ') || quizStats.totalQuizzes,
        publishedQuizzes: quizStats.publishedQuizzes,
        totalResponses: quizStats.totalResponses,
        thisMonthResponses: quizStats.thisMonthResponses,
        members: getCurrentUsage('MEMBER') || 1,
        storageUsed: Math.round(getCurrentUsage('STORAGE') / 1024 / 1024),
      },
      limits: {
        maxQuizzes: team.subscription?.plan?.maxQuizzes,
        maxMembers: team.subscription?.plan?.maxMembers,
        maxResponsesPerMonth: team.subscription?.plan?.maxResponsesPerMonth,
        maxStorageMB: team.subscription?.plan?.maxStorageMB,
      },
      trends: {
        weekly: usageData.weeklyTrends.map(trend => ({
          resourceType: trend.resourceType,
          count: trend.count,
          periodStart: trend.periodStart.toISOString(),
          periodEnd: trend.periodEnd.toISOString(),
        })),
        monthly: usageData.monthlyTrends.map(trend => ({
          resourceType: trend.resourceType,
          count: trend.count,
          periodStart: trend.periodStart.toISOString(),
          periodEnd: trend.periodEnd.toISOString(),
        })),
      },
      exportedAt: new Date().toISOString(),
    };
  };

  const downloadAsJSON = () => {
    const report = generateReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `usage-report-${team.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadAsCSV = () => {
    const report = generateReport();

    // Summary CSV
    const summaryRows = [
      ['Metric', 'Current', 'Limit', 'Usage %'],
      [
        'Quizzes',
        report.summary.quizzes,
        report.limits.maxQuizzes || 'Unlimited',
        report.limits.maxQuizzes
          ? `${Math.round((report.summary.quizzes / report.limits.maxQuizzes) * 100)}%`
          : 'N/A',
      ],
      [
        'Members',
        report.summary.members,
        report.limits.maxMembers || 'Unlimited',
        report.limits.maxMembers
          ? `${Math.round((report.summary.members / report.limits.maxMembers) * 100)}%`
          : 'N/A',
      ],
      [
        'Responses (Monthly)',
        report.summary.thisMonthResponses,
        report.limits.maxResponsesPerMonth || 'Unlimited',
        report.limits.maxResponsesPerMonth
          ? `${Math.round((report.summary.thisMonthResponses / report.limits.maxResponsesPerMonth) * 100)}%`
          : 'N/A',
      ],
      [
        'Storage (MB)',
        report.summary.storageUsed,
        report.limits.maxStorageMB || 'Unlimited',
        report.limits.maxStorageMB
          ? `${Math.round((report.summary.storageUsed / report.limits.maxStorageMB) * 100)}%`
          : 'N/A',
      ],
    ];

    // Trends CSV
    const trendsRows = [
      ['Period', 'Resource Type', 'Count', 'Period Start', 'Period End'],
      ...report.trends.weekly.map(trend => [
        'Weekly',
        trend.resourceType,
        trend.count,
        new Date(trend.periodStart).toLocaleDateString(),
        new Date(trend.periodEnd).toLocaleDateString(),
      ]),
      ...report.trends.monthly.map(trend => [
        'Monthly',
        trend.resourceType,
        trend.count,
        new Date(trend.periodStart).toLocaleDateString(),
        new Date(trend.periodEnd).toLocaleDateString(),
      ]),
    ];

    const csvContent = [
      `Team: ${report.team.name}`,
      `Plan: ${report.team.plan}`,
      `Export Date: ${new Date().toLocaleDateString()}`,
      '',
      'USAGE SUMMARY',
      ...summaryRows.map(row => row.join(',')),
      '',
      'USAGE TRENDS',
      ...trendsRows.map(row => row.join(',')),
    ].join('\n');

    const dataUri =
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `usage-report-${team.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadAsPDF = async () => {
    // This would require a PDF generation library
    // For now, we'll show a coming soon message
    toast({
      title: t('export.pdf.comingSoon.title'),
      description: t('export.pdf.comingSoon.description'),
    });
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      switch (format) {
        case 'json':
          downloadAsJSON();
          toast({
            title: t('export.success.title'),
            description: t('export.success.json'),
          });
          break;
        case 'csv':
          downloadAsCSV();
          toast({
            title: t('export.success.title'),
            description: t('export.success.csv'),
          });
          break;
        case 'pdf':
          await downloadAsPDF();
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('export.error.title'),
        description: t('export.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? t('export.exporting') : t('export.button')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">
          {t('export.formats')}
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>CSV</span>
            <span className="text-muted-foreground text-xs">
              {t('export.csv.description')}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>JSON</span>
            <span className="text-muted-foreground text-xs">
              {t('export.json.description')}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>PDF</span>
            <span className="text-muted-foreground text-xs">
              {t('export.pdf.description')}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          <Calendar className="mr-1 inline h-3 w-3" />
          {t('export.includesData')}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
