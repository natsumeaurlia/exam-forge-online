'use server';

import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { QuestionType, QuestionDifficulty } from '@prisma/client';
import { BankQuestionWhereClause, BankQuestionOrderBy } from '@/types/database';
import { aiQuestionService, type GenerationParams } from '@/lib/services/ai';
import { FEATURES, canUseFeature, incrementUsage } from '@/lib/feature-flags';

const action = createSafeActionClient();

const createBankQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1),
  points: z.number().min(1).default(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.nativeEnum(QuestionDifficulty).default('MEDIUM'),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  aiGenerated: z.boolean().default(false),
  aiMetadata: z.any().optional(),
});

const getBankQuestionsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  difficulty: z.nativeEnum(QuestionDifficulty).optional(),
  type: z.nativeEnum(QuestionType).optional(),
  sortBy: z.enum(['newest', 'oldest', 'difficulty', 'type']).default('newest'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const updateBankQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1).optional(),
  points: z.number().min(1).optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.nativeEnum(QuestionDifficulty).optional(),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const createBankQuestion = action
  .schema(createBankQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      // Get user's team (assuming they have one)
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        include: { team: true },
      });

      if (!teamMember) {
        return { success: false, error: 'チームメンバーシップが必要です' };
      }

      const bankQuestion = await prisma.bankQuestion.create({
        data: {
          teamId: teamMember.teamId,
          createdById: session.user.id,
          type: parsedInput.type,
          text: parsedInput.text,
          points: parsedInput.points,
          hint: parsedInput.hint,
          explanation: parsedInput.explanation,
          difficulty: parsedInput.difficulty,
          aiGenerated: parsedInput.aiGenerated,
          aiMetadata: parsedInput.aiMetadata,
          options: parsedInput.options
            ? {
                create: parsedInput.options.map((option, index) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  order: index,
                })),
              }
            : undefined,
          categories: parsedInput.categoryIds
            ? {
                create: parsedInput.categoryIds.map(categoryId => ({
                  categoryId,
                })),
              }
            : undefined,
          tags: parsedInput.tagIds
            ? {
                create: parsedInput.tagIds.map(tagId => ({
                  tagId,
                })),
              }
            : undefined,
        },
        include: {
          options: true,
          categories: {
            include: { category: true },
          },
          tags: {
            include: { tag: true },
          },
          createdBy: {
            select: { name: true },
          },
        },
      });

      revalidatePath('/[lng]/dashboard/question-bank', 'page');
      return { success: true, question: bankQuestion };
    } catch (error) {
      console.error('Failed to create bank question:', error);
      return { success: false, error: '問題の作成に失敗しました' };
    }
  });

export const getBankQuestions = action
  .schema(getBankQuestionsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      // Get user's team
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
      });

      if (!teamMember) {
        return { success: false, error: 'チームメンバーシップが必要です' };
      }

      const { search, categoryId, difficulty, type, sortBy, page, limit } =
        parsedInput;
      const skip = (page - 1) * limit;

      const where: BankQuestionWhereClause = {
        teamId: teamMember.teamId,
      };

      if (search) {
        where.text = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (categoryId) {
        where.categories = {
          some: { categoryId: { in: [categoryId] } },
        };
      }

      if (difficulty) {
        where.difficulty = difficulty;
      }

      if (type) {
        where.type = type;
      }

      let orderBy: BankQuestionOrderBy;
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'difficulty':
          orderBy = { difficulty: 'asc' };
          break;
        case 'type':
          orderBy = { type: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const [questions, totalCount] = await Promise.all([
        prisma.bankQuestion.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
            categories: {
              include: { category: true },
            },
            tags: {
              include: { tag: true },
            },
            createdBy: {
              select: { name: true },
            },
          },
        }),
        prisma.bankQuestion.count({ where }),
      ]);

      return {
        success: true,
        questions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Failed to get bank questions:', error);
      return { success: false, error: '問題の取得に失敗しました' };
    }
  });

