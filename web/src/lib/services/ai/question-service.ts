import type {
  AIProvider,
  GenerationParams,
  GeneratedQuestion,
  ValidationResult,
  AIGenerationResult,
} from './types';
import { OpenAIProvider } from './openai-provider';

export class AIQuestionService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider = 'openai';

  constructor() {
    // Register available providers
    this.providers.set('openai', new OpenAIProvider());
  }

  async generateQuestions(
    params: GenerationParams,
    providerId: string = this.defaultProvider
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`AI provider '${providerId}' not found`);
    }

    try {
      // Validate parameters
      this.validateGenerationParams(params);

      // Check provider availability
      if (
        'isAvailable' in provider &&
        typeof provider.isAvailable === 'function'
      ) {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          throw new Error(
            `AI provider '${providerId}' is currently unavailable`
          );
        }
      }

      // Generate questions
      const questions = await provider.generateQuestions(params);
      const generationTime = Date.now() - startTime;

      // Estimate tokens used (rough calculation)
      const tokensUsed = this.estimateTokensUsed(params, questions);

      return {
        success: true,
        questions,
        metadata: {
          model: provider.name,
          tokensUsed,
          generationTime,
          providerId,
        },
      };
    } catch (error) {
      console.error(`AI generation failed with provider ${providerId}:`, error);

      return {
        success: false,
        questions: [],
        metadata: {
          model: provider.name,
          tokensUsed: 0,
          generationTime: Date.now() - startTime,
          providerId,
        },
      };
    }
  }

  async validateQuestionContent(
    content: string,
    providerId: string = this.defaultProvider
  ): Promise<ValidationResult> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`AI provider '${providerId}' not found`);
    }

    return provider.validateContent(content);
  }

  async getAvailableProviders(): Promise<
    Array<{ id: string; name: string; available: boolean }>
  > {
    const providers = [];

    for (const [id, provider] of this.providers.entries()) {
      let available = true;

      if (
        'isAvailable' in provider &&
        typeof provider.isAvailable === 'function'
      ) {
        try {
          available = await provider.isAvailable();
        } catch (error) {
          available = false;
        }
      }

      providers.push({
        id,
        name: provider.name,
        available,
      });
    }

    return providers;
  }

  estimateGenerationCost(
    params: GenerationParams,
    providerId: string = this.defaultProvider
  ): {
    tokensEstimate: number;
    costEstimate: number;
    currency: string;
  } {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`AI provider '${providerId}' not found`);
    }

    if (
      'estimateCost' in provider &&
      typeof provider.estimateCost === 'function'
    ) {
      const estimate = provider.estimateCost(params);
      return {
        ...estimate,
        currency: 'USD',
      };
    }

    // Fallback rough estimate
    const baseTokensPerQuestion = 500;
    const tokensEstimate = baseTokensPerQuestion * params.count;
    const costEstimate = tokensEstimate * 0.00003; // Rough GPT-4 pricing

    return {
      tokensEstimate,
      costEstimate,
      currency: 'USD',
    };
  }

  private validateGenerationParams(params: GenerationParams): void {
    if (!params.topic?.trim()) {
      throw new Error('Topic is required for question generation');
    }

    if (params.count < 1 || params.count > 20) {
      throw new Error('Question count must be between 1 and 20');
    }

    const validLanguages = ['ja', 'en'];
    if (!validLanguages.includes(params.language)) {
      throw new Error(`Language must be one of: ${validLanguages.join(', ')}`);
    }
  }

  private estimateTokensUsed(
    params: GenerationParams,
    questions: GeneratedQuestion[]
  ): number {
    // Rough calculation based on content length
    let totalTokens = 0;

    // Count tokens from generated questions
    questions.forEach(question => {
      totalTokens += Math.ceil(question.text.length / 4); // Rough token estimate
      totalTokens += Math.ceil((question.explanation || '').length / 4);
      totalTokens += Math.ceil((question.hint || '').length / 4);

      if (question.options) {
        question.options.forEach(option => {
          totalTokens += Math.ceil(option.text.length / 4);
        });
      }
    });

    // Add prompt tokens (rough estimate)
    const promptTokens = Math.ceil(
      (params.topic.length + (params.context || '').length) / 4
    );
    totalTokens += promptTokens * params.count; // Prompt repeated for each question

    return totalTokens;
  }

  // Method to register custom providers
  registerProvider(id: string, provider: AIProvider): void {
    this.providers.set(id, provider);
  }

  // Method to remove providers
  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  // Get provider info
  getProviderInfo(providerId: string): { id: string; name: string } | null {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    return {
      id: providerId,
      name: provider.name,
    };
  }
}
