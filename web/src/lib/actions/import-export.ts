'use server';

import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parseCSV, ParsedQuestion } from '@/lib/utils/csv-import-export';
import { QuestionType, QuestionDifficulty } from '@prisma/client';

const action = createSafeActionClient();

const importQuestionsSchema = z.object({
  csvContent: z.string().min(1),
  createCategories: z.boolean().default(true),
  createTags: z.boolean().default(true),
});

const exportQuestionsSchema = z.object({
  questionIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  includeAll: z.boolean().default(false),
});

export const importQuestions = action(
  importQuestionsSchema,
  async ({ csvContent, createCategories, createTags }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('No active team found');
    }

    try {
      // Parse CSV content
      const parsedQuestions = parseCSV(csvContent);

      if (parsedQuestions.length === 0) {
        throw new Error('No valid questions found in CSV');
      }

      const results = {
        imported: 0,
        errors: [] as string[],
        categoriesCreated: 0,
        tagsCreated: 0,
      };

      // Process questions one by one
      for (let i = 0; i < parsedQuestions.length; i++) {
        try {
          await importSingleQuestion(
            parsedQuestions[i],
            teamMember.teamId,
            session.user.id,
            createCategories,
            createTags,
            results
          );
          results.imported++;
        } catch (error) {
          console.error(`Error importing question ${i + 1}:`, error);
          results.errors.push(
            `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      revalidatePath('/dashboard/question-bank');
      return { success: true, results };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Import failed');
    }
  }
);

async function importSingleQuestion(
  question: ParsedQuestion,
  teamId: string,
  userId: string,
  createCategories: boolean,
  createTags: boolean,
  results: { categoriesCreated: number; tagsCreated: number }
) {
  // Create or find categories
  const categoryIds: string[] = [];
  if (question.categoryNames && createCategories) {
    for (const categoryName of question.categoryNames) {
      let category = await prisma.category.findFirst({
        where: {
          name: categoryName,
          teamId,
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            teamId,
          },
        });
        results.categoriesCreated++;
      }

      categoryIds.push(category.id);
    }
  }

  // Create bank question
  const bankQuestion = await prisma.bankQuestion.create({
    data: {
      teamId,
      createdById: userId,
      type: question.type,
      text: question.text,
      points: question.points,
      difficulty: question.difficulty,
      hint: question.hint,
      explanation: question.explanation,
    },
  });

  // Create options if they exist
  if (question.options) {
    await prisma.bankQuestionOption.createMany({
      data: question.options.map((option, index) => ({
        bankQuestionId: bankQuestion.id,
        text: option.text,
        isCorrect: option.isCorrect,
        order: index,
      })),
    });
  }

  // Link to categories
  if (categoryIds.length > 0) {
    await prisma.bankQuestionCategory.createMany({
      data: categoryIds.map(categoryId => ({
        bankQuestionId: bankQuestion.id,
        categoryId,
      })),
    });
  }

  // Create tags if needed
  if (question.tagNames && createTags) {
    for (const tagName of question.tagNames) {
      await prisma.bankQuestionTag.create({
        data: {
          bankQuestionId: bankQuestion.id,
          name: tagName,
        },
      });
      results.tagsCreated++;
    }
  }

  return bankQuestion;
}

export const exportQuestions = action(
  exportQuestionsSchema,
  async ({ questionIds, categoryId, includeAll }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('No active team found');
    }

    try {
      // Build where clause based on parameters
      const whereClause: any = {
        teamId: teamMember.teamId,
      };

      if (!includeAll) {
        if (questionIds && questionIds.length > 0) {
          whereClause.id = { in: questionIds };
        } else if (categoryId) {
          whereClause.categories = {
            some: {
              categoryId,
            },
          };
        } else {
          throw new Error('Must specify questions to export');
        }
      }

      // Fetch questions with all related data
      const questions = await prisma.bankQuestion.findMany({
        where: whereClause,
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (questions.length === 0) {
        throw new Error('No questions found to export');
      }

      return { questions };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Export failed');
    }
  }
);

export const getImportTemplate = action(z.object({}), async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Return CSV template structure
  const template = {
    headers: [
      'type',
      'text',
      'points',
      'difficulty',
      'hint',
      'explanation',
      'option1',
      'option1_correct',
      'option2',
      'option2_correct',
      'option3',
      'option3_correct',
      'option4',
      'option4_correct',
      'categories',
      'tags',
    ],
    sampleData: [
      {
        type: 'SINGLE_CHOICE',
        text: 'What is the capital of Japan?',
        points: '1',
        difficulty: 'EASY',
        hint: 'Think about the largest city in Japan',
        explanation: 'Tokyo is the capital and largest city of Japan',
        option1: 'Tokyo',
        option1_correct: 'true',
        option2: 'Osaka',
        option2_correct: 'false',
        option3: 'Kyoto',
        option3_correct: 'false',
        option4: 'Yokohama',
        option4_correct: 'false',
        categories: 'Geography;Asia',
        tags: 'Japan;Capitals',
      },
    ],
    validTypes: [
      'SINGLE_CHOICE',
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'SHORT_ANSWER',
    ],
    validDifficulties: ['EASY', 'MEDIUM', 'HARD'],
  };

  return { template };
});
