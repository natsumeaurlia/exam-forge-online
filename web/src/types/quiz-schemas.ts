import { z } from 'zod';
import {
  QuizStatus,
  ScoringType,
  SharingMode,
  QuestionType,
} from '@prisma/client';

// ============================================
// 基本的な共通スキーマ
// ============================================

export const idSchema = z.string();

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// ============================================
// クイズ関連スキーマ
// ============================================

// クイズ作成スキーマ（クライアント・サーバー共通）
export const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  scoringType: z.nativeEnum(ScoringType),
  sharingMode: z.nativeEnum(SharingMode),
  password: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val)),
});

// クイズ作成フォーム用スキーマ（パスワード検証付き）
export const createQuizFormSchema = createQuizSchema.refine(
  data => {
    if (data.sharingMode === SharingMode.PASSWORD) {
      return !!data.password && data.password.length >= 4;
    }
    return true;
  },
  {
    message: 'パスワードは4文字以上で設定してください',
    path: ['password'],
  }
);

// クイズ更新スキーマ
export const updateQuizSchema = z.object({
  id: idSchema,
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional(),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  coverImage: z.string().optional(),
  subdomain: z
    .string()
    .min(3, 'サブドメインは3文字以上必要です')
    .max(30, 'サブドメインは30文字以下にしてください')
    .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です')
    .optional(),
  timeLimit: z.number().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  maxAttempts: z.number().min(1).optional(),
});

// クイズ削除スキーマ
export const deleteQuizSchema = z.object({
  id: idSchema,
});

// クイズ公開スキーマ
export const publishQuizSchema = z.object({
  id: idSchema,
  subdomain: z
    .string()
    .min(3, 'サブドメインは3文字以上必要です')
    .max(30, 'サブドメインは30文字以下にしてください')
    .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です'),
});

// クイズ一覧取得スキーマ
export const getQuizzesSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(QuizStatus).optional(),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'responseCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tags: z.array(z.string()).optional(),
});

// サブドメインチェックスキーマ
export const checkSubdomainSchema = z.object({
  subdomain: z.string(),
});

// ============================================
// 問題関連スキーマ
// ============================================

// 問題タイプごとの正解スキーマ定義
export const correctAnswerSchemas = {
  TRUE_FALSE: z.boolean(),
  MULTIPLE_CHOICE: z.string(),
  CHECKBOX: z.array(z.string()),
  SHORT_ANSWER: z.string(),
  SORTING: z.array(z.string()),
  FILL_IN_BLANK: z.record(z.string(), z.string()),
  DIAGRAM: z.object({
    x: z.number(),
    y: z.number(),
    label: z.string(),
  }),
  MATCHING: z.record(z.string(), z.string()),
  NUMERIC: z.number(),
} as const;

// 統合されたcorrectAnswerスキーマ
export const correctAnswerSchema = z.union([
  correctAnswerSchemas.TRUE_FALSE,
  correctAnswerSchemas.MULTIPLE_CHOICE,
  correctAnswerSchemas.CHECKBOX,
  correctAnswerSchemas.SHORT_ANSWER,
  correctAnswerSchemas.SORTING,
  correctAnswerSchemas.FILL_IN_BLANK,
  correctAnswerSchemas.DIAGRAM,
  correctAnswerSchemas.MATCHING,
  correctAnswerSchemas.NUMERIC,
]);

// 選択肢スキーマ
export const questionOptionSchema = z.object({
  text: z.string().min(1, '選択肢は必須です'),
  isCorrect: z.boolean().default(false),
});

export const questionOptionWithIdSchema = questionOptionSchema.extend({
  id: z.string().optional(),
});

// 問題追加スキーマ
export const addQuestionSchema = z.object({
  quizId: idSchema,
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1, '問題文は必須です'),
  points: z.number().min(1).default(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
  correctAnswer: correctAnswerSchema.optional(),
  sectionId: z.string().optional(),
});

