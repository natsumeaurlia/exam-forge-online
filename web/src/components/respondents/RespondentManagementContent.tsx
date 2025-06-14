'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  MoreHorizontal,
  UserPlus,
  Calendar,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import {
  getRespondents,
  getRespondentDetails,
  exportRespondents,
  type RespondentSummary,
  type RespondentDetails,
} from '@/lib/actions/respondents';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface RespondentManagementContentProps {
  lng: string;
  teamId: string;
}

interface QuizResponse {
  id: string;
  quizTitle: string;
  score: number | null;
  totalPoints: number;
  isPassed: boolean | null;
  completedAt: Date | null;
  duration: number; // in minutes
}

export function RespondentManagementContent({
  lng,
  teamId,
}: RespondentManagementContentProps) {
  const t = useTranslations('respondents');
  const { data: session } = useSession();
  const [respondents, setRespondents] = useState<RespondentSummary[]>([]);
  const [selectedRespondents, setSelectedRespondents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'blocked'
  >('all');
  const [selectedRespondent, setSelectedRespondent] =
    useState<RespondentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({
    totalRespondents: 0,
    activeRespondents: 0,
    averageScore: 0,
    totalQuizzes: 0,
    totalPoints: 0,
  });

  const locale = lng === 'ja' ? ja : enUS;

  // Load respondents data
  useEffect(() => {
    const loadRespondents = async () => {
      if (!session?.user || !teamId) return;

      setIsLoading(true);
      try {
        const result = await getRespondents({
          teamId,
          search: searchQuery,
          status: statusFilter,
          page: 1,
          limit: 100,
        });

        if ('error' in result) {
          toast.error(result.error);
          return;
        }

        setRespondents(result.respondents);
        setStats(result.stats);
      } catch (error) {
        console.error('Error loading respondents:', error);
        toast.error('Failed to load respondents');
      } finally {
        setIsLoading(false);
      }
    };

    loadRespondents();
  }, [session, teamId, searchQuery, statusFilter]);

  // Since filtering is now done server-side, we use respondents directly
  const filteredRespondents = respondents;

  const handleSelectAll = () => {
    if (selectedRespondents.length === filteredRespondents.length) {
      setSelectedRespondents([]);
    } else {
      setSelectedRespondents(filteredRespondents.map(r => r.id));
    }
  };

  const handleSelectRespondent = (id: string) => {
    if (selectedRespondents.includes(id)) {
      setSelectedRespondents(selectedRespondents.filter(rid => rid !== id));
    } else {
      setSelectedRespondents([...selectedRespondents, id]);
    }
  };

  const loadRespondentDetails = async (respondentId: string) => {
    try {
      const result = await getRespondentDetails({
        teamId,
        userId: respondentId,
      });

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      setSelectedRespondent(result.respondent);
    } catch (error) {
      console.error('Error loading respondent details:', error);
      toast.error('Failed to load respondent details');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const result = await exportRespondents({ teamId, format });

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      // TODO: Implement actual file download
      toast.success(`Respondents exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting respondents:', error);
      toast.error('Failed to export respondents');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t('status.active')}
          </Badge>
        );
      case 'inactive':
        return <Badge variant="secondary">{t('status.inactive')}</Badge>;
      case 'blocked':
        return <Badge variant="destructive">{t('status.blocked')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getQuizStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : t('actions.export')}
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            {t('actions.invite')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalRespondents')}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRespondents}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeRespondents} {t('stats.active')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.avgScore')}
            </CardTitle>
            <Trophy className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.averageScore)}%
            </div>
            <p className="text-muted-foreground text-xs">
              {t('stats.avgScoreDescription')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalQuizzes')}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-muted-foreground text-xs">
              {t('stats.totalQuizzesDescription')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalPoints')}
            </CardTitle>
            <Trophy className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPoints.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('stats.totalPointsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive' | 'blocked') =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="active">{t('filters.active')}</SelectItem>
              <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
              <SelectItem value="blocked">{t('filters.blocked')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedRespondents.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedRespondents.length} {t('selected')}
            </span>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              {t('actions.sendEmail')}
            </Button>
            <Button variant="outline" size="sm">
              {t('actions.bulkActions')}
            </Button>
          </div>
        )}
      </div>

      {/* Respondents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('table.title')}</CardTitle>
              <CardDescription>{t('table.description')}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={
                  selectedRespondents.length === filteredRespondents.length &&
                  filteredRespondents.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {t('table.selectAll')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRespondents.map(respondent => (
              <div
                key={respondent.id}
                className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedRespondents.includes(respondent.id)}
                  onCheckedChange={() => handleSelectRespondent(respondent.id)}
                />
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={respondent.image || undefined}
                    alt={respondent.name || 'User'}
                  />
                  <AvatarFallback>
                    {(respondent.name || respondent.email)
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {respondent.name || 'Anonymous'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {respondent.email}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {respondent.quizzesCompleted}
                  </p>
                  <p className="text-xs text-gray-500">{t('table.quizzes')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {respondent.averageScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">{t('table.avgScore')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {respondent.totalPoints}
                  </p>
                  <p className="text-xs text-gray-500">{t('table.points')}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    {respondent.lastActivity
                      ? formatDistanceToNow(respondent.lastActivity, {
                          addSuffix: true,
                          locale,
                        })
                      : 'No activity'}
                  </p>
                </div>
                {getStatusBadge(respondent.status)}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadRespondentDetails(respondent.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {t('details.title')}: {selectedRespondent?.name}
                      </DialogTitle>
                      <DialogDescription>
                        {t('details.description')}
                      </DialogDescription>
                    </DialogHeader>
                    {selectedRespondent && (
                      <Tabs defaultValue="overview" className="mt-4">
                        <TabsList>
                          <TabsTrigger value="overview">
                            {t('details.tabs.overview')}
                          </TabsTrigger>
                          <TabsTrigger value="quizzes">
                            {t('details.tabs.quizzes')}
                          </TabsTrigger>
                          <TabsTrigger value="activity">
                            {t('details.tabs.activity')}
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-sm font-medium">
                                {t('details.info.basic')}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.email')}:
                                  </span>{' '}
                                  {selectedRespondent.email}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.joined')}:
                                  </span>{' '}
                                  {selectedRespondent.lastActivity
                                    ? formatDistanceToNow(
                                        selectedRespondent.lastActivity,
                                        { locale }
                                      ) + ' ago'
                                    : 'No activity'}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.status')}:
                                  </span>{' '}
                                  {getStatusBadge(selectedRespondent.status)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-medium">
                                {t('details.info.performance')}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.completed')}:
                                  </span>{' '}
                                  {selectedRespondent.quizzesCompleted} quizzes
                                </p>
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.avgScore')}:
                                  </span>{' '}
                                  {selectedRespondent.averageScore.toFixed(1)}%
                                </p>
                                <p>
                                  <span className="font-medium">
                                    {t('details.info.totalPoints')}:
                                  </span>{' '}
                                  {selectedRespondent.totalPoints}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Tags section removed as it's not part of the current data model */}
                        </TabsContent>
                        <TabsContent value="quizzes" className="space-y-4">
                          <div className="space-y-3">
                            {selectedRespondent.quizResponses.map(response => (
                              <div
                                key={response.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div className="flex items-center space-x-3">
                                  {getQuizStatusIcon(
                                    response.isPassed ? 'passed' : 'failed'
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {response.quizTitle}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {response.completedAt
                                        ? formatDistanceToNow(
                                            response.completedAt,
                                            { addSuffix: true, locale }
                                          )
                                        : 'In progress'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {response.score !== null
                                      ? `${response.score}%`
                                      : '-'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {response.duration}min
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="activity">
                          <p className="text-sm text-gray-500">
                            {t('details.activityPlaceholder')}
                          </p>
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>

          {filteredRespondents.length === 0 && (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {t('empty.title')}
              </h3>
              <p className="mb-4 text-gray-500">{t('empty.description')}</p>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('empty.action')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
