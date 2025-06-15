/**
 * Integrations Management Page
 * Main dashboard for managing external system integrations
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import IntegrationsManagementClient from '@/components/integrations/IntegrationsManagementClient';

interface IntegrationsPageProps {
  params: { lng: string };
}

export async function generateMetadata({
  params,
}: IntegrationsPageProps): Promise<Metadata> {
  const t = await getTranslations('integrations.metadata');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${params.lng}/auth/signin`);
  }

  // Get user's team memberships
  const teamMemberships = await prisma.teamMember.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          plan: true,
        },
      },
    },
    orderBy: {
      team: {
        createdAt: 'desc',
      },
    },
  });

  if (teamMemberships.length === 0) {
    redirect(`/${params.lng}/dashboard`);
  }

  // Get integrations for all user's teams
  const teamIds = teamMemberships.map(tm => tm.teamId);

  const integrations = await prisma.integration.findMany({
    where: {
      teamId: { in: teamIds },
    },
    include: {
      team: {
        select: { id: true, name: true },
      },
      syncOperations: {
        orderBy: { startedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          type: true,
          status: true,
          recordsProcessed: true,
          recordsSucceeded: true,
          recordsFailed: true,
          startedAt: true,
          completedAt: true,
        },
      },
      events: {
        orderBy: { timestamp: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          status: true,
          message: true,
          timestamp: true,
        },
      },
      _count: {
        select: {
          syncOperations: true,
          events: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get integration analytics for the primary team
  const primaryTeamId = teamMemberships[0].teamId;
  const since = new Date();
  since.setDate(since.getDate() - 30); // Last 30 days

  const [totalSyncOperations, successfulSyncs, failedSyncs, recentEvents] =
    await Promise.all([
      prisma.syncOperation.count({
        where: {
          integration: { teamId: primaryTeamId },
          startedAt: { gte: since },
        },
      }),
      prisma.syncOperation.count({
        where: {
          integration: { teamId: primaryTeamId },
          startedAt: { gte: since },
          status: 'completed',
        },
      }),
      prisma.syncOperation.count({
        where: {
          integration: { teamId: primaryTeamId },
          startedAt: { gte: since },
          status: 'failed',
        },
      }),
      prisma.integrationEvent.findMany({
        where: {
          integration: { teamId: primaryTeamId },
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          integration: {
            select: { name: true, type: true, provider: true },
          },
        },
      }),
    ]);

  const analytics = {
    totalIntegrations: integrations.length,
    activeIntegrations: integrations.filter(i => i.status === 'active').length,
    totalSyncOperations,
    successfulSyncs,
    failedSyncs,
    syncSuccessRate:
      totalSyncOperations > 0
        ? (successfulSyncs / totalSyncOperations) * 100
        : 0,
    recentEvents,
  };

  // Check integration limits based on team plans
  const integrationLimits = teamMemberships.reduce(
    (acc, tm) => {
      const planLimits = getPlanIntegrationLimits(tm.team.plan);
      acc[tm.teamId] = planLimits;
      return acc;
    },
    {} as Record<string, any>
  );

  return (
    <IntegrationsManagementClient
      integrations={integrations}
      teams={teamMemberships.map(tm => tm.team)}
      analytics={analytics}
      integrationLimits={integrationLimits}
      locale={params.lng}
    />
  );
}

function getPlanIntegrationLimits(plan: string) {
  switch (plan) {
    case 'FREE':
      return {
        maxIntegrations: 2,
        allowedTypes: ['webhook'],
        features: ['basic_sync'],
      };
    case 'PRO':
      return {
        maxIntegrations: 10,
        allowedTypes: ['lms', 'webhook', 'sso', 'notification'],
        features: ['basic_sync', 'auto_sync', 'grade_passback'],
      };
    case 'ENTERPRISE':
      return {
        maxIntegrations: -1, // Unlimited
        allowedTypes: [
          'lms',
          'webhook',
          'sso',
          'ai',
          'notification',
          'storage',
          'analytics',
        ],
        features: [
          'basic_sync',
          'auto_sync',
          'grade_passback',
          'advanced_analytics',
          'custom_integration',
        ],
      };
    default:
      return {
        maxIntegrations: 1,
        allowedTypes: ['webhook'],
        features: ['basic_sync'],
      };
  }
}
