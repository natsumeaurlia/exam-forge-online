import { QuestionType, QuestionDifficulty } from '@prisma/client';

export interface PromptTemplate {
  system: string;
  user: string;
}

export const DIFFICULTY_DESCRIPTIONS = {
  EASY: 'beginner level, basic concepts, simple vocabulary',
  MEDIUM: 'intermediate level, moderate complexity, standard concepts',
  HARD: 'advanced level, complex concepts, detailed understanding required',
} as const;

export const LANGUAGE_INSTRUCTIONS = {
  ja: 'Generate the question in Japanese. Use natural Japanese language.',
  en: 'Generate the question in English. Use clear, natural English.',
} as const;

export const QUESTION_TYPE_TEMPLATES: Record<QuestionType, PromptTemplate> = {
  MULTIPLE_CHOICE: {
    system: `You are an expert question generator. Create high-quality multiple choice questions that test understanding, not just memorization.

Guidelines:
- Question should be clear and unambiguous
- Provide exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Incorrect options should be plausible but clearly wrong
- Avoid "all of the above" or "none of the above" options
- Include a clear explanation for why the correct answer is right`,
    user: `Generate a multiple choice question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "The question text",
  "options": [
    {"text": "Option A", "isCorrect": false},
    {"text": "Option B", "isCorrect": true},
    {"text": "Option C", "isCorrect": false},
    {"text": "Option D", "isCorrect": false}
  ],
  "explanation": "Clear explanation of why the correct answer is right",
  "hint": "Optional hint to guide students"
}`,
  },

  TRUE_FALSE: {
    system: `You are an expert question generator. Create true/false questions that test genuine understanding.

Guidelines:
- Statement should be definitively true or false, not ambiguous
- Avoid trick questions or overly technical language
- Focus on important concepts, not trivial details
- Provide clear explanation for the correct answer`,
    user: `Generate a true/false question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "The statement to evaluate",
  "options": [
    {"text": "True", "isCorrect": true},
    {"text": "False", "isCorrect": false}
  ],
  "explanation": "Clear explanation of why the answer is true or false",
  "hint": "Optional hint to guide students"
}`,
  },

  CHECKBOX: {
    system: `You are an expert question generator. Create multiple-select questions where students must choose all correct answers.

Guidelines:
- Provide 4-6 options
- 2-4 options should be correct
- Incorrect options should be plausible but clearly wrong
- Question should clearly indicate multiple selections are allowed
- Provide explanation for each correct and incorrect option`,
    user: `Generate a multiple-select (checkbox) question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "Select all correct answers about...",
  "options": [
    {"text": "Option 1", "isCorrect": true},
    {"text": "Option 2", "isCorrect": false},
    {"text": "Option 3", "isCorrect": true},
    {"text": "Option 4", "isCorrect": false}
  ],
  "explanation": "Detailed explanation of why each option is correct or incorrect",
  "hint": "Optional hint about what to look for"
}`,
  },

  SHORT_ANSWER: {
    system: `You are an expert question generator. Create short answer questions that require thoughtful responses.

Guidelines:
- Question should require 1-3 sentence answers
- Focus on understanding, analysis, or application
- Provide a model answer and explanation
- Avoid questions with only one-word answers`,
    user: `Generate a short answer question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "The question requiring a short written response",
  "explanation": "Model answer and explanation of key points to cover",
  "hint": "Optional hint to guide thinking"
}`,
  },

  FILL_IN_BLANK: {
    system: `You are an expert question generator. Create fill-in-the-blank questions that test key concepts.

Guidelines:
- Replace 1-3 key terms with blanks
- Provide clear context so the answer is determinable
- Blanks should test important concepts, not trivial details
- Provide the complete answer with blanks filled`,
    user: `Generate a fill-in-the-blank question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "The sentence with _____ blanks to fill",
  "explanation": "The complete sentence with correct answers: 'The sentence with CORRECT ANSWERS filled'",
  "hint": "Optional hint about what type of words go in the blanks"
}`,
  },

  MATCHING: {
    system: `You are an expert question generator. Create matching questions that connect related concepts.

Guidelines:
- Provide 4-6 items to match
- Each item should have exactly one correct match
- Include some plausible but incorrect options
- Ensure all matches are logical and clear`,
    user: `Generate a matching question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "Match each item on the left with the correct item on the right",
  "options": [
    {"text": "Left item 1 | Right item A", "isCorrect": true},
    {"text": "Left item 2 | Right item B", "isCorrect": true},
    {"text": "Left item 3 | Right item C", "isCorrect": true}
  ],
  "explanation": "Explanation of why each match is correct",
  "hint": "Optional hint about the relationship to look for"
}`,
  },

  SORTING: {
    system: `You are an expert question generator. Create sorting questions where items must be arranged in correct order.

Guidelines:
- Provide 4-6 items to sort
- Order should be logical (chronological, numerical, alphabetical, etc.)
- Make the ordering criteria clear in the question
- Provide explanation of the correct sequence`,
    user: `Generate a sorting question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "Arrange the following items in the correct order (specify criteria):",
  "options": [
    {"text": "First item", "isCorrect": true},
    {"text": "Second item", "isCorrect": true},
    {"text": "Third item", "isCorrect": true},
    {"text": "Fourth item", "isCorrect": true}
  ],
  "explanation": "Explanation of the correct order and why",
  "hint": "Optional hint about the ordering criteria"
}`,
  },

  NUMERIC: {
    system: `You are an expert question generator. Create numeric questions that require calculation or estimation.

Guidelines:
- Question should have a clear numerical answer
- Provide step-by-step solution method
- Include appropriate units if applicable
- Ensure calculation is appropriate for difficulty level`,
    user: `Generate a numeric question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "The question requiring a numerical answer",
  "explanation": "Step-by-step solution showing how to arrive at the answer",
  "hint": "Optional hint about the approach or formula to use"
}`,
  },

  DIAGRAM: {
    system: `You are an expert question generator. Create diagram-based questions that test visual understanding.

Guidelines:
- Question should reference visual elements or spatial relationships
- Provide clear description of what students should identify
- Focus on understanding of structures, processes, or relationships
- Explain what the correct identification demonstrates`,
    user: `Generate a diagram-based question about: {{topic}}

Context: {{context}}
Difficulty: {{difficulty}} ({{difficultyDescription}})
Language: {{language}}
{{languageInstructions}}

{{customInstructions}}

Return your response in the following JSON format:
{
  "text": "Question about identifying or analyzing parts of a diagram/image",
  "explanation": "What the correct identification shows and why it's important",
  "hint": "Optional hint about what to look for in the visual"
}`,
  },
};

export function buildPrompt(
  template: PromptTemplate,
  params: {
    topic: string;
    context?: string;
    difficulty: QuestionDifficulty;
    language: string;
    customInstructions?: string;
  }
): { system: string; user: string } {
  const difficultyDescription = DIFFICULTY_DESCRIPTIONS[params.difficulty];
  const languageInstructions =
    LANGUAGE_INSTRUCTIONS[
      params.language as keyof typeof LANGUAGE_INSTRUCTIONS
    ] || LANGUAGE_INSTRUCTIONS.en;

  const replacements = {
    '{{topic}}': params.topic,
    '{{context}}': params.context || 'No additional context provided',
    '{{difficulty}}': params.difficulty,
    '{{difficultyDescription}}': difficultyDescription,
    '{{language}}': params.language,
    '{{languageInstructions}}': languageInstructions,
    '{{customInstructions}}': params.customInstructions || '',
  };

  let userPrompt = template.user;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    system: template.system,
    user: userPrompt,
  };
}
