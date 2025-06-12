'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getUserPlanData,
  getUserStorageData,
  updateUserStorageUsage,
} from '@/lib/actions/helpers';
import { prisma } from '@/lib/prisma';
import { authAction } from './auth-action';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// メディア削除用のスキーマ
const deleteMediaSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
});

// メディア検証用のスキーマ
const validateUploadSchema = z.object({
  fileSize: z.number().min(1, 'File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  questionId: z.string().min(1, 'Question ID is required'),
});

/**
 * アップロード前の検証を行うServerAction
 * ファイルサイズ、プラン制限、ストレージ容量をチェック
 */
export const validateMediaUpload = authAction
  .inputSchema(validateUploadSchema)
  .action(async ({ parsedInput: { fileSize, fileType, questionId }, ctx }) => {
    const { userId } = ctx;

    // Check if user has Pro plan
    const userPlanData = await getUserPlanData(userId);
    if (!userPlanData) {
      throw new Error('ユーザープランの取得に失敗しました');
    }

    const hasPaidPlan =
      userPlanData.planType === 'PRO' || userPlanData.planType === 'PREMIUM';

    if (!hasPaidPlan) {
      throw new Error('メディアアップロードにはProプランが必要です');
    }

    // Validate file type
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ];
    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/x-m4a',
    ];
    const allowedTypes = [
      ...allowedImageTypes,
      ...allowedVideoTypes,
      ...allowedAudioTypes,
    ];

    if (!allowedTypes.includes(fileType)) {
      throw new Error(`サポートされていないファイル形式です: ${fileType}`);
    }

    // Validate individual file size
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 500 * 1024 * 1024; // 500MB for videos
    const maxAudioSize = 50 * 1024 * 1024; // 50MB for audio
    const isVideo = allowedVideoTypes.includes(fileType);
    const isAudio = allowedAudioTypes.includes(fileType);
    const maxSize = isVideo
      ? maxVideoSize
      : isAudio
        ? maxAudioSize
        : maxImageSize;

    if (fileSize > maxSize) {
      const maxSizeLabel = isVideo ? '500MB' : isAudio ? '50MB' : '10MB';
      throw new Error(
        `ファイルサイズが制限を超えています (最大 ${maxSizeLabel})`
      );
    }

    // Check user storage
    const storageData = await getUserStorageData(userId);
    if (!storageData) {
      throw new Error('ストレージ情報の取得に失敗しました');
    }

    // Check if file size would exceed user's storage limit
    if (storageData.usedBytes + fileSize > storageData.maxBytes) {
      const maxGB = storageData.maxBytes / (1024 * 1024 * 1024);
      const usedGB = storageData.usedBytes / (1024 * 1024 * 1024);
      const remainingGB = maxGB - usedGB;
      throw new Error(
        `ストレージ容量が不足しています。残り容量: ${remainingGB.toFixed(2)} GB`
      );
    }

    // Verify question ownership
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quiz: {
          createdById: userId,
        },
      },
      select: { id: true },
    });

    if (!question) {
      throw new Error('質問が見つからないか、アクセス権限がありません');
    }

    return {
      success: true,
      mediaType: isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'IMAGE',
      remainingStorage: storageData.maxBytes - storageData.usedBytes,
    };
  });

/**
 * メディア削除用のServerAction
 */
export const deleteMedia = authAction
  .inputSchema(deleteMediaSchema)
  .action(async ({ parsedInput: { mediaId }, ctx }) => {
    const { userId } = ctx;

    // Get media record and verify ownership
    const media = await prisma.questionMedia.findFirst({
      where: {
        id: mediaId,
        question: {
          quiz: {
            createdById: userId,
          },
        },
      },
    });

    if (!media) {
      throw new Error('メディアが見つからないか、アクセス権限がありません');
    }

    // Delete from database
    await prisma.questionMedia.delete({
      where: { id: mediaId },
    });

    // Update storage usage (negative value to decrease)
    await updateUserStorageUsage(userId, -media.fileSize);

    // TODO: Delete from MinIO (implement deleteFile in minio.ts)

    return {
      success: true,
      freedBytes: media.fileSize,
    };
  });

/**
 * メディア作成用のServerAction（API Routeでアップロード後に呼び出し）
 */
const createMediaRecordSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  url: z.string().url('Valid URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1, 'File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO']),
  order: z.number().min(0, 'Order must be non-negative'),
});

export const createMediaRecord = authAction
  .inputSchema(createMediaRecordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Verify question ownership
    const question = await prisma.question.findFirst({
      where: {
        id: parsedInput.questionId,
        quiz: {
          createdById: userId,
        },
      },
      select: { id: true },
    });

    if (!question) {
      throw new Error('質問が見つからないか、アクセス権限がありません');
    }

    // Create database record
    const media = await prisma.questionMedia.create({
      data: {
        questionId: parsedInput.questionId,
        url: parsedInput.url,
        type: parsedInput.mediaType,
        fileName: parsedInput.fileName,
        fileSize: parsedInput.fileSize,
        mimeType: parsedInput.mimeType,
        order: parsedInput.order,
      },
    });

    // Update user storage usage
    await updateUserStorageUsage(userId, parsedInput.fileSize);

    return {
      success: true,
      media,
    };
  });

