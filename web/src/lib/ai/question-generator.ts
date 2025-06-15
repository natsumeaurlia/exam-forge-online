'use server';

import { QuestionType, QuestionDifficulty } from '@prisma/client';

export interface AIQuestionGenerationParams {
  topic: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  count: number;
  additionalContext?: string;
  language?: 'ja' | 'en';
}

export interface GeneratedQuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  points: number;
  difficulty: QuestionDifficulty;
  hint?: string;
  explanation?: string;
  options?: GeneratedQuestionOption[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateQuestionsWithAI(
  params: AIQuestionGenerationParams
): Promise<GeneratedQuestion[]> {
  const {
    topic,
    questionType,
    difficulty,
    count,
    additionalContext,
    language = 'ja',
  } = params;

  // If no API key is configured, fall back to mock generation
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using mock generation');
    return generateMockQuestions(params);
  }

  try {
    const systemPrompt =
      language === 'ja'
        ? getJapaneseSystemPrompt(questionType, difficulty)
        : getEnglishSystemPrompt(questionType, difficulty);

    const userPrompt =
      language === 'ja'
        ? getJapaneseUserPrompt(topic, count, additionalContext)
        : getEnglishUserPrompt(topic, count, additionalContext);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // Parse the JSON response from the AI
    const parsedQuestions = JSON.parse(content);

    // Validate and format the questions
    return validateAndFormatQuestions(
      parsedQuestions,
      questionType,
      difficulty
    );
  } catch (error) {
    console.error('AI question generation failed:', error);
    // Fall back to mock generation on error
    return generateMockQuestions(params);
  }
}

function getJapaneseSystemPrompt(
  type: QuestionType,
  difficulty: QuestionDifficulty
): string {
  const difficultyText = {
    EASY: '初級',
    MEDIUM: '中級',
    HARD: '上級',
  }[difficulty];

  const typeInstructions = {
    SINGLE_CHOICE: '1つの正解選択肢を含む4つの選択肢を作成してください。',
    MULTIPLE_CHOICE: '複数の正解選択肢を含む4つの選択肢を作成してください。',
    TRUE_FALSE: '正誤問題として、適切な文章を作成してください。',
    SHORT_ANSWER: '短答問題として、明確な答えを求める問題を作成してください。',
  }[type];

  return `あなたは教育専門家です。指定されたトピックについて、${difficultyText}レベルの${typeInstructions}

以下のJSON形式で回答してください：
[
  {
    "text": "問題文",
    "hint": "ヒント（オプション）",
    "explanation": "解説",
    "options": [
      {"text": "選択肢1", "isCorrect": true},
      {"text": "選択肢2", "isCorrect": false},
      {"text": "選択肢3", "isCorrect": false},
      {"text": "選択肢4", "isCorrect": false}
    ]
  }
]

注意事項：
- 問題文は明確で具体的にする
- 選択肢がある場合は4つ作成する
- 短答問題の場合はoptionsは不要
- ヒントと解説は教育的価値のある内容にする
- ${difficultyText}レベルに適した難易度にする`;
}

function getEnglishSystemPrompt(
  type: QuestionType,
  difficulty: QuestionDifficulty
): string {
  const difficultyText = {
    EASY: 'beginner',
    MEDIUM: 'intermediate',
    HARD: 'advanced',
  }[difficulty];

  const typeInstructions = {
    SINGLE_CHOICE: 'Create 4 options with 1 correct answer.',
    MULTIPLE_CHOICE: 'Create 4 options with multiple correct answers.',
    TRUE_FALSE: 'Create a true/false statement.',
    SHORT_ANSWER: 'Create a short answer question requiring a specific answer.',
  }[type];

  return `You are an education expert. Create ${difficultyText} level questions about the specified topic. ${typeInstructions}

Respond in the following JSON format:
[
  {
    "text": "Question text",
    "hint": "Hint (optional)",
    "explanation": "Explanation",
    "options": [
      {"text": "Option 1", "isCorrect": true},
      {"text": "Option 2", "isCorrect": false},
      {"text": "Option 3", "isCorrect": false},
      {"text": "Option 4", "isCorrect": false}
    ]
  }
]

Requirements:
- Make questions clear and specific
- Create 4 options when applicable
- For short answer questions, omit options
- Provide educational hints and explanations
- Match the ${difficultyText} difficulty level`;
}

function getJapaneseUserPrompt(
  topic: string,
  count: number,
  additionalContext?: string
): string {
  let prompt = `トピック: ${topic}\n問題数: ${count}`;

  if (additionalContext) {
    prompt += `\n追加情報: ${additionalContext}`;
  }

  return prompt;
}

function getEnglishUserPrompt(
  topic: string,
  count: number,
  additionalContext?: string
): string {
  let prompt = `Topic: ${topic}\nNumber of questions: ${count}`;

  if (additionalContext) {
    prompt += `\nAdditional context: ${additionalContext}`;
  }

  return prompt;
}

function validateAndFormatQuestions(
  questions: any[],
  expectedType: QuestionType,
  expectedDifficulty: QuestionDifficulty
): GeneratedQuestion[] {
  return questions.map((q, index) => ({
    type: expectedType,
    text: q.text || `Generated question ${index + 1}`,
    points: 1,
    difficulty: expectedDifficulty,
    hint: q.hint || undefined,
    explanation: q.explanation || undefined,
    options:
      q.options?.map((opt: any) => ({
        text: opt.text || '',
        isCorrect: Boolean(opt.isCorrect),
      })) || undefined,
  }));
}

function generateMockQuestions(
  params: AIQuestionGenerationParams
): GeneratedQuestion[] {
  const { topic, questionType, difficulty, count, language = 'ja' } = params;

  return Array.from({ length: count }, (_, i) => {
    const questionNumber = i + 1;
    const isJapanese = language === 'ja';

    const text = isJapanese
      ? `${topic}に関する問題 ${questionNumber}: サンプル問題文です。`
      : `Question ${questionNumber} about ${topic}: This is a sample question.`;

    const hint = isJapanese
      ? `${topic}について考えてみてください。`
      : `Think about ${topic}.`;

    const explanation = isJapanese
      ? `この問題の解説: ${topic}に関する重要なポイントです。`
      : `Explanation: This covers important points about ${topic}.`;

    const options =
      questionType !== 'SHORT_ANSWER'
        ? [
            {
              text: isJapanese ? '選択肢A' : 'Option A',
              isCorrect: i % 3 === 0,
            },
            {
              text: isJapanese ? '選択肢B' : 'Option B',
              isCorrect: i % 3 === 1,
            },
            {
              text: isJapanese ? '選択肢C' : 'Option C',
              isCorrect: i % 3 === 2,
            },
            {
              text: isJapanese ? '選択肢D' : 'Option D',
              isCorrect: false,
            },
          ]
        : undefined;

    return {
      type: questionType,
      text,
      points: 1,
      difficulty,
      hint,
      explanation,
      options,
    };
  });
}
