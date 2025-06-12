'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MoreVertical, UserPlus, Shield, User, Eye, Crown } from 'lucide-react';
import {
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/lib/actions/team-member';
import { TeamRole } from '@prisma/client';

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  currentUserRole: TeamRole;
  _count: {
    members: number;
    quizzes: number;
  };
  subscription?: {
    plan: {
      maxMembers: number | null;
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

interface TeamMembersClientProps {
  lng: string;
  team: Team;
  members: TeamMember[];
  currentUserId: string;
  userTeams: TeamWithRole[];
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

export default function TeamMembersClient({
  lng,
  team,
  members,
  currentUserId,
  userTeams,
}: TeamMembersClientProps) {
  const t = useTranslations('team');
  const router = useRouter();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);

  const canManageMembers = ['OWNER', 'ADMIN'].includes(team.currentUserRole);
  const canChangeRoles = team.currentUserRole === 'OWNER';
  const maxMembers = team.subscription?.plan.maxMembers || 1;
  const isAtMemberLimit = maxMembers !== null && members.length >= maxMembers;

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    setIsLoading(true);
    try {
      await addTeamMember({
        teamId: team.id,
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(t('members.inviteSuccess'));
      setInviteEmail('');
      setInviteRole('MEMBER');
      setIsInviteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(t('members.inviteError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('members.removeConfirm'))) return;

    try {
      await removeTeamMember({
        teamId: team.id,
        userId,
      });
      toast.success(t('members.removeSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(t('members.removeError'));
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    try {
      await updateTeamMemberRole({
        teamId: team.id,
        userId,
        role,
      });
      toast.success(t('members.roleUpdateSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(t('members.roleUpdateError'));
    }
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
                      `/${lng}/dashboard/team/members?teamId=${userTeam.id}`
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('members.description', { teamName: team.name })}
          </p>
        </div>
        {canManageMembers && (
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button disabled={isAtMemberLimit}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('members.inviteMember')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('members.inviteDialogTitle')}</DialogTitle>
                <DialogDescription>
                  {t('members.inviteDialogDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('members.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('members.emailPlaceholder')}
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t('members.roleLabel')}</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={value => setInviteRole(value as TeamRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        {t('members.roles.admin')}
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        {t('members.roles.member')}
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        {t('members.roles.viewer')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleInviteMember} disabled={isLoading}>
                  {t('members.inviteButton')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isAtMemberLimit && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle>{t('members.limitReachedTitle')}</CardTitle>
            <CardDescription>
              {t('members.limitReachedDescription', { max: maxMembers })}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('members.membersList')}</CardTitle>
          <CardDescription>
            {t('members.membersCount', {
              count: members.length,
              max: maxMembers || '∞',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('members.memberColumn')}</TableHead>
                <TableHead>{t('members.roleColumn')}</TableHead>
                <TableHead>{t('members.joinedColumn')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => {
                const RoleIcon = roleIcons[member.role];
                const isCurrentUser = member.userId === currentUserId;
                const canModifyMember =
                  canManageMembers && !isCurrentUser && member.role !== 'OWNER';

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback>
                            {member.user.name?.[0] ||
                              member.user.email?.[0] ||
                              '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.user.name || member.user.email}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-2">
                                ({t('members.you')})
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="gap-1"
                      >
                        <RoleIcon className="h-3 w-3" />
                        {t(`members.roles.${member.role.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString(lng)}
                    </TableCell>
                    <TableCell>
                      {canModifyMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t('members.actions')}
                            </DropdownMenuLabel>
                            {canChangeRoles && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.userId, 'ADMIN')
                                  }
                                  disabled={member.role === 'ADMIN'}
                                >
                                  {t('members.makeAdmin')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.userId, 'MEMBER')
                                  }
                                  disabled={member.role === 'MEMBER'}
                                >
                                  {t('members.makeMember')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.userId, 'VIEWER')
                                  }
                                  disabled={member.role === 'VIEWER'}
                                >
                                  {t('members.makeViewer')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-destructive"
                            >
                              {t('members.remove')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
