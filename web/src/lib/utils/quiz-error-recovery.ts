/**
 * Quiz Error Recovery Utilities for Issue #223
 * Advanced error recovery and resilience mechanisms
 */

import { QuizErrorInfo, QuizErrorType } from './quiz-error-handling';

export interface RecoveryAction {
  type: 'retry' | 'refresh' | 'login' | 'offline' | 'fallback';
  delay?: number;
  maxAttempts?: number;
  priority: number;
  description: string;
  execute: () => Promise<boolean>;
}

export interface RecoveryStrategy {
  errorType: QuizErrorType;
  actions: RecoveryAction[];
  fallbackMessage?: string;
}

/**
 * Smart retry with exponential backoff and jitter
 */
export class SmartRetryManager {
  private attempts = new Map<string, number>();
  private lastAttempt = new Map<string, number>();

  async executeWithRetry<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      jitter?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      jitter = true,
    } = options;

    const attemptCount = this.attempts.get(key) || 0;
    this.attempts.set(key, attemptCount + 1);

    try {
      const result = await operation();
      // Success - reset attempts
      this.attempts.delete(key);
      this.lastAttempt.delete(key);
      return result;
    } catch (error) {
      const currentAttempts = this.attempts.get(key) || 0;

      if (currentAttempts >= maxRetries) {
        this.attempts.delete(key);
        this.lastAttempt.delete(key);
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      let delay = Math.min(
        baseDelay * Math.pow(backoffFactor, currentAttempts - 1),
        maxDelay
      );

      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5); // Add 0-50% jitter
      }

      // Ensure minimum time between attempts
      const lastAttemptTime = this.lastAttempt.get(key) || 0;
      const timeSinceLastAttempt = Date.now() - lastAttemptTime;
      const actualDelay = Math.max(delay, 500 - timeSinceLastAttempt);

      this.lastAttempt.set(key, Date.now() + actualDelay);

      await new Promise(resolve => setTimeout(resolve, actualDelay));
      return this.executeWithRetry(key, operation, options);
    }
  }

  getAttemptCount(key: string): number {
    return this.attempts.get(key) || 0;
  }

  clearAttempts(key: string): void {
    this.attempts.delete(key);
    this.lastAttempt.delete(key);
  }
}

/**
 * Optimistic offline storage for quiz responses
 */
export class OfflineStorageManager {
  private readonly STORAGE_KEY = 'quiz_offline_responses';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

  async storeOfflineResponse(
    quizId: string,
    responseData: any,
    metadata: {
      timestamp: number;
      userId?: string;
      correlationId: string;
    }
  ): Promise<boolean> {
    try {
      const stored = this.getStoredResponses();
      const entry = {
        quizId,
        responseData,
        metadata,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Check storage size limit
      const serialized = JSON.stringify([...stored, entry]);
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        // Remove oldest entries to make space
        stored.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
        while (
          stored.length > 0 &&
          JSON.stringify([...stored, entry]).length > this.MAX_STORAGE_SIZE
        ) {
          stored.shift();
        }
      }

      stored.push(entry);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));

