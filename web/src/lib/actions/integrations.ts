/**
 * Integration Management Server Actions
 * Handles CRUD operations for external system integrations
 */

'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authAction } from './auth-action';
import {
  BaseIntegration,
  IntegrationType,
  IntegrationStatus,
  LMSIntegration,
  WebhookIntegration,
  SyncOperation,
} from '@/types/integrations';

// Schema definitions
const createIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'lms',
    'sso',
    'webhook',
    'ai',
    'notification',
    'storage',
    'analytics',
  ]),
  provider: z.string().min(1),
  teamId: z.string().cuid(),
  config: z.record(z.any()),
  credentials: z.record(z.string()).optional().default({}),
  features: z.array(z.string()).optional().default([]),
});

const updateIntegrationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

const syncIntegrationSchema = z.object({
  integrationId: z.string().cuid(),
  type: z.enum([
    'roster',
    'courses',
    'assignments',
    'grades',
    'users',
    'content',
  ]),
  direction: z
    .enum(['inbound', 'outbound', 'bidirectional'])
    .default('inbound'),
});

const testIntegrationSchema = z.object({
  id: z.string().cuid(),
});

// Get integrations for a team
export const getTeamIntegrations = authAction
  .schema(z.object({ teamId: z.string().cuid() }))
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify user is a team member
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId,
          teamId,
          status: 'ACTIVE',
        },
      });

      if (!teamMember) {
        throw new Error('チームメンバーではありません');
      }

      // Get all integrations for the team
      const integrations = await prisma.integration.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
        include: {
          team: {
            select: { id: true, name: true },
          },
          syncOperations: {
            orderBy: { startedAt: 'desc' },
            take: 5,
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
            take: 10,
            select: {
              id: true,
              type: true,
              status: true,
              message: true,
              timestamp: true,
            },
          },
        },
      });

      return { success: true, data: integrations };
    } catch (error) {
      console.error('Get team integrations error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '統合情報の取得に失敗しました',
      };
    }
  });

// Create new integration
export const createIntegration = authAction
  .schema(createIntegrationSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify user has permission to create integrations for the team
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId,
          teamId: data.teamId,
          status: 'ACTIVE',
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!teamMember) {
        throw new Error('統合を作成する権限がありません');
      }

      // Check integration limits for the team
      const integrationCount = await prisma.integration.count({
        where: { teamId: data.teamId },
      });

      // TODO: Check team's integration limits based on plan
      const maxIntegrations = 10; // This should come from team's subscription plan
      if (integrationCount >= maxIntegrations) {
        throw new Error('統合数の上限に達しています');
      }

      // Create integration
      const integration = await prisma.integration.create({
        data: {
          name: data.name,
          type: data.type,
          provider: data.provider,
          status: 'pending',
          teamId: data.teamId,
          config: data.config,
          credentials: data.credentials,
          features: data.features,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      });

      // Log integration creation
      await prisma.integrationEvent.create({
        data: {
          integrationId: integration.id,
          type: 'integration_created',
          status: 'success',
          message: `統合 "${integration.name}" が作成されました`,
          timestamp: new Date(),
        },
      });

      revalidatePath('/dashboard/integrations');
      return { success: true, data: integration };
    } catch (error) {
      console.error('Create integration error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '統合の作成に失敗しました',
      };
    }
  });

// Update integration
export const updateIntegration = authAction
  .schema(updateIntegrationSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify integration exists and user has permission
      const integration = await prisma.integration.findFirst({
        where: {
          id: data.id,
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      });

      if (!integration) {
        throw new Error('統合が見つからないか、編集権限がありません');
      }

      // Update integration
      const updatedIntegration = await prisma.integration.update({
        where: { id: data.id },
        data: {
          name: data.name,
          config: data.config,
          credentials: data.credentials,
          features: data.features,
          updatedAt: new Date(),
        },
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      });

      // Log integration update
      await prisma.integrationEvent.create({
        data: {
          integrationId: integration.id,
          type: 'integration_updated',
          status: 'success',
          message: `統合 "${updatedIntegration.name}" が更新されました`,
          timestamp: new Date(),
        },
      });

      revalidatePath('/dashboard/integrations');
      return { success: true, data: updatedIntegration };
    } catch (error) {
      console.error('Update integration error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '統合の更新に失敗しました',
      };
    }
  });

