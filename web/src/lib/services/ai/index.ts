// Main exports for AI service
export { AIQuestionService } from './question-service';
export { OpenAIProvider } from './openai-provider';

// Type exports
export type {
  AIProvider,
  GenerationParams,
  GeneratedQuestion,
  GeneratedOption,
  ValidationResult,
  AIGenerationResult,
  AIJobStatus,
} from './types';

// Schema exports
export {
  generatedOptionSchema,
  generatedQuestionSchema,
  aiQuestionResponseSchema,
  validatedQuestionSchema,
  generationRequestSchema,
} from './schemas';

export type {
  GeneratedOption as SchemaGeneratedOption,
  GeneratedQuestion as SchemaGeneratedQuestion,
  AIQuestionResponse,
  ValidatedQuestion,
  GenerationRequest,
} from './schemas';

// Prompt template exports
export { 
  QUESTION_TYPE_TEMPLATES, 
  buildPrompt,
  DIFFICULTY_DESCRIPTIONS,
  LANGUAGE_INSTRUCTIONS,
} from './prompts/question-templates';

// Singleton instance for easy use
export const aiQuestionService = new AIQuestionService();