'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';

const action = createSafeActionClient();

const resend = new Resend(process.env.RESEND_API_KEY);

// Email notification schemas
const emailNotificationSchema = z.object({
  teamId: z.string(),
  type: z.enum(['usage_warning', 'usage_critical', 'usage_limit_reached']),
  resourceType: z.enum(['QUIZ', 'RESPONSE', 'MEMBER', 'STORAGE']),
  currentUsage: z.number(),
  limit: z.number(),
  percentage: z.number(),
});

const usageNotificationSettingsSchema = z.object({
  userId: z.string(),
  usageAlertsEnabled: z.boolean(),
  warningThreshold: z.number().min(0).max(100),
  criticalThreshold: z.number().min(0).max(100),
});

// Update user notification preferences for usage alerts
export const updateUsageNotificationSettings = action
  .schema(usageNotificationSettingsSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== parsedInput.userId) {
      redirect('/auth/signin');
    }

    const { userId, usageAlertsEnabled, warningThreshold, criticalThreshold } =
      parsedInput;

    // Update notification preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        // TODO: Add usageAlerts fields after migration
        // usageAlerts: usageAlertsEnabled,
        // usageWarningThreshold: warningThreshold,
        // usageCriticalThreshold: criticalThreshold,
      },
      update: {
        // TODO: Add usageAlerts fields after migration
        // usageAlerts: usageAlertsEnabled,
        // usageWarningThreshold: warningThreshold,
        // usageCriticalThreshold: criticalThreshold,
      },
    });

    return { success: true, preferences };
  });

// Get user notification preferences
export const getUserNotificationPreferences = action
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== parsedInput.userId) {
      redirect('/auth/signin');
    }

    const { userId } = parsedInput;

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return {
      success: true,
      preferences: preferences || {
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        usageAlerts: true,
        usageWarningThreshold: 75,
        usageCriticalThreshold: 90,
      },
    };
  });

// Send email notification
export const sendUsageEmailNotification = action
  .schema(emailNotificationSchema)
  .action(async ({ parsedInput }) => {
    const { teamId, type, resourceType, currentUsage, limit, percentage } =
      parsedInput;

    // Get team info and notification preferences for team admins
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              include: {
                notificationPreferences: true,
              },
            },
          },
          where: {
            role: {
              in: ['OWNER', 'ADMIN'],
            },
          },
        },
      },
    });

    if (!team) {
      return { success: false, message: 'Team not found' };
    }

    // Filter recipients who have usage alerts enabled
    const recipients = team.members
      .filter(
        member =>
          member.user.email &&
          member.user.notificationPreferences?.emailNotifications
        // TODO: Add usageAlerts check after migration
        // && member.user.notificationPreferences?.usageAlerts
      )
      .map(member => member.user.email)
      .filter(Boolean) as string[];

    if (recipients.length === 0) {
      return {
        success: false,
        message: 'No email recipients with usage alerts enabled',
      };
    }

    // Generate email content based on type
    const emailContent = generateEmailContent(
      type,
      resourceType,
      currentUsage,
      limit,
      percentage,
      team.name
    );

    try {
      // Send email using Resend
      await resend.emails.send({
        from: 'ExamForge <notifications@examforge.com>',
        to: recipients,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      // Log notification
      await prisma.notification.create({
        data: {
          teamId,
          type: type.toUpperCase() as any, // TODO: Fix enum type
          title: emailContent.subject,
          message: `Email sent to ${recipients.length} recipient(s)`,
          userId: team.members[0]?.userId || 'system', // Required field
          // TODO: Add additional fields after migration
          // resourceType,
          // resourceValue: currentUsage,
          // threshold: percentage,
        },
      });

      return {
        success: true,
        message: `Email notification sent to ${recipients.length} recipient(s)`,
      };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return { success: false, message: 'Failed to send email notification' };
    }
  });

