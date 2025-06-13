'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamRole } from '@prisma/client';
import { Users, Settings, Shield } from 'lucide-react';

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

interface TeamManagementClientProps {
  lng: string;
  teams: TeamWithRole[];
  currentTeamId?: string;
}

export default function TeamManagementClient({
  lng,
  teams,
  currentTeamId,
}: TeamManagementClientProps) {
  const t = useTranslations('team');
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState(
    currentTeamId || teams[0]?.id
  );

  const selectedTeam = teams.find(team => team.id === selectedTeamId);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    router.push(`/${lng}/dashboard/team/members?teamId=${teamId}`);
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

  if (teams.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('noTeams.title')}</CardTitle>
            <CardDescription>{t('noTeams.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/${lng}/dashboard`)}>
              {t('noTeams.createTeam')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>
      </div>

      {teams.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('selectTeam')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map(team => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-colors ${
                    team.id === selectedTeamId
                      ? 'border-primary'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleTeamChange(team.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <Badge variant={getRoleBadgeVariant(team.role)}>
                        {t(`members.roles.${team.role.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 text-sm">
                      {team.description || t('noDescription')}
                    </p>
                    <div className="text-muted-foreground flex justify-between text-sm">
                      <span>
                        {t('membersCount', { count: team._count.members })}
                      </span>
                      <span>
                        {t('quizzesCount', { count: team._count.quizzes })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTeam.name}</CardTitle>
            <CardDescription>
              {t('teamId')}: {selectedTeam.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="members" className="space-y-4">
              <TabsList>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  {t('tabs.members')}
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  {t('tabs.settings')}
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-2">
                  <Shield className="h-4 w-4" />
                  {t('tabs.permissions')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members">
                <Button
                  onClick={() =>
                    router.push(
                      `/${lng}/dashboard/team/members?teamId=${selectedTeam.id}`
                    )
                  }
                >
                  {t('viewMembers')}
                </Button>
              </TabsContent>

              <TabsContent value="settings">
                <Button
                  onClick={() =>
                    router.push(
                      `/${lng}/dashboard/team/settings?teamId=${selectedTeam.id}`
                    )
                  }
                  disabled={!['OWNER', 'ADMIN'].includes(selectedTeam.role)}
                >
                  {t('viewSettings')}
                </Button>
              </TabsContent>

              <TabsContent value="permissions">
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    {t('permissions.description')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">
                        {t('permissions.owner')}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t('permissions.ownerDescription')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">
                        {t('permissions.admin')}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t('permissions.adminDescription')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">
                        {t('permissions.member')}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t('permissions.memberDescription')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium">
                        {t('permissions.viewer')}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t('permissions.viewerDescription')}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
