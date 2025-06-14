import { Question, QuestionOption } from '@prisma/client';

// Define a union type for all possible answer types
export type QuizAnswer =
  | boolean // TRUE_FALSE
  | string // MULTIPLE_CHOICE, SHORT_ANSWER
  | string[] // CHECKBOX, SORTING
  | Record<string, string> // FILL_IN_BLANK, MATCHING
  | number // NUMERIC
  | { x: number; y: number; label: string }; // DIAGRAM

// Define the answer record type
export type AnswerRecord = Record<string, QuizAnswer>;

// Define proper types for question with correct answer and options
export interface QuestionWithDetails extends Omit<Question, 'correctAnswer'> {
  correctAnswer?: QuizAnswer;
  options: QuestionOption[];
}

// Define the Answer interface for quiz responses
export interface QuizAnswerResponse {
  questionId: string;
  answer: QuizAnswer;
  isCorrect?: boolean;
  score?: number;
}

// Type guards for different answer types
export function isBooleanAnswer(answer: QuizAnswer): answer is boolean {
  return typeof answer === 'boolean';
}

export function isStringAnswer(answer: QuizAnswer): answer is string {
  return typeof answer === 'string';
}

export function isStringArrayAnswer(answer: QuizAnswer): answer is string[] {
  return (
    Array.isArray(answer) && answer.every(item => typeof item === 'string')
  );
}

export function isRecordAnswer(
  answer: QuizAnswer
): answer is Record<string, string> {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    !Array.isArray(answer) &&
    Object.values(answer).every(value => typeof value === 'string')
  );
}

export function isNumberAnswer(answer: QuizAnswer): answer is number {
  return typeof answer === 'number';
}

export function isDiagramAnswer(
  answer: QuizAnswer
): answer is { x: number; y: number; label: string } {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'x' in answer &&
    'y' in answer &&
    'label' in answer &&
    typeof answer.x === 'number' &&
    typeof answer.y === 'number' &&
    typeof answer.label === 'string'
  );
}

// Helper function to validate answer format based on question type
export function validateAnswerFormat(
  questionType: string,
  answer: QuizAnswer
): boolean {
  switch (questionType) {
    case 'TRUE_FALSE':
      return isBooleanAnswer(answer);
    case 'MULTIPLE_CHOICE':
    case 'SHORT_ANSWER':
      return isStringAnswer(answer);
    case 'CHECKBOX':
    case 'SORTING':
      return isStringArrayAnswer(answer);
    case 'FILL_IN_BLANK':
    case 'MATCHING':
      return isRecordAnswer(answer);
    case 'NUMERIC':
      return isNumberAnswer(answer);
    case 'DIAGRAM':
      return isDiagramAnswer(answer);
    default:
      return false;
  }
}
