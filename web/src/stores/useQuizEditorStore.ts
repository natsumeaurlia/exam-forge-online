import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Quiz,
  Question,
  Section,
  QuizTag,
  QuestionType,
  QuestionOption,
  QuestionMedia,
  Tag,
  MediaType,
} from '@prisma/client';
import type {
  TrueFalseAnswer,
  MultipleChoiceAnswer,
  CheckboxAnswer,
  ShortAnswer,
  SortingAnswer,
  FillInBlankAnswer,
  DiagramAnswer,
  MatchingAnswer,
  NumericAnswer,
} from '@/types/quiz-schemas';

interface MediaItem extends QuestionMedia {
  type: MediaType;
}

// Type for correct answer based on question type
type CorrectAnswerByType<T extends QuestionType> = T extends 'TRUE_FALSE'
  ? TrueFalseAnswer
  : T extends 'MULTIPLE_CHOICE'
    ? MultipleChoiceAnswer
    : T extends 'CHECKBOX'
      ? CheckboxAnswer
      : T extends 'SHORT_ANSWER'
        ? ShortAnswer
        : T extends 'SORTING'
          ? SortingAnswer
          : T extends 'FILL_IN_BLANK'
            ? FillInBlankAnswer
            : T extends 'DIAGRAM'
              ? DiagramAnswer
              : T extends 'MATCHING'
                ? MatchingAnswer
                : T extends 'NUMERIC'
                  ? NumericAnswer
                  : null;

// Utility function to get default correct answer by type
function getDefaultCorrectAnswer(
  type: QuestionType
): CorrectAnswerByType<typeof type> {
  switch (type) {
    case 'TRUE_FALSE':
      return false as CorrectAnswerByType<typeof type>;
    case 'MULTIPLE_CHOICE':
      return '' as CorrectAnswerByType<typeof type>;
    case 'CHECKBOX':
      return [] as CorrectAnswerByType<typeof type>;
    case 'SHORT_ANSWER':
      return '' as CorrectAnswerByType<typeof type>;
    case 'SORTING':
      return [] as CorrectAnswerByType<typeof type>;
    case 'FILL_IN_BLANK':
      return {} as CorrectAnswerByType<typeof type>;
    case 'DIAGRAM':
      return { x: 0, y: 0, label: '' } as CorrectAnswerByType<typeof type>;
    case 'MATCHING':
      return {} as CorrectAnswerByType<typeof type>;
    case 'NUMERIC':
      return 0 as CorrectAnswerByType<typeof type>;
    default:
      return null as CorrectAnswerByType<typeof type>;
  }
}

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: QuestionOption[];
    media?: MediaItem[];
  })[];
  sections: Section[];
  tags: (QuizTag & {
    tag: Tag;
  })[];
}

interface QuizEditorState {
  quiz: QuizWithRelations | null;
  questions: (Question & { options: QuestionOption[]; media?: MediaItem[] })[];
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
  updateQuestion: (
    index: number,
    updates: Partial<Question & { media?: MediaItem[] }>
  ) => void;
  deleteQuestion: (index: number) => void;
  duplicateQuestion: (index: number) => void;
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
      questions: [],
      currentQuestionIndex: null,
      isSaving: false,
      isDirty: false,
      history: {
        past: [],
        future: [],
      },

      initializeQuiz: quiz => {
        // Ensure correctAnswer is properly initialized for all question types
        const questions = (quiz.questions || []).map(q => ({
          ...q,
          correctAnswer: q.correctAnswer ?? getDefaultCorrectAnswer(q.type),
        }));

        set({
          quiz,
          questions,
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
        const { quiz, questions } = get();
        if (!quiz) return;

        const newQuestion: Question & {
          options: QuestionOption[];
          media?: MediaItem[];
        } = {
          id: `temp-${Date.now()}`,
          type,
          text: '',
          points: 1,
          order: questions.length + 1,
          hint: null,
          explanation: null,
          correctAnswer: getDefaultCorrectAnswer(type),
          gradingCriteria: null,
          isRequired: false,
          // isActive: true, // TODO: Add this field to schema
          quizId: quiz.id,
          sectionId: null,
          difficultyLevel: null,
          sectionTimeLimit: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          options:
            type === 'MULTIPLE_CHOICE' || type === 'CHECKBOX'
              ? [
                  {
                    id: `opt-${Date.now()}-1`,
                    text: '',
                    isCorrect: false,
                    order: 1,
                    questionId: `temp-${Date.now()}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  {
                    id: `opt-${Date.now()}-2`,
                    text: '',
                    isCorrect: false,
                    order: 2,
                    questionId: `temp-${Date.now()}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]
              : [],
          media: [],
        };

        set(state => ({
          questions: [...state.questions, newQuestion],
          currentQuestionIndex: state.questions.length,
          isDirty: true,
        }));

        // Scroll to the new question after a short delay to ensure DOM is updated
        setTimeout(() => {
          const questionId = `question-${questions.length}`;
          const element = document.getElementById(questionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      },

      updateQuestion: (index, updates) => {
        const { questions } = get();

        const newQuestions = questions.map((q, i) =>
          i === index ? { ...q, ...updates } : q
        );

        set({
          questions: newQuestions,
          isDirty: true,
        });
      },

      deleteQuestion: index => {
        const { questions, currentQuestionIndex } = get();

        const newQuestions = questions.filter((_, i) => i !== index);

        set({
          questions: newQuestions,
          currentQuestionIndex:
            currentQuestionIndex === index
              ? null
              : currentQuestionIndex && currentQuestionIndex > index
                ? currentQuestionIndex - 1
                : currentQuestionIndex,
          isDirty: true,
        });
      },

      duplicateQuestion: index => {
        const { questions } = get();
        const questionToDuplicate = questions[index];
        if (!questionToDuplicate) return;

        const newQuestion = {
          ...questionToDuplicate,
          id: `temp-${Date.now()}`,
          order: questions.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          options: questionToDuplicate.options.map(opt => ({
            ...opt,
            id: `opt-${Date.now()}-${opt.order}`,
            questionId: `temp-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        };

        set(state => ({
          questions: [...state.questions, newQuestion],
          currentQuestionIndex: state.questions.length,
          isDirty: true,
        }));
      },

      reorderQuestions: questionIds => {
        const { questions } = get();

        const questionMap = new Map(questions.map(q => [q.id, q]));
        const newQuestions = questionIds
          .map(id => questionMap.get(id))
          .filter((q): q is (typeof questions)[0] => q !== undefined)
          .map((q, index) => ({ ...q, order: index + 1 }));

        set({
          questions: newQuestions,
          isDirty: true,
        });
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
