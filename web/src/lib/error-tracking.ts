import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export interface ErrorContext {
  userId?: string;
  teamId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  environment?: string;
  release?: string;
  buildId?: string;
}

export interface StackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  module?: string;
  contextLine?: string;
  preContext?: string[];
  postContext?: string[];
}

export interface ErrorReport {
  id: string;
  fingerprint: string;
  message: string;
  type: string;
  level: 'error' | 'warning' | 'info' | 'debug' | 'fatal';
  timestamp: Date;
  stack?: StackFrame[];
  context: ErrorContext;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  breadcrumbs?: Breadcrumb[];
  count?: number;
  firstSeen?: Date;
  lastSeen?: Date;
  resolved?: boolean;
  assignedTo?: string;
}

export interface Breadcrumb {
  timestamp: Date;
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, any>;
}

export interface AggregatedError {
  fingerprint: string;
  message: string;
  type: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  level: string;
  resolved: boolean;
  assignedTo?: string;
  examples: ErrorReport[];
}

class ErrorTrackingService {
  private breadcrumbs: Map<string, Breadcrumb[]> = new Map();
  private maxBreadcrumbs = 50;

  async captureError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    level: ErrorReport['level'] = 'error'
  ): Promise<string> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType =
      typeof error === 'string' ? 'Error' : error.constructor.name;
    const stack =
      typeof error === 'string' ? undefined : this.parseStackTrace(error.stack);

    const fingerprint = this.generateFingerprint(
      errorMessage,
      errorType,
      stack
    );
    const sessionId = context.sessionId || this.getSessionId();

    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      fingerprint,
      message: errorMessage,
      type: errorType,
      level,
      timestamp: new Date(),
      stack,
      context: {
        environment: process.env.NODE_ENV || 'unknown',
        release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
        buildId: process.env.BUILD_ID || 'unknown',
        ...context,
      },
      breadcrumbs: this.getBreadcrumbs(sessionId),
    };

    await this.saveError(errorReport);
    await this.updateAggregation(fingerprint, errorReport);

    // Trigger alerts for critical errors
    if (level === 'fatal' || level === 'error') {
      await this.checkErrorAlerts(errorReport);
    }

    return errorReport.id;
  }

  async captureException(
    error: Error,
    request?: NextRequest,
    additionalContext: Partial<ErrorContext> = {}
  ): Promise<string> {
    const context: Partial<ErrorContext> = {
      ...additionalContext,
    };

    if (request) {
      context.url = request.url;
      context.method = request.method;
      context.userAgent = request.headers.get('user-agent') || undefined;
      context.ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        undefined;

      // Safely extract query and headers
      try {
        const url = new URL(request.url);
        context.query = Object.fromEntries(url.searchParams);
      } catch (e) {
        console.warn('Failed to parse request URL for error context');
      }

      context.headers = Object.fromEntries(
        Array.from(request.headers.entries()).filter(
          ([key]) =>
            !['authorization', 'cookie', 'x-api-key'].includes(
              key.toLowerCase()
            )
        )
      );
    }

    return await this.captureError(error, context, 'error');
  }

  addBreadcrumb(
    message: string,
    category: string,
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>,
    sessionId?: string
  ): void {
    const sid = sessionId || this.getSessionId();

    const breadcrumb: Breadcrumb = {
      timestamp: new Date(),
      message,
      category,
      level,
      data,
    };

    let sessionBreadcrumbs = this.breadcrumbs.get(sid) || [];
    sessionBreadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (sessionBreadcrumbs.length > this.maxBreadcrumbs) {
      sessionBreadcrumbs = sessionBreadcrumbs.slice(-this.maxBreadcrumbs);
    }

    this.breadcrumbs.set(sid, sessionBreadcrumbs);
  }

  private getBreadcrumbs(sessionId: string): Breadcrumb[] {
    return this.breadcrumbs.get(sessionId) || [];
  }

  private getSessionId(): string {
    // In a real implementation, this would extract from request context
    return 'default-session';
  }

  private parseStackTrace(stackTrace?: string): StackFrame[] {
    if (!stackTrace) return [];

    const frames: StackFrame[] = [];
    const lines = stackTrace.split('\n');

    for (const line of lines) {
      const match =
        line.match(/\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
        line.match(/\s*at\s+(.+?):(\d+):(\d+)/);

      if (match) {
        frames.push({
          function: match[1]?.trim(),
          filename: match[2]?.trim(),
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        });
      }
    }

    return frames;
  }

  private generateFingerprint(
    message: string,
    type: string,
    stack?: StackFrame[]
  ): string {
    // Create a consistent fingerprint for grouping similar errors
    const baseString = `${type}:${message}`;

    if (stack && stack.length > 0) {
      const topFrame = stack[0];
      const frameString = `${topFrame.filename}:${topFrame.function}:${topFrame.lineno}`;
      return this.simpleHash(baseString + frameString);
    }

    return this.simpleHash(baseString);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async saveError(errorReport: ErrorReport): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO error_reports (
          id, fingerprint, message, type, level, timestamp,
          stack, context, tags, extra, breadcrumbs
        ) VALUES (
          ${errorReport.id},
          ${errorReport.fingerprint},
          ${errorReport.message},
          ${errorReport.type},
          ${errorReport.level},
          ${errorReport.timestamp},
          ${JSON.stringify(errorReport.stack)},
          ${JSON.stringify(errorReport.context)},
          ${JSON.stringify(errorReport.tags || {})},
          ${JSON.stringify(errorReport.extra || {})},
          ${JSON.stringify(errorReport.breadcrumbs)}
        )
      `;
    } catch (error) {
      console.error('Failed to save error report:', error);
    }
  }

  private async updateAggregation(
    fingerprint: string,
    errorReport: ErrorReport
  ): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO error_aggregations (
          fingerprint, message, type, level, count, first_seen, last_seen, resolved
        ) VALUES (
          ${fingerprint}, ${errorReport.message}, ${errorReport.type},
          ${errorReport.level}, 1, ${errorReport.timestamp}, ${errorReport.timestamp}, false
        )
        ON CONFLICT (fingerprint) DO UPDATE SET
          count = error_aggregations.count + 1,
          last_seen = ${errorReport.timestamp},
          level = CASE 
            WHEN ${errorReport.level} = 'fatal' THEN 'fatal'
            WHEN ${errorReport.level} = 'error' AND error_aggregations.level != 'fatal' THEN 'error'
            WHEN ${errorReport.level} = 'warning' AND error_aggregations.level NOT IN ('fatal', 'error') THEN 'warning'
            ELSE error_aggregations.level
          END
      `;
    } catch (error) {
      console.error('Failed to update error aggregation:', error);
    }
  }

  async getErrorsByFingerprint(
    fingerprint: string,
    limit: number = 10
  ): Promise<ErrorReport[]> {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT * FROM error_reports 
        WHERE fingerprint = ${fingerprint}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      return results.map(this.mapDbRowToErrorReport);
    } catch (error) {
      console.error('Failed to fetch errors by fingerprint:', error);
      return [];
    }
  }

  async getAggregatedErrors(
    limit: number = 50,
    resolved: boolean = false
  ): Promise<AggregatedError[]> {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT * FROM error_aggregations
        WHERE resolved = ${resolved}
        ORDER BY last_seen DESC
        LIMIT ${limit}
      `;

      const aggregatedErrors: AggregatedError[] = [];

      for (const row of results) {
        const examples = await this.getErrorsByFingerprint(row.fingerprint, 3);

        aggregatedErrors.push({
          fingerprint: row.fingerprint,
          message: row.message,
          type: row.type,
          count: row.count,
          firstSeen: row.first_seen,
          lastSeen: row.last_seen,
          level: row.level,
          resolved: row.resolved,
          assignedTo: row.assigned_to,
          examples,
        });
      }

      return aggregatedErrors;
    } catch (error) {
      console.error('Failed to fetch aggregated errors:', error);
      return [];
    }
  }

  async resolveError(fingerprint: string, assignedTo?: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE error_aggregations 
        SET resolved = true, assigned_to = ${assignedTo || null}
        WHERE fingerprint = ${fingerprint}
      `;
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  }

  async getErrorStatistics(hours: number = 24): Promise<{
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    errorsByType: Record<string, number>;
    recentTrends: Array<{ hour: number; count: number }>;
  }> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const [totalResult] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM error_reports 
        WHERE timestamp >= ${since}
      `;

      const levelResults = await prisma.$queryRaw<
        Array<{ level: string; count: bigint }>
      >`
        SELECT level, COUNT(*) as count FROM error_reports 
        WHERE timestamp >= ${since}
        GROUP BY level
      `;

      const typeResults = await prisma.$queryRaw<
        Array<{ type: string; count: bigint }>
      >`
        SELECT type, COUNT(*) as count FROM error_reports 
        WHERE timestamp >= ${since}
        GROUP BY type
        ORDER BY count DESC
        LIMIT 10
      `;

      const trendResults = await prisma.$queryRaw<
        Array<{ hour: number; count: bigint }>
      >`
        SELECT 
          EXTRACT(hour FROM timestamp) as hour,
          COUNT(*) as count
        FROM error_reports 
        WHERE timestamp >= ${since}
        GROUP BY EXTRACT(hour FROM timestamp)
        ORDER BY hour
      `;

      return {
        totalErrors: Number(totalResult.count),
        errorsByLevel: Object.fromEntries(
          levelResults.map(r => [r.level, Number(r.count)])
        ),
        errorsByType: Object.fromEntries(
          typeResults.map(r => [r.type, Number(r.count)])
        ),
        recentTrends: trendResults.map(r => ({
          hour: r.hour,
          count: Number(r.count),
        })),
      };
    } catch (error) {
      console.error('Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByLevel: {},
        errorsByType: {},
        recentTrends: [],
      };
    }
  }

  private mapDbRowToErrorReport(row: any): ErrorReport {
    return {
      id: row.id,
      fingerprint: row.fingerprint,
      message: row.message,
      type: row.type,
      level: row.level,
      timestamp: row.timestamp,
      stack: JSON.parse(row.stack || '[]'),
      context: JSON.parse(row.context || '{}'),
      tags: JSON.parse(row.tags || '{}'),
      extra: JSON.parse(row.extra || '{}'),
      breadcrumbs: JSON.parse(row.breadcrumbs || '[]'),
    };
  }

  private async checkErrorAlerts(errorReport: ErrorReport): Promise<void> {
    // Check for error rate spikes, new error types, etc.
    const recentSimilarErrors = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM error_reports 
      WHERE fingerprint = ${errorReport.fingerprint}
      AND timestamp >= NOW() - INTERVAL '5 minutes'
    `;

    const count = Number(recentSimilarErrors[0]?.count || 0);

    if (count >= 10) {
      console.error(
        `ERROR SPIKE ALERT: ${errorReport.type} - ${errorReport.message} (${count} occurrences in 5 minutes)`
      );
      // Trigger notification system here
    }
  }
}

export const errorTracker = new ErrorTrackingService();

// Global error handler for unhandled errors
if (typeof window === 'undefined') {
  process.on('uncaughtException', error => {
    errorTracker.captureError(error, {}, 'fatal');
  });

  process.on('unhandledRejection', reason => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    errorTracker.captureError(error, {}, 'error');
  });
}

export default errorTracker;
