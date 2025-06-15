import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced error wrapper for API routes with Sentry integration
 */
export function withSentryErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  routeName: string
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    return Sentry.withScope(async scope => {
      // Set route context
      scope.setTag('route', routeName);
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
      });

      try {
        const response = await handler(req, context);

        // Track successful responses
        Sentry.addBreadcrumb({
          message: `API ${routeName} completed successfully`,
          category: 'api',
          level: 'info',
          data: {
            status: response.status,
            method: req.method,
          },
        });

        return response;
      } catch (error) {
        // Capture error with enhanced context
        scope.setLevel('error');
        scope.setContext('error_details', {
          route: routeName,
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString(),
        });

        Sentry.captureException(error);

        // Return structured error response
        return NextResponse.json(
          {
            error: 'Internal server error',
            message:
              process.env.NODE_ENV === 'development'
                ? (error as Error).message
                : 'Something went wrong',
            route: routeName,
          },
          { status: 500 }
        );
      }
    });
  };
}

/**
 * Performance monitoring wrapper for API routes
 */
export function withSentryPerformanceMonitoring<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: operationName,
      op: 'function',
    },
    async span => {
      try {
        const result = await operation();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: (error as Error).message });
        throw error;
      }
    }
  );
}

/**
 * Database operation monitoring
 */
export function withSentryDBMonitoring<T>(
  queryName: string,
  dbOperation: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: queryName,
      op: 'db.query',
    },
    async span => {
      try {
        const result = await dbOperation();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: (error as Error).message });
        Sentry.captureException(error, {
          tags: {
            component: 'database',
            query: queryName,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * User context setter for better error tracking
 */
export function setSentryUserContext(
  userId: string,
  email?: string,
  teamId?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    teamId,
  });
}

/**
 * Clear user context (for logout, etc.)
 */
export function clearSentryUserContext() {
  Sentry.setUser(null);
}
