/**
 * Webhook Manager
 * Handles webhook delivery, retry logic, and signature verification
 */

import {
  BaseIntegrationProvider,
  IntegrationError,
  RetryManager,
  WebhookSigner,
} from '../base';
import {
  WebhookIntegration,
  WebhookPayload,
  WebhookEvent,
  SyncOperation,
} from '@/types/integrations';
import { prisma } from '@/lib/prisma';

export class WebhookManager extends BaseIntegrationProvider<WebhookIntegration> {
  async connect(): Promise<boolean> {
    try {
      await this.testConnection();
      await this.updateStatus('active');
      await this.logger.log(
        'webhook_activated',
        'success',
        'Webhook endpoint activated'
      );
      return true;
    } catch (error) {
      await this.handleError(error as Error, 'connect');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.updateStatus('inactive');
    await this.logger.log(
      'webhook_deactivated',
      'success',
      'Webhook endpoint deactivated'
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPayload: WebhookPayload = {
        event: 'quiz.created',
        timestamp: new Date().toISOString(),
        data: { test: true },
        team: {
          id: this.integration.teamId,
          name: 'Test Team',
        },
      };

      await this.deliverWebhook(testPayload, true);
      return true;
    } catch {
      return false;
    }
  }

  async sync(operation: SyncOperation): Promise<SyncOperation> {
    // Webhooks don't really "sync" in the traditional sense
    // This could be used for webhook delivery status checks
    return {
      ...operation,
      status: 'completed',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
      completedAt: new Date(),
    };
  }

  async deliverWebhook(payload: WebhookPayload, isTest = false): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if this event type is enabled
      if (!isTest && !this.integration.events.includes(payload.event)) {
        return;
      }

      // Sign the payload
      const payloadString = JSON.stringify(payload);
      const signature = await WebhookSigner.sign(
        payloadString,
        this.integration.secret
      );

      // Add signature to payload
      payload.signature = signature;

      const delivery = await this.createDelivery(payload);

      try {
        await this.sendWebhook(payload, payloadString, signature);

        await this.updateDeliveryStatus(delivery.id, 'delivered', null);

        const duration = Date.now() - startTime;
        await this.logger.log(
          'webhook_delivered',
          'success',
          `Webhook delivered for event ${payload.event}`,
          { deliveryId: delivery.id },
          duration
        );
      } catch (error) {
        await this.updateDeliveryStatus(
          delivery.id,
          'failed',
          (error as Error).message
        );

        // Schedule retry if configured
        if (this.integration.config.retryAttempts > 0) {
          await this.scheduleRetry(delivery.id, 1);
        }

        throw error;
      }
    } catch (error) {
      await this.handleError(error as Error, 'webhook_delivery');
      throw error;
    }
  }

  async retryWebhook(deliveryId: string, attempt: number): Promise<void> {
    const delivery = await this.getDelivery(deliveryId);

    if (!delivery || delivery.status === 'delivered') {
      return;
    }

    if (attempt > this.integration.config.retryAttempts) {
      await this.updateDeliveryStatus(
        deliveryId,
        'failed',
        'Max retry attempts exceeded'
      );
      await this.logger.log(
        'webhook_failed',
        'error',
        `Webhook delivery failed after ${attempt - 1} retries`,
        { deliveryId }
      );
      return;
    }

    const startTime = Date.now();

    try {
      const payload = delivery.payload as WebhookPayload;
      const payloadString = JSON.stringify(payload);
      const signature = payload.signature!;

      await this.sendWebhook(payload, payloadString, signature);

      await this.updateDeliveryStatus(deliveryId, 'delivered', null);

      const duration = Date.now() - startTime;
      await this.logger.log(
        'webhook_delivered',
        'success',
        `Webhook delivered on retry attempt ${attempt}`,
        { deliveryId, attempt },
        duration
      );
    } catch (error) {
      await this.updateDeliveryStatus(
        deliveryId,
        'failed',
        (error as Error).message
      );

      // Schedule next retry
      const nextAttempt = attempt + 1;
      if (nextAttempt <= this.integration.config.retryAttempts) {
        const delay = this.calculateRetryDelay(nextAttempt);
        await this.scheduleRetry(deliveryId, nextAttempt, delay);
      }

      await this.logger.log(
        'webhook_retry_failed',
        'warning',
        `Webhook retry attempt ${attempt} failed: ${(error as Error).message}`,
        { deliveryId, attempt }
      );
    }
  }

  private async sendWebhook(
    payload: WebhookPayload,
    payloadString: string,
    signature: string
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ExamForge-Webhook/1.0',
      'X-ExamForge-Event': payload.event,
      'X-ExamForge-Signature': `sha256=${signature}`,
      'X-ExamForge-Timestamp': payload.timestamp,
    };

    // Add custom headers if configured
    if (this.integration.config.customHeaders) {
      Object.assign(headers, this.integration.config.customHeaders);
    }

    // Add authentication if configured
    if (this.integration.config.authType && this.integration.config.authValue) {
      switch (this.integration.config.authType) {
        case 'bearer':
          headers['Authorization'] =
            `Bearer ${this.integration.config.authValue}`;
          break;
        case 'basic':
          headers['Authorization'] =
            `Basic ${this.integration.config.authValue}`;
          break;
      }
    }

    await RetryManager.withRetry(async () => {
      const response = await fetch(this.integration.deliveryUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(this.integration.config.timeout * 1000),
      });

      if (!response.ok) {
        throw new IntegrationError(
          `HTTP ${response.status}: ${response.statusText}`,
          'WEBHOOK_HTTP_ERROR',
          response.status >= 500 // Retry on server errors
        );
      }
    }, 1); // Don't retry here - we handle retries at a higher level
  }

  private async createDelivery(payload: WebhookPayload): Promise<any> {
    return await prisma.webhookDelivery.create({
      data: {
        integrationId: this.integration.id,
        event: payload.event,
        payload: payload as any,
        url: this.integration.deliveryUrl,
        status: 'pending',
        createdAt: new Date(),
      },
    });
  }

  private async getDelivery(deliveryId: string): Promise<any> {
    return await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });
  }

  private async updateDeliveryStatus(
    deliveryId: string,
    status: 'pending' | 'delivered' | 'failed',
    error?: string | null
  ): Promise<void> {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        error,
        deliveredAt: status === 'delivered' ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  private async scheduleRetry(
    deliveryId: string,
    attempt: number,
    delay?: number
  ): Promise<void> {
    const retryDelay = delay || this.calculateRetryDelay(attempt);
    const retryAt = new Date(Date.now() + retryDelay);

    await prisma.webhookRetry.create({
      data: {
        deliveryId,
        attempt,
        retryAt,
        createdAt: new Date(),
      },
    });

    // In a production system, you would use a job queue here
    // For now, we'll use a simple setTimeout (not recommended for production)
    setTimeout(() => {
      this.retryWebhook(deliveryId, attempt).catch(console.error);
    }, retryDelay);
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.integration.config.retryDelay * 1000; // Convert to ms
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter

    return Math.min(exponentialDelay + jitter, 300000); // Cap at 5 minutes
  }

  async getDeliveryHistory(limit = 50): Promise<any[]> {
    return await prisma.webhookDelivery.findMany({
      where: { integrationId: this.integration.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        retries: {
          orderBy: { attempt: 'asc' },
        },
      },
    });
  }

  async getDeliveryStats(days = 7): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, delivered, failed] = await Promise.all([
      prisma.webhookDelivery.count({
        where: {
          integrationId: this.integration.id,
          createdAt: { gte: since },
        },
      }),
      prisma.webhookDelivery.count({
        where: {
          integrationId: this.integration.id,
          createdAt: { gte: since },
          status: 'delivered',
        },
      }),
      prisma.webhookDelivery.count({
        where: {
          integrationId: this.integration.id,
          createdAt: { gte: since },
          status: 'failed',
        },
      }),
    ]);

    return {
      total,
      delivered,
      failed,
      pending: total - delivered - failed,
      successRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }
}

