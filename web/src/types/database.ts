import { QuestionType, QuestionDifficulty } from '@prisma/client';

// Type-safe database query builder types
export interface BankQuestionWhereClause {
  teamId: string;
  text?: {
    contains: string;
    mode: 'insensitive';
  };
  categoryId?: string;
  categories?: {
    some: {
      categoryId: {
        in: string[];
      };
    };
  };
  difficulty?: QuestionDifficulty;
  type?: QuestionType;
  tags?: {
    some: {
      tagId: {
        in: string[];
      };
    };
  };
}

export interface BankQuestionOrderBy {
  createdAt?: 'asc' | 'desc';
  difficulty?: 'asc' | 'desc';
  type?: 'asc' | 'desc';
}

export interface AnalyticsWhereClause {
  quizId: string;
  completedAt?: {
    gte?: Date;
    lte?: Date;
  };
  user?: {
    id?: string;
  };
}

export interface ExportWhereClause {
  quizId: string;
  completedAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface TemplateUpdateData {
  title?: string;
  description?: string;
  category?: string;
  thumbnail?: string;
  coverImage?: string;
  estimatedTime?: number;
  difficulty?: QuestionDifficulty;
  isPublic?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
  settings?: Record<string, any>;
  questions?: any;
}

export interface TemplateWhereClause {
  teamId?: string;
  OR?: Array<{
    teamId?: string;
    isPublic?: boolean;
    title?: {
      contains: string;
      mode: 'insensitive';
    };
    description?: {
      contains: string;
      mode: 'insensitive';
    };
  }>;
  title?: {
    contains: string;
    mode: 'insensitive';
  };
  category?: string;
  difficulty?: QuestionDifficulty;
  isPublic?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
  tags?: {
    some: {
      tagId: {
        in: string[];
      };
    };
  };
}
