'use server';

import { createSafeActionClient } from 'next-safe-action';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '../prisma';

// Create safe action client
const action = createSafeActionClient();

// Get user storage information
export async function getUserStorage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      success: true,
      data: {
        usedBytes: 0,
        maxBytes: 0,
        usedGB: 0,
        maxGB: 0,
        storageUsed: 0,
        storageLimit: 0,
        files: [],
      },
      error: null,
    };
  }

  try {
    // Get or create user storage record
    let storage = await prisma.userStorage.findUnique({
      where: { userId: session.user.id },
    });

    if (!storage) {
      storage = await prisma.userStorage.create({
        data: {
          userId: session.user.id,
          usedBytes: BigInt(0),
          maxBytes: BigInt(10 * 1024 * 1024 * 1024), // 10GB
        },
      });
    }

    // Get user's files
    const files = await prisma.questionMedia.findMany({
      where: {
        question: {
          quiz: {
            createdById: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert BigInt to number for JSON serialization
    const usedBytes = Number(storage.usedBytes);
    const maxBytes = Number(storage.maxBytes);
    const usedGB = usedBytes / 1024 ** 3;
    const maxGB = maxBytes / 1024 ** 3;

    return {
      success: true,
      data: {
        usedBytes,
        maxBytes,
        usedGB,
        maxGB,
        storageUsed: usedBytes,
        storageLimit: maxBytes,
        files: files.map(file => ({
          id: file.id,
          url: file.url,
          contentType: file.type === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
          filename: file.url.split('/').pop() || 'unknown',
          size: 1024 * 1024, // Default size, you may want to store actual size
          createdAt: file.createdAt.toISOString(),
        })),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting user storage:', error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to get storage info',
    };
  }
}

// Update user storage usage
export const updateStorageUsage = action
  .schema(
    z.object({
      bytesChange: z.number(), // Positive for addition, negative for deletion
    })
  )
  .action(async ({ parsedInput: data }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    try {
      const storage = await prisma.userStorage.findUnique({
        where: { userId: session.user.id },
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
        where: { userId: session.user.id },
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
export async function deleteUserFile(fileId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Check if the file belongs to the user
    const file = await prisma.questionMedia.findFirst({
      where: {
        id: fileId,
        question: {
          quiz: {
            createdById: session.user.id,
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
}