export class WebhookEventEmitter {
  private static integrations: Map<string, WebhookManager> = new Map();

  static async initialize(): Promise<void> {
    // Load all active webhook integrations
    const webhookIntegrations = await prisma.integration.findMany({
      where: {
        type: 'webhook',
        status: 'active',
      },
    });

    for (const integration of webhookIntegrations) {
      const manager = new WebhookManager(integration as WebhookIntegration);
      this.integrations.set(integration.id, manager);
    }
  }

  static async emit(
    teamId: string,
    event: WebhookEvent,
    data: Record<string, any>
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      team: {
        id: teamId,
        name: 'Team Name', // TODO: Fetch actual team name
      },
    };

    // Find all webhook integrations for this team that listen to this event
    const teamWebhooks = Array.from(this.integrations.values()).filter(
      manager =>
        manager['integration'].teamId === teamId &&
        manager['integration'].events.includes(event)
    );

    // Deliver to all matching webhooks
    await Promise.allSettled(
      teamWebhooks.map(manager => manager.deliverWebhook(payload))
    );
  }

  static async addIntegration(integration: WebhookIntegration): Promise<void> {
    const manager = new WebhookManager(integration);
    this.integrations.set(integration.id, manager);
  }

  static async removeIntegration(integrationId: string): Promise<void> {
    this.integrations.delete(integrationId);
  }
}
