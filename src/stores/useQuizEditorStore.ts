import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Quiz,
  Question,
  Section,
  QuizTag,
  QuestionType,
} from '@prisma/client';

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: {
      id: string;
      text: string;
      order: number;
      isCorrect: boolean;
    }[];
  })[];
  sections: Section[];
  tags: (QuizTag & {
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  })[];
}

interface QuizEditorState {
  quiz: QuizWithRelations | null;
  currentQuestionIndex: number | null;
  isSaving: boolean;
  isDirty: boolean;
  history: {
    past: QuizWithRelations[];
    future: QuizWithRelations[];
  };

  // Actions
  initializeQuiz: (quiz: QuizWithRelations) => void;
  updateQuizMetadata: (updates: Partial<Quiz>) => void;
  addQuestion: (type: QuestionType) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  reorderQuestions: (questionIds: string[]) => void;
  setCurrentQuestion: (index: number | null) => void;
  setSaving: (isSaving: boolean) => void;
  undo: () => void;
  redo: () => void;
}

export const useQuizEditorStore = create<QuizEditorState>()(
  devtools(
    (set, get) => ({
      quiz: null,
      currentQuestionIndex: null,
      isSaving: false,
      isDirty: false,
      history: {
        past: [],
        future: [],
      },

      initializeQuiz: quiz => {
        set({
          quiz,
          currentQuestionIndex: null,
          isDirty: false,
          history: { past: [], future: [] },
        });
      },

      updateQuizMetadata: updates => {
        const { quiz } = get();
        if (!quiz) return;

        const newQuiz = { ...quiz, ...updates };
        set(state => ({
          quiz: newQuiz,
          isDirty: true,
          history: {
            past: [...state.history.past, quiz],
            future: [],
          },
        }));
      },

      addQuestion: type => {
        const { quiz } = get();
        if (!quiz) return;

        const newQuestion: Question & { options: any[] } = {
          id: `temp-${Date.now()}`,
          type,
          text: '',
          points: 1,
          order: quiz.questions.length + 1,
          hint: null,
          explanation: null,
          mediaUrl: null,
          mediaType: null,
          correctAnswer: null,
          gradingCriteria: null,
          quizId: quiz.id,
          sectionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: [],
        };

        const newQuiz = {
          ...quiz,
          questions: [...quiz.questions, newQuestion],
        };

        set(state => ({
          quiz: newQuiz,
          currentQuestionIndex: quiz.questions.length,
          isDirty: true,
          history: {
            past: [...state.history.past, quiz],
            future: [],
          },
        }));
      },

      updateQuestion: (questionId, updates) => {
        const { quiz } = get();
        if (!quiz) return;

        const newQuestions = quiz.questions.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        );

        const newQuiz = { ...quiz, questions: newQuestions };

        set(state => ({
          quiz: newQuiz,
          isDirty: true,
          history: {
            past: [...state.history.past, quiz],
            future: [],
          },
        }));
      },

      deleteQuestion: questionId => {
        const { quiz, currentQuestionIndex } = get();
        if (!quiz) return;

        const questionIndex = quiz.questions.findIndex(
          q => q.id === questionId
        );
        const newQuestions = quiz.questions.filter(q => q.id !== questionId);
        const newQuiz = { ...quiz, questions: newQuestions };

        set(state => ({
          quiz: newQuiz,
          currentQuestionIndex:
            currentQuestionIndex === questionIndex
              ? null
              : currentQuestionIndex && currentQuestionIndex > questionIndex
                ? currentQuestionIndex - 1
                : currentQuestionIndex,
          isDirty: true,
          history: {
            past: [...state.history.past, quiz],
            future: [],
          },
        }));
      },

      reorderQuestions: questionIds => {
        const { quiz } = get();
        if (!quiz) return;

        const questionMap = new Map(quiz.questions.map(q => [q.id, q]));
        const newQuestions = questionIds
          .map(id => questionMap.get(id))
          .filter((q): q is (typeof quiz.questions)[0] => q !== undefined)
          .map((q, index) => ({ ...q, order: index + 1 }));

        const newQuiz = { ...quiz, questions: newQuestions };

        set(state => ({
          quiz: newQuiz,
          isDirty: true,
          history: {
            past: [...state.history.past, quiz],
            future: [],
          },
        }));
      },

      setCurrentQuestion: index => {
        set({ currentQuestionIndex: index });
      },

      setSaving: isSaving => {
        set({ isSaving });
      },

      undo: () => {
        const { history, quiz } = get();
        if (history.past.length === 0 || !quiz) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
          quiz: previous,
          history: {
            past: newPast,
            future: [quiz, ...history.future],
          },
          isDirty: newPast.length > 0,
        });
      },

      redo: () => {
        const { history, quiz } = get();
        if (history.future.length === 0 || !quiz) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
          quiz: next,
          history: {
            past: [...history.past, quiz],
            future: newFuture,
          },
          isDirty: true,
        });
      },
    }),
    {
      name: 'quiz-editor-store',
    }
  )
);
