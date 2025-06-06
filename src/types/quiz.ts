import {
  Quiz,
  Question,
  QuestionOption,
  QuizResponse,
  QuestionResponse,
  Tag,
  QuizTag,
  Section,
} from '@prisma/client';

// 基本的なクイズ型
export type QuizWithDetails = Quiz & {
  questions: (Question & {
    options: QuestionOption[];
  })[];
  tags: (QuizTag & {
    tag: Tag;
  })[];
  sections: Section[];
  _count: {
    questions: number;
    responses: number;
  };
};

// クイズ一覧用の型
export type QuizListItem = Quiz & {
  tags: (QuizTag & {
    tag: Tag;
  })[];
  _count: {
    questions: number;
    responses: number;
  };
};

// 問題詳細型
export type QuestionWithOptions = Question & {
  options: QuestionOption[];
};

// クイズ回答型
export type QuizResponseWithDetails = QuizResponse & {
  responses: (QuestionResponse & {
    question: Question;
  })[];
};

// ページネーション型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// クイズ一覧レスポンス型
export interface QuizzesResponse {
  quizzes: QuizListItem[];
  pagination: Pagination;
}

// フィルター・ソート型
export interface QuizFilters {
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'responseCount';
  sortOrder?: 'asc' | 'desc';
}

// クイズ作成フォーム型
export interface CreateQuizForm {
  title: string;
  description?: string;
  scoringType: 'AUTO' | 'MANUAL';
  sharingMode: 'URL' | 'PASSWORD';
  password?: string;
}

// クイズ更新フォーム型
export interface UpdateQuizForm {
  title?: string;
  description?: string;
  passingScore?: number;
  coverImage?: string;
  subdomain?: string;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  maxAttempts?: number;
}

// 問題作成フォーム型
export interface CreateQuestionForm {
  type:
    | 'TRUE_FALSE'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOX'
    | 'SHORT_ANSWER'
    | 'SORTING'
    | 'FILL_IN_BLANK'
    | 'DIAGRAM'
    | 'MATCHING'
    | 'NUMERIC';
  text: string;
  points: number;
  hint?: string;
  explanation?: string;
  options?: {
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer?: any;
  sectionId?: string;
}

// 問題更新フォーム型
export interface UpdateQuestionForm {
  text?: string;
  points?: number;
  hint?: string;
  explanation?: string;
  correctAnswer?: any;
  options?: {
    id?: string;
    text: string;
    isCorrect: boolean;
  }[];
}

// タグ型
export type TagWithCount = Tag & {
  _count: {
    quizzes: number;
  };
};

// 公開設定型
export interface PublishSettings {
  subdomain: string;
}

// サブドメイン可用性チェック型
export interface SubdomainAvailability {
  available: boolean;
}

// Server Action レスポンス型
export interface ActionResponse<T = any> {
  data?: T;
  serverError?: string;
  validationErrors?: Record<string, string[]>;
}

// クイズタイプ選択用の型
export interface QuizTypeProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  featureInfo?: Record<string, boolean>;
  proOnly?: boolean;
}
