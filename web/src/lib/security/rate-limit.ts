import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface RateLimitOptions {
  identifier: string;
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date;
}> {
  const { identifier, maxAttempts, windowMs } = options;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Get IP address from headers
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  const key = `${identifier}:${ip}`;

  // Count recent attempts
  const recentAttempts = await prisma.rateLimitEntry.count({
    where: {
      key,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  if (recentAttempts >= maxAttempts) {
    const oldestAttempt = await prisma.rateLimitEntry.findFirst({
      where: {
        key,
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const resetAt = oldestAttempt
      ? new Date(oldestAttempt.createdAt.getTime() + windowMs)
      : new Date(now.getTime() + windowMs);

    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt,
    };
  }

  // Record this attempt
  await prisma.rateLimitEntry.create({
    data: {
      key,
    },
  });

  // Clean up old entries
  await prisma.rateLimitEntry.deleteMany({
    where: {
      createdAt: {
        lt: windowStart,
      },
    },
  });

  return {
    allowed: true,
    remainingAttempts: maxAttempts - recentAttempts - 1,
    resetAt: new Date(now.getTime() + windowMs),
  };
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  publicQuizSubmission: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  publicQuizAccess: {
    maxAttempts: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  passwordAttempt: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const;
