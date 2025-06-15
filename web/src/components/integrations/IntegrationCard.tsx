/**
 * Integration Card Component
 * Displays individual integration status and controls
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  testIntegration,
  syncIntegration,
  deleteIntegration,
} from '@/lib/actions/integrations';

interface IntegrationCardProps {
  integration: any;
  locale: string;
}

export function IntegrationCard({ integration, locale }: IntegrationCardProps) {
  const t = useTranslations('integrations.card');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(integration.lastSyncAt);

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = () => {
    switch (integration.type) {
      case 'lms':
        return 'bg-blue-100 text-blue-800';
      case 'webhook':
        return 'bg-green-100 text-green-800';
      case 'sso':
        return 'bg-purple-100 text-purple-800';
      case 'ai':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const result = await testIntegration({ id: integration.id });
      if (result.success) {
        // Refresh page to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error('Test integration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (type: string) => {
    setIsLoading(true);
    try {
      const result = await syncIntegration({
        integrationId: integration.id,
        type: type as any,
      });
      if (result.success) {
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      console.error('Sync integration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteIntegration({ id: integration.id });
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Delete integration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recentSync = integration.syncOperations?.[0];
  const recentEvent = integration.events?.[0];

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{integration.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTest} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('actions.test')}
              </DropdownMenuItem>
              {integration.type === 'lms' && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleSync('roster')}
                    disabled={isLoading}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t('actions.syncRoster')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSync('grades')}
                    disabled={isLoading}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t('actions.syncGrades')}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getTypeColor()}>
            {integration.type.toUpperCase()}
          </Badge>
          <Badge className={getStatusColor()}>
            {t(`status.${integration.status}`)}
          </Badge>
          <span className="text-muted-foreground text-sm">
            {integration.provider}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Summary */}
        <div>
          <h4 className="mb-2 text-sm font-medium">{t('configuration')}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {integration.type === 'lms' && (
              <>
                <div>
                  <span className="text-muted-foreground">
                    {t('autoSync')}:
                  </span>
                  <span
                    className={`ml-1 ${integration.config?.autoSync ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    {integration.config?.autoSync
                      ? t('enabled')
                      : t('disabled')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('interval')}:
                  </span>
                  <span className="ml-1">
                    {integration.config?.syncInterval || 60}m
                  </span>
                </div>
              </>
            )}
            {integration.type === 'webhook' && (
              <>
                <div>
                  <span className="text-muted-foreground">{t('events')}:</span>
                  <span className="ml-1">
                    {integration.events?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('retries')}:</span>
                  <span className="ml-1">
                    {integration.config?.retryAttempts || 3}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div>
          <h4 className="mb-2 text-sm font-medium">{t('recentActivity')}</h4>

          {recentSync && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('lastSync')}:</span>
                <span>
                  {new Date(recentSync.startedAt).toLocaleDateString(locale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('syncType')}:</span>
                <Badge variant="outline" className="text-xs">
                  {recentSync.type}
                </Badge>
              </div>
              {recentSync.recordsProcessed > 0 && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{t('progress')}</span>
                    <span>
                      {recentSync.recordsSucceeded}/
                      {recentSync.recordsProcessed}
                    </span>
                  </div>
                  <Progress
                    value={
                      (recentSync.recordsSucceeded /
                        recentSync.recordsProcessed) *
                      100
                    }
                    className="h-1"
                  />
                </div>
              )}
            </div>
          )}

          {recentEvent && (
            <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
              <div className="mb-1 flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${
                    recentEvent.status === 'success'
                      ? 'bg-green-500'
                      : recentEvent.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                />
                <span className="font-medium">{recentEvent.type}</span>
              </div>
              <p className="text-muted-foreground">{recentEvent.message}</p>
              <p className="text-muted-foreground mt-1">
                {new Date(recentEvent.timestamp).toLocaleString(locale)}
              </p>
            </div>
          )}

          {!recentSync && !recentEvent && (
            <p className="text-muted-foreground text-xs">{t('noActivity')}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t pt-2">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {integration._count?.syncOperations || 0}
            </div>
            <div className="text-muted-foreground text-xs">
              {t('stats.syncs')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {integration._count?.events || 0}
            </div>
            <div className="text-muted-foreground text-xs">
              {t('stats.events')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {lastSync
                ? new Date(lastSync).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '-'}
            </div>
            <div className="text-muted-foreground text-xs">
              {t('stats.lastSync')}
            </div>
          </div>
        </div>
      </CardContent>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      )}
    </Card>
  );
}