// Delete integration
export const deleteIntegration = authAction
  .schema(z.object({ id: z.string().cuid() }))
  .action(async ({ parsedInput: { id }, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify integration exists and user has permission
      const integration = await prisma.integration.findFirst({
        where: {
          id,
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      });

      if (!integration) {
        throw new Error('統合が見つからないか、削除権限がありません');
      }

      // Delete related records in transaction
      await prisma.$transaction([
        // Delete sync operations
        prisma.syncOperation.deleteMany({
          where: { integrationId: id },
        }),
        // Delete events
        prisma.integrationEvent.deleteMany({
          where: { integrationId: id },
        }),
        // Delete integration
        prisma.integration.delete({
          where: { id },
        }),
      ]);

      revalidatePath('/dashboard/integrations');
      return {
        success: true,
        message: `統合 "${integration.name}" が削除されました`,
      };
    } catch (error) {
      console.error('Delete integration error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '統合の削除に失敗しました',
      };
    }
  });

// Test integration connection
export const testIntegration = authAction
  .schema(testIntegrationSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify integration exists and user has permission
      const integration = await prisma.integration.findFirst({
        where: {
          id,
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
              },
            },
          },
        },
      });

      if (!integration) {
        throw new Error('統合が見つからないか、アクセス権限がありません');
      }

      // TODO: Initialize appropriate provider and test connection
      // This would be implemented based on the integration type and provider
      let testResult = false;
      let errorMessage = '';

      try {
        // Simulate test connection based on type
        switch (integration.type) {
          case 'lms':
            // Test LMS connection
            testResult = true; // Placeholder
            break;
          case 'webhook':
            // Test webhook endpoint
            testResult = true; // Placeholder
            break;
          default:
            throw new Error('サポートされていない統合タイプです');
        }

        // Update integration status based on test result
        const newStatus: IntegrationStatus = testResult ? 'active' : 'error';
        await prisma.integration.update({
          where: { id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        // Log test result
        await prisma.integrationEvent.create({
          data: {
            integrationId: id,
            type: testResult
              ? 'connection_test_success'
              : 'connection_test_failed',
            status: testResult ? 'success' : 'error',
            message: testResult
              ? '接続テストが成功しました'
              : `接続テストが失敗しました: ${errorMessage}`,
            timestamp: new Date(),
          },
        });
      } catch (testError) {
        errorMessage =
          testError instanceof Error ? testError.message : '不明なエラー';

        await prisma.integration.update({
          where: { id },
          data: {
            status: 'error',
            updatedAt: new Date(),
          },
        });

        await prisma.integrationEvent.create({
          data: {
            integrationId: id,
            type: 'connection_test_failed',
            status: 'error',
            message: `接続テストが失敗しました: ${errorMessage}`,
            timestamp: new Date(),
          },
        });
      }

      revalidatePath('/dashboard/integrations');
      return {
        success: true,
        data: {
          connected: testResult,
          error: errorMessage || undefined,
        },
      };
    } catch (error) {
      console.error('Test integration error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '接続テストに失敗しました',
      };
    }
  });

// Trigger sync operation
export const syncIntegration = authAction
  .schema(syncIntegrationSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify integration exists and user has permission
      const integration = await prisma.integration.findFirst({
        where: {
          id: data.integrationId,
          team: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      });

      if (!integration) {
        throw new Error('統合が見つからないか、同期権限がありません');
      }

      if (integration.status !== 'active') {
        throw new Error('統合がアクティブではありません');
      }

      // Create sync operation record
      const syncOperation = await prisma.syncOperation.create({
        data: {
          integrationId: data.integrationId,
          type: data.type,
          status: 'pending',
          direction: data.direction,
          recordsProcessed: 0,
          recordsSucceeded: 0,
          recordsFailed: 0,
          errors: [],
          startedAt: new Date(),
        },
      });

      // TODO: Start actual sync operation based on integration type
      // This would be handled by the appropriate provider class

      // For now, simulate sync completion
      setTimeout(async () => {
        await prisma.syncOperation.update({
          where: { id: syncOperation.id },
          data: {
            status: 'completed',
            recordsProcessed: 0,
            recordsSucceeded: 0,
            recordsFailed: 0,
            completedAt: new Date(),
          },
        });
      }, 1000);

      // Log sync start
      await prisma.integrationEvent.create({
        data: {
          integrationId: data.integrationId,
          type: 'sync_started',
          status: 'success',
          message: `${data.type}同期を開始しました`,
          data: {
            syncOperationId: syncOperation.id,
            syncType: data.type,
            direction: data.direction,
          },
          timestamp: new Date(),
        },
      });

      revalidatePath('/dashboard/integrations');
      return { success: true, data: syncOperation };
    } catch (error) {
      console.error('Sync integration error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '同期の開始に失敗しました',
      };
    }
  });

// Get integration analytics
export const getIntegrationAnalytics = authAction
  .schema(
    z.object({
      teamId: z.string().cuid(),
      timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
    })
  )
  .action(async ({ parsedInput: { teamId, timeRange }, ctx }) => {
    try {
      const { userId } = ctx;

      // Verify user is a team member
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId,
          teamId,
          status: 'ACTIVE',
        },
      });

      if (!teamMember) {
        throw new Error('チームメンバーではありません');
      }

      // Calculate date range
      const days = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get analytics data
      const [
        totalIntegrations,
        activeIntegrations,
        totalSyncOperations,
        successfulSyncs,
        failedSyncs,
        recentEvents,
      ] = await Promise.all([
        prisma.integration.count({
          where: { teamId },
        }),
        prisma.integration.count({
          where: { teamId, status: 'active' },
        }),
        prisma.syncOperation.count({
          where: {
            integration: { teamId },
            startedAt: { gte: since },
          },
        }),
        prisma.syncOperation.count({
          where: {
            integration: { teamId },
            startedAt: { gte: since },
            status: 'completed',
          },
        }),
        prisma.syncOperation.count({
          where: {
            integration: { teamId },
            startedAt: { gte: since },
            status: 'failed',
          },
        }),
        prisma.integrationEvent.findMany({
          where: {
            integration: { teamId },
            timestamp: { gte: since },
          },
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            integration: {
              select: { name: true, type: true, provider: true },
            },
          },
        }),
      ]);

      const analytics = {
        totalIntegrations,
        activeIntegrations,
        inactiveIntegrations: totalIntegrations - activeIntegrations,
        totalSyncOperations,
        successfulSyncs,
        failedSyncs,
        syncSuccessRate:
          totalSyncOperations > 0
            ? (successfulSyncs / totalSyncOperations) * 100
            : 0,
        recentEvents,
        timeRange,
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Get integration analytics error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '分析データの取得に失敗しました',
      };
    }
  });
