'use server';

import { createSafeActionClient } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/utils/error';
import {
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
  getTemplatesSchema,
  createTemplateFromQuizSchema,
  createQuizFromTemplateSchema,
  getTemplateStatsSchema,
} from '@/types/template-schemas';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('INVALID_USER:認証が必要です');
  }

  return session.user.id;
}

// Helper function to get user's active team
async function getUserActiveTeam(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        where: {
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER'],
          },
        },
        include: {
          team: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!user?.teamMembers[0]?.team?.id) {
    throw new Error('INVALID_TEAM:有効なチームが見つかりません');
  }

  return user.teamMembers[0].team.id;
}

// Create template
export const createTemplate = action
  .schema(createTemplateSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      const template = await prisma.quizTemplate.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          isPublic: data.isPublic,
          thumbnail: data.thumbnail,
          questions: data.questions,
          settings: data.settings,
          teamId,
          createdById: userId,
        },
      });

      // Add tags if provided
      if (data.tagIds && data.tagIds.length > 0) {
        await prisma.templateTag.createMany({
          data: data.tagIds.map(tagId => ({
            templateId: template.id,
            tagId,
          })),
        });
      }

      revalidatePath('/dashboard/templates');

      return {
        success: true,
        template: {
          id: template.id,
          title: template.title,
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Update template
export const updateTemplate = action
  .schema(updateTemplateSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      // Verify template ownership
      const existingTemplate = await prisma.quizTemplate.findFirst({
        where: {
          id: data.id,
          teamId,
        },
      });

      if (!existingTemplate) {
        throw new Error('TEMPLATE_NOT_FOUND:テンプレートが見つかりません');
      }

      // Update template
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
      if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
      if (data.questions !== undefined) updateData.questions = data.questions;
      if (data.settings !== undefined) updateData.settings = data.settings;

      const template = await prisma.quizTemplate.update({
        where: { id: data.id },
        data: updateData,
      });

      // Update tags if provided
      if (data.tagIds) {
        // Remove existing tags
        await prisma.templateTag.deleteMany({
          where: { templateId: data.id },
        });

        // Add new tags
        if (data.tagIds.length > 0) {
          await prisma.templateTag.createMany({
            data: data.tagIds.map(tagId => ({
              templateId: data.id,
              tagId,
            })),
          });
        }
      }

      revalidatePath('/dashboard/templates');
      revalidatePath(`/dashboard/templates/${data.id}`);

      return {
        success: true,
        template: {
          id: template.id,
          title: template.title,
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Delete template
export const deleteTemplate = action
  .schema(deleteTemplateSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      // Verify template ownership
      const existingTemplate = await prisma.quizTemplate.findFirst({
        where: {
          id,
          teamId,
        },
      });

      if (!existingTemplate) {
        throw new Error('TEMPLATE_NOT_FOUND:テンプレートが見つかりません');
      }

      // Delete template (tags will be deleted by cascade)
      await prisma.quizTemplate.delete({
        where: { id },
      });

      revalidatePath('/dashboard/templates');

      return { success: true };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Get templates with filtering and pagination
export const getTemplates = action
  .schema(getTemplatesSchema)
  .action(async ({ parsedInput: filters }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      const {
        page,
        limit,
        search,
        category,
        isPublic,
        sortBy,
        sortOrder,
        tagIds,
      } = filters;

      // Build where clause
      const where: any = {
        OR: [
          { teamId }, // Team templates
          { isPublic: true }, // Public templates
        ],
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      if (tagIds && tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: { in: tagIds },
          },
        };
      }

      // Get total count
      const total = await prisma.quizTemplate.count({ where });

      // Get templates
      const templates = await prisma.quizTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              tags: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Create template from existing quiz
export const createTemplateFromQuiz = action
  .schema(createTemplateFromQuizSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      // Get quiz with questions
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: data.quizId,
          teamId,
        },
        include: {
          questions: {
            include: {
              options: true,
              media: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!quiz) {
        throw new Error('QUIZ_NOT_FOUND:クイズが見つかりません');
      }

      // Transform quiz data to template format
      const templateQuestions = quiz.questions.map(question => ({
        type: question.type,
        text: question.text,
        points: question.points,
        order: question.order,
        hint: question.hint,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
        gradingCriteria: question.gradingCriteria,
        isRequired: question.isRequired,
        difficultyLevel: question.difficultyLevel,
        options: question.options.map(option => ({
          text: option.text,
          order: option.order,
          isCorrect: option.isCorrect,
        })),
        media: question.media.map(media => ({
          url: media.url,
          type: media.type,
          fileName: media.fileName,
          fileSize: media.fileSize,
          mimeType: media.mimeType,
          order: media.order,
        })),
      }));

      const templateSettings = {
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
        maxAttempts: quiz.maxAttempts,
        sharingMode: quiz.sharingMode,
        password: quiz.password,
        difficultyLevel: quiz.difficultyLevel,
      };

      // Create template
      const template = await prisma.quizTemplate.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          isPublic: data.isPublic,
          questions: templateQuestions,
          settings: templateSettings,
          teamId,
          createdById: userId,
        },
      });

      // Add tags if provided
      if (data.tagIds && data.tagIds.length > 0) {
        await prisma.templateTag.createMany({
          data: data.tagIds.map(tagId => ({
            templateId: template.id,
            tagId,
          })),
        });
      }

      revalidatePath('/dashboard/templates');

      return {
        success: true,
        template: {
          id: template.id,
          title: template.title,
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Create quiz from template
export const createQuizFromTemplate = action
  .schema(createQuizFromTemplateSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      // Get template
      const template = await prisma.quizTemplate.findFirst({
        where: {
          id: data.templateId,
          OR: [{ teamId }, { isPublic: true }],
        },
      });

      if (!template) {
        throw new Error('TEMPLATE_NOT_FOUND:テンプレートが見つかりません');
      }

      // Create quiz from template
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          description: data.description,
          status: 'DRAFT',
          ...(template.settings as any),
          teamId,
          createdById: userId,
        },
      });

      // Create questions from template
      const templateQuestions = template.questions as any[];

      for (let index = 0; index < templateQuestions.length; index++) {
        const templateQuestion = templateQuestions[index];
        const question = await prisma.question.create({
          data: {
            type: templateQuestion.type,
            text: templateQuestion.text,
            points: templateQuestion.points,
            order: index + 1,
            hint: templateQuestion.hint,
            explanation: templateQuestion.explanation,
            correctAnswer: templateQuestion.correctAnswer,
            gradingCriteria: templateQuestion.gradingCriteria,
            isRequired: templateQuestion.isRequired,
            difficultyLevel: templateQuestion.difficultyLevel,
            quizId: quiz.id,
          },
        });

        // Create options if any
        if (templateQuestion.options && templateQuestion.options.length > 0) {
          await prisma.questionOption.createMany({
            data: templateQuestion.options.map((option: any) => ({
              text: option.text,
              order: option.order,
              isCorrect: option.isCorrect,
              questionId: question.id,
            })),
          });
        }

        // Note: Media files would need special handling for copying
        // For now, we'll skip media to keep the implementation simple
      }

      // Increment template usage count
      await prisma.quizTemplate.update({
        where: { id: data.templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      revalidatePath('/dashboard/quizzes');
      revalidatePath('/dashboard/templates');

      return {
        success: true,
        quiz: {
          id: quiz.id,
          title: quiz.title,
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });

// Get template statistics
export const getTemplateStats = action
  .schema(getTemplateStatsSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      const userId = await getAuthenticatedUser();
      const teamId = await getUserActiveTeam(userId);

      const template = await prisma.quizTemplate.findFirst({
        where: {
          id,
          OR: [{ teamId }, { isPublic: true }],
        },
      });

      if (!template) {
        throw new Error('TEMPLATE_NOT_FOUND:テンプレートが見つかりません');
      }

      // For now, return basic stats
      // In a real implementation, you might track template usage in a separate table
      return {
        success: true,
        stats: {
          id: template.id,
          usageCount: template.usageCount,
          createdCount: template.usageCount, // Simplified
          lastUsed: template.updatedAt,
        },
      };
    } catch (error) {
      return handleActionError(error);
    }
  });
