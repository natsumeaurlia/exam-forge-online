import { QuestionType, QuestionDifficulty } from '@prisma/client';

export interface GenerationParams {
  topic: string;
  context?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  count: number;
  language: string;
  customInstructions?: string;
}

export interface GeneratedOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  points: number;
  hint?: string;
  explanation: string;
  options?: GeneratedOption[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export interface AIProvider {
  name: string;
  generateQuestions(params: GenerationParams): Promise<GeneratedQuestion[]>;
  validateContent(content: string): Promise<ValidationResult>;
}

export interface AIGenerationResult {
  success: boolean;
  questions: GeneratedQuestion[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    providerId: string;
  };
}

export interface AIJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: AIGenerationResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}