'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authAction } from './auth-action';

// Certificate template design schema
const templateDesignSchema = z.object({
  layout: z.enum(['portrait', 'landscape']),
  dimensions: z.object({
    width: z.number().min(100).max(1200),
    height: z.number().min(100).max(1200),
  }),
  background: z.object({
    type: z.enum(['color', 'gradient', 'image']),
    value: z.string(),
    opacity: z.number().min(0).max(1).default(1),
  }),
  elements: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['text', 'image', 'qr', 'signature', 'logo']),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      content: z.string().optional(),
      style: z
        .object({
          fontSize: z.number().optional(),
          fontFamily: z.string().optional(),
          fontWeight: z.string().optional(),
          color: z.string().optional(),
          textAlign: z.enum(['left', 'center', 'right']).optional(),
          backgroundColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderWidth: z.number().optional(),
          borderRadius: z.number().optional(),
        })
        .optional(),
      data: z.record(z.any()).optional(), // For dynamic content bindings
    })
  ),
  variables: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'date', 'score', 'quiz_title', 'user_name']),
        format: z.string().optional(),
      })
    )
    .optional(),
});

// Certificate template creation schema
const createCertificateTemplateSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100),
  description: z.string().optional(),
  design: templateDesignSchema,
  backgroundImage: z.string().optional(),
  logoImage: z.string().optional(),
  signatureImage: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

// Certificate template update schema
const updateCertificateTemplateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  design: templateDesignSchema.optional(),
  backgroundImage: z.string().optional(),
  logoImage: z.string().optional(),
  signatureImage: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Get certificate templates schema
