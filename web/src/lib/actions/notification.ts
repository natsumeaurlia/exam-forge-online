'use server';

import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  userId: z.string(),
  teamId: z.string().optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  metadata: z.any().optional(),
});

const markAsReadSchema = z.object({
  notificationId: z.string(),
});

const markAllAsReadSchema = z.object({
  userId: z.string(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  quizCompletion: z.boolean().optional(),
  teamInvitation: z.boolean().optional(),
  quizShared: z.boolean().optional(),
  systemUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

const action = createSafeActionClient();

export const createNotification = action
  .schema(createNotificationSchema)
  .action(
    async ({
      parsedInput: {
        type,
        title,
        message,
        userId,
        teamId,
        entityId,
        entityType,
        metadata,
      },
    }) => {
      try {
        const notification = await prisma.notification.create({
          data: {
            type,
            title,
            message,
            userId,
            teamId,
            entityId,
            entityType,
            metadata,
          },
        });

        revalidatePath('/[lng]/dashboard/notifications', 'page');
        return { success: true, notification };
      } catch (error) {
        console.error('Failed to create notification:', error);
        return { success: false, error: '通知の作成に失敗しました' };
      }
    }
  );

export const markNotificationAsRead = action
  .schema(markAsReadSchema)
  .action(async ({ parsedInput: { notificationId } }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      revalidatePath('/[lng]/dashboard/notifications', 'page');
      return { success: true, notification };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error: '通知の既読処理に失敗しました' };
    }
  });

export const markAllNotificationsAsRead = action
  .schema(markAllAsReadSchema)
  .action(async ({ parsedInput: { userId } }) => {
    try {
      const session = await auth();
      if (!session?.user?.id || session.user.id !== userId) {
        return { success: false, error: '権限がありません' };
      }

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      revalidatePath('/[lng]/dashboard/notifications', 'page');
      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, error: '全通知の既読処理に失敗しました' };
    }
  });

export const getNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: '権限がありません' };
    }

    const skip = (page - 1) * limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          team: {
            select: { name: true },
          },
        },
      }),
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return { success: false, error: '通知の取得に失敗しました' };
  }
};

export const updateNotificationPreferences = action
  .schema(updatePreferencesSchema)
  .action(async ({ parsedInput: preferences }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      const updatedPreferences = await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...preferences,
        },
        update: preferences,
      });

      revalidatePath('/[lng]/dashboard/settings', 'page');
      return { success: true, preferences: updatedPreferences };
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return { success: false, error: '通知設定の更新に失敗しました' };
    }
  });

export const getNotificationPreferences = async (userId: string) => {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: '権限がありません' };
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return { success: true, preferences };
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return { success: false, error: '通知設定の取得に失敗しました' };
  }
};

export const deleteNotification = action
  .schema(z.object({ notificationId: z.string() }))
  .action(async ({ parsedInput: { notificationId } }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      });

      revalidatePath('/[lng]/dashboard/notifications', 'page');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return { success: false, error: '通知の削除に失敗しました' };
    }
  });

// Helper function to create system notifications
export const createSystemNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    teamId?: string;
    entityId?: string;
    entityType?: string;
    metadata?: any;
  }
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
        teamId: options?.teamId,
        entityId: options?.entityId,
        entityType: options?.entityType,
        metadata: options?.metadata,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Failed to create system notification:', error);
    return { success: false, error: 'システム通知の作成に失敗しました' };
  }
};

// Helper function to create team notifications (for all team members)
export const createTeamNotification = async (
  teamId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    entityId?: string;
    entityType?: string;
    metadata?: any;
    excludeUserId?: string; // Exclude specific user (e.g., the one who performed the action)
  }
) => {
  try {
    // Get all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        ...(options?.excludeUserId && {
          userId: { not: options.excludeUserId },
        }),
      },
      select: { userId: true },
    });

    // Create notifications for all team members
    const notifications = await Promise.all(
      teamMembers.map(member =>
        prisma.notification.create({
          data: {
            type,
            title,
            message,
            userId: member.userId,
            teamId,
            entityId: options?.entityId,
            entityType: options?.entityType,
            metadata: options?.metadata,
          },
        })
      )
    );

    return { success: true, notifications };
  } catch (error) {
    console.error('Failed to create team notifications:', error);
    return { success: false, error: 'チーム通知の作成に失敗しました' };
  }
};