      return true;
    } catch (error) {
      console.error('Failed to store offline response:', error);
      return false;
    }
  }

  getStoredResponses(): Array<{
    id: string;
    quizId: string;
    responseData: any;
    metadata: {
      timestamp: number;
      userId?: string;
      correlationId: string;
    };
  }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve offline responses:', error);
      return [];
    }
  }

  async syncOfflineResponses(
    syncFunction: (response: any) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    const stored = this.getStoredResponses();
    let success = 0;
    let failed = 0;

    for (const entry of stored) {
      try {
        const synced = await syncFunction(entry);
        if (synced) {
          success++;
          this.removeStoredResponse(entry.id);
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to sync response ${entry.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  removeStoredResponse(id: string): void {
    try {
      const stored = this.getStoredResponses();
      const filtered = stored.filter(entry => entry.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove stored response:', error);
    }
  }

  clearAllStoredResponses(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored responses:', error);
    }
  }

  getStorageStats(): {
    totalEntries: number;
    totalSizeBytes: number;
    oldestTimestamp?: number;
    newestTimestamp?: number;
  } {
    const stored = this.getStoredResponses();
    const serialized = JSON.stringify(stored);

    const timestamps = stored.map(entry => entry.metadata.timestamp);

    return {
      totalEntries: stored.length,
      totalSizeBytes: new Blob([serialized]).size,
      oldestTimestamp:
        timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestTimestamp:
        timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }
}

/**
 * Network status monitor with intelligent retry scheduling
 */
export class NetworkStatusManager {
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];
  private retryQueue: Array<() => Promise<void>> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.listeners.forEach(listener => listener(true));
    this.processRetryQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.listeners.forEach(listener => listener(false));
  }

  addStatusListener(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  addToRetryQueue(operation: () => Promise<void>): void {
    this.retryQueue.push(operation);
  }

  private async processRetryQueue(): Promise<void> {
    if (!this.isOnline || this.retryQueue.length === 0) return;

    const operations = [...this.retryQueue];
    this.retryQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to execute queued operation:', error);
        // Re-queue failed operations if still online
        if (this.isOnline) {
          this.retryQueue.push(operation);
        }
      }
    }
  }

  getStatus(): {
    isOnline: boolean;
    reconnectAttempts: number;
    queueLength: number;
  } {
    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
      queueLength: this.retryQueue.length,
    };
  }

  async pingServer(url: string = '/api/health'): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  cleanup(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners = [];
    this.retryQueue = [];
  }
}

/**
 * Create recovery strategies based on error type
 */
export function createRecoveryStrategy(
  errorInfo: QuizErrorInfo,
  context: {
    retryManager: SmartRetryManager;
    offlineManager: OfflineStorageManager;
    networkManager: NetworkStatusManager;
    submitFunction: () => Promise<any>;
  }
): RecoveryStrategy {
  const { retryManager, offlineManager, networkManager, submitFunction } =
    context;

  const strategies: Record<QuizErrorType, RecoveryStrategy> = {
    [QuizErrorType.NETWORK_ERROR]: {
      errorType: QuizErrorType.NETWORK_ERROR,
      actions: [
        {
          type: 'offline',
          priority: 1,
          description: 'Store response offline for later sync',
          execute: async () => {
            // This would be implemented by the calling component
            return true;
          },
        },
        {
          type: 'retry',
          delay: 3000,
          maxAttempts: 5,
          priority: 2,
          description: 'Retry submission when network recovers',
          execute: async () => {
            return retryManager
              .executeWithRetry('network_retry', submitFunction, {
                maxRetries: 5,
                baseDelay: 3000,
              })
              .then(() => true)
              .catch(() => false);
          },
        },
      ],
    },
    [QuizErrorType.SUBMISSION_TIMEOUT]: {
      errorType: QuizErrorType.SUBMISSION_TIMEOUT,
      actions: [
        {
          type: 'retry',
          delay: 2000,
          maxAttempts: 3,
          priority: 1,
          description: 'Retry with shorter timeout',
          execute: async () => {
            return retryManager
              .executeWithRetry('timeout_retry', submitFunction, {
                maxRetries: 3,
                baseDelay: 2000,
              })
              .then(() => true)
              .catch(() => false);
          },
        },
      ],
    },
    [QuizErrorType.SESSION_EXPIRED]: {
      errorType: QuizErrorType.SESSION_EXPIRED,
      actions: [
        {
          type: 'refresh',
          priority: 1,
          description: 'Refresh authentication token',
          execute: async () => {
            window.location.reload();
            return true;
          },
        },
        {
          type: 'login',
          priority: 2,
          description: 'Redirect to login page',
          execute: async () => {
            window.location.href = '/auth/signin';
            return true;
          },
        },
      ],
    },
    [QuizErrorType.RATE_LIMIT_EXCEEDED]: {
      errorType: QuizErrorType.RATE_LIMIT_EXCEEDED,
      actions: [
        {
          type: 'retry',
          delay: 30000,
          maxAttempts: 2,
          priority: 1,
          description: 'Wait and retry after rate limit resets',
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 30000));
            return retryManager
              .executeWithRetry('rate_limit_retry', submitFunction, {
                maxRetries: 2,
                baseDelay: 30000,
              })
              .then(() => true)
              .catch(() => false);
          },
        },
      ],
    },
    [QuizErrorType.DATABASE_ERROR]: {
      errorType: QuizErrorType.DATABASE_ERROR,
      actions: [
        {
          type: 'offline',
          priority: 1,
          description: 'Store response offline due to database issues',
          execute: async () => {
            // Implementation would store the response offline
            return true;
          },
        },
        {
          type: 'retry',
          delay: 5000,
          maxAttempts: 3,
          priority: 2,
          description: 'Retry when database recovers',
          execute: async () => {
            return retryManager
              .executeWithRetry('database_retry', submitFunction, {
                maxRetries: 3,
                baseDelay: 5000,
              })
              .then(() => true)
              .catch(() => false);
          },
        },
      ],
    },
  };

  // Add default strategies for missing error types
  const missingErrorTypes = Object.values(QuizErrorType).filter(
    errorType => !strategies[errorType]
  );

  for (const errorType of missingErrorTypes) {
    strategies[errorType] = {
      errorType,
      actions: [
        {
          type: 'retry',
          delay: 1000,
          maxAttempts: 2,
          priority: 1,
          description: 'Basic retry attempt',
          execute: async () => {
            return retryManager
              .executeWithRetry(`${errorType}_retry`, submitFunction, {
                maxRetries: 2,
              })
              .then(() => true)
              .catch(() => false);
          },
        },
      ],
      fallbackMessage:
        'Please try again or contact support if the problem persists.',
    };
  }

  return {
    errorType: errorInfo.quizErrorType,
    actions:
      strategies[errorInfo.quizErrorType]?.actions ||
      strategies[QuizErrorType.SERVER_ERROR].actions,
    fallbackMessage: strategies[errorInfo.quizErrorType]?.fallbackMessage,
  };
}

// Singleton instances for global use
export const globalRetryManager = new SmartRetryManager();
export const globalOfflineManager = new OfflineStorageManager();
export const globalNetworkManager = new NetworkStatusManager();
