'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

export async function submitQuizResponse(
  data: z.infer<typeof submitResponseSchema>
) {
  try {
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

    // Create response record
    const response = await prisma.quizResponse.create({
      data: {
        quizId,
        participantName,
        participantEmail,
        answers: {
          create: responseAnswers,
        },
        score,
        passed,
        startedAt,
        completedAt,
        timeTaken: Math.floor(
          (completedAt.getTime() - startedAt.getTime()) / 1000
        ),
      },
      include: {
        answers: true,
      },
    });

    // Update quiz statistics
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        totalResponses: { increment: 1 },
        averageScore: {
          set: await calculateAverageScore(quizId),
        },
      },
    });

    return {
      success: true,
      data: {
        id: response.id,
        score: response.score,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        passed: response.passed,
      },
    };
  } catch (error) {
    console.error('Error submitting quiz response:', error);
    return { success: false, error: 'Failed to submit response' };
  }
}

async function calculateAverageScore(quizId: string): Promise<number> {
  const result = await prisma.quizResponse.aggregate({
    where: { quizId },
    _avg: { score: true },
  });
  return result._avg.score || 0;
}

export async function getQuizResponse(responseId: string) {
  try {
    const response = await prisma.quizResponse.findUnique({
      where: { id: responseId },
      include: {
        quiz: true,
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
      return { success: false, error: 'Response not found' };
    }

    return {
      success: true,
      data: {
        id: response.id,
        score: response.score,
        totalQuestions: response.quiz.questions?.length || 0,
        correctAnswers: response.answers.filter(a => a.isCorrect).length,
        passed: response.passed,
        answers: response.answers,
        quiz: response.quiz,
      },
    };
  } catch (error) {
    console.error('Error fetching quiz response:', error);
    return { success: false, error: 'Failed to fetch response' };
  }
}
