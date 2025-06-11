'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const submitResponseSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.record(z.string()),
      ]),
    })
  ),
  participantName: z.string().optional(),
  participantEmail: z.string().email().optional(),
  startedAt: z.date(),
  completedAt: z.date(),
});

export async function submitQuizResponse(
  data: z.infer<typeof submitResponseSchema>
) {
  try {
    const session = await getServerSession(authOptions);

    const {
      quizId,
      answers,
      participantName,
      participantEmail,
      startedAt,
      completedAt,
    } = submitResponseSchema.parse(data);

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Check if quiz is published
    if (quiz.status !== 'PUBLISHED') {
      return { success: false, error: 'Quiz is not published' };
    }

    // For non-public quizzes, require authentication
    if (!quiz.sharingMode || quiz.sharingMode !== 'URL') {
      if (!session?.user?.id) {
        return { success: false, error: 'Authentication required' };
      }
    }

    // Calculate score
    let correctAnswers = 0;
    const responseAnswers = [];

    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;

      // Check if answer is correct based on question type
      switch (question.type) {
        case 'MULTIPLE_CHOICE':
          const correctOption = question.options.find(opt => opt.isCorrect);
          isCorrect = correctOption?.id === answer.answer;
          break;

        case 'CHECKBOX':
          const correctOptions = question.options
            .filter(opt => opt.isCorrect)
            .map(opt => opt.id);
          const selectedOptions = answer.answer || [];
          isCorrect =
            correctOptions.length === selectedOptions.length &&
            correctOptions.every(id => selectedOptions.includes(id));
          break;

        case 'TRUE_FALSE':
          const trueFalseAnswer =
            typeof answer.answer === 'boolean'
              ? answer.answer.toString()
              : answer.answer?.toString().toLowerCase();
          isCorrect = question.correctAnswer?.toLowerCase() === trueFalseAnswer;
          break;

        case 'SHORT_ANSWER':
          // Normalize strings for comparison (handle full/half-width characters)
          const normalizeString = (str: string) => {
            return str
              ?.toLowerCase()
              .trim()
              .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
                String.fromCharCode(s.charCodeAt(0) - 0xfee0)
              );
          };
          isCorrect =
            normalizeString(question.correctAnswer || '') ===
            normalizeString(answer.answer?.toString() || '');
          break;

        case 'NUMERIC':
          const correctNum = parseFloat(question.correctAnswer || '0');
          const answerNum = parseFloat(answer.answer || '0');
          const tolerance = 0.01; // Allow small floating point differences
          isCorrect = Math.abs(correctNum - answerNum) < tolerance;
          break;

        case 'FILL_IN_BLANK':
          const correctBlanks = JSON.parse(question.correctAnswer || '[]');
          const answerBlanks = answer.answer || [];
          isCorrect =
            correctBlanks.length === answerBlanks.length &&
            correctBlanks.every(
              (blank: string, index: number) =>
                blank.toLowerCase().trim() ===
                answerBlanks[index]?.toLowerCase().trim()
            );
          break;

        case 'MATCHING':
          const correctMatches = JSON.parse(question.correctAnswer || '{}');
          const answerMatches = answer.answer || {};
          isCorrect = Object.keys(correctMatches).every(
            key => correctMatches[key] === answerMatches[key]
          );
          break;

        case 'SORTING':
          const correctOrder = JSON.parse(question.correctAnswer || '[]');
          const answerOrder = answer.answer || [];
          isCorrect =
            correctOrder.length === answerOrder.length &&
            correctOrder.every(
              (item: string, index: number) => item === answerOrder[index]
            );
          break;
      }

      if (isCorrect) correctAnswers++;

      responseAnswers.push({
        questionId: answer.questionId,
        answer: JSON.stringify(answer.answer),
        isCorrect,
      });
    }

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = quiz.passingScore ? score >= quiz.passingScore : true;

    // Use transaction to ensure data consistency
    const response = await prisma.$transaction(async tx => {
      // Create response record
      const quizResponse = await tx.quizResponse.create({
        data: {
          quizId,
          userId: session?.user?.id || null,
          participantName,
          participantEmail,
          responses: {
            create: responseAnswers.map(ra => ({
              questionId: ra.questionId,
              answer: ra.answer,
              isCorrect: ra.isCorrect,
            })),
          },
          score,
          isPassed: passed,
          totalPoints: quiz.questions.length,
          timeTaken: Math.floor(
            (completedAt.getTime() - startedAt.getTime()) / 1000
          ),
          startedAt,
          completedAt,
        },
        include: {
          responses: true,
        },
      });

      // Note: Quiz statistics would be updated in a separate background job
      // or calculated on-demand to avoid performance issues

      return quizResponse;
    });

    return {
      success: true,
      data: {
        id: response.id,
        score: response.score || 0,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        passed: response.isPassed || false,
      },
    };
  } catch (error) {
    console.error('Error submitting quiz response:', error);
    return { success: false, error: 'Failed to submit response' };
  }
}

// This function would be called from a background job or calculated on-demand
// to avoid performance issues during response submission
async function calculateAverageScore(quizId: string): Promise<number> {
  const result = await prisma.quizResponse.aggregate({
    where: {
      quizId,
      completedAt: { not: null },
    },
    _avg: { score: true },
  });
  return result._avg.score || 0;
}

export async function getQuizResponse(responseId: string) {
  try {
    const session = await getServerSession(authOptions);

    const response = await prisma.quizResponse.findUnique({
      where: { id: responseId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        responses: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!response) {
      return { success: false, error: 'Response not found' };
    }

    // Check permissions: Only the respondent or team members can view
    if (response.userId && response.userId !== session?.user?.id) {
      // Check if user is a team member
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: response.quiz.teamId,
          userId: session?.user?.id || '',
        },
      });

      if (!teamMember) {
        return { success: false, error: 'Unauthorized' };
      }
    }

    return {
      success: true,
      data: {
        id: response.id,
        score: response.score || 0,
        totalQuestions: response.quiz.questions?.length || 0,
        correctAnswers: response.responses.filter(a => a.isCorrect).length,
        passed: response.isPassed || false,
        answers: response.responses,
        quiz: response.quiz,
      },
    };
  } catch (error) {
    console.error('Error fetching quiz response:', error);
    return { success: false, error: 'Failed to fetch response' };
  }
}