const getCertificateTemplatesSchema = z.object({
  teamId: z.string().cuid(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Associate template with quiz schema
const associateTemplateWithQuizSchema = z.object({
  templateId: z.string().cuid(),
  quizId: z.string().cuid(),
  minScore: z.number().min(0).max(100).default(70),
  validityDays: z.number().min(1).max(3650).default(365),
  autoIssue: z.boolean().default(true),
});

// Create certificate template
export const createCertificateTemplate = authAction
  .schema(createCertificateTemplateSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Get user's active team
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: { team: true },
            take: 1,
          },
        },
      });

      if (!user?.teamMembers[0]) {
        throw new Error('アクティブなチームが見つかりません');
      }

      const teamId = user.teamMembers[0].teamId;

      // Create certificate template
      const template = await prisma.certificateTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          design: data.design,
          backgroundImage: data.backgroundImage,
          logoImage: data.logoImage,
          signatureImage: data.signatureImage,
          isPublic: data.isPublic,
          tags: data.tags || [],
          teamId,
          createdById: userId,
        },
        include: {
          team: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          _count: {
            select: { certificates: true },
          },
        },
      });

      revalidatePath('/dashboard/certificates/templates');
      return { success: true, data: template };
    } catch (error) {
      console.error('Certificate template creation error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Update certificate template
export const updateCertificateTemplate = authAction
  .schema(updateCertificateTemplateSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if user has permission to update this template
      const existingTemplate = await prisma.certificateTemplate.findFirst({
        where: {
          id: data.id,
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

      if (!existingTemplate) {
        throw new Error('テンプレートが見つからないか、編集権限がありません');
      }

      // Update template
      const { id, ...updateData } = data;
      const template = await prisma.certificateTemplate.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          team: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          _count: {
            select: { certificates: true },
          },
        },
      });

      revalidatePath('/dashboard/certificates/templates');
      revalidatePath(`/dashboard/certificates/templates/${id}`);
      return { success: true, data: template };
    } catch (error) {
      console.error('Certificate template update error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Delete certificate template
export const deleteCertificateTemplate = authAction
  .schema(z.object({ id: z.string().cuid() }))
  .action(async ({ parsedInput: { id }, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if user has permission to delete this template
      const template = await prisma.certificateTemplate.findFirst({
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
        include: {
          _count: {
            select: { certificates: true },
          },
        },
      });

      if (!template) {
        throw new Error('テンプレートが見つからないか、削除権限がありません');
      }

      if (template._count.certificates > 0) {
        throw new Error('証明書が発行済みのテンプレートは削除できません');
      }

      // Delete template
      await prisma.certificateTemplate.delete({
        where: { id },
      });

      revalidatePath('/dashboard/certificates/templates');
      return { success: true, data: { id } };
    } catch (error) {
      console.error('Certificate template deletion error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Get certificate templates
export const getCertificateTemplates = authAction
  .schema(getCertificateTemplatesSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Build where clause
      const where: any = {
        OR: [
          // User's team templates
          {
            teamId: data.teamId,
            team: {
              members: {
                some: {
                  userId,
                  status: 'ACTIVE',
                },
              },
            },
          },
          // Public templates
          { isPublic: true },
        ],
      };

      // Add search filter
      if (data.search) {
        where.AND = [
          {
            OR: [
              { name: { contains: data.search, mode: 'insensitive' } },
              { description: { contains: data.search, mode: 'insensitive' } },
            ],
          },
        ];
      }

      // Add tags filter
      if (data.tags && data.tags.length > 0) {
        where.AND = where.AND || [];
        where.AND.push({
          tags: {
            hasSome: data.tags,
          },
        });
      }

      // Add public filter
      if (data.isPublic !== undefined) {
        where.isPublic = data.isPublic;
      }

      // Get templates with count
      const [templates, total] = await Promise.all([
        prisma.certificateTemplate.findMany({
          where,
          include: {
            team: {
              select: { name: true },
            },
            createdBy: {
              select: { name: true, email: true },
            },
            _count: {
              select: { certificates: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: data.offset,
          take: data.limit,
        }),
        prisma.certificateTemplate.count({ where }),
      ]);

      return {
        success: true,
        data: {
          templates,
          pagination: {
            total,
            limit: data.limit,
            offset: data.offset,
            pages: Math.ceil(total / data.limit),
          },
        },
      };
    } catch (error) {
      console.error('Get certificate templates error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Associate template with quiz
export const associateTemplateWithQuiz = authAction
  .schema(associateTemplateWithQuizSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    try {
      const { userId } = ctx;

      // Check if user has permission to modify both template and quiz
      const [template, quiz] = await Promise.all([
        prisma.certificateTemplate.findFirst({
          where: {
            id: data.templateId,
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
        }),
        prisma.quiz.findFirst({
          where: {
            id: data.quizId,
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
        }),
      ]);

      if (!template) {
        throw new Error(
          'テンプレートが見つからないか、アクセス権限がありません'
        );
      }

      if (!quiz) {
        throw new Error('クイズが見つからないか、アクセス権限がありません');
      }

      // Create or update association
      const association = await prisma.quizCertificateTemplate.upsert({
        where: {
          quizId_templateId: {
            quizId: data.quizId,
            templateId: data.templateId,
          },
        },
        update: {
          minScore: data.minScore,
          validityDays: data.validityDays,
          autoIssue: data.autoIssue,
        },
        create: {
          quizId: data.quizId,
          templateId: data.templateId,
          minScore: data.minScore,
          validityDays: data.validityDays,
          autoIssue: data.autoIssue,
        },
        include: {
          quiz: {
            select: { title: true },
          },
          template: {
            select: { name: true },
          },
        },
      });

      revalidatePath(`/dashboard/quizzes/${data.quizId}`);
      revalidatePath(`/dashboard/certificates/templates/${data.templateId}`);
      return { success: true, data: association };
    } catch (error) {
      console.error('Associate template with quiz error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Get template by ID
export const getCertificateTemplateById = authAction
  .schema(z.object({ id: z.string().cuid() }))
  .action(async ({ parsedInput: { id }, ctx }) => {
    try {
      const { userId } = ctx;

      const template = await prisma.certificateTemplate.findFirst({
        where: {
          id,
          OR: [
            // User's team templates
            {
              team: {
                members: {
                  some: {
                    userId,
                    status: 'ACTIVE',
                  },
                },
              },
            },
            // Public templates
            { isPublic: true },
          ],
        },
        include: {
          team: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          quizTemplates: {
            include: {
              quiz: {
                select: { id: true, title: true },
              },
            },
          },
          _count: {
            select: { certificates: true },
          },
        },
      });

      if (!template) {
        throw new Error('テンプレートが見つかりません');
      }

      return { success: true, data: template };
    } catch (error) {
      console.error('Get certificate template by ID error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });

// Duplicate certificate template
export const duplicateCertificateTemplate = authAction
  .schema(z.object({ id: z.string().cuid(), name: z.string().min(1).max(100) }))
  .action(async ({ parsedInput: { id, name }, ctx }) => {
    try {
      const { userId } = ctx;

      // Get original template
      const originalTemplate = await prisma.certificateTemplate.findFirst({
        where: {
          id,
          OR: [
            {
              team: {
                members: {
                  some: {
                    userId,
                    status: 'ACTIVE',
                  },
                },
              },
            },
            { isPublic: true },
          ],
        },
      });

      if (!originalTemplate) {
        throw new Error('テンプレートが見つかりません');
      }

      // Get user's active team
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: { team: true },
            take: 1,
          },
        },
      });

      if (!user?.teamMembers[0]) {
        throw new Error('アクティブなチームが見つかりません');
      }

      const teamId = user.teamMembers[0].teamId;

      // Create duplicate
      const duplicateTemplate = await prisma.certificateTemplate.create({
        data: {
          name,
          description: originalTemplate.description,
          design: originalTemplate.design,
          backgroundImage: originalTemplate.backgroundImage,
          logoImage: originalTemplate.logoImage,
          signatureImage: originalTemplate.signatureImage,
          isPublic: false, // Duplicates are private by default
          tags: originalTemplate.tags,
          teamId,
          createdById: userId,
        },
        include: {
          team: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          _count: {
            select: { certificates: true },
          },
        },
      });

      revalidatePath('/dashboard/certificates/templates');
      return { success: true, data: duplicateTemplate };
    } catch (error) {
      console.error('Duplicate certificate template error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      };
    }
  });
