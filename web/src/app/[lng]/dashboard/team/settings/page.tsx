import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  getTeamById,
  getUserTeams,
} from '../../../../../lib/actions/team-member';
import { auth } from '../../../../../lib/auth';
import { redirect } from 'next/navigation';
import TeamSettingsClient from './client';

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng, namespace: 'team' });

  return {
    title: t('settings.title'),
  };
}

export default async function TeamSettingsPage({
  params: { lng },
  searchParams,
}: {
  params: { lng: string };
  searchParams: { teamId?: string };
}) {
  const session = await auth();
  if (!(session?.user as any)?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get user's teams
  const teamsResult = await getUserTeams({});
  if (!teamsResult?.data?.teams || teamsResult.data.teams.length === 0) {
    redirect(`/${lng}/dashboard`);
  }

  const teams = teamsResult.data.teams;

  // Get team ID from searchParams or user's first team
  let teamId = searchParams.teamId || teams[0].id;

  // Verify user has access to the requested team
  const hasAccess = teams.some(team => team.id === teamId);
  if (!hasAccess) {
    teamId = teams[0].id;
  }

  try {
    const teamResult = await getTeamById({ teamId });

    if (!teamResult?.data?.team) {
      throw new Error('Failed to load team data');
    }

    const team = teamResult.data.team;

    // Only OWNER and ADMIN can access team settings
    if (!['OWNER', 'ADMIN'].includes(team.currentUserRole)) {
      redirect(`/${lng}/dashboard`);
    }

    return (
      <TeamSettingsClient lng={lng} team={team as any} userTeams={teams} />
    );
  } catch (error) {
    console.error('Error loading team settings:', error);
    redirect(`/${lng}/dashboard`);
  }
}
