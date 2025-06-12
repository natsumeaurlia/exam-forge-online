'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlan } from '@/lib/actions/user';
import { getUserStorage, updateStorageUsage } from '@/lib/actions/storage';
import { prisma } from '@/lib/prisma';

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
export const validateMediaUpload = action
  .schema(validateUploadSchema)
  .action(async ({ parsedInput: { fileSize, fileType, questionId } }) => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // Check if user has Pro plan
    const userPlanResult = await getUserPlan();
    if (!userPlanResult.success || !userPlanResult.data) {
      throw new Error('ユーザープランの取得に失敗しました');
    }

    const hasPaidPlan =
      userPlanResult.data.planType === 'PRO' ||
      userPlanResult.data.planType === 'PREMIUM';

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
    const storageResult = await getUserStorage();
    if (!storageResult.success || !storageResult.data) {
      throw new Error('ストレージ情報の取得に失敗しました');
    }

    // Check if file size would exceed user's storage limit
    if (storageResult.data.usedBytes + fileSize > storageResult.data.maxBytes) {
      const maxGB = storageResult.data.maxBytes / (1024 * 1024 * 1024);
      const usedGB = storageResult.data.usedBytes / (1024 * 1024 * 1024);
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
          createdById: session.user.id,
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
      remainingStorage:
        storageResult.data.maxBytes - storageResult.data.usedBytes,
    };
  });

/**
 * メディア削除用のServerAction
 */
export const deleteMedia = action
  .schema(deleteMediaSchema)
  .action(async ({ parsedInput: { mediaId } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // Get media record and verify ownership
    const media = await prisma.questionMedia.findFirst({
      where: {
        id: mediaId,
        question: {
          quiz: {
            createdById: session.user.id,
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
    await updateStorageUsage({ bytesChange: -media.fileSize });

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

export const createMediaRecord = action
  .schema(createMediaRecordSchema)
  .action(async ({ parsedInput }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('認証が必要です');
    }

    // Verify question ownership
    const question = await prisma.question.findFirst({
      where: {
        id: parsedInput.questionId,
        quiz: {
          createdById: session.user.id,
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
    await updateStorageUsage({ bytesChange: parsedInput.fileSize });

    return {
      success: true,
      media,
    };
  });
