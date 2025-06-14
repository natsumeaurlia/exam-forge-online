import { create } from 'zustand';
import type { QuestionType } from '@prisma/client';
import { QuizAnswer } from '@/types/quiz-answers';

interface QuizPreviewState {
  currentQuestionIndex: number;
  mockAnswers: Record<string, QuizAnswer>;
  deviceMode: 'desktop' | 'mobile';
  isStarted: boolean;
  isCompleted: boolean;
  startTime: Date | null;
  participantInfo: {
    name?: string;
    email?: string;
  };
  // Actions
  startQuiz: () => void;
  submitAnswer: (questionId: string, answer: QuizAnswer) => void;
  navigateToQuestion: (index: number) => void;
  resetPreview: () => void;
  setDeviceMode: (mode: 'desktop' | 'mobile') => void;
  completeQuiz: () => void;
  setParticipantInfo: (info: { name?: string; email?: string }) => void;
  goToPreviousQuestion: () => void;
  goToNextQuestion: (totalQuestions: number) => void;
}

export const useQuizPreviewStore = create<QuizPreviewState>(set => ({
  currentQuestionIndex: 0,
  mockAnswers: {},
  deviceMode: 'desktop',
  isStarted: false,
  isCompleted: false,
  startTime: null,
  participantInfo: {},

  startQuiz: () =>
    set({
      isStarted: true,
      startTime: new Date(),
      currentQuestionIndex: 0,
    }),

  submitAnswer: (questionId, answer) =>
    set(state => ({
      mockAnswers: {
        ...state.mockAnswers,
        [questionId]: answer,
      },
    })),

  navigateToQuestion: index =>
    set({
      currentQuestionIndex: index,
    }),

  resetPreview: () =>
    set({
      currentQuestionIndex: 0,
      mockAnswers: {},
      isStarted: false,
      isCompleted: false,
      startTime: null,
      participantInfo: {},
    }),

  setDeviceMode: mode =>
    set({
      deviceMode: mode,
    }),

  completeQuiz: () =>
    set({
      isCompleted: true,
    }),

  setParticipantInfo: info =>
    set(state => ({
      participantInfo: {
        ...state.participantInfo,
        ...info,
      },
    })),

  goToPreviousQuestion: () =>
    set(state => ({
      currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
    })),

  goToNextQuestion: totalQuestions =>
    set(state => ({
      currentQuestionIndex: Math.min(
        totalQuestions - 1,
        state.currentQuestionIndex + 1
      ),
    })),
}));
