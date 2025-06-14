import { z } from 'zod';

// Create template schema
export const createTemplateSchema = z.object({
  title: z
    .string()
    .min(1, '題名は必須です')
    .max(200, '題名は200文字以内で入力してください'),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
  thumbnail: z.string().optional(),
  questions: z.array(z.any()), // JSON array of question objects
  settings: z.record(z.any()), // JSON object for quiz settings
  tagIds: z.array(z.string()).optional(),
});

// Update template schema
export const updateTemplateSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, '題名は必須です')
    .max(200, '題名は200文字以内で入力してください')
    .optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional(),
  questions: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  tagIds: z.array(z.string()).optional(),
});

// Delete template schema
export const deleteTemplateSchema = z.object({
  id: z.string(),
});

// Get templates schema
export const getTemplatesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'usageCount'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tagIds: z.array(z.string()).optional(),
});

// Create template from quiz schema
export const createTemplateFromQuizSchema = z.object({
  quizId: z.string(),
  title: z
    .string()
    .min(1, '題名は必須です')
    .max(200, '題名は200文字以内で入力してください'),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
});

// Create quiz from template schema
export const createQuizFromTemplateSchema = z.object({
  templateId: z.string(),
  title: z
    .string()
    .min(1, '題名は必須です')
    .max(200, '題名は200文字以内で入力してください'),
  description: z.string().optional(),
});

// Template statistics schema
export const getTemplateStatsSchema = z.object({
  id: z.string(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type GetTemplatesInput = z.infer<typeof getTemplatesSchema>;
export type CreateTemplateFromQuizInput = z.infer<
  typeof createTemplateFromQuizSchema
>;
export type CreateQuizFromTemplateInput = z.infer<
  typeof createQuizFromTemplateSchema
>;
export type GetTemplateStatsInput = z.infer<typeof getTemplateStatsSchema>;
