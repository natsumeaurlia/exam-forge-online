'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createSafeActionClient } from 'next-safe-action';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const action = createSafeActionClient();

const submitResponseSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.any(),
    })
  ),
  participantName: z.string().optional(),
  participantEmail: z.string().email().optional(),
  startedAt: z.date(),
  completedAt: z.date(),
});

export const submitQuizResponse = action
  .schema(submitResponseSchema)
  .action(async ({ parsedInput: data }) => {
    const {
      quizId,
      answers,
      participantName,
      participantEmail,
      startedAt,
      completedAt,
    } = data;

    // Get current session for authenticated users
    const session = await getServerSession(authOptions);

    // Get quiz with questions and verify it's published
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        isPublished: true,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            members: {
              where: {
                userId: session?.user?.id || '',
              },
            },
          },
        },
        questions: {
          where: { isActive: true },
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found or not published');
    }

    // Check if quiz requires authentication
    if (quiz.sharingMode === 'TEAM_ONLY' && !session?.user) {
      throw new Error('Authentication required for this quiz');
    }

    // Check if user is a team member for team-only quizzes
    if (quiz.sharingMode === 'TEAM_ONLY' && quiz.team.members.length === 0) {
      throw new Error('You are not authorized to take this quiz');
    }

    // Check max attempts if user is authenticated
    if (session?.user && quiz.maxAttempts) {
      const previousAttempts = await prisma.quizResponse.count({
        where: {
          quizId,
          userId: session.user.id,
          completedAt: { not: null },
        },
      });

      if (previousAttempts >= quiz.maxAttempts) {
        throw new Error('Maximum attempts reached for this quiz');
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
          isCorrect = question.correctAnswer === answer.answer.toString();
          break;

        case 'SHORT_ANSWER':
          // Simple string comparison, could be improved with fuzzy matching
          isCorrect =
            question.correctAnswer?.toLowerCase().trim() ===
            answer.answer?.toLowerCase().trim();
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

    const score = (correctAnswers / quiz.questions.length) * 100;
    const passed = quiz.passingScore ? score >= quiz.passingScore : true;

    // Use transaction for atomic operations
    const response = await prisma.$transaction(async tx => {
      // Create response record
      const quizResponse = await tx.quizResponse.create({
        data: {
          quizId,
          userId: session?.user?.id || null,
          participantName,
          participantEmail,
          score,
          isPassed: passed,
          totalPoints: quiz.questions.length,
          startedAt,
          completedAt,
          timeTaken: Math.floor(
            (completedAt.getTime() - startedAt.getTime()) / 1000
          ),
        },
      });

      // Create answer records
      await tx.questionResponse.createMany({
        data: responseAnswers.map(answer => ({
          quizResponseId: quizResponse.id,
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          score: answer.isCorrect ? 1 : 0,
        })),
      });

      // Update quiz statistics
      const avgScore = await tx.quizResponse.aggregate({
        where: { quizId },
        _avg: { score: true },
      });

      await tx.quiz.update({
        where: { id: quizId },
        data: {
          totalResponses: { increment: 1 },
          averageScore: avgScore._avg.score || 0,
        },
      });

      // Return the complete response with answers
      return await tx.quizResponse.findUnique({
        where: { id: quizResponse.id },
        include: {
          answers: true,
        },
      });
    });

    // Revalidate quiz page to update statistics
    revalidatePath(`/quiz/${quizId}`);
    revalidatePath('/dashboard/quizzes');

    return {
      success: true,
      data: {
        id: response!.id,
        score: response!.score || 0,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        passed: response!.isPassed || false,
      },
    };
  });

const getResponseSchema = z.object({
  responseId: z.string(),
});

export const getQuizResponse = action
  .schema(getResponseSchema)
  .action(async ({ parsedInput: { responseId } }) => {
    const session = await getServerSession(authOptions);

    const response = await prisma.quizResponse.findUnique({
      where: { id: responseId },
      include: {
        quiz: {
          include: {
            team: {
              select: {
                id: true,
                members: session?.user
                  ? {
                      where: {
                        userId: session.user.id,
                      },
                    }
                  : undefined,
              },
            },
            questions: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
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
      throw new Error('Response not found');
    }

    // Check if user has permission to view this response
    const canView =
      // User is the responder
      (session?.user && response.userId === session.user.id) ||
      // User submitted with same email (for non-authenticated submissions)
      (response.participantEmail &&
        session?.user?.email === response.participantEmail) ||
      // User is a team member (for team quizzes)
      (session?.user &&
        response.quiz.team.members &&
        response.quiz.team.members.length > 0) ||
      // Quiz is public and allows viewing results
      response.quiz.sharingMode === 'URL';

    if (!canView) {
      throw new Error('You do not have permission to view this response');
    }

    return {
      success: true,
      data: {
        id: response.id,
        score: response.score || 0,
        totalQuestions: response.quiz.questions.length,
        correctAnswers: response.answers.filter(a => a.isCorrect).length,
        passed: response.isPassed || false,
        answers: response.answers,
        quiz: response.quiz,
      },
    };
  });
