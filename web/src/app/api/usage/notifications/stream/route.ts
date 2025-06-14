import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Global SSE clients map (only initialize on server runtime)
declare global {
  var sseClients: Map<string, any[]> | undefined;
  var usageMonitors: Map<string, NodeJS.Timeout> | undefined;
}

// Initialize global variables only when needed
function getSSEClients() {
  if (typeof global !== 'undefined' && !global.sseClients) {
    global.sseClients = new Map();
  }
  return global.sseClients;
}

function getUsageMonitors() {
  if (typeof global !== 'undefined' && !global.usageMonitors) {
    global.usageMonitors = new Map();
  }
  return global.usageMonitors;
}

// GET /api/usage/notifications/stream - Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return new Response('Missing teamId parameter', { status: 400 });
    }

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return new Response('Team not found', { status: 404 });
    }

    // Create SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // SSE headers
        const headers = {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control',
        };

        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connection_established',
          timestamp: new Date().toISOString(),
          message: 'Real-time notifications connected',
        })}\n\n`;

        controller.enqueue(encoder.encode(initialMessage));

        // Store this connection for broadcasting
        const sseClients = getSSEClients();
        if (!sseClients?.has(teamId)) {
          sseClients?.set(teamId, []);
        }

        const clients = sseClients?.get(teamId) || [];
        const clientConnection = {
          controller,
          encoder,
          write: (data: string) => {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              console.error('Error writing to SSE stream:', error);
            }
          },
        };

        clients.push(clientConnection);

        // Cleanup on close
        let cleanup = () => {
          const index = clients.indexOf(clientConnection);
          if (index > -1) {
            clients.splice(index, 1);
          }
          if (clients.length === 0) {
            getSSEClients()?.delete(teamId);
          }
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);

        // Send periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(heartbeatMessage));
          } catch (error) {
            console.error('Heartbeat error:', error);
            clearInterval(heartbeat);
            cleanup();
          }
        }, 30000); // 30 seconds

        // Start usage monitoring for this team
        startUsageMonitoring(teamId);

        // Cleanup heartbeat on close
        const originalCleanup = cleanup;
        cleanup = () => {
          clearInterval(heartbeat);
          originalCleanup();
        };
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Error setting up SSE stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Start monitoring usage for a team
async function startUsageMonitoring(teamId: string) {
  const usageMonitors = getUsageMonitors();
  if (usageMonitors?.has(teamId)) {
    return; // Already monitoring this team
  }

  const monitor = setInterval(async () => {
    try {
      await checkUsageThresholds(teamId);
    } catch (error) {
      console.error('Error monitoring usage for team:', teamId, error);
    }
  }, 60000); // Check every minute

  usageMonitors?.set(teamId, monitor);

  // Cleanup monitor when no clients
  setTimeout(() => {
    const sseClients = getSSEClients();
    if (!sseClients?.has(teamId) || sseClients.get(teamId)?.length === 0) {
      clearInterval(monitor);
      getUsageMonitors()?.delete(teamId);
    }
  }, 300000); // 5 minutes
}

// Check usage thresholds and send notifications
async function checkUsageThresholds(teamId: string) {
  try {
    // Get team with subscription info
    const team = await prisma.team.findFirst({
      where: { id: teamId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!team?.subscription?.plan) {
      return; // No subscription to monitor
    }

    const plan = team.subscription.plan;

    // Get notification settings from team metadata
    const teamData = await prisma.team.findFirst({
      where: { id: teamId },
      select: { lmsConfiguration: true },
    });

    const settings = (teamData?.lmsConfiguration as any)?.notificationSettings;

    if (!settings?.enabled) {
      return; // Notifications disabled
    }

    // Check current usage
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [quizCount, memberCount, monthlyResponses, storageUsage] =
      await Promise.all([
        prisma.quiz.count({ where: { teamId } }),
        prisma.teamMember.count({ where: { teamId } }),
        prisma.quizResponse.count({
          where: {
            quiz: { teamId },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.usageRecord.aggregate({
          where: {
            teamId,
            resourceType: 'STORAGE',
            periodStart: { gte: thirtyDaysAgo },
          },
          _sum: { count: true },
        }),
      ]);

    const currentStorage = storageUsage._sum.count || 0;

    // Check each resource type
    const checks = [
      {
        resourceType: 'QUIZ' as const,
        current: quizCount,
        limit: plan.maxQuizzes,
        enabled: settings.resourceTypes?.quiz ?? true,
      },
      {
        resourceType: 'MEMBER' as const,
        current: memberCount,
        limit: plan.maxMembers,
        enabled: settings.resourceTypes?.member ?? true,
      },
      {
        resourceType: 'RESPONSE' as const,
        current: monthlyResponses,
        limit: plan.maxResponsesPerMonth,
        enabled: settings.resourceTypes?.response ?? true,
      },
      {
        resourceType: 'STORAGE' as const,
        current: Math.round(currentStorage / 1024 / 1024), // Convert to MB
        limit: plan.maxStorageMB,
        enabled: settings.resourceTypes?.storage ?? true,
      },
    ];

    for (const check of checks) {
      if (!check.enabled || !check.limit) continue;

      const percentage = (check.current / check.limit) * 100;

      // Check if we need to send notification
      let notificationType: 'warning' | 'critical' | null = null;
      let threshold = 0;

      if (percentage >= settings.criticalThreshold) {
        notificationType = 'critical';
        threshold = settings.criticalThreshold;
      } else if (percentage >= settings.warningThreshold) {
        notificationType = 'warning';
        threshold = settings.warningThreshold;
      }

      if (notificationType) {
        // Check if we already sent this notification recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            teamId,
            type: { in: ['STORAGE_LIMIT_WARNING', 'PLAN_LIMIT_WARNING'] },
            metadata: {
              path: ['resourceType'],
              equals: check.resourceType,
            },
            createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, // Within last hour
          },
        });

        if (!recentNotification) {
          await createAndBroadcastNotification(
            teamId,
            notificationType,
            check.resourceType,
            check.current,
            check.limit,
            threshold
          );
        }
      }

      // Always broadcast current usage update
      await broadcastUsageUpdate(
        teamId,
        check.resourceType,
        check.current,
        check.limit
      );
    }
  } catch (error) {
    console.error('Error checking usage thresholds:', error);
  }
}

async function createAndBroadcastNotification(
  teamId: string,
  type: 'warning' | 'critical',
  resourceType: string,
  current: number,
  limit: number,
  threshold: number
) {
  const resourceNames = {
    QUIZ: 'quizzes',
    MEMBER: 'team members',
    RESPONSE: 'responses',
    STORAGE: 'storage',
  };

  const title =
    type === 'critical'
      ? `Critical: ${resourceNames[resourceType as keyof typeof resourceNames]} limit nearly reached`
      : `Warning: High ${resourceNames[resourceType as keyof typeof resourceNames]} usage`;

  const message = `You are using ${current} of ${limit} ${resourceNames[resourceType as keyof typeof resourceNames]} (${Math.round((current / limit) * 100)}%). Consider upgrading your plan.`;

  // Create notification in database
  const teamOwner = await prisma.teamMember.findFirst({
    where: { teamId, role: 'OWNER' },
    select: { userId: true },
  });

  const notification = await prisma.notification.create({
    data: {
      type:
        type === 'critical' ? 'PLAN_LIMIT_WARNING' : 'STORAGE_LIMIT_WARNING',
      title,
      message,
      userId: teamOwner?.userId || '',
      teamId,
      metadata: {
        severity: type,
        resourceType,
        threshold,
        currentUsage: current,
        maxLimit: limit,
      },
      isRead: false,
    },
  });

  // Broadcast to SSE clients
  await broadcastToClients(teamId, {
    type: 'usage_threshold_exceeded',
    id: notification.id,
    severity: type,
    title,
    message,
    resourceType,
    threshold,
    currentUsage: current,
    maxLimit: limit,
    timestamp: notification.createdAt.toISOString(),
  });
}

async function broadcastUsageUpdate(
  teamId: string,
  resourceType: string,
  current: number,
  limit: number
) {
  await broadcastToClients(teamId, {
    type: 'usage_updated',
    resourceType,
    currentUsage: current,
    maxLimit: limit,
    percentage: Math.round((current / limit) * 100),
    timestamp: new Date().toISOString(),
  });
}

async function broadcastToClients(teamId: string, data: any) {
  const sseClients = getSSEClients();
  if (!sseClients?.has(teamId)) return;

  const clients = sseClients.get(teamId);
  if (!clients) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client: any, index: number) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error broadcasting to SSE client:', error);
      // Remove broken client
      clients.splice(index, 1);
    }
  });
}
