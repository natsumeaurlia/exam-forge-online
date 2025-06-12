import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  getTeamMembers,
  getTeamById,
  getUserTeams,
} from '@/lib/actions/team-member';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TeamMembersClient from './client';

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng, namespace: 'team' });

  return {
    title: t('members.title'),
  };
}

export default async function TeamMembersPage({
  params: { lng },
  searchParams,
}: {
  params: { lng: string };
  searchParams: { teamId?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get user's teams
  const teams = await getUserTeams();
  if (teams.length === 0) {
    redirect(`/${lng}/dashboard`);
  }

  // Get team ID from searchParams or user's first team
  let teamId = searchParams.teamId || teams[0].id;

  // Verify user has access to the requested team
  const hasAccess = teams.some(team => team.id === teamId);
  if (!hasAccess) {
    teamId = teams[0].id;
  }

  try {
    const [team, members] = await Promise.all([
      getTeamById(teamId),
      getTeamMembers(teamId),
    ]);

    return (
      <TeamMembersClient
        lng={lng}
        team={team}
        members={members}
        currentUserId={session.user.id}
        userTeams={teams}
      />
    );
  } catch (error) {
    console.error('Error loading team members:', error);
    redirect(`/${lng}/dashboard`);
  }
}
