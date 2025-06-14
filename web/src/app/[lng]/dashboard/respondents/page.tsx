import { Suspense } from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RespondentManagementContent } from '@/components/respondents/RespondentManagementContent';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { prisma } from '@/lib/prisma';

type Props = {
  params: { lng: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('respondents');
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

function RespondentManagementLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

async function getUserActiveTeam(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        where: {
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER'],
          },
        },
        include: {
          team: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
    },
  });

  if (!user || user.teamMembers.length === 0) {
    throw new Error('User has no team membership');
  }

  return user.teamMembers[0].teamId;
}

export default async function RespondentManagementPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.lng}/auth/signin`);
  }

  const teamId = await getUserActiveTeam(session.user.id);

  return (
    <Suspense fallback={<RespondentManagementLoading />}>
      <RespondentManagementContent lng={params.lng} teamId={teamId} />
    </Suspense>
  );
}
