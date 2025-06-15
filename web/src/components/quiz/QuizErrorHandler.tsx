'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  RefreshCw,
  LogIn,
  ArrowLeft,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  QuizErrorInfo,
  getQuizErrorMessage,
} from '@/lib/utils/quiz-error-handling';
import { retryWithBackoff } from '@/lib/utils/error-handling';
import {
  SmartRetryManager,
  OfflineStorageManager,
  NetworkStatusManager,
  createRecoveryStrategy,
} from '@/lib/utils/quiz-error-recovery';

interface QuizErrorHandlerProps {
  error?: QuizErrorInfo | null;
  onRetry?: () => Promise<void>;
  onLogin?: () => void;
  onNavigate?: (path: string) => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
  isOnline?: boolean;
  locale?: string;
  retryAttempts?: number;
  maxRetries?: number;
  className?: string;
  // Enhanced props for recovery
  onOfflineStore?: (data: any) => Promise<boolean>;
  quizData?: any; // Quiz response data for offline storage
  enableAdvancedRecovery?: boolean;
}

export function QuizErrorHandler({
  error,
  onRetry,
  onLogin,
  onNavigate,
  onContactSupport,
  onDismiss,
  isOnline = true,
  locale = 'ja',
  retryAttempts = 0,
  maxRetries = 3,
  className,
  onOfflineStore,
  quizData,
  enableAdvancedRecovery = true,
}: QuizErrorHandlerProps) {
  const t = useTranslations('quiz.errors');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isStoringOffline, setIsStoringOffline] = useState(false);
  const [offlineStored, setOfflineStored] = useState(false);
  const [recoveryActions, setRecoveryActions] = useState<any[]>([]);

  // Enhanced recovery managers
  const [retryManager] = useState(() => new SmartRetryManager());
  const [offlineManager] = useState(() => new OfflineStorageManager());
  const [networkManager] = useState(() => new NetworkStatusManager());

  useEffect(() => {
    if (error && !isOnline) {
      toast.error(t('networkOffline'), {
        description: t('networkOfflineDescription'),
        action: {
          label: t('retry'),
          onClick: () => window.location.reload(),
        },
      });
    }
  }, [error, isOnline, t]);

  // Set up recovery strategies when error changes
  useEffect(() => {
    if (error && enableAdvancedRecovery && onRetry) {
      const strategy = createRecoveryStrategy(error, {
        retryManager,
        offlineManager,
        networkManager,
        submitFunction: onRetry,
      });
      setRecoveryActions(
        strategy.actions.sort((a, b) => a.priority - b.priority)
      );
    }
  }, [
    error,
    enableAdvancedRecovery,
    onRetry,
    retryManager,
    offlineManager,
    networkManager,
  ]);

  if (!error) return null;

  const errorMessage = getQuizErrorMessage(error, locale);
  const canRetry = error.retryable && retryAttempts < maxRetries && onRetry;

  const handleOfflineStore = async () => {
    if (!onOfflineStore || !quizData) return;

    setIsStoringOffline(true);
    try {
      const success = await onOfflineStore(quizData);
      if (success) {
        setOfflineStored(true);
        toast.success(t('offlineStoreSuccess'), {
          description: t('offlineStoreDescription'),
        });
      } else {
        throw new Error('Failed to store offline');
      }
    } catch (error) {
      toast.error(t('offlineStoreFailed'));
    } finally {
      setIsStoringOffline(false);
    }
  };

  const handleRetry = async () => {
    if (!onRetry || !canRetry) return;

    setIsRetrying(true);
    setRetryProgress(0);

    try {
      // Enhanced retry with smart retry manager
      const progressInterval = setInterval(() => {
        setRetryProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Use smart retry manager for enhanced error handling
      const correlationId = error?.correlationId || 'retry_' + Date.now();
      await retryManager.executeWithRetry(correlationId, onRetry, {
        maxRetries: error?.maxRetries || maxRetries,
        baseDelay: error?.retryDelay || 1000,
        backoffFactor: 2,
        jitter: true,
      });

      clearInterval(progressInterval);
      setRetryProgress(100);

      setTimeout(() => {
        toast.success(t('retrySuccess'));
        setIsRetrying(false);
        setRetryProgress(0);
        onDismiss?.();
      }, 500);
    } catch (retryError) {
      setIsRetrying(false);
      setRetryProgress(0);

      // Enhanced error reporting with correlation ID
      console.error('Enhanced retry failed:', {
        correlationId: error?.correlationId,
        attempts: retryManager.getAttemptCount(
          error?.correlationId || 'unknown'
        ),
        error: retryError,
      });

      toast.error(t('retryFailed'), {
        description: t('retryFailedDescription'),
      });
    }
  };

  const handleSmartRecovery = async (actionIndex: number) => {
    const action = recoveryActions[actionIndex];
    if (!action) return;

    try {
      const success = await action.execute();
      if (success) {
        toast.success(t('recoverySuccess'), {
          description: action.description,
        });
        onDismiss?.();
      } else {
        toast.error(t('recoveryFailed'));
      }
    } catch (error) {
      toast.error(t('recoveryFailed'), {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleAction = () => {
    switch (errorMessage.actionType) {
      case 'retry':
        handleRetry();
        break;
      case 'login':
        onLogin?.();
        break;
      case 'navigate':
        onNavigate?.('/dashboard');
        break;
      case 'contact':
        onContactSupport?.();
        break;
    }
  };

  const getErrorIcon = () => {
    if (isRetrying) return <RefreshCw className="h-6 w-6 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-6 w-6 text-red-500" />;

    switch (error.severity) {
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-blue-500" />;
    }
  };

  const getAlertVariant = () => {
    if (!isOnline) return 'destructive';
    return error.severity === 'critical' ? 'destructive' : 'default';
  };

  return (
    <Card
      className={`border-l-4 ${
        error.severity === 'critical'
          ? 'border-l-red-500'
          : error.severity === 'high'
            ? 'border-l-yellow-500'
            : 'border-l-blue-500'
      } ${className}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getErrorIcon()}
          <span>{errorMessage.title}</span>
          {!isOnline && (
            <Badge variant="destructive" className="ml-auto">
              <WifiOff className="mr-1 h-3 w-3" />
              {t('offline')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* メインエラーメッセージ */}
        <Alert variant={getAlertVariant()}>
          <AlertDescription>{errorMessage.message}</AlertDescription>
        </Alert>

        {/* リトライ進捗 */}
        {isRetrying && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t('retryingMessage')}
            </div>
            <Progress value={retryProgress} className="h-2" />
          </div>
        )}

        {/* リトライ情報 */}
        {canRetry && !isRetrying && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {t('retryAttempts', { current: retryAttempts, max: maxRetries })}
          </div>
        )}

        {/* オンライン状態表示 */}
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{t('online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600">{t('offline')}</span>
            </>
          )}
        </div>

        {/* Enhanced Recovery Actions */}
        {enableAdvancedRecovery && recoveryActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              {t('recoveryOptions')}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryActions.slice(0, 3).map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleSmartRecovery(index)}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  {action.type === 'retry' && (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  {action.type === 'offline' && (
                    <WifiOff className="mr-2 h-3 w-3" />
                  )}
                  {action.type === 'login' && (
                    <LogIn className="mr-2 h-3 w-3" />
                  )}
                  <span className="truncate">{action.description}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Offline Storage Option */}
        {!isOnline && onOfflineStore && quizData && !offlineStored && (
          <Button
            onClick={handleOfflineStore}
            disabled={isStoringOffline}
            variant="secondary"
            className="w-full"
          >
            {isStoringOffline ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WifiOff className="mr-2 h-4 w-4" />
            )}
            {isStoringOffline ? t('storingOffline') : t('storeOffline')}
          </Button>
        )}

        {offlineStored && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            {t('offlineStored')}
          </div>
        )}

        {/* Traditional Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {errorMessage.actionText && (
            <Button
              onClick={handleAction}
              disabled={
                isRetrying || (!isOnline && errorMessage.actionType === 'retry')
              }
              className="flex-1"
              variant={
                errorMessage.actionType === 'retry' ? 'default' : 'outline'
              }
            >
              {errorMessage.actionType === 'retry' && (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {errorMessage.actionType === 'login' && (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {errorMessage.actionType === 'navigate' && (
                <ArrowLeft className="mr-2 h-4 w-4" />
              )}
              {errorMessage.actionType === 'contact' && (
                <Phone className="mr-2 h-4 w-4" />
              )}
              {isRetrying ? t('retrying') : errorMessage.actionText}
            </Button>
          )}

          {/* 詳細表示ボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? t('hideDetails') : t('showDetails')}
          </Button>

          {/* 閉じるボタン */}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {t('dismiss')}
            </Button>
          )}
        </div>

        {/* 詳細情報 */}
        {showDetails && (
          <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-medium">{t('errorType')}:</span>
              <Badge variant="outline" className="ml-2">
                {error.quizErrorType}
              </Badge>
            </div>

            {error.code && (
              <div>
                <span className="font-medium">{t('errorCode')}:</span>
                <code className="ml-2 rounded bg-gray-200 px-1">
                  {error.code}
                </code>
              </div>
            )}

            {error.technicalMessage && (
              <div>
                <span className="font-medium">{t('technicalDetails')}:</span>
                <p className="mt-1 text-gray-600">{error.technicalMessage}</p>
              </div>
            )}

            {error.timestamp && (
              <div>
                <span className="font-medium">{t('timestamp')}:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(error.timestamp).toLocaleString(locale)}
                </span>
              </div>
            )}

            {error.correlationId && (
              <div>
                <span className="font-medium">{t('correlationId')}:</span>
                <code className="ml-2 rounded bg-gray-200 px-1 text-xs">
                  {error.correlationId}
                </code>
              </div>
            )}

            {error.userActionRequired && (
              <div>
                <span className="font-medium">{t('recommendedAction')}:</span>
                <p className="mt-1 text-gray-600">{error.userActionRequired}</p>
              </div>
            )}

            {enableAdvancedRecovery && (
              <div>
                <span className="font-medium">{t('recoveryStrategies')}:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {error.recoveryStrategies?.map((strategy, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook for managing quiz error state with automatic retry logic
 */
export function useQuizErrorHandler() {
  const [error, setError] = useState<QuizErrorInfo | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleError = (errorInfo: QuizErrorInfo) => {
    setError(errorInfo);

    // 自動リトライが可能な場合は実行
    if (errorInfo.retryable && retryAttempts < (errorInfo.maxRetries || 3)) {
      setRetryAttempts(prev => prev + 1);
    }
  };

  const clearError = () => {
    setError(null);
    setRetryAttempts(0);
  };

  const resetRetryAttempts = () => {
    setRetryAttempts(0);
  };

  return {
    error,
    retryAttempts,
    isOnline,
    handleError,
    clearError,
    resetRetryAttempts,
  };
}
