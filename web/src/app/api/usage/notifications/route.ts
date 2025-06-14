import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getNotificationsSchema = z.object({
  teamId: z.string().min(1),
});

const createNotificationSchema = z.object({
  teamId: z.string().min(1),
  type: z.enum(['warning', 'critical', 'info']),
  title: z.string().min(1),
  message: z.string().min(1),
  resourceType: z.enum(['QUIZ', 'RESPONSE', 'MEMBER', 'STORAGE']),
  threshold: z.number().min(0).max(100),
  currentUsage: z.number().min(0),
  maxLimit: z.number().min(1),
});

// GET /api/usage/notifications - Get existing notifications and settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = getNotificationsSchema.safeParse({
      teamId: searchParams.get('teamId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { teamId } = validation.data;

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get existing usage notifications
    const notifications = await prisma.notification.findMany({
      where: {
        teamId,
        type: { in: ['STORAGE_LIMIT_WARNING', 'PLAN_LIMIT_WARNING'] },
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get notification settings from team metadata
    const team = await prisma.team.findFirst({
      where: { id: teamId },
      select: { lmsConfiguration: true },
    });

    const settings = (team?.lmsConfiguration as any)?.notificationSettings;

    const defaultSettings = {
      enabled: true,
      warningThreshold: 75,
      criticalThreshold: 90,
      emailNotifications: true,
      pushNotifications: true,
      resourceTypes: {
        quiz: true,
        response: true,
        member: true,
        storage: true,
      },
    };

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.metadata?.severity || 'info',
        title: n.title,
        message: n.message,
        resourceType: n.metadata?.resourceType || 'USAGE',
        threshold: n.metadata?.threshold || 0,
        currentUsage: n.metadata?.currentUsage || 0,
        maxLimit: n.metadata?.maxLimit || 0,
        timestamp: n.createdAt,
        dismissed: n.isRead,
      })),
      settings: settings
        ? {
            enabled: settings.enabled,
            warningThreshold: settings.warningThreshold,
            criticalThreshold: settings.criticalThreshold,
            emailNotifications: settings.emailNotifications,
            pushNotifications: settings.pushNotifications,
            resourceTypes: settings.resourceTypes,
          }
        : defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching usage notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/usage/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      teamId,
      type,
      title,
      message,
      resourceType,
      threshold,
      currentUsage,
      maxLimit,
    } = validation.data;

    // Verify user has access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Create notification using existing Notification model
    const notification = await prisma.notification.create({
      data: {
        type:
          type === 'critical' ? 'PLAN_LIMIT_WARNING' : 'STORAGE_LIMIT_WARNING',
        title,
        message,
        userId: session.user.id,
        teamId,
        metadata: {
          severity: type,
          resourceType,
          threshold,
          currentUsage,
          maxLimit,
        },
        isRead: false,
      },
    });

    // Broadcast to SSE clients
    await broadcastNotification(teamId, {
      type: 'usage_threshold_exceeded',
      id: notification.id,
      severity: type,
      title,
      message,
      resourceType,
      threshold,
      currentUsage,
      maxLimit,
      timestamp: notification.createdAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: (notification.metadata as any)?.severity || type,
        title: notification.title,
        message: notification.message,
        resourceType:
          (notification.metadata as any)?.resourceType || resourceType,
        threshold: (notification.metadata as any)?.threshold || threshold,
        currentUsage:
          (notification.metadata as any)?.currentUsage || currentUsage,
        maxLimit: (notification.metadata as any)?.maxLimit || maxLimit,
        timestamp: notification.createdAt,
        dismissed: notification.isRead,
      },
    });
  } catch (error) {
    console.error('Error creating usage notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to broadcast notifications to SSE clients
async function broadcastNotification(teamId: string, data: any) {
  // This would typically use a message queue or pub/sub system
  // For now, we'll store it in a global map that SSE endpoints can access
  if (global.sseClients) {
    const clients = global.sseClients.get(teamId) || [];
    const message = `data: ${JSON.stringify(data)}\n\n`;

    clients.forEach((client: any) => {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error broadcasting to SSE client:', error);
      }
    });
  }
}
