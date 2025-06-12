'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { action } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

const submitQuizResponseSchema = z.object({
  quizId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.any(),
    })
  ),
  duration: z.number(),
  isAnonymous: z.boolean().optional(),
  participantName: z.string().optional(),
  participantEmail: z.string().email().optional(),
});

export const submitQuizResponse = action(
  submitQuizResponseSchema,
  async data => {
    const session = await auth();
    const userId = session?.user?.id;

    // If not anonymous, user must be authenticated
    if (!data.isAnonymous && !userId) {
      throw new Error('Authentication required');
    }

    // Check rate limit for anonymous submissions
    if (data.isAnonymous) {
      const { checkRateLimit, RATE_LIMITS } = await import(
        '@/lib/security/rate-limit'
      );
      const rateLimitResult = await checkRateLimit({
        identifier: `quiz-submission:${data.quizId}`,
        ...RATE_LIMITS.publicQuizSubmission,
      });

      if (!rateLimitResult.allowed) {
        throw new Error('Too many quiz submissions. Please try again later.');
      }
    }

    // Fetch quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      throw new Error('Quiz not found or not published');
    }

    // Check if quiz allows anonymous responses
    if (data.isAnonymous && quiz.sharingMode === 'NONE') {
      throw new Error('This quiz does not allow anonymous responses');
    }

    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;
    const answerResults = [];

    for (const answer of data.answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let points = 0;

      switch (question.type) {
        case 'MULTIPLE_CHOICE':
          const selectedOption = question.options.find(
            opt => opt.id === answer.answer
          );
          isCorrect = selectedOption?.isCorrect || false;
          break;

        case 'CHECKBOX':
          const correctOptions = question.options
            .filter(opt => opt.isCorrect)
            .map(opt => opt.id);
          const selectedOptions = answer.answer as string[];
          isCorrect =
            correctOptions.length === selectedOptions.length &&
            correctOptions.every(id => selectedOptions.includes(id));
          break;

        case 'TRUE_FALSE':
          isCorrect = String(answer.answer) === String(question.correctAnswer);
          break;

        case 'SHORT_ANSWER':
        case 'LONG_ANSWER':
          // For text answers, do simple comparison (can be enhanced later)
          isCorrect =
            answer.answer?.toLowerCase().trim() ===
            question.correctAnswer?.toLowerCase().trim();
          break;

        case 'NUMERIC':
          const numAnswer = parseFloat(answer.answer);
          const correctNum = parseFloat(question.correctAnswer || '0');
          const tolerance = parseFloat(question.tolerance || '0');
          isCorrect = Math.abs(numAnswer - correctNum) <= tolerance;
          break;

        case 'FILL_IN_BLANK':
          // Simple implementation - all blanks must match
          const blanks = question.correctAnswer?.split('|') || [];
          const userBlanks = answer.answer as string[];
          isCorrect =
            blanks.length === userBlanks.length &&
            blanks.every(
              (blank, i) =>
                blank.toLowerCase().trim() ===
                userBlanks[i]?.toLowerCase().trim()
            );
          break;

        case 'MATCHING':
          const correctMatches = JSON.parse(question.correctAnswer || '{}');
          const userMatches = answer.answer as Record<string, string>;
          isCorrect = Object.keys(correctMatches).every(
            key => correctMatches[key] === userMatches[key]
          );
          break;

        case 'SORTING':
          const correctOrder = JSON.parse(question.correctAnswer || '[]');
          const userOrder = answer.answer as string[];
          isCorrect =
            JSON.stringify(correctOrder) === JSON.stringify(userOrder);
          break;
      }

      if (isCorrect) {
        points = question.points || 0;
        totalScore += points;
        correctAnswers++;
      }

      answerResults.push({
        questionId: question.id,
        isCorrect,
        points,
      });
    }

    const totalPoints = quiz.questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0
    );
    const percentage =
      totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const passed = quiz.passingScore
      ? percentage >= quiz.passingScore
      : undefined;

    // Create quiz response
    const response = await prisma.quizResponse.create({
      data: {
        quizId: data.quizId,
        userId,
        score: totalScore,
        duration: data.duration,
        completedAt: new Date(),
        participantName: data.participantName,
        participantEmail: data.participantEmail,
        answers: {
          create: data.answers.map(answer => ({
            questionId: answer.questionId,
            answer: JSON.stringify(answer.answer),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Revalidate quiz analytics if needed
    revalidatePath(`/dashboard/quizzes/${data.quizId}/analytics`);

    return {
      id: response.id,
      score: totalScore,
      totalPoints,
      percentage,
      duration: data.duration,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      passingScore: quiz.passingScore,
      passed,
      answers: quiz.showCorrectAnswers ? answerResults : undefined,
    };
  }
);

// Get quiz response details
const getQuizResponseSchema = z.object({
  responseId: z.string(),
});

export const getQuizResponse = action(
  getQuizResponseSchema,
  async ({ responseId }) => {
    const session = await auth();

    const response = await prisma.quizResponse.findUnique({
      where: { id: responseId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!response) {
      throw new Error('Response not found');
    }

    // Check access permissions
    if (response.userId && response.userId !== session?.user?.id) {
      // Check if user is a team member
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId: session?.user?.id,
          teamId: response.quiz.teamId,
        },
      });

      if (!teamMember) {
        throw new Error('Access denied');
      }
    }

    return response;
  }
);
