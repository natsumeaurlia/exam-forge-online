import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserTeams } from '@/lib/actions/team-member';
import TeamManagementClient from './client';

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng, namespace: 'team' });

  return {
    title: t('title'),
  };
}

export default async function TeamPage({
  params: { lng },
}: {
  params: { lng: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  try {
    const teams = await getUserTeams();

    if (teams.length === 0) {
      // No teams, redirect to dashboard or create team flow
      redirect(`/${lng}/dashboard`);
    }

    // If user has teams, redirect to the first team's members page
    redirect(`/${lng}/dashboard/team/members?teamId=${teams[0].id}`);
  } catch (error) {
    console.error('Error loading teams:', error);
    redirect(`/${lng}/dashboard`);
  }
}
