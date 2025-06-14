'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { updateTeam } from '@/lib/actions/team-member';
import { TeamRole } from '@prisma/client';
import { Building2, CreditCard, Shield, Settings } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  currentUserRole: TeamRole;
  createdAt: Date;
  _count: {
    members: number;
    quizzes: number;
  };
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    plan: {
      id: string;
      name: string;
      monthlyPrice: number;
      yearlyPrice: number;
      currency?: string;
      interval?: string;
      maxMembers: number | null;
      maxQuizzes: number | null;
      maxResponsesPerQuiz?: number | null;
    };
  } | null;
}

interface TeamWithRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  role: TeamRole;
  joinedAt: Date;
  _count: {
    members: number;
    quizzes: number;
  };
}

interface TeamSettingsClientProps {
  lng: string;
  team: Team;
  userTeams: TeamWithRole[];
}

export default function TeamSettingsClient({
  lng,
  team,
  userTeams,
}: TeamSettingsClientProps) {
  const t = useTranslations('team.settings');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    logo: team.logo || '',
  });

  const canEdit = ['OWNER', 'ADMIN'].includes(team.currentUserRole);
  const isOwner = team.currentUserRole === 'OWNER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    try {
      await updateTeam({
        teamId: team.id,
        name: formData.name,
        description: formData.description || undefined,
        logo: formData.logo || undefined,
      });
      toast.success(t('updateSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(t('updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      case 'MEMBER':
        return 'outline';
      case 'VIEWER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      {userTeams.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('selectTeam')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userTeams.map(userTeam => (
                <Card
                  key={userTeam.id}
                  className={`cursor-pointer transition-colors ${
                    userTeam.id === team.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() =>
                    router.push(
                      `/${lng}/dashboard/team/settings?teamId=${userTeam.id}`
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{userTeam.name}</CardTitle>
                      <Badge variant={getRoleBadgeVariant(userTeam.role)}>
                        {t(`members.roles.${userTeam.role.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground flex justify-between text-sm">
                      <span>
                        {t('membersCount', { count: userTeam._count.members })}
                      </span>
                      <span>
                        {t('quizzesCount', { count: userTeam._count.quizzes })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            {t('tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            {t('tabs.billing')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('tabs.security')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('general.title')}</CardTitle>
              <CardDescription>{t('general.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('general.teamName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    disabled={!canEdit}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">{t('general.teamSlug')}</Label>
                  <Input
                    id="slug"
                    value={team.slug}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-muted-foreground text-sm">
                    {t('general.slugHelp')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('general.teamDescription')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    disabled={!canEdit}
                    rows={3}
                    placeholder={t('general.descriptionPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">{t('general.teamLogo')}</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={formData.logo}
                    onChange={e => handleChange('logo', e.target.value)}
                    disabled={!canEdit}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-muted-foreground text-sm">
                    {t('general.logoHelp')}
                  </p>
                </div>

                {canEdit && (
                  <Button type="submit" disabled={isLoading}>
                    {t('general.saveChanges')}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('info.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('info.created')}
                  </p>
                  <p className="font-medium">
                    {new Date(team.createdAt).toLocaleDateString(lng)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('info.teamId')}
                  </p>
                  <p className="font-mono text-sm">{team.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('info.members')}
                  </p>
                  <p className="font-medium">{team._count.members}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t('info.quizzes')}
                  </p>
                  <p className="font-medium">{team._count.quizzes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('billing.title')}</CardTitle>
              <CardDescription>{t('billing.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {team.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {team.subscription.plan.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t('billing.price', {
                          price: team.subscription.plan.monthlyPrice,
                          currency: team.subscription.plan.currency || 'JPY',
                          interval: t('billing.interval.month'),
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        team.subscription.status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {t(`billing.status.${team.subscription.status}`)}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">{t('billing.limits')}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {t('billing.maxMembers')}
                        </p>
                        <p className="font-medium">
                          {team._count.members} /{' '}
                          {team.subscription.plan.maxMembers || '∞'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {t('billing.maxQuizzes')}
                        </p>
                        <p className="font-medium">
                          {team._count.quizzes} /{' '}
                          {team.subscription.plan.maxQuizzes || '∞'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-muted-foreground text-sm">
                      {t('billing.nextBilling', {
                        date: new Date(
                          team.subscription.currentPeriodEnd
                        ).toLocaleDateString(lng),
                      })}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      onClick={() =>
                        (window.location.href = '/api/stripe/portal')
                      }
                      variant="outline"
                    >
                      {t('billing.manageSubscription')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Building2 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    {t('billing.noPlan')}
                  </p>
                  {isOwner && (
                    <Button onClick={() => router.push(`/${lng}/plans`)}>
                      {t('billing.upgradePlan')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.title')}</CardTitle>
              <CardDescription>{t('security.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('security.twoFactor')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('security.twoFactorDescription')}
                    </p>
                  </div>
                  <Badge variant="outline">{t('security.comingSoon')}</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('security.apiKeys')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('security.apiKeysDescription')}
                    </p>
                  </div>
                  <Badge variant="outline">{t('security.comingSoon')}</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('security.auditLogs')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('security.auditLogsDescription')}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {t('security.enterpriseOnly')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  {t('danger.title')}
                </CardTitle>
                <CardDescription>{t('danger.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  {t('danger.deleteTeam')}
                </Button>
                <p className="text-muted-foreground mt-2 text-sm">
                  {t('danger.deleteWarning')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
