import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const dismissNotificationSchema = z.object({
  teamId: z.string().min(1),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/usage/notifications/[id]/dismiss - Dismiss a specific notification
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: notificationId } = await params;
    const body = await request.json();

    const validation = dismissNotificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
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

    // Verify notification belongs to team
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        teamId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        dismissed: updatedNotification.isRead,
        dismissedAt: updatedNotification.readAt,
      },
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
