/**
 * Integrations Management Client Component
 * Provides UI for managing external system integrations
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateIntegrationModal } from './CreateIntegrationModal';
import { IntegrationCard } from './IntegrationCard';
import { SyncOperationsList } from './SyncOperationsList';
import { IntegrationAnalytics } from './IntegrationAnalytics';

interface IntegrationsManagementClientProps {
  integrations: any[];
  teams: any[];
  analytics: any;
  integrationLimits: Record<string, any>;
  locale: string;
}

export default function IntegrationsManagementClient({
  integrations,
  teams,
  analytics,
  integrationLimits,
  locale,
}: IntegrationsManagementClientProps) {
  const t = useTranslations('integrations');
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const teamIntegrations = integrations.filter(i => i.teamId === selectedTeam);
  const currentTeam = teams.find(t => t.id === selectedTeam);
  const teamLimits = integrationLimits[selectedTeam] || {};

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh page data
    window.location.reload();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {t('actions.refresh')}
          </Button>
          <CreateIntegrationModal
            teams={teams}
            selectedTeam={selectedTeam}
            integrationLimits={teamLimits}
            locale={locale}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.create')}
              </Button>
            }
          />
        </div>
      </div>

      {/* Team Selector */}
      {teams.length > 1 && (
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            {t('teamSelector.label')}
          </label>
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Overview Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('overview.total')}
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamIntegrations.length}</div>
            {teamLimits.maxIntegrations > 0 && (
              <div className="mt-2">
                <Progress
                  value={
                    (teamIntegrations.length / teamLimits.maxIntegrations) * 100
                  }
                  className="h-2"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {teamIntegrations.length} / {teamLimits.maxIntegrations}{' '}
                  {t('overview.used')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('overview.active')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teamIntegrations.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('overview.syncs')}
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalSyncOperations}
            </div>
            <p className="text-muted-foreground text-xs">
              {analytics.syncSuccessRate.toFixed(1)}%{' '}
              {t('overview.successRate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('overview.events')}
            </CardTitle>
            <Zap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.recentEvents.length}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('overview.lastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">
            {t('tabs.integrations')}
          </TabsTrigger>
          <TabsTrigger value="analytics">{t('tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          {teamIntegrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  {t('empty.title')}
                </h3>
                <p className="text-muted-foreground mb-4 text-center">
                  {t('empty.description')}
                </p>
                <CreateIntegrationModal
                  teams={teams}
                  selectedTeam={selectedTeam}
                  integrationLimits={teamLimits}
                  locale={locale}
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('empty.createFirst')}
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <IntegrationAnalytics
            analytics={analytics}
            teamId={selectedTeam}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('activity.recentEvents')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentEvents.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">
                    {t('activity.noEvents')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {getStatusIcon(event.status)}
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {event.integration.name}
                            </span>
                            <Badge
                              className={getTypeColor(event.integration.type)}
                            >
                              {event.integration.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {event.message}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(event.timestamp).toLocaleString(locale)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <SyncOperationsList teamId={selectedTeam} locale={locale} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