export const updateBankQuestion = action
  .schema(updateBankQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      const { id, options, categoryIds, tagIds, ...updateData } = parsedInput;

      // Verify ownership
      const existingQuestion = await prisma.bankQuestion.findFirst({
        where: {
          id,
          team: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      });

      if (!existingQuestion) {
        return {
          success: false,
          error: '問題が見つからないか、権限がありません',
        };
      }

      const bankQuestion = await prisma.bankQuestion.update({
        where: { id },
        data: {
          ...updateData,
          options: options
            ? {
                deleteMany: {},
                create: options.map((option, index) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  order: index,
                })),
              }
            : undefined,
          categories: categoryIds
            ? {
                deleteMany: {},
                create: categoryIds.map(categoryId => ({
                  categoryId,
                })),
              }
            : undefined,
          tags: tagIds
            ? {
                deleteMany: {},
                create: tagIds.map(tagId => ({
                  tagId,
                })),
              }
            : undefined,
        },
        include: {
          options: true,
          categories: {
            include: { category: true },
          },
          tags: {
            include: { tag: true },
          },
          createdBy: {
            select: { name: true },
          },
        },
      });

      revalidatePath('/[lng]/dashboard/question-bank', 'page');
      return { success: true, question: bankQuestion };
    } catch (error) {
      console.error('Failed to update bank question:', error);
      return { success: false, error: '問題の更新に失敗しました' };
    }
  });

export const deleteBankQuestion = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      // Verify ownership
      const existingQuestion = await prisma.bankQuestion.findFirst({
        where: {
          id,
          team: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      });

      if (!existingQuestion) {
        return {
          success: false,
          error: '問題が見つからないか、権限がありません',
        };
      }

      await prisma.bankQuestion.delete({
        where: { id },
      });

      revalidatePath('/[lng]/dashboard/question-bank', 'page');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete bank question:', error);
      return { success: false, error: '問題の削除に失敗しました' };
    }
  });

export const importQuestionToQuiz = action
  .schema(
    z.object({
      bankQuestionId: z.string(),
      quizId: z.string(),
    })
  )
  .action(async ({ parsedInput: { bankQuestionId, quizId } }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      // Verify access to both bank question and quiz
      const [bankQuestion, quiz] = await Promise.all([
        prisma.bankQuestion.findFirst({
          where: {
            id: bankQuestionId,
            team: {
              members: {
                some: { userId: session.user.id },
              },
            },
          },
          include: {
            options: true,
          },
        }),
        prisma.quiz.findFirst({
          where: {
            id: quizId,
            team: {
              members: {
                some: { userId: session.user.id },
              },
            },
          },
        }),
      ]);

      if (!bankQuestion || !quiz) {
        return {
          success: false,
          error: '問題またはクイズが見つからないか、権限がありません',
        };
      }

      // Get next question order
      const questionCount = await prisma.question.count({
        where: { quizId },
      });

      // Create question in quiz
      const question = await prisma.question.create({
        data: {
          quizId,
          type: bankQuestion.type,
          text: bankQuestion.text,
          points: bankQuestion.points,
          order: questionCount + 1,
          hint: bankQuestion.hint,
          explanation: bankQuestion.explanation,
          difficultyLevel: bankQuestion.difficulty,
          options: {
            create: bankQuestion.options.map(option => ({
              text: option.text,
              isCorrect: option.isCorrect,
              order: option.order,
            })),
          },
        },
        include: {
          options: true,
        },
      });

      // Link bank question to quiz question
      await prisma.quizBankQuestion.create({
        data: {
          quizId,
          bankQuestionId,
          questionId: question.id,
        },
      });

      revalidatePath(`/[lng]/dashboard/quizzes/${quizId}/edit`, 'page');
      return { success: true, question };
    } catch (error) {
      console.error('Failed to import question to quiz:', error);
      return { success: false, error: '問題のインポートに失敗しました' };
    }
  });