function generateEmailContent(
  type: string,
  resourceType: string,
  currentUsage: number,
  limit: number,
  percentage: number,
  teamName: string
) {
  const resourceNames = {
    QUIZ: 'Quizzes',
    RESPONSE: 'Quiz Responses',
    MEMBER: 'Team Members',
    STORAGE: 'Storage',
  };

  const resourceName =
    resourceNames[resourceType as keyof typeof resourceNames] || resourceType;
  const formattedUsage =
    resourceType === 'STORAGE'
      ? `${Math.round(currentUsage / 1024 / 1024)}MB`
      : currentUsage.toLocaleString();
  const formattedLimit =
    resourceType === 'STORAGE' ? `${limit}MB` : limit.toLocaleString();

  let subject = '';
  let urgencyLevel = '';
  let actionRequired = '';

  switch (type) {
    case 'usage_warning':
      subject = `⚠️ Usage Warning: ${resourceName} at ${Math.round(percentage)}% - ${teamName}`;
      urgencyLevel = 'Warning';
      actionRequired =
        'Consider monitoring your usage more closely or upgrading your plan if needed.';
      break;
    case 'usage_critical':
      subject = `🚨 Critical Usage Alert: ${resourceName} at ${Math.round(percentage)}% - ${teamName}`;
      urgencyLevel = 'Critical';
      actionRequired =
        'Immediate attention required. Consider upgrading your plan or reducing usage.';
      break;
    case 'usage_limit_reached':
      subject = `🔴 Limit Reached: ${resourceName} at 100% - ${teamName}`;
      urgencyLevel = 'Limit Reached';
      actionRequired =
        'Your usage limit has been reached. Please upgrade your plan to continue using this feature.';
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .alert-box { border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .usage-stats { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .progress-bar { background-color: #e5e7eb; border-radius: 4px; overflow: hidden; height: 8px; margin-top: 8px; }
        .progress-fill { height: 100%; background-color: ${percentage >= 90 ? '#ef4444' : percentage >= 75 ? '#f59e0b' : '#10b981'}; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ExamForge Usage Alert</h1>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2 style="margin-top: 0; color: #dc2626;">${urgencyLevel}: ${resourceName} Usage</h2>
            <p><strong>Team:</strong> ${teamName}</p>
            <p><strong>Resource:</strong> ${resourceName}</p>
            <p><strong>Current Usage:</strong> ${formattedUsage} / ${formattedLimit}</p>
            <p><strong>Usage Percentage:</strong> ${Math.round(percentage)}%</p>
          </div>

          <div class="usage-stats">
            <h3>Usage Details</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>${resourceName} Usage</span>
              <span><strong>${Math.round(percentage)}%</strong></span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%;"></div>
            </div>
          </div>

          <p><strong>Action Required:</strong> ${actionRequired}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://examforge.com/dashboard/usage" class="button">View Usage Dashboard</a>
            <a href="https://examforge.com/dashboard/billing" class="button" style="background-color: #059669; margin-left: 10px;">Upgrade Plan</a>
          </div>

          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>

        <div class="footer">
          <p>This is an automated notification from ExamForge.</p>
          <p>You can manage your notification preferences in your team settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// Background job to check usage and send notifications
export async function checkAndSendUsageNotifications() {
  try {
    // Get all teams with notification settings enabled
    // TODO: Replace with proper notification settings after migration
    const teamsWithNotifications = await prisma.team.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        members: {
          include: {
            user: {
              include: {
                notificationPreferences: true,
              },
            },
          },
          where: {
            role: {
              in: ['OWNER', 'ADMIN'],
            },
          },
        },
      },
    });

    for (const team of teamsWithNotifications) {
      const plan = team.subscription?.plan;
      // TODO: Get from notification preferences after migration
      const warningThreshold = 75;
      const criticalThreshold = 90;

      if (!plan) continue;

      // Get current usage
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const currentUsage = await prisma.usageRecord.groupBy({
        by: ['resourceType'],
        where: {
          teamId: team.id,
          periodStart: {
            gte: thirtyDaysAgo,
          },
        },
        _sum: {
          count: true,
        },
      });

      // Check each resource type
      const resourceLimits = {
        QUIZ: plan.maxQuizzes,
        RESPONSE: plan.maxResponsesPerMonth,
        MEMBER: plan.maxMembers,
        STORAGE: plan.maxStorageMB ? plan.maxStorageMB * 1024 * 1024 : null, // Convert to bytes
      };

      for (const [resourceType, limit] of Object.entries(resourceLimits)) {
        if (!limit) continue;

        const usage = currentUsage.find(u => u.resourceType === resourceType);
        const currentValue = usage?._sum.count || 0;
        const percentage = (currentValue / limit) * 100;

        // Check if we should send a notification
        let notificationType: string | null = null;

        if (percentage >= 100) {
          notificationType = 'usage_limit_reached';
        } else if (percentage >= criticalThreshold) {
          notificationType = 'usage_critical';
        } else if (percentage >= warningThreshold) {
          notificationType = 'usage_warning';
        }

        if (notificationType) {
          // Check if we've already sent this type of notification recently
          const recentNotification = await prisma.notification.findFirst({
            where: {
              teamId: team.id,
              // TODO: Add resourceType after migration
              type: notificationType.toUpperCase() as any,
              createdAt: {
                gte: new Date(now.getTime() - 60 * 60 * 1000), // Within last hour
              },
            },
          });

          if (!recentNotification) {
            // Send email notification
            await sendUsageEmailNotification({
              teamId: team.id,
              type: notificationType as any,
              resourceType: resourceType as any,
              currentUsage: currentValue,
              limit,
              percentage,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in usage notification check:', error);
  }
}
