'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authAction } from './auth-action';

// Contact form submission schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum([
    'GENERAL',
    'TECHNICAL',
    'BILLING',
    'FEATURE_REQUEST',
    'BUG_REPORT',
    'ACCOUNT',
  ]),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

// Help article feedback schema
const helpFeedbackSchema = z.object({
  articleId: z.string().cuid(),
  helpful: z.boolean(),
});

// FAQ feedback schema
const faqFeedbackSchema = z.object({
  faqId: z.string().cuid(),
  helpful: z.boolean(),
});

// Search help content schema
const searchHelpSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  type: z.enum(['articles', 'faqs', 'all']).default('all'),
});

/**
 * Submit contact form
 */
export const submitContactForm = authAction
  .schema(contactFormSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Get user's team for context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMembers: {
            include: {
              team: true,
            },
          },
        },
      });

      const teamId = user?.teamMembers[0]?.teamId;

      // Create contact submission
      const submission = await prisma.contactSubmission.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          category: data.category,
          message: data.message,
          userId,
          teamId,
          status: 'PENDING',
          priority:
            data.category === 'BILLING' || data.category === 'BUG_REPORT'
              ? 'HIGH'
              : 'NORMAL',
        },
      });

      // TODO: Send email notification to support team
      // TODO: Send confirmation email to user

      return {
        success: true,
        data: { submissionId: submission.id },
        message: 'お問い合わせを受け付けました。24時間以内にご連絡いたします。',
      };
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        error:
          'お問い合わせの送信に失敗しました。しばらくしてから再度お試しください。',
      };
    }
  });

/**
 * Submit help article feedback
 */
export const submitHelpFeedback = authAction
  .schema(helpFeedbackSchema)
  .action(async ({ parsedInput: { articleId, helpful }, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if article exists
      const article = await prisma.helpArticle.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return {
          success: false,
          error: 'ヘルプ記事が見つかりません',
        };
      }

      // Update helpful count
      if (helpful) {
        await prisma.helpArticle.update({
          where: { id: articleId },
          data: {
            helpfulCount: {
              increment: 1,
            },
          },
        });
      }

      // Track user feedback (optional - could create a separate table)
      // For now, we just update the count

      return {
        success: true,
        message: helpful
          ? 'フィードバックありがとうございます'
          : 'フィードバックを記録しました',
      };
    } catch (error) {
      console.error('Help feedback error:', error);
      return {
        success: false,
        error: 'フィードバックの送信に失敗しました',
      };
    }
  });

/**
 * Submit FAQ feedback
 */
export const submitFaqFeedback = authAction
  .schema(faqFeedbackSchema)
  .action(async ({ parsedInput: { faqId, helpful }, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if FAQ exists
      const faq = await prisma.fAQ.findUnique({
        where: { id: faqId },
      });

      if (!faq) {
        return {
          success: false,
          error: 'FAQが見つかりません',
        };
      }

      // Update helpful count
      if (helpful) {
        await prisma.fAQ.update({
          where: { id: faqId },
          data: {
            helpfulCount: {
              increment: 1,
            },
          },
        });
      }

      return {
        success: true,
        message: helpful
          ? 'フィードバックありがとうございます'
          : 'フィードバックを記録しました',
      };
    } catch (error) {
      console.error('FAQ feedback error:', error);
      return {
        success: false,
        error: 'フィードバックの送信に失敗しました',
      };
    }
  });

/**
 * Record help article view
 */
export const recordHelpView = authAction
  .schema(z.object({ articleId: z.string().cuid() }))
  .action(async ({ parsedInput: { articleId }, ctx }) => {
    try {
      // Increment view count
      await prisma.helpArticle.update({
        where: { id: articleId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Help view tracking error:', error);
      return {
        success: false,
        error: 'ビュー記録に失敗しました',
      };
    }
  });

/**
 * Record FAQ view
 */
export const recordFaqView = authAction
  .schema(z.object({ faqId: z.string().cuid() }))
  .action(async ({ parsedInput: { faqId }, ctx }) => {
    try {
      // Increment view count
      await prisma.fAQ.update({
        where: { id: faqId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('FAQ view tracking error:', error);
      return {
        success: false,
        error: 'ビュー記録に失敗しました',
      };
    }
  });

/**
 * Search help content
 */
export const searchHelpContent = authAction
  .schema(searchHelpSchema)
  .action(async ({ parsedInput: { query, category, type }, ctx }) => {
    try {
      const results: {
        articles: any[];
        faqs: any[];
      } = {
        articles: [],
        faqs: [],
      };

      const searchQuery = `%${query.toLowerCase()}%`;
      const categoryFilter = category ? { categoryId: category } : {};

      if (type === 'articles' || type === 'all') {
        results.articles = await prisma.helpArticle.findMany({
          where: {
            isPublished: true,
            ...categoryFilter,
            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  hasSome: [query],
                },
              },
            ],
          },
          include: {
            category: true,
          },
          orderBy: [{ viewCount: 'desc' }, { order: 'asc' }],
          take: 20,
        });
      }

      if (type === 'faqs' || type === 'all') {
        results.faqs = await prisma.fAQ.findMany({
          where: {
            isPublished: true,
            ...categoryFilter,
            OR: [
              {
                question: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                answer: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  hasSome: [query],
                },
              },
            ],
          },
          include: {
            category: true,
          },
          orderBy: [{ viewCount: 'desc' }, { order: 'asc' }],
          take: 20,
        });
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Help search error:', error);
      return {
        success: false,
        error: '検索に失敗しました',
      };
    }
  });

/**
 * Get help analytics for admin
 */
export const getHelpAnalytics = authAction
  .schema(
    z.object({
      days: z.number().min(1).max(365).default(30),
    })
  )
  .action(async ({ parsedInput: { days }, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if user is admin (you might want to add proper admin check)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMembers: {
            where: {
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      });

      if (!user?.teamMembers.length) {
        return {
          success: false,
          error: '管理者権限が必要です',
        };
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      const [
        totalArticles,
        totalFaqs,
        recentContacts,
        popularArticles,
        popularFaqs,
      ] = await Promise.all([
        prisma.helpArticle.count({
          where: { isPublished: true },
        }),
        prisma.fAQ.count({
          where: { isPublished: true },
        }),
        prisma.contactSubmission.count({
          where: {
            createdAt: { gte: since },
          },
        }),
        prisma.helpArticle.findMany({
          where: { isPublished: true },
          orderBy: { viewCount: 'desc' },
          take: 10,
          include: {
            category: true,
          },
        }),
        prisma.fAQ.findMany({
          where: { isPublished: true },
          orderBy: { viewCount: 'desc' },
          take: 10,
          include: {
            category: true,
          },
        }),
      ]);

      return {
        success: true,
        data: {
          totalArticles,
          totalFaqs,
          recentContacts,
          popularArticles,
          popularFaqs,
        },
      };
    } catch (error) {
      console.error('Help analytics error:', error);
      return {
        success: false,
        error: '分析データの取得に失敗しました',
      };
    }
  });
