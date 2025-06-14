import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// SSE connection management
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to user's connection set
      if (!connections.has(userId)) {
        connections.set(userId, new Set());
      }
      connections.get(userId)?.add(controller);

      // Send initial connection event
      controller.enqueue(
        `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
      );

      // Send unread notifications count
      sendUnreadCount(userId, controller);

      // Cleanup on connection close
      const cleanup = () => {
        connections.get(userId)?.delete(controller);
        if (connections.get(userId)?.size === 0) {
          connections.delete(userId);
        }
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
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
}

// Send unread notifications count to user
async function sendUnreadCount(
  userId: string,
  controller: ReadableStreamDefaultController
) {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    controller.enqueue(
      `data: ${JSON.stringify({
        type: 'unread_count',
        count: unreadCount,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
  } catch (error) {
    console.error('Error sending unread count:', error);
  }
}

// Send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const data = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    userConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${data}\n\n`);
      } catch (error) {
        // Remove broken connections
        userConnections.delete(controller);
      }
    });
  }
}

// Send notification to team members
export async function sendNotificationToTeam(
  teamId: string,
  notification: any
) {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    teamMembers.forEach(member => {
      sendNotificationToUser(member.userId, notification);
    });
  } catch (error) {
    console.error('Error sending team notification:', error);
  }
}

// Update unread count for user
export function updateUnreadCount(userId: string) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.forEach(controller => {
      sendUnreadCount(userId, controller);
    });
  }
}
