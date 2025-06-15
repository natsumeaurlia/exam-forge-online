import { QuestionType } from '@prisma/client';

// Union type for different answer formats based on question type
export type QuizAnswerValue =
  | string // SHORT_ANSWER, FILL_IN_BLANK
  | string[] // MULTIPLE_CHOICE, CHECKBOX, SORTING
  | number // NUMERIC
  | boolean // TRUE_FALSE
  | Record<string, string> // MATCHING (leftId -> rightId mapping)
  | File // File uploads (if supported)
  | null; // No answer

// Type-safe answer interface with discriminated union
export interface TypedQuizAnswer {
  questionId: string;
  questionType: QuestionType;
  value: QuizAnswerValue;
}

// Answer change handler type
export type AnswerChangeHandler = (
  questionId: string,
  value: QuizAnswerValue
) => void;

// Type guards for answer validation
export const isStringAnswer = (value: QuizAnswerValue): value is string =>
  typeof value === 'string';

export const isStringArrayAnswer = (
  value: QuizAnswerValue
): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

export const isNumberAnswer = (value: QuizAnswerValue): value is number =>
  typeof value === 'number';

export const isBooleanAnswer = (value: QuizAnswerValue): value is boolean =>
  typeof value === 'boolean';

export const isFileAnswer = (value: QuizAnswerValue): value is File =>
  value instanceof File;

// Helper to validate answer type matches question type
export const validateAnswerType = (
  questionType: QuestionType,
  value: QuizAnswerValue
): boolean => {
  if (value === null) return true; // null is always valid (no answer)

  switch (questionType) {
    case 'SHORT_ANSWER':
    case 'FILL_IN_BLANK':
      return isStringAnswer(value);

    case 'MULTIPLE_CHOICE':
    case 'CHECKBOX':
    case 'SORTING':
      return isStringArrayAnswer(value);

    case 'MATCHING':
      return (
        typeof value === 'object' && value !== null && !Array.isArray(value)
      );

    case 'TRUE_FALSE':
      return isBooleanAnswer(value);

    case 'NUMERIC':
      return isNumberAnswer(value);

    case 'DIAGRAM':
      // Diagram answers can be various formats
      return true;

    default:
      return false;
  }
};
