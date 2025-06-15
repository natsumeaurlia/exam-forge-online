/**
 * Base Integration Classes and Utilities
 * Provides common functionality for all external integrations
 */

import {
  BaseIntegration,
  IntegrationStatus,
  SyncOperation,
  IntegrationEvent,
} from '@/types/integrations';
import { prisma } from '@/lib/prisma';

export abstract class BaseIntegrationProvider<
  T extends BaseIntegration = BaseIntegration,
> {
  protected integration: T;
  protected logger: IntegrationLogger;

  constructor(integration: T) {
    this.integration = integration;
    this.logger = new IntegrationLogger(integration.id);
  }

  // Abstract methods that must be implemented by providers
  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract sync(operation: SyncOperation): Promise<SyncOperation>;

  // Common integration methods
  async updateStatus(status: IntegrationStatus): Promise<void> {
    await prisma.integration.update({
      where: { id: this.integration.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    this.integration.status = status;
    await this.logger.log(
      'status_changed',
      'info',
      `Status changed to ${status}`
    );
  }

  async updateLastSync(): Promise<void> {
    const now = new Date();
    await prisma.integration.update({
      where: { id: this.integration.id },
      data: { lastSyncAt: now },
    });

    this.integration.lastSyncAt = now;
  }

  async updateCredentials(credentials: Record<string, string>): Promise<void> {
    // Encrypt sensitive credentials before storing
    const encryptedCredentials = await this.encryptCredentials(credentials);

    await prisma.integration.update({
      where: { id: this.integration.id },
      data: {
        credentials: encryptedCredentials,
        updatedAt: new Date(),
      },
    });

    this.integration.credentials = credentials;
  }

  async getDecryptedCredentials(): Promise<Record<string, string>> {
    return await this.decryptCredentials(this.integration.credentials);
  }

  protected async validateConnection(): Promise<void> {
    if (this.integration.status !== 'active') {
      throw new IntegrationError(
        'Integration is not active',
        'INACTIVE_INTEGRATION'
      );
    }

    const isConnected = await this.testConnection();
    if (!isConnected) {
      await this.updateStatus('error');
      throw new IntegrationError('Connection test failed', 'CONNECTION_FAILED');
    }
  }

  protected async handleError(error: Error, operation?: string): Promise<void> {
    const message = `${operation ? `${operation}: ` : ''}${error.message}`;
    await this.logger.log('error', 'error', message, { error: error.stack });

    if (this.isAuthError(error)) {
      await this.updateStatus('error');
      await this.logger.log(
        'auth_failed',
        'error',
        'Authentication failed - credentials may need renewal'
      );
    }
  }

  protected isAuthError(error: Error): boolean {
    const authErrorPatterns = [
      'unauthorized',
      'invalid_token',
      'expired_token',
      'authentication failed',
      'access denied',
    ];

    return authErrorPatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern)
    );
  }

  private async encryptCredentials(
    credentials: Record<string, string>
  ): Promise<Record<string, string>> {
    // TODO: Implement proper encryption using crypto module
    // For now, return as-is (should be implemented with proper encryption)
    return credentials;
  }

  private async decryptCredentials(
    encryptedCredentials: Record<string, string>
  ): Promise<Record<string, string>> {
    // TODO: Implement proper decryption using crypto module
    // For now, return as-is (should be implemented with proper decryption)
    return encryptedCredentials;
  }
}

export class IntegrationLogger {
  private integrationId: string;

  constructor(integrationId: string) {
    this.integrationId = integrationId;
  }

  async log(
    type: IntegrationEvent['type'],
    status: IntegrationEvent['status'],
    message: string,
    data?: Record<string, any>,
    duration?: number
  ): Promise<void> {
    const event: Omit<IntegrationEvent, 'id'> = {
      integrationId: this.integrationId,
      type,
      status,
      message,
      data,
      timestamp: new Date(),
      duration,
    };

    await prisma.integrationEvent.create({
      data: event,
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Integration ${this.integrationId}] ${type}: ${message}`,
        data
      );
    }
  }

  async getEvents(limit = 50): Promise<IntegrationEvent[]> {
    return await prisma.integrationEvent.findMany({
      where: { integrationId: this.integrationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export class IntegrationError extends Error {
  public code: string;
  public retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.retryable = retryable;
  }
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => time > windowStart);

    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  async waitForSlot(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<void> {
    const requests = this.requests.get(key) || [];
    if (requests.length >= limit) {
      const oldestRequest = Math.min(...requests);
      const waitTime = windowMs - (Date.now() - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Don't retry if it's not a retryable error
        if (error instanceof IntegrationError && !error.retryable) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }

    throw lastError!;
  }
}

export class WebhookSigner {
  static async sign(payload: string, secret: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  static async verify(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = await this.sign(payload, secret);
    const crypto = await import('crypto');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export class ConfigValidator {
  static validateRequired(
    config: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missing = requiredFields.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new IntegrationError(
        `Missing required configuration fields: ${missing.join(', ')}`,
        'INVALID_CONFIG'
      );
    }
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class DataTransformer {
  static transformUserData(
    externalUser: Record<string, any>,
    mapping: Record<string, string>
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const [internalField, externalField] of Object.entries(mapping)) {
      const value = this.getNestedValue(externalUser, externalField);
      if (value !== undefined) {
        transformed[internalField] = value;
      }
    }

    return transformed;
  }

  private static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  static normalizeGrade(
    score: number,
    maxScore: number,
    targetMax: number = 100
  ): number {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * targetMax * 100) / 100;
  }
}
