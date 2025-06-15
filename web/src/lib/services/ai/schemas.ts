import { z } from 'zod';
import { QuestionType, QuestionDifficulty } from '@prisma/client';

export const generatedOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

export const generatedQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  options: z.array(generatedOptionSchema).optional(),
  explanation: z.string().min(1, 'Explanation is required'),
  hint: z.string().optional(),
});

export const aiQuestionResponseSchema = z.object({
  text: z.string(),
  options: z.array(generatedOptionSchema).optional(),
  explanation: z.string(),
  hint: z.string().optional(),
});

// Schema for validating AI-generated content before saving
export const validatedQuestionSchema = z.object({
  text: z.string().min(10, 'Question text must be at least 10 characters'),
  type: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(QuestionDifficulty),
  points: z.number().min(1).max(100),
  hint: z.string().optional(),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
  options: z.array(generatedOptionSchema).optional(),
}).refine((data) => {
  // Validation rules based on question type
  if (data.type === 'SHORT_ANSWER') {
    return true; // No options needed
  }
  
  if (!data.options || data.options.length === 0) {
    return false;
  }
  
  const correctOptions = data.options.filter(opt => opt.isCorrect);
  
  switch (data.type) {
    case 'TRUE_FALSE':
      return data.options.length === 2 && correctOptions.length === 1;
    case 'MULTIPLE_CHOICE':
      return data.options.length >= 2 && data.options.length <= 6 && correctOptions.length === 1;
    case 'CHECKBOX':
      return data.options.length >= 2 && correctOptions.length >= 1 && correctOptions.length < data.options.length;
    default:
      return correctOptions.length >= 1;
  }
}, {
  message: 'Invalid options configuration for question type',
});

// Generation request schema
export const generationRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  context: z.string().optional(),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(QuestionDifficulty),
  count: z.number().min(1, 'At least 1 question required').max(20, 'Maximum 20 questions per request'),
  language: z.enum(['ja', 'en']).default('ja'),
  customInstructions: z.string().optional(),
});

export type GeneratedOption = z.infer<typeof generatedOptionSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type AIQuestionResponse = z.infer<typeof aiQuestionResponseSchema>;
export type ValidatedQuestion = z.infer<typeof validatedQuestionSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;