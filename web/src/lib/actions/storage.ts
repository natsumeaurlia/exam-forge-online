'use server';

import { createSafeActionClient } from 'next-safe-action';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authAction } from './auth';
import { getUserStorageData } from './helpers';

// Get user storage information
const getUserStorageSchema = z.object({});

export const getUserStorage = authAction
  .inputSchema(getUserStorageSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    try {
      return await getUserStorageData(userId);
    } catch (error) {
      console.error('Error getting user storage:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get storage info'
      );
    }
  });

// Update user storage usage
export const updateStorageUsage = authAction
  .inputSchema(
    z.object({
      bytesChange: z.number(), // Positive for addition, negative for deletion
    })
  )
  .action(async ({ parsedInput: data, ctx }) => {
    const { userId } = ctx;

    try {
      const storage = await prisma.userStorage.findUnique({
        where: { userId },
      });

      if (!storage) {
        throw new Error('Storage record not found');
      }

      const newUsedBytes = BigInt(storage.usedBytes) + BigInt(data.bytesChange);

      // Ensure we don't go below 0
      const finalUsedBytes = newUsedBytes < 0 ? BigInt(0) : newUsedBytes;

      // Check if user would exceed storage limit
      if (data.bytesChange > 0 && finalUsedBytes > storage.maxBytes) {
        throw new Error('Storage limit exceeded');
      }

      const updatedStorage = await prisma.userStorage.update({
        where: { userId },
        data: { usedBytes: finalUsedBytes },
      });

      return {
        usedBytes: Number(updatedStorage.usedBytes),
        maxBytes: Number(updatedStorage.maxBytes),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update storage'
      );
    }
  });

// Delete user file
const deleteUserFileSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
});

export const deleteUserFile = authAction
  .inputSchema(deleteUserFileSchema)
  .action(async ({ parsedInput: { fileId }, ctx }) => {
    const { userId } = ctx;

    try {
      // SECURITY: チームベースの削除権限検証
      const file = await prisma.questionMedia.findFirst({
        where: {
          id: fileId,
          question: {
            quiz: {
              OR: [
                { createdById: userId }, // 作成者
                {
                  team: {
                    members: {
                      some: {
                        userId: userId,
                        role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                      },
                    },
                  },
                }, // チームメンバー
              ],
            },
          },
        },
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      // Delete the file record
      await prisma.questionMedia.delete({
        where: { id: fileId },
      });

      // TODO: Also delete from MinIO storage

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  });

// Get user storage information with detailed calculations
// This replaces the /api/storage endpoint
const getUserStorageWithDetailsSchema = z.object({});

export const getUserStorageWithDetails = authAction
  .inputSchema(getUserStorageWithDetailsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    try {
      // Get user storage information
      const storageData = await getUserStorageData(userId);

      if (!storageData) {
        throw new Error('Failed to get storage info');
      }

      // Calculate additional properties
      const storageUsedGB = storageData.storageUsed / (1024 * 1024 * 1024);
      const storageLimitGB = storageData.storageLimit / (1024 * 1024 * 1024);
      const percentageUsed =
        (storageData.storageUsed / storageData.storageLimit) * 100;

      // Return storage info with the expected structure
      return {
        storageUsed: storageData.storageUsed,
        storageLimit: storageData.storageLimit,
        storageUsedGB: parseFloat(storageUsedGB.toFixed(2)),
        storageLimitGB: parseFloat(storageLimitGB.toFixed(2)),
        percentageUsed: parseFloat(percentageUsed.toFixed(2)),
        files: storageData.files,
      };
    } catch (error) {
      console.error('Storage API error:', error);
      throw new Error('Failed to get storage info');
    }
  });
