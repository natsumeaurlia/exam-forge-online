/**
 * Quiz-specific error handling utilities for Issue #223
 * Unified error handling for quiz response submission and validation
 */

import { analyzeError, ErrorInfo } from './error-handling';

// Quiz-specific error types
export enum QuizErrorType {
  QUIZ_NOT_FOUND = 'QUIZ_NOT_FOUND',
  QUIZ_NOT_PUBLISHED = 'QUIZ_NOT_PUBLISHED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  MAX_ATTEMPTS_REACHED = 'MAX_ATTEMPTS_REACHED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SUBMISSION_TIMEOUT = 'SUBMISSION_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CONCURRENT_SUBMISSION = 'CONCURRENT_SUBMISSION',
  INVALID_ANSWER_FORMAT = 'INVALID_ANSWER_FORMAT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DUPLICATE_SUBMISSION = 'DUPLICATE_SUBMISSION',
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUIZ_ACCESS_DENIED = 'QUIZ_ACCESS_DENIED',
  SUBMISSION_SIZE_EXCEEDED = 'SUBMISSION_SIZE_EXCEEDED',
}

export interface QuizErrorInfo extends ErrorInfo {
  quizErrorType: QuizErrorType;
  actionType?: 'submit' | 'validate' | 'load' | 'retry';
  retryable: boolean;
  retryDelay?: number;
  maxRetries?: number;
  requiresAuth?: boolean;
  userActionRequired?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  code?: string;
  technicalMessage?: string;
  timestamp?: string;
  correlationId?: string;
  additionalContext?: Record<string, any>;
  recoveryStrategies?: Array<'retry' | 'refresh' | 'login' | 'offline'>;
  notificationLevel?: 'none' | 'toast' | 'modal' | 'alert';
}

/**
 * Analyze and classify quiz-specific errors
 */
