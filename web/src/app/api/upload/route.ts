import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/minio';
import { getUserPlan } from '@/lib/actions/user';
import { getUserStorage, updateStorageUsage } from '@/lib/actions/storage';
import { prisma } from '@/lib/prisma';
import { QuestionMedia } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Pro plan
    const userPlanResult = await getUserPlan();

    if (!userPlanResult.success || !userPlanResult.data) {
      return NextResponse.json(
        { error: 'Failed to get user plan' },
        { status: 500 }
      );
    }

    const hasPaidPlan =
      userPlanResult.data.planType === 'PRO' ||
      userPlanResult.data.planType === 'PREMIUM';

    if (!hasPaidPlan) {
      return NextResponse.json(
        { error: 'Media upload requires Pro plan' },
        { status: 403 }
      );
    }

    // Check user storage
    const storageResult = await getUserStorage();
    if (!storageResult) {
      return NextResponse.json(
        { error: 'Failed to check storage' },
        { status: 500 }
      );
    }

    // Get the uploaded files
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const questionId = formData.get('questionId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
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
    const uploadedMedia: QuestionMedia[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.name}. Only images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, OGG, MOV), and audio files (MP3, WAV, OGG, M4A) are allowed.`,
          },
          { status: 400 }
        );
      }

      // Validate individual file size
      const maxImageSize = 10 * 1024 * 1024; // 10MB for images
      const maxVideoSize = 500 * 1024 * 1024; // 500MB for videos
      const maxAudioSize = 50 * 1024 * 1024; // 50MB for audio
      const isVideo = allowedVideoTypes.includes(file.type);
      const isAudio = allowedAudioTypes.includes(file.type);
      const maxSize = isVideo
        ? maxVideoSize
        : isAudio
          ? maxAudioSize
          : maxImageSize;

      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `File size exceeds limit for ${file.name} (max ${isVideo ? '500MB' : isAudio ? '50MB' : '10MB'})`,
          },
          { status: 400 }
        );
      }

      totalSize += file.size;
    }

    // Check if total size would exceed user's storage limit
    if (storageResult.storageUsed + totalSize > storageResult.storageLimit) {
      return NextResponse.json(
        {
          error: `Storage limit exceeded. You have ${storageResult.storageLimit - storageResult.storageUsed} GB remaining.`,
        },
        { status: 400 }
      );
    }

    // Upload files and create database records
    try {
      for (const file of files) {
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to MinIO
        const url = await uploadFile(buffer, file.name, file.type);

        // Determine media type
        const mediaType = allowedVideoTypes.includes(file.type)
          ? 'VIDEO'
          : allowedAudioTypes.includes(file.type)
            ? 'AUDIO'
            : 'IMAGE';

        // Create database record
        const media = await prisma.questionMedia.create({
          data: {
            questionId,
            url,
            type: mediaType,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            order: uploadedMedia.length,
          },
        });

        uploadedMedia.push(media);
      }

      // Update user storage usage
      await updateStorageUsage({ bytesChange: totalSize });

      return NextResponse.json({
        media: uploadedMedia,
        storageUsed: storageResult.storageUsed + totalSize,
        storageMax: storageResult.storageLimit,
      });
    } catch (error) {
      // If any upload fails, we should ideally clean up already uploaded files
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload files' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// Delete media endpoint
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Media not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.questionMedia.delete({
      where: { id: mediaId },
    });

    // Update storage usage (negative value to decrease)
    await updateStorageUsage({ bytesChange: -media.fileSize });

    // TODO: Delete from MinIO (implement deleteFile in minio.ts)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
