'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { authAction } from './auth-action';
import {
  sendNotificationToUser,
  sendNotificationToTeam,
  updateUnreadCount,
} from '@/app/api/notifications/stream/route';
import { sendNotificationEmail } from '@/lib/email/notifications';

// Schemas
const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().optional(),
  data: z.any().optional(),
  userId: z.string().optional(),
  teamId: z.string().optional(),
  expiresAt: z.date().optional(),
});

const markAsReadSchema = z.object({
  notificationId: z.string(),
});

const markAllAsReadSchema = z.object({
  teamId: z.string().optional(),
});

const getNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  isRead: z.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

const updateNotificationSettingsSchema = z.object({
  teamId: z.string().optional(),
  settings: z.object({
    emailEnabled: z.boolean().optional(),
    emailQuizCompleted: z.boolean().optional(),
    emailNewTeamMember: z.boolean().optional(),
    emailSubscription: z.boolean().optional(),
    emailSystemUpdates: z.boolean().optional(),
    emailMarketing: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    inAppQuizCompleted: z.boolean().optional(),
    inAppNewTeamMember: z.boolean().optional(),
    inAppSubscription: z.boolean().optional(),
    inAppSystemUpdates: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    pushQuizCompleted: z.boolean().optional(),
    pushNewTeamMember: z.boolean().optional(),
  }),
});

// Create notification
export const createNotification = authAction
  .schema(createNotificationSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const {
      type,
      title,
      message,
      data,
      userId: targetUserId,
      teamId,
      expiresAt,
    } = parsedInput;

    // Verify permissions
    if (teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });
      if (!teamMember) {
        throw new Error('Access denied to team');
      }
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data,
        userId: targetUserId,
        teamId,
        expiresAt,
      },
      include: {
        user: true,
        team: true,
      },
    });

    // Send real-time notification
    if (targetUserId) {
      sendNotificationToUser(targetUserId, notification);
    } else if (teamId) {
      sendNotificationToTeam(teamId, notification);
    }

    // Send email notification if enabled
    await sendEmailNotificationIfEnabled(notification);

    return { success: true, data: notification };
  });

// Mark notification as read
export const markNotificationAsRead = authAction
  .schema(markAsReadSchema)
  .action(async ({ parsedInput: { notificationId }, ctx: { userId } }) => {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Update unread count
    updateUnreadCount(userId);

    return { success: true, data: updatedNotification };
  });

// Mark all notifications as read
export const markAllNotificationsAsRead = authAction
  .schema(markAllAsReadSchema)
  .action(async ({ parsedInput: { teamId }, ctx: { userId } }) => {
    const where: any = {
      userId,
      isRead: false,
    };

    if (teamId) {
      where.teamId = teamId;
    }

    await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Update unread count
    updateUnreadCount(userId);

    return { success: true };
  });

// Get notifications
export const getNotifications = authAction
  .schema(getNotificationsSchema)
  .action(
    async ({
      parsedInput: { limit, offset, isRead, type },
      ctx: { userId },
    }) => {
      const where: any = {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            team: true,
          },
        }),
        prisma.notification.count({ where }),
      ]);

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      return {
        success: true,
        data: {
          notifications,
          total,
          unreadCount,
          hasMore: offset + limit < total,
        },
      };
    }
  );

// Get notification settings
export const getNotificationSettings = authAction
  .schema(z.object({ teamId: z.string().optional() }))
  .action(async ({ parsedInput: { teamId }, ctx: { userId } }) => {
    let settings = await prisma.notificationSettings.findFirst({
      where: {
        userId,
        teamId: teamId || null,
      },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          teamId: teamId || null,
        },
      });
    }

    return { success: true, data: settings };
  });

// Update notification settings
export const updateNotificationSettings = authAction
  .schema(updateNotificationSettingsSchema)
  .action(async ({ parsedInput: { teamId, settings }, ctx: { userId } }) => {
    const existingSettings = await prisma.notificationSettings.findFirst({
      where: {
        userId,
        teamId: teamId || null,
      },
    });

    let updatedSettings;
    if (existingSettings) {
      updatedSettings = await prisma.notificationSettings.update({
        where: { id: existingSettings.id },
        data: settings,
      });
    } else {
      updatedSettings = await prisma.notificationSettings.create({
        data: {
          userId,
          teamId: teamId || null,
          ...settings,
        },
      });
    }

    return { success: true, data: updatedSettings };
  });

// Delete notification
export const deleteNotification = authAction
  .schema(z.object({ notificationId: z.string() }))
  .action(async ({ parsedInput: { notificationId }, ctx: { userId } }) => {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    // Update unread count
    updateUnreadCount(userId);

    return { success: true };
  });

// Helper function to send email notifications
async function sendEmailNotificationIfEnabled(notification: any) {
  if (!notification.userId) return;

  const settings = await prisma.notificationSettings.findFirst({
    where: {
      userId: notification.userId,
      teamId: notification.teamId,
    },
  });

  if (!settings?.emailEnabled) return;

  // Check specific notification type settings
  const shouldSendEmail = checkEmailNotificationEnabled(
    notification.type,
    settings
  );

  if (shouldSendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
    });

    if (user?.email) {
      await sendNotificationEmail({
        to: user.email,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        user: user,
      });
    }
  }
}

function checkEmailNotificationEnabled(
  type: NotificationType,
  settings: any
): boolean {
  switch (type) {
    case 'QUIZ_COMPLETED':
      return settings.emailQuizCompleted;
    case 'TEAM_MEMBER_JOINED':
    case 'TEAM_MEMBER_LEFT':
      return settings.emailNewTeamMember;
    case 'SUBSCRIPTION_CREATED':
    case 'SUBSCRIPTION_UPDATED':
    case 'SUBSCRIPTION_CANCELED':
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT_FAILED':
      return settings.emailSubscription;
    case 'SYSTEM_MAINTENANCE':
    case 'SYSTEM_UPDATE':
      return settings.emailSystemUpdates;
    case 'MARKETING':
      return settings.emailMarketing;
    default:
      return true; // Default to enabled for other types
  }
}

// Utility functions for common notification scenarios
export async function notifyQuizCompleted(
  quizId: string,
  userId: string,
  score?: number
) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { team: true },
  });

  if (!quiz) return;

  const result = await createNotification({
    type: 'QUIZ_COMPLETED',
    title: `クイズ「${quiz.title}」が完了しました`,
    message: score !== undefined ? `スコア: ${score}点` : undefined,
    data: { quizId, score },
    userId,
    teamId: quiz.teamId,
  });

  return result;
}

export async function notifyTeamMemberJoined(
  teamId: string,
  newMemberId: string
) {
  const [team, newMember] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.user.findUnique({ where: { id: newMemberId } }),
  ]);

  if (!team || !newMember) return;

  // Notify team owners and admins
  const teamMembers = await prisma.teamMember.findMany({
    where: {
      teamId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  for (const member of teamMembers) {
    await createNotification({
      type: 'TEAM_MEMBER_JOINED',
      title: '新しいメンバーが参加しました',
      message: `${newMember.name || newMember.email}さんがチーム「${team.name}」に参加しました`,
      data: { teamId, newMemberId },
      userId: member.userId,
      teamId,
    });
  }
}