export function analyzeQuizError(
  error: any,
  context?: {
    action?: string;
    quizId?: string;
    userId?: string;
  }
): QuizErrorInfo {
  const baseError = analyzeError(error);
  const errorMessage = error?.message || error?.toString() || '';

  // Generate correlation ID for error tracking
  const correlationId = `qe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Default quiz error info
  let quizErrorInfo: QuizErrorInfo = {
    ...baseError,
    quizErrorType: QuizErrorType.SERVER_ERROR,
    retryable: false,
    severity: 'critical',
    code: 'UNKNOWN_ERROR',
    technicalMessage: errorMessage,
    timestamp: new Date().toISOString(),
    correlationId,
    additionalContext: {
      action: context?.action,
      quizId: context?.quizId,
      userId: context?.userId,
    },
    recoveryStrategies: ['retry'],
    notificationLevel: 'modal',
  };

  // Quiz-specific error classification
  if (
    errorMessage.includes('クイズが見つからない') ||
    errorMessage.includes('Quiz not found')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.QUIZ_NOT_FOUND,
      userMessage: 'このクイズは存在しないか削除されています。',
      technicalMessage: 'Quiz not found or has been deleted',
      retryable: false,
      userActionRequired: 'クイズ一覧に戻って、他のクイズを選択してください。',
    };
  } else if (
    errorMessage.includes('公開されていません') ||
    errorMessage.includes('not published')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.QUIZ_NOT_PUBLISHED,
      userMessage: 'このクイズはまだ公開されていません。',
      technicalMessage: 'Quiz is not in published status',
      retryable: false,
      userActionRequired: 'クイズの公開をお待ちください。',
    };
  } else if (
    errorMessage.includes('認証が必要') ||
    errorMessage.includes('Authentication required')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.AUTHENTICATION_REQUIRED,
      userMessage: 'このクイズを受けるにはログインが必要です。',
      technicalMessage: 'User authentication required for this quiz',
      retryable: true,
      requiresAuth: true,
      userActionRequired: 'ログインしてからもう一度お試しください。',
    };
  } else if (
    errorMessage.includes('回答回数の上限') ||
    errorMessage.includes('Maximum attempts')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.MAX_ATTEMPTS_REACHED,
      userMessage: 'このクイズの回答回数上限に達しています。',
      technicalMessage: 'User has reached maximum attempts for this quiz',
      retryable: false,
      userActionRequired: '他のクイズをお試しください。',
    };
  } else if (
    errorMessage.includes('パスワード') ||
    errorMessage.includes('password')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.PASSWORD_REQUIRED,
      userMessage: 'このクイズにはパスワードが必要です。',
      technicalMessage: 'Quiz password verification required',
      retryable: true,
      userActionRequired: '正しいパスワードを入力してください。',
    };
  } else if (
    error?.name === 'ValidationError' ||
    errorMessage.includes('Invalid request data')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.VALIDATION_ERROR,
      userMessage: '回答データに問題があります。',
      technicalMessage: 'Answer validation failed',
      retryable: true,
      retryDelay: 1000,
      userActionRequired: '回答を確認してもう一度送信してください。',
    };
  } else if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('タイムアウト')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.SUBMISSION_TIMEOUT,
      userMessage: '送信がタイムアウトしました。',
      technicalMessage: 'Quiz submission timeout',
      retryable: true,
      retryDelay: 2000,
      maxRetries: 3,
      userActionRequired: 'しばらく待ってから再送信してください。',
    };
  } else if (baseError.type.includes('NETWORK')) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.NETWORK_ERROR,
      userMessage: 'ネットワーク接続に問題があります。',
      technicalMessage: 'Network connection error during quiz submission',
      retryable: true,
      retryDelay: 3000,
      maxRetries: 5,
      userActionRequired:
        'インターネット接続を確認してから再送信してください。',
    };
  } else if (
    errorMessage.includes('concurrent') ||
    errorMessage.includes('同時送信')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.CONCURRENT_SUBMISSION,
      userMessage: '既に送信処理中です。少々お待ちください。',
      technicalMessage: 'Concurrent submission detected',
      retryable: true,
      retryDelay: 5000,
      maxRetries: 1,
      userActionRequired: '処理が完了するまでお待ちください。',
    };
  } else if (baseError.type.includes('AUTHENTICATION')) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.SESSION_EXPIRED,
      userMessage: 'セッションが期限切れです。',
      technicalMessage: 'User session has expired',
      retryable: true,
      requiresAuth: true,
      userActionRequired: '再度ログインしてからお試しください。',
      recoveryStrategies: ['login', 'refresh'],
      notificationLevel: 'modal',
    };
  } else if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('レート制限')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.RATE_LIMIT_EXCEEDED,
      userMessage: 'リクエストが多すぎます。しばらく待ってからお試しください。',
      technicalMessage: 'Rate limit exceeded for quiz submission',
      retryable: true,
      retryDelay: 30000, // 30 seconds
      maxRetries: 2,
      severity: 'medium',
      userActionRequired: '30秒待ってから再送信してください。',
      recoveryStrategies: ['retry'],
      notificationLevel: 'toast',
    };
  } else if (
    errorMessage.includes('duplicate') ||
    errorMessage.includes('already submitted') ||
    errorMessage.includes('重複')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.DUPLICATE_SUBMISSION,
      userMessage: 'この回答は既に送信されています。',
      technicalMessage: 'Duplicate submission detected',
      retryable: false,
      severity: 'low',
      userActionRequired: '結果ページで確認してください。',
      recoveryStrategies: ['refresh'],
      notificationLevel: 'toast',
    };
  } else if (
    errorMessage.includes('database') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('データベース')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.DATABASE_ERROR,
      userMessage: 'データベース接続に問題があります。',
      technicalMessage: 'Database connection or query error',
      retryable: true,
      retryDelay: 5000,
      maxRetries: 3,
      severity: 'high',
      userActionRequired: 'しばらく待ってから再送信してください。',
      recoveryStrategies: ['retry', 'offline'],
      notificationLevel: 'modal',
    };
  } else if (
    errorMessage.includes('access denied') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('アクセス拒否')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.QUIZ_ACCESS_DENIED,
      userMessage: 'このクイズへのアクセス権限がありません。',
      technicalMessage: 'Access denied for quiz resource',
      retryable: false,
      severity: 'medium',
      userActionRequired: 'クイズの管理者に連絡してください。',
      recoveryStrategies: ['login'],
      notificationLevel: 'modal',
    };
  } else if (
    errorMessage.includes('payload too large') ||
    errorMessage.includes('request entity too large') ||
    errorMessage.includes('サイズ制限')
  ) {
    quizErrorInfo = {
      ...quizErrorInfo,
      quizErrorType: QuizErrorType.SUBMISSION_SIZE_EXCEEDED,
      userMessage: '回答データのサイズが大きすぎます。',
      technicalMessage: 'Submission payload size exceeded limit',
      retryable: false,
      severity: 'medium',
      userActionRequired: '回答内容を短くしてから再送信してください。',
      recoveryStrategies: [],
      notificationLevel: 'modal',
    };
  }

  // Set action type based on context
  if (context?.action) {
    quizErrorInfo.actionType = context.action as any;
  }

  return quizErrorInfo;
}

/**
 * Get user-friendly error message with internationalization support
 */
export function getQuizErrorMessage(
  error: QuizErrorInfo,
  locale: string = 'ja'
): {
  title: string;
  message: string;
  actionText?: string;
  actionType?: 'retry' | 'login' | 'navigate' | 'contact';
} {
  const isJapanese = locale === 'ja';

  switch (error.quizErrorType) {
    case QuizErrorType.QUIZ_NOT_FOUND:
      return {
        title: isJapanese ? 'クイズが見つかりません' : 'Quiz Not Found',
        message: isJapanese
          ? 'このクイズは存在しないか削除されています。'
          : 'This quiz does not exist or has been deleted.',
        actionText: isJapanese ? 'クイズ一覧に戻る' : 'Back to Quiz List',
        actionType: 'navigate',
      };

    case QuizErrorType.QUIZ_NOT_PUBLISHED:
      return {
        title: isJapanese ? 'クイズが未公開です' : 'Quiz Not Published',
        message: isJapanese
          ? 'このクイズはまだ公開されていません。'
          : 'This quiz has not been published yet.',
        actionText: isJapanese ? 'クイズ一覧に戻る' : 'Back to Quiz List',
        actionType: 'navigate',
      };

    case QuizErrorType.AUTHENTICATION_REQUIRED:
      return {
        title: isJapanese ? 'ログインが必要です' : 'Login Required',
        message: isJapanese
          ? 'このクイズを受けるにはログインが必要です。'
          : 'You need to log in to take this quiz.',
        actionText: isJapanese ? 'ログイン' : 'Login',
        actionType: 'login',
      };

    case QuizErrorType.MAX_ATTEMPTS_REACHED:
      return {
        title: isJapanese
          ? '回答回数上限に達しました'
          : 'Maximum Attempts Reached',
        message: isJapanese
          ? 'このクイズの回答回数上限に達しています。'
          : 'You have reached the maximum number of attempts for this quiz.',
        actionText: isJapanese ? '他のクイズを探す' : 'Find Other Quizzes',
        actionType: 'navigate',
      };

    case QuizErrorType.NETWORK_ERROR:
      return {
        title: isJapanese ? 'ネットワークエラー' : 'Network Error',
        message: isJapanese
          ? 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
          : 'There is a network connection problem. Please check your internet connection.',
        actionText: isJapanese ? '再送信' : 'Retry',
        actionType: 'retry',
      };

    case QuizErrorType.SUBMISSION_TIMEOUT:
      return {
        title: isJapanese ? '送信タイムアウト' : 'Submission Timeout',
        message: isJapanese
          ? '送信がタイムアウトしました。しばらく待ってから再送信してください。'
          : 'The submission timed out. Please wait a moment and try again.',
        actionText: isJapanese ? '再送信' : 'Retry',
        actionType: 'retry',
      };

    case QuizErrorType.SESSION_EXPIRED:
      return {
        title: isJapanese ? 'セッション期限切れ' : 'Session Expired',
        message: isJapanese
          ? 'セッションが期限切れです。再度ログインしてください。'
          : 'Your session has expired. Please log in again.',
        actionText: isJapanese ? 'ログイン' : 'Login',
        actionType: 'login',
      };

    case QuizErrorType.VALIDATION_ERROR:
      return {
        title: isJapanese ? '入力エラー' : 'Validation Error',
        message: isJapanese
          ? '回答データに問題があります。回答を確認してもう一度送信してください。'
          : 'There is an issue with your answer data. Please check your answers and try again.',
        actionText: isJapanese ? '再送信' : 'Retry',
        actionType: 'retry',
      };

    case QuizErrorType.RATE_LIMIT_EXCEEDED:
      return {
        title: isJapanese ? 'レート制限エラー' : 'Rate Limit Exceeded',
        message: isJapanese
          ? 'リクエストが多すぎます。しばらく待ってからお試しください。'
          : 'Too many requests. Please wait a moment and try again.',
        actionText: isJapanese ? '30秒後に再試行' : 'Retry in 30s',
        actionType: 'retry',
      };

    case QuizErrorType.DUPLICATE_SUBMISSION:
      return {
        title: isJapanese ? '重複送信エラー' : 'Duplicate Submission',
        message: isJapanese
          ? 'この回答は既に送信されています。結果ページで確認してください。'
          : 'This response has already been submitted. Please check the results page.',
        actionText: isJapanese ? '結果を確認' : 'View Results',
        actionType: 'navigate',
      };

    case QuizErrorType.DATABASE_ERROR:
      return {
        title: isJapanese ? 'データベースエラー' : 'Database Error',
        message: isJapanese
          ? 'データベース接続に問題があります。しばらく待ってからお試しください。'
          : 'There is a database connection issue. Please try again in a moment.',
        actionText: isJapanese ? '再送信' : 'Retry',
        actionType: 'retry',
      };

    case QuizErrorType.QUIZ_ACCESS_DENIED:
      return {
        title: isJapanese ? 'アクセス拒否' : 'Access Denied',
        message: isJapanese
          ? 'このクイズへのアクセス権限がありません。'
          : 'You do not have permission to access this quiz.',
        actionText: isJapanese ? 'ログイン' : 'Login',
        actionType: 'login',
      };

    case QuizErrorType.SUBMISSION_SIZE_EXCEEDED:
      return {
        title: isJapanese ? 'データサイズエラー' : 'Data Size Error',
        message: isJapanese
          ? '回答データのサイズが大きすぎます。回答内容を短くしてから再送信してください。'
          : 'The answer data is too large. Please shorten your responses and try again.',
        actionText: isJapanese ? '回答を編集' : 'Edit Answers',
        actionType: 'navigate',
      };

    default:
      return {
        title: isJapanese ? 'エラーが発生しました' : 'An Error Occurred',
        message: isJapanese
          ? '予期しないエラーが発生しました。しばらく待ってからお試しください。'
          : 'An unexpected error occurred. Please try again in a moment.',
        actionText: isJapanese ? 'サポートに連絡' : 'Contact Support',
        actionType: 'contact',
      };
  }
}

/**
 * Create standardized error response for Server Actions and API Routes
 */
export function createQuizErrorResponse(
  error: any,
  context?: {
    action?: string;
    quizId?: string;
    userId?: string;
    locale?: string;
  }
): { success: false; error: any } | { success: true; data: any } {
  const analyzedError = analyzeQuizError(error, context);
  const errorMessage = getQuizErrorMessage(analyzedError, context?.locale);

  return {
    success: false,
    error: {
      type: analyzedError.quizErrorType,
      code: analyzedError.code || 'UNKNOWN_ERROR',
      message: errorMessage.message,
      title: errorMessage.title,
      actionText: errorMessage.actionText,
      actionType: errorMessage.actionType,
      retryable: analyzedError.retryable,
      retryDelay: analyzedError.retryDelay,
      maxRetries: analyzedError.maxRetries,
      requiresAuth: analyzedError.requiresAuth,
      userActionRequired: analyzedError.userActionRequired,
      technicalMessage: analyzedError.technicalMessage || '',
      timestamp: analyzedError.timestamp || new Date().toISOString(),
    },
  };
}

/**
 * Validate quiz response data with detailed error information
 */
export function validateQuizResponseData(data: any): {
  isValid: boolean;
  errors?: QuizErrorInfo[];
} {
  const errors: QuizErrorInfo[] = [];

  if (!data.quizId || typeof data.quizId !== 'string') {
    errors.push(
      analyzeQuizError(new Error('Quiz ID is required and must be a string'))
    );
  }

  if (!data.responses || !Array.isArray(data.responses)) {
    errors.push(analyzeQuizError(new Error('Responses must be an array')));
  }

  if (!data.startedAt || !data.completedAt) {
    errors.push(
      analyzeQuizError(new Error('Start and completion times are required'))
    );
  }

  if (data.responses?.length === 0) {
    errors.push(
      analyzeQuizError(new Error('At least one response is required'))
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
