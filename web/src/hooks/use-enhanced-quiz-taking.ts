import { useState, useEffect, useCallback, useRef } from 'react';
import { useAction } from 'next-safe-action/hooks';
import {
  analyzeError,
  retryWithBackoff,
  saveAnswersToLocal,
  restoreAnswersFromLocal,
  clearSavedAnswers,
  createOnlineStatusMonitor,
  ErrorInfo,
  ErrorType,
} from '@/lib/utils/error-handling';
import { submitQuizResponse } from '@/lib/actions/quiz-response';

interface Answer {
  questionId: string;
  answer: any;
}

interface ParticipantInfo {
  name: string;
  email: string;
}

export function useEnhancedQuizTaking(
  quizId: string,
  onSuccess?: (responseId: string) => void
) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo>({
    name: '',
    email: '',
  });
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [retryCount, setRetryCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    'saved' | 'saving' | 'error' | null
  >(null);

  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // オンライン状態の監視
  useEffect(() => {
    const cleanup = createOnlineStatusMonitor(online => {
      setIsOnline(online);
      if (online && error?.type === ErrorType.OFFLINE_ERROR) {
        setError(null);
      }
    });

    return cleanup;
  }, [error]);

  // 自動保存機能
  const autoSave = useCallback(() => {
    if (Object.keys(answers).length > 0) {
      setAutoSaveStatus('saving');
      const saved = saveAnswersToLocal(quizId, answers, participantInfo);
      setAutoSaveStatus(saved ? 'saved' : 'error');

      // 3秒後にステータスをクリア
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus(null);
      }, 3000);
    }
  }, [answers, participantInfo, quizId]);

  // 定期的な自動保存
  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [autoSave]);

  // 保存データの復元
  useEffect(() => {
    const restored = restoreAnswersFromLocal(quizId);
    if (restored) {
      setAnswers(restored.answers || {});
      setParticipantInfo(restored.participantInfo || { name: '', email: '' });
    }
  }, [quizId]);

  const { execute: executeSubmit, isExecuting: submitting } = useAction(
    submitQuizResponse,
    {
      onSuccess: ({ data }) => {
        if (data && data.success && data.data) {
          clearSavedAnswers(quizId);
          setError(null);
          setRetryCount(0);
          if (onSuccess) {
            onSuccess(data.data.id);
          }
        } else if (data && data.error) {
          const errorInfo = analyzeError({ message: data.error });
          setError(errorInfo);
        }
      },
      onError: ({ error: actionError }) => {
        const errorInfo = analyzeError(actionError);
        setError(errorInfo);

        // 自動リトライ可能なエラーの場合
        if (errorInfo.canRetry && retryCount < 3) {
          const delay = errorInfo.retryDelay || 3000;
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            handleRetry();
          }, delay);
        }
      },
    }
  );

  const handleRetry = useCallback(() => {
    if (error && error.canRetry) {
      setError(null);
      // 最後の送信を再実行（実際の送信データは親コンポーネントから提供）
    }
  }, [error]);

  const enhancedSubmit = useCallback(
    async (submitData: any) => {
      try {
        // オフライン時は自動保存のみ
        if (!isOnline) {
          autoSave();
          setError({
            type: ErrorType.OFFLINE_ERROR,
            message: 'Offline',
            userMessage:
              'オフラインです。回答は自動保存されました。オンライン時に自動送信されます。',
            canRetry: true,
            action: 'auto_save',
          });
          return;
        }

        // リトライ機能付きで送信
        await retryWithBackoff(async () => {
          return executeSubmit(submitData);
        }, 3);
      } catch (finalError) {
        const errorInfo = analyzeError(finalError);
        setError(errorInfo);

        // 送信失敗時も自動保存
        autoSave();
      }
    },
    [isOnline, executeSubmit, autoSave]
  );

  const updateAnswer = useCallback(
    (questionId: string, answer: any) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          questionId,
          answer,
        },
      }));

      // 回答変更時に自動保存
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(autoSave, 1000);
    },
    [autoSave]
  );

  const updateParticipantInfo = useCallback(
    (info: Partial<ParticipantInfo>) => {
      setParticipantInfo(prev => ({ ...prev, ...info }));
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const forceRetry = useCallback(() => {
    if (error && error.canRetry) {
      clearError();
      handleRetry();
    }
  }, [error, clearError, handleRetry]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    answers,
    participantInfo,
    error,
    isOnline,
    submitting,
    retryCount,
    autoSaveStatus,
    updateAnswer,
    updateParticipantInfo,
    enhancedSubmit,
    clearError,
    forceRetry,
    autoSave,
  };
}
