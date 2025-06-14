import type {
  QuizTemplate,
  TemplateTag,
  Tag,
  User,
  Team,
} from '@prisma/client';

// Template with relations for list display
export type TemplateListItem = QuizTemplate & {
  _count: {
    tags: number;
  };
  tags: (TemplateTag & {
    tag: Tag;
  })[];
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  };
};

// Template with full relations for detailed view
export type TemplateWithRelations = QuizTemplate & {
  tags: (TemplateTag & {
    tag: Tag;
  })[];
  createdBy: User;
  team: Team;
};

// Template statistics
export type TemplateStats = {
  id: string;
  usageCount: number;
  createdCount: number; // How many quizzes created from this template
  lastUsed: Date | null;
};

// Template categories
export const TEMPLATE_CATEGORIES = [
  'education',
  'business',
  'training',
  'assessment',
  'survey',
  'certification',
  'onboarding',
  'compliance',
  'feedback',
  'general',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// Template content structure
export interface TemplateQuestionData {
  type: string;
  text: string;
  points: number;
  order: number;
  hint?: string;
  explanation?: string;
  correctAnswer?: any;
  gradingCriteria?: string;
  isRequired: boolean;
  difficultyLevel?: string;
  options?: Array<{
    text: string;
    order: number;
    isCorrect: boolean;
  }>;
  media?: Array<{
    url: string;
    type: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    order: number;
  }>;
}

export interface TemplateSettings {
  timeLimit?: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts?: number;
  sharingMode: string;
  password?: string;
  difficultyLevel?: string;
}

// Template search filters
export interface TemplateFilters {
  search?: string;
  category?: string;
  isPublic?: boolean;
  tagIds?: string[];
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Template creation payload
export interface CreateTemplatePayload {
  title: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  thumbnail?: string;
  questions: TemplateQuestionData[];
  settings: TemplateSettings;
  tagIds?: string[];
}
