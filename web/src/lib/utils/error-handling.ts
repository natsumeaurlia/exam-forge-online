/**
 * クイズ回答機能のエラーハンドリングユーティリティ
 * ユーザーフレンドリーなエラーメッセージとリトライ機能を提供
 */

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  retryDelay?: number;
  action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  code?: string | number;
  technicalMessage?: string;
  timestamp?: string;
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * エラーを分析して適切なErrorInfoを返す
 */
export function analyzeError(error: any): ErrorInfo {
  // ネットワークエラーの検出
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: error.message,
      userMessage:
        'ネットワーク接続に問題があります。インターネット接続を確認してください。',
      canRetry: true,
      retryDelay: 3000,
      action: 'retry',
      severity: 'medium',
      code: 'NETWORK_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // タイムアウトエラー
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: error.message,
      userMessage: '処理に時間がかかりすぎています。もう一度お試しください。',
      canRetry: true,
      retryDelay: 2000,
      action: 'retry',
      severity: 'medium',
      code: 'TIMEOUT_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // 認証エラー
  if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
    return {
      type: ErrorType.AUTHENTICATION_ERROR,
      message: error.message,
      userMessage: 'セッションが期限切れです。ページを再読み込みしてください。',
      canRetry: false,
      action: 'reload',
      severity: 'high',
      code: 'AUTH_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // 権限エラー
  if (error?.status === 403 || error?.message?.includes('Forbidden')) {
    return {
      type: ErrorType.PERMISSION_ERROR,
      message: error.message,
      userMessage: 'このクイズにアクセスする権限がありません。',
      canRetry: false,
      severity: 'high',
      code: 'PERM_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // バリデーションエラー
  if (error?.status === 400 || error?.validationErrors) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message: error.message,
      userMessage: '入力内容に問題があります。必須項目をご確認ください。',
      canRetry: false,
      severity: 'medium',
      code: 'VALID_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // データベースエラー
  if (
    error?.message?.includes('database') ||
    error?.message?.includes('connection')
  ) {
    return {
      type: ErrorType.DATABASE_ERROR,
      message: error.message,
      userMessage:
        'サーバーで一時的な問題が発生しています。しばらく時間をおいてからお試しください。',
      canRetry: true,
      retryDelay: 5000,
      action: 'retry',
      severity: 'high',
      code: 'DB_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // オフラインエラー
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      type: ErrorType.OFFLINE_ERROR,
      message: 'Offline',
      userMessage:
        'インターネット接続が切断されています。回答は自動保存されました。',
      canRetry: true,
      retryDelay: 1000,
      action: 'auto_save',
      severity: 'medium',
      code: 'OFFLINE_001',
      technicalMessage: 'Navigator offline detected',
      timestamp: new Date().toISOString(),
    };
  }

  // サーバーエラー
  if (error?.status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: error.message,
      userMessage:
        'サーバーで問題が発生しています。しばらく時間をおいてからお試しください。',
      canRetry: true,
      retryDelay: 10000,
      action: 'retry',
      severity: 'critical',
      code: error?.status || 'SERVER_001',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // 不明なエラー
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error?.message || '不明なエラー',
    userMessage:
      '予期しない問題が発生しました。ページを再読み込みするか、サポートにお問い合わせください。',
    canRetry: true,
    retryDelay: 3000,
    action: 'retry',
    severity: 'medium',
    code: 'UNKNOWN_001',
    technicalMessage: error?.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 自動リトライを実行
 */
export async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  multiplier: number = 2
): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 最後の試行の場合はエラーをthrow
      if (attempt === maxRetries) {
        throw error;
      }

      // エクスポネンシャルバックオフ
      const delay = baseDelay * Math.pow(multiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * ローカルストレージに回答を保存
 */
export function saveAnswersToLocal(
  quizId: string,
  answers: any,
  participantInfo?: any
) {
  try {
    const saveData = {
      quizId,
      answers,
      participantInfo,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(`quiz_backup_${quizId}`, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.warn('回答の自動保存に失敗しました:', error);
    return false;
  }
}

/**
 * ローカルストレージから回答を復元
 */
export function restoreAnswersFromLocal(quizId: string) {
  try {
    const saved = localStorage.getItem(`quiz_backup_${quizId}`);
    if (saved) {
      const data = JSON.parse(saved);
      // 1時間以内の保存データのみ復元
      const saveTime = new Date(data.timestamp).getTime();
      const now = new Date().getTime();
      if (now - saveTime < 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.warn('回答の復元に失敗しました:', error);
    return null;
  }
}

/**
 * 保存された回答をクリーンアップ
 */
export function clearSavedAnswers(quizId: string) {
  try {
    localStorage.removeItem(`quiz_backup_${quizId}`);
  } catch (error) {
    console.warn('保存データの削除に失敗しました:', error);
  }
}

/**
 * オンライン状態の監視
 */
export function createOnlineStatusMonitor(
  callback: (isOnline: boolean) => void
) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 初期状態をチェック
  if (typeof navigator !== 'undefined') {
    callback(navigator.onLine);
  }

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
