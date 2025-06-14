import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  getTeamMembers,
  getTeamById,
  getUserTeams,
} from '../../../../../lib/actions/team-member';
import { auth } from '../../../../../lib/auth';
import { redirect } from 'next/navigation';
import TeamMembersClient from './client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>;
}): Promise<Metadata> {
  const { lng } = await params;
  const t = await getTranslations({ locale: lng, namespace: 'team' });

  return {
    title: t('members.title'),
  };
}

export default async function TeamMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lng: string }>;
  searchParams: Promise<{ teamId?: string }>;
}) {
  const { lng } = await params;
  const { teamId: searchParamsTeamId } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get user's teams
  const teamsResult = await getUserTeams({});
  if (!teamsResult.data?.teams || teamsResult.data.teams.length === 0) {
    redirect(`/${lng}/dashboard`);
  }

  const teams = teamsResult.data.teams;

  // Get team ID from searchParams or user's first team
  let teamId = searchParamsTeamId || teams[0].id;

  // Verify user has access to the requested team
  const hasAccess = teams.some(team => team.id === teamId);
  if (!hasAccess) {
    teamId = teams[0].id;
  }

  try {
    const [teamResult, membersResult] = await Promise.all([
      getTeamById({ teamId }),
      getTeamMembers({ teamId }),
    ]);

    if (!teamResult.data?.team || !membersResult.data?.members) {
      throw new Error('Failed to load team data');
    }

    return (
      <TeamMembersClient
        lng={lng}
        team={teamResult.data.team}
        members={membersResult.data.members}
        currentUserId={(session.user as any).id}
        userTeams={teams}
      />
    );
  } catch (error) {
    console.error('Error loading team members:', error);
    redirect(`/${lng}/dashboard`);
  }
}
