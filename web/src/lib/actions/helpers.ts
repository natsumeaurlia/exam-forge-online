import { prisma } from '@/lib/prisma';
import { FeatureType } from '@prisma/client';

/**
 * ユーザープラン情報を取得するヘルパー関数
 */
export async function getUserPlanData(userId: string) {
  // First, get the user's active team membership
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        where: {
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
          },
        },
        include: {
          team: {
            include: {
              subscription: {
                include: {
                  plan: {
                    include: {
                      features: {
                        include: {
                          feature: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get the first team's subscription (or the active team if we implement team switching)
  const activeTeamMember = user.teamMembers[0];
  const subscription = activeTeamMember?.team.subscription;

  // If no team or subscription, user is on FREE plan
  if (!activeTeamMember || !subscription) {
    const freePlan = await prisma.plan.findUnique({
      where: { type: 'FREE' },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
    });

    return {
      planType: 'FREE' as const,
      plan: freePlan,
      subscription: null,
      features: freePlan?.features.map(pf => pf.feature.type) || [],
    };
  }

  // Check if subscription is active
  const isActive =
    subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';

  // If subscription is not active, treat as FREE plan
  if (!isActive) {
    const freePlan = await prisma.plan.findUnique({
      where: { type: 'FREE' },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
    });

    return {
      planType: 'FREE' as const,
      plan: freePlan,
      subscription: subscription,
      features: freePlan?.features.map(pf => pf.feature.type) || [],
    };
  }

  return {
    planType: subscription.plan.type,
    plan: subscription.plan,
    subscription: subscription,
    features: subscription.plan.features.map(pf => pf.feature.type),
  };
}

/**
 * ユーザーストレージ情報を取得するヘルパー関数
 */
export async function getUserStorageData(userId: string) {
  // Get or create user storage record
  let storage = await prisma.userStorage.findUnique({
    where: { userId },
  });

  if (!storage) {
    storage = await prisma.userStorage.create({
      data: {
        userId,
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
          createdById: userId,
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
  };
}

/**
 * ユーザーストレージ使用量を更新するヘルパー関数
 */
export async function updateUserStorageUsage(
  userId: string,
  bytesChange: number
) {
  const storage = await prisma.userStorage.findUnique({
    where: { userId },
  });

  if (!storage) {
    throw new Error('Storage record not found');
  }

  const newUsedBytes = BigInt(storage.usedBytes) + BigInt(bytesChange);

  // Ensure we don't go below 0
  const finalUsedBytes = newUsedBytes < 0 ? BigInt(0) : newUsedBytes;

  // Check if user would exceed storage limit
  if (bytesChange > 0 && finalUsedBytes > storage.maxBytes) {
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
}