/**
 * Upload media files - replaces /api/upload POST endpoint
 * Note: This action handles the database operations and storage tracking.
 * The actual file upload to MinIO should be handled separately.
 */
export const uploadMedia = authAction
  .inputSchema(
    z.object({
      files: z.array(
        z.object({
          buffer: z.instanceof(Buffer),
          fileName: z.string(),
          mimeType: z.string(),
          size: z.number(),
        })
      ),
      questionId: z.string().min(1, 'Question ID is required'),
    })
  )
  .action(async ({ parsedInput: { files, questionId }, ctx }) => {
    const { userId } = ctx;

    // Check if user has Pro plan
    const userPlanData = await getUserPlanData(userId);
    if (!userPlanData) {
      throw new Error('Failed to get user plan');
    }

    const hasPaidPlan =
      userPlanData.planType === 'PRO' || userPlanData.planType === 'PREMIUM';

    if (!hasPaidPlan) {
      throw new Error('Media upload requires Pro plan');
    }

    // Check user storage
    const storageData = await getUserStorageData(userId);
    if (!storageData) {
      throw new Error('Failed to check storage');
    }

    // SECURITY FIX: Verify user has access to the question/quiz
    const questionAccess = await prisma.question.findFirst({
      where: {
        id: questionId,
        quiz: {
          team: {
            members: {
              some: {
                userId: userId,
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
      },
    });

    if (!questionAccess) {
      throw new Error('Unauthorized: Access denied to this question');
    }

    // Validate file types and calculate total size
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ];
    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
      'audio/x-m4a',
    ];
    const allowedTypes = [
      ...allowedImageTypes,
      ...allowedVideoTypes,
      ...allowedAudioTypes,
    ];

    let totalSize = 0;
    const uploadedMedia = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.mimeType)) {
        throw new Error(
          `Invalid file type: ${file.fileName}. Only images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, OGG, MOV), and audio files (MP3, WAV, OGG, M4A) are allowed.`
        );
      }

      // Validate individual file size
      const maxImageSize = 10 * 1024 * 1024; // 10MB for images
      const maxVideoSize = 500 * 1024 * 1024; // 500MB for videos
      const maxAudioSize = 50 * 1024 * 1024; // 50MB for audio
      const isVideo = allowedVideoTypes.includes(file.mimeType);
      const isAudio = allowedAudioTypes.includes(file.mimeType);
      const maxSize = isVideo
        ? maxVideoSize
        : isAudio
          ? maxAudioSize
          : maxImageSize;

      if (file.size > maxSize) {
        throw new Error(
          `File size exceeds limit for ${file.fileName} (max ${isVideo ? '500MB' : isAudio ? '50MB' : '10MB'})`
        );
      }

      totalSize += file.size;
    }

    // Check if total size would exceed user's storage limit
    if (storageData.storageUsed + totalSize > storageData.storageLimit) {
      throw new Error(
        `Storage limit exceeded. You have ${storageData.storageLimit - storageData.storageUsed} bytes remaining.`
      );
    }

    // Upload files and create database records
    try {
      const { uploadFile } = await import('@/lib/minio');

      for (const file of files) {
        // Upload to MinIO
        const url = await uploadFile(file.buffer, file.fileName, file.mimeType);

        // Determine media type
        const mediaType = allowedVideoTypes.includes(file.mimeType)
          ? 'VIDEO'
          : allowedAudioTypes.includes(file.mimeType)
            ? 'AUDIO'
            : 'IMAGE';

        // Create database record
        const media: any = await prisma.questionMedia.create({
          data: {
            questionId,
            url,
            type: mediaType,
            fileName: file.fileName,
            fileSize: file.size,
            mimeType: file.mimeType,
            order: uploadedMedia.length,
          },
        });

        uploadedMedia.push(media);
      }

      // Update user storage usage
      await updateUserStorageUsage(userId, totalSize);

      return {
        media: uploadedMedia,
        storageUsed: storageData.storageUsed + totalSize,
        storageMax: storageData.storageLimit,
      };
    } catch (error) {
      // If any upload fails, we should ideally clean up already uploaded files
      console.error('Upload error:', error);
      throw new Error('Failed to upload files');
    }
  });

/**
 * Delete media - replaces /api/upload DELETE endpoint
 */
export const deleteMediaById = authAction
  .inputSchema(
    z.object({
      mediaId: z.string().min(1, 'Media ID is required'),
    })
  )
  .action(async ({ parsedInput: { mediaId }, ctx }) => {
    const { userId } = ctx;

    // SECURITY: チームベース削除権限検証
    const media = await prisma.questionMedia.findFirst({
      where: {
        id: mediaId,
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

    if (!media) {
      throw new Error('Media not found or unauthorized');
    }

    // Delete from database
    await prisma.questionMedia.delete({
      where: { id: mediaId },
    });

    // Update storage usage (negative value to decrease)
    await updateUserStorageUsage(userId, -media.fileSize);

    // TODO: Delete from MinIO (implement deleteFile in minio.ts)

    return { success: true };
  });
