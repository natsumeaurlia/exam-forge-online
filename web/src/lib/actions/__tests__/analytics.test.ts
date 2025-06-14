import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuizAnalytics } from '../analytics';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('getQuizAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle null scores correctly when calculating average', async () => {
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    // Mock transaction
    const mockTransaction = vi.fn().mockImplementation(async callback => {
      const mockTx = {
        quiz: {
          findFirst: vi.fn().mockResolvedValue({ id: 'quiz-1' }),
        },
        quizResponse: {
          aggregate: vi.fn().mockResolvedValue({
            _count: 10,
            _avg: { score: 75.5 },
          }),
          count: vi
            .fn()
            .mockResolvedValueOnce(7) // passed count
            .mockResolvedValueOnce(8), // completed responses with non-null scores
          findMany: vi.fn().mockResolvedValue([
            {
              score: 80,
              startedAt: new Date('2024-01-01'),
              completedAt: new Date('2024-01-01'),
            },
            {
              score: 70,
              startedAt: new Date('2024-01-01'),
              completedAt: new Date('2024-01-01'),
            },
            {
              score: null,
              startedAt: new Date('2024-01-01'),
              completedAt: null,
            },
            {
              score: 76,
              startedAt: new Date('2024-01-01'),
              completedAt: new Date('2024-01-01'),
            },
          ]),
        },
      };
      return callback(mockTx);
    });

    vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

    const result = await getQuizAnalytics({ quizId: 'quiz-1' });

    expect(result?.data?.averageScore).toBe(75.5);
    expect(result?.data?.totalResponses).toBe(10);
  });

  it('should return 0 average score when no completed responses exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTransaction = vi.fn().mockImplementation(async callback => {
      const mockTx = {
        quiz: {
          findFirst: vi.fn().mockResolvedValue({ id: 'quiz-1' }),
        },
        quizResponse: {
          aggregate: vi.fn().mockResolvedValue({
            _count: 5,
            _avg: { score: null },
          }),
          count: vi
            .fn()
            .mockResolvedValueOnce(0) // passed count
            .mockResolvedValueOnce(0), // completed responses with non-null scores
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      return callback(mockTx);
    });

    vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

    const result = await getQuizAnalytics({ quizId: 'quiz-1' });

    expect(result?.data?.averageScore).toBe(0);
  });

  it('should use transaction for data consistency', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const mockTransaction = vi.fn().mockImplementation(async callback => {
      const mockTx = {
        quiz: {
          findFirst: vi.fn().mockResolvedValue({ id: 'quiz-1' }),
        },
        quizResponse: {
          aggregate: vi.fn().mockResolvedValue({
            _count: 1,
            _avg: { score: 100 },
          }),
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      return callback(mockTx);
    });

    vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

    await getQuizAnalytics({ quizId: 'quiz-1' });

    // Verify transaction was used
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Error('Database error')
    );

    const result = await getQuizAnalytics({ quizId: 'quiz-1' });

    // next-safe-action doesn't return success/error properties in the new version
    // Instead, it throws or returns data directly
    expect(result?.data).toBeUndefined();
  });
});
