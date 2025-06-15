import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AIProvider, GenerationParams, GeneratedQuestion, ValidationResult, AIGenerationResult } from './types';
import { QUESTION_TYPE_TEMPLATES, buildPrompt } from './prompts/question-templates';
import { aiQuestionResponseSchema, validatedQuestionSchema } from './schemas';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT-4';
  private model = openai('gpt-4-turbo');
  private maxRetries = 3;

  async generateQuestions(params: GenerationParams): Promise<GeneratedQuestion[]> {
    const startTime = Date.now();
    const template = QUESTION_TYPE_TEMPLATES[params.questionType];
    
    if (!template) {
      throw new Error(`Unsupported question type: ${params.questionType}`);
    }

    const prompt = buildPrompt(template, {
      topic: params.topic,
      context: params.context,
      difficulty: params.difficulty,
      language: params.language,
      customInstructions: params.customInstructions,
    });

    const questions: GeneratedQuestion[] = [];

    // Generate questions one by one for better quality control
    for (let i = 0; i < params.count; i++) {
      try {
        const question = await this.generateSingleQuestion(prompt, params);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error(`Failed to generate question ${i + 1}:`, error);
        // Continue with other questions rather than failing completely
      }
    }

    if (questions.length === 0) {
      throw new Error('Failed to generate any valid questions');
    }

    return questions;
  }

  private async generateSingleQuestion(
    prompt: { system: string; user: string },
    params: GenerationParams,
    retryCount = 0
  ): Promise<GeneratedQuestion | null> {
    try {
      const { object } = await generateObject({
        model: this.model,
        system: prompt.system,
        prompt: prompt.user,
        schema: aiQuestionResponseSchema,
        temperature: 0.7, // Some creativity but not too random
      });

      // Validate and transform the AI response
      const question = this.transformAIResponse(object, params);
      
      // Validate the final question
      const validation = validatedQuestionSchema.safeParse(question);
      if (!validation.success) {
        console.warn('Generated question failed validation:', validation.error);
        if (retryCount < this.maxRetries) {
          return this.generateSingleQuestion(prompt, params, retryCount + 1);
        }
        return null;
      }

      return question;
    } catch (error) {
      console.error('Error generating question:', error);
      
      if (retryCount < this.maxRetries) {
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.generateSingleQuestion(prompt, params, retryCount + 1);
      }
      
      return null;
    }
  }

  private transformAIResponse(aiResponse: any, params: GenerationParams): GeneratedQuestion {
    return {
      text: aiResponse.text,
      type: params.questionType,
      difficulty: params.difficulty,
      points: this.getDefaultPoints(params.difficulty),
      hint: aiResponse.hint,
      explanation: aiResponse.explanation,
      options: aiResponse.options,
    };
  }

  private getDefaultPoints(difficulty: string): number {
    switch (difficulty) {
      case 'EASY': return 1;
      case 'MEDIUM': return 2;
      case 'HARD': return 3;
      default: return 2;
    }
  }

  async validateContent(content: string): Promise<ValidationResult> {
    try {
      const { object } = await generateObject({
        model: this.model,
        system: `You are a content validator for educational materials. Analyze the provided content for:
1. Appropriateness for educational use
2. Factual accuracy (flag if uncertain)
3. Clarity and readability
4. Potential bias or sensitive content
5. Grammar and language quality`,
        prompt: `Validate this educational content: "${content}"

Return a JSON object with:
- isValid: boolean (true if suitable for educational use)
- issues: array of strings (any problems found)
- suggestions: array of strings (recommendations for improvement)`,
        schema: z.object({
          isValid: z.boolean(),
          issues: z.array(z.string()),
          suggestions: z.array(z.string()),
        }),
      });

      return object;
    } catch (error) {
      console.error('Error validating content:', error);
      return {
        isValid: false,
        issues: ['Failed to validate content due to service error'],
        suggestions: ['Please review content manually'],
      };
    }
  }

  // Health check method
  async isAvailable(): Promise<boolean> {
    try {
      const { object } = await generateObject({
        model: this.model,
        prompt: 'Return a simple test object',
        schema: z.object({ test: z.string() }),
      });
      return object.test !== undefined;
    } catch (error) {
      console.error('OpenAI provider health check failed:', error);
      return false;
    }
  }

  // Cost estimation (rough estimates)
  estimateCost(params: GenerationParams): { tokensEstimate: number; costEstimate: number } {
    const baseTokensPerQuestion = 500; // Rough estimate
    const tokensEstimate = baseTokensPerQuestion * params.count;
    const costPerToken = 0.00003; // GPT-4 turbo pricing (approximate)
    const costEstimate = tokensEstimate * costPerToken;

    return { tokensEstimate, costEstimate };
  }
}