// 問題更新スキーマ
export const updateQuestionSchema = z.object({
  id: idSchema,
  text: z.string().min(1, '問題文は必須です').optional(),
  points: z.number().min(1).optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  mediaUrl: z.string().url().optional().nullable(),
  mediaType: z.string().optional().nullable(),
  correctAnswer: correctAnswerSchema.optional(),
  options: z.array(questionOptionWithIdSchema).optional(),
});

// 問題削除スキーマ
export const deleteQuestionSchema = z.object({
  id: idSchema,
});

// 問題順序変更スキーマ
export const reorderQuestionsSchema = z.object({
  quizId: idSchema,
  questionIds: z.array(idSchema),
});

// クイズ全体保存スキーマ（自動保存用）
export const saveQuizWithQuestionsSchema = z.object({
  id: idSchema,
  title: z.string().min(1, 'タイトルは必須です').max(200),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  coverImage: z.string().optional(),
  subdomain: z.string().optional(),
  timeLimit: z.number().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  maxAttempts: z.number().min(1).optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.nativeEnum(QuestionType),
      text: z.string(),
      points: z.number().min(1),
      hint: z.string().optional().nullable(),
      explanation: z.string().optional().nullable(),
      correctAnswer: correctAnswerSchema.optional().nullable(),
      isRequired: z.boolean(),
      order: z.number(),
      options: z
        .array(
          z.object({
            id: z.string().optional(),
            text: z.string(),
            isCorrect: z.boolean(),
            order: z.number(),
          })
        )
        .optional(),
      media: z
        .array(
          z.object({
            id: z.string().optional(),
            url: z.string(),
            type: z.enum(['IMAGE', 'VIDEO', 'AUDIO']),
          })
        )
        .optional(),
    })
  ),
});

// ============================================
// タグ関連スキーマ
// ============================================

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名は必須です')
    .max(50, 'タグ名は50文字以内で入力してください'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '有効な色コードを入力してください')
    .optional(),
});

export const updateTagSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .min(1, 'タグ名は必須です')
    .max(50, 'タグ名は50文字以内で入力してください')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '有効な色コードを入力してください')
    .optional(),
});

export const deleteTagSchema = z.object({
  id: idSchema,
});

export const addTagToQuizSchema = z.object({
  quizId: idSchema,
  tagId: idSchema,
});

export const removeTagFromQuizSchema = z.object({
  quizId: idSchema,
  tagId: idSchema,
});

export const getTagsSchema = z.object({});

// ============================================
// 型エクスポート
// ============================================

// クイズ関連
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type CreateQuizFormData = z.infer<typeof createQuizFormSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type DeleteQuizInput = z.infer<typeof deleteQuizSchema>;
export type PublishQuizInput = z.infer<typeof publishQuizSchema>;
export type GetQuizzesInput = z.infer<typeof getQuizzesSchema>;

// 問題関連
export type CorrectAnswerType = z.infer<typeof correctAnswerSchema>;
export type TrueFalseAnswer = z.infer<typeof correctAnswerSchemas.TRUE_FALSE>;
export type MultipleChoiceAnswer = z.infer<
  typeof correctAnswerSchemas.MULTIPLE_CHOICE
>;
export type CheckboxAnswer = z.infer<typeof correctAnswerSchemas.CHECKBOX>;
export type ShortAnswer = z.infer<typeof correctAnswerSchemas.SHORT_ANSWER>;
export type SortingAnswer = z.infer<typeof correctAnswerSchemas.SORTING>;
export type FillInBlankAnswer = z.infer<
  typeof correctAnswerSchemas.FILL_IN_BLANK
>;
export type DiagramAnswer = z.infer<typeof correctAnswerSchemas.DIAGRAM>;
export type MatchingAnswer = z.infer<typeof correctAnswerSchemas.MATCHING>;
export type NumericAnswer = z.infer<typeof correctAnswerSchemas.NUMERIC>;

export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type DeleteQuestionInput = z.infer<typeof deleteQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
export type SaveQuizWithQuestionsInput = z.infer<
  typeof saveQuizWithQuestionsSchema
>;

// タグ関連
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type AddTagToQuizInput = z.infer<typeof addTagToQuizSchema>;
export type RemoveTagFromQuizInput = z.infer<typeof removeTagFromQuizSchema>;
