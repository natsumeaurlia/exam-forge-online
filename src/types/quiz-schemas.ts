import { z } from 'zod';

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

// 型エクスポート
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
