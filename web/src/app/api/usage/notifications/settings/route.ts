import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  teamId: z.string().min(1),
  settings: z.object({
    enabled: z.boolean(),
    warningThreshold: z.number().min(50).max(95),
    criticalThreshold: z.number().min(80).max(100),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    resourceTypes: z.object({
      quiz: z.boolean(),
      response: z.boolean(),
      member: z.boolean(),
      storage: z.boolean(),
    }),
  }),
});

// PUT /api/usage/notifications/settings - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { teamId, settings } = validation.data;

    // Verify user has admin access to team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate threshold logic
    if (settings.warningThreshold >= settings.criticalThreshold) {
      return NextResponse.json(
        { error: 'Warning threshold must be less than critical threshold' },
        { status: 400 }
      );
    }

    // Update team metadata with notification settings
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        lmsConfiguration: {
          ...(((await prisma.team.findUnique({ where: { id: teamId } }))
            ?.lmsConfiguration as any) || {}),
          notificationSettings: {
            enabled: settings.enabled,
            warningThreshold: settings.warningThreshold,
            criticalThreshold: settings.criticalThreshold,
            emailNotifications: settings.emailNotifications,
            pushNotifications: settings.pushNotifications,
            resourceTypes: settings.resourceTypes,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    const updatedSettings =
      (updatedTeam.lmsConfiguration as any)?.notificationSettings || settings;

    // If notifications are disabled, mark usage notifications as read
    if (!settings.enabled) {
      await prisma.notification.updateMany({
        where: {
          teamId,
          type: { in: ['STORAGE_LIMIT_WARNING', 'PLAN_LIMIT_WARNING'] },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        enabled: updatedSettings.enabled,
        warningThreshold: updatedSettings.warningThreshold,
        criticalThreshold: updatedSettings.criticalThreshold,
        emailNotifications: updatedSettings.emailNotifications,
        pushNotifications: updatedSettings.pushNotifications,
        resourceTypes: updatedSettings.resourceTypes,
      },
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/usage/notifications/settings - Get notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing teamId parameter' },
        { status: 400 }
      );
    }

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
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