// Helper function for external use (without safe action wrapper)
export const getBankQuestionsForTeam = async (
  teamId: string,
  filters: Partial<BankQuestionWhereClause> = {}
) => {
  try {
    const where: BankQuestionWhereClause = {
      teamId,
      ...filters,
    };

    const questions = await prisma.bankQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    return { success: true, questions };
  } catch (error) {
    console.error('Failed to get bank questions for team:', error);
    return { success: false, error: '問題の取得に失敗しました' };
  }
};

// AI Question Generation Schema
const generateQuestionsWithAISchema = z.object({
  topic: z.string().min(1, 'トピックは必須です'),
  context: z.string().optional(),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(QuestionDifficulty),
  count: z
    .number()
    .min(1, '最低1問は必要です')
    .max(20, '最大20問まで生成可能です'),
  language: z.enum(['ja', 'en']).default('ja'),
  customInstructions: z.string().optional(),
});

export const generateQuestionsWithAI = action
  .schema(generateQuestionsWithAISchema)
  .action(async ({ parsedInput }) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' };
      }

      // Get user's team
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        include: { team: true },
      });

      if (!teamMember) {
        return { success: false, error: 'チームメンバーシップが必要です' };
      }

      const teamId = teamMember.teamId;

      // Check if team can use AI generation feature
      const canUse = await canUseFeature(teamId, FEATURES.AI_GENERATION);
      if (!canUse) {
        return {
          success: false,
          error: 'AI問題生成機能はProプランでご利用いただけます',
        };
      }

      // Prepare generation parameters
      const generationParams: GenerationParams = {
        topic: parsedInput.topic,
        context: parsedInput.context,
        questionType: parsedInput.questionType,
        difficulty: parsedInput.difficulty,
        count: parsedInput.count,
        language: parsedInput.language,
        customInstructions: parsedInput.customInstructions,
      };

      // Generate questions with AI
      const result =
        await aiQuestionService.generateQuestions(generationParams);

      if (!result.success || result.questions.length === 0) {
        return {
          success: false,
          error:
            'AI問題生成に失敗しました。しばらく待ってから再試行してください。',
        };
      }

      // Save generated questions to database
      const savedQuestions = [];

      for (const question of result.questions) {
        try {
          const bankQuestion = await prisma.bankQuestion.create({
            data: {
              teamId,
              createdById: session.user.id,
              type: question.type,
              text: question.text,
              points: question.points,
              hint: question.hint,
              explanation: question.explanation,
              difficulty: question.difficulty,
              aiGenerated: true,
              aiMetadata: {
                generatedAt: new Date().toISOString(),
                model: result.metadata.model,
                providerId: result.metadata.providerId,
                generationParams: {
                  topic: parsedInput.topic,
                  difficulty: parsedInput.difficulty,
                  questionType: parsedInput.questionType,
                  language: parsedInput.language,
                },
                tokensUsed: Math.ceil(
                  result.metadata.tokensUsed / result.questions.length
                ),
              },
              options: question.options
                ? {
                    create: question.options.map((option, index) => ({
                      text: option.text,
                      isCorrect: option.isCorrect,
                      order: index + 1,
                    })),
                  }
                : undefined,
            },
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
          });

          savedQuestions.push(bankQuestion);
        } catch (questionError) {
          console.error('Failed to save generated question:', questionError);
          // Continue with other questions rather than failing completely
        }
      }

      // Track feature usage
      try {
        await incrementUsage(
          teamId,
          FEATURES.AI_GENERATION,
          savedQuestions.length
        );
      } catch (usageError) {
        console.error('Failed to track AI generation usage:', usageError);
        // Don't fail the whole operation for tracking errors
      }

      revalidatePath('/[lng]/dashboard/question-bank', 'page');

      return {
        success: true,
        questions: savedQuestions,
        metadata: {
          generated: result.questions.length,
          saved: savedQuestions.length,
          tokensUsed: result.metadata.tokensUsed,
          generationTime: result.metadata.generationTime,
          model: result.metadata.model,
        },
      };
    } catch (error) {
      console.error('Failed to generate questions with AI:', error);
      return {
        success: false,
        error:
          'AI問題生成中にエラーが発生しました。しばらく待ってから再試行してください。',
      };
    }
  });
