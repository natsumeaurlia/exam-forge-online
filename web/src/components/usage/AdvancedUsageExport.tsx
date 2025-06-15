'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, subDays, subMonths, subWeeks } from 'date-fns';

interface Team {
  id: string;
  name: string;
  subscription?: {
    plan: {
      name: string;
      type: string;
      maxQuizzes?: number | null;
      maxMembers?: number | null;
      maxResponsesPerMonth?: number | null;
      maxStorageMB?: number | null;
    };
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

interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  dateRange: {
    from: Date;
    to: Date;
  };
  includeResourceTypes: {
    quiz: boolean;
    response: boolean;
    member: boolean;
    storage: boolean;
  };
  includeForecasts: boolean;
  includeComparisons: boolean;
  granularity: 'daily' | 'weekly' | 'monthly';
}

interface AdvancedUsageExportProps {
  team: Team;
  usageData: UsageData;
  quizStats: QuizStats;
  lng: string;
}

export function AdvancedUsageExport({
  team,
  usageData,
  quizStats,
  lng,
}: AdvancedUsageExportProps) {
  const t = useTranslations('dashboard.usage.export');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    dateRange: {
      from: subMonths(new Date(), 3),
      to: new Date(),
    },
    includeResourceTypes: {
      quiz: true,
      response: true,
      member: true,
      storage: true,
    },
    includeForecasts: true,
    includeComparisons: true,
    granularity: 'weekly',
  });

  const quickDateRanges = [
    {
      label: t('dateRanges.lastWeek'),
      value: 'lastWeek',
      from: subWeeks(new Date(), 1),
      to: new Date(),
    },
    {
      label: t('dateRanges.lastMonth'),
      value: 'lastMonth',
      from: subMonths(new Date(), 1),
      to: new Date(),
    },
    {
      label: t('dateRanges.last3Months'),
      value: 'last3Months',
      from: subMonths(new Date(), 3),
      to: new Date(),
    },
    {
      label: t('dateRanges.last6Months'),
      value: 'last6Months',
      from: subMonths(new Date(), 6),
      to: new Date(),
    },
  ];

  const handleQuickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/usage/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team.id,
          format,
          options: {
            ...exportOptions,
            format,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `usage-report-${team.name}-${format}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvancedExport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/usage/export/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team.id,
          options: exportOptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Advanced export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const fileExtension =
        exportOptions.format === 'excel' ? 'xlsx' : exportOptions.format;
      a.download = `advanced-usage-report-${team.name}-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Advanced export error:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Quick Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            {t('quickExport')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('quickFormats')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            {t('formats.csv')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('formats.excel')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            {t('formats.pdf')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Export Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('advancedExport')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('advanced.title')}</DialogTitle>
            <DialogDescription>{t('advanced.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>{t('advanced.format')}</Label>
              <Select
                value={exportOptions.format}
                onValueChange={value =>
                  setExportOptions(prev => ({ ...prev, format: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {t('formats.excel')}
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      {t('formats.csv')}
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      <FileJson className="mr-2 h-4 w-4" />
                      {t('formats.json')}
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      {t('formats.pdf')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-3">
              <Label>{t('advanced.dateRange')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickDateRanges.map(range => (
                  <Button
                    key={range.value}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExportOptions(prev => ({
                        ...prev,
                        dateRange: { from: range.from, to: range.to },
                      }))
                    }
                    className={cn(
                      exportOptions.dateRange.from.getTime() ===
                        range.from.getTime() &&
                        exportOptions.dateRange.to.getTime() ===
                          range.to.getTime() &&
                        'bg-primary text-primary-foreground'
                    )}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(exportOptions.dateRange.from, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.dateRange.from}
                      onSelect={date =>
                        date &&
                        setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date },
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(exportOptions.dateRange.to, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.dateRange.to}
                      onSelect={date =>
                        date &&
                        setExportOptions(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date },
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Resource Types */}
            <div className="space-y-3">
              <Label>{t('advanced.includeResources')}</Label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(exportOptions.includeResourceTypes).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={checked =>
                          setExportOptions(prev => ({
                            ...prev,
                            includeResourceTypes: {
                              ...prev.includeResourceTypes,
                              [key]: !!checked,
                            },
                          }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-medium">
                        {t(`resourceTypes.${key}`)}
                      </Label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <Label>{t('advanced.additionalOptions')}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="forecasts"
                    checked={exportOptions.includeForecasts}
                    onCheckedChange={checked =>
                      setExportOptions(prev => ({
                        ...prev,
                        includeForecasts: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="forecasts" className="text-sm">
                    {t('advanced.includeForecasts')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comparisons"
                    checked={exportOptions.includeComparisons}
                    onCheckedChange={checked =>
                      setExportOptions(prev => ({
                        ...prev,
                        includeComparisons: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="comparisons" className="text-sm">
                    {t('advanced.includeComparisons')}
                  </Label>
                </div>
              </div>
            </div>

            {/* Granularity */}
            <div className="space-y-2">
              <Label>{t('advanced.granularity')}</Label>
              <Select
                value={exportOptions.granularity}
                onValueChange={value =>
                  setExportOptions(prev => ({
                    ...prev,
                    granularity: value as any,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    {t('granularity.daily')}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {t('granularity.weekly')}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t('granularity.monthly')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAdvancedExport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t('generate')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
