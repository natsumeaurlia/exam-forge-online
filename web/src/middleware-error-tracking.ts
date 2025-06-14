import { NextRequest, NextResponse } from 'next/server';
import { errorTracker } from '@/lib/error-tracking';

export function withErrorTracking(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Add breadcrumb for the request
      errorTracker.addBreadcrumb(
        `${req.method} ${req.url}`,
        'navigation',
        'info',
        {
          method: req.method,
          url: req.url,
          userAgent: req.headers.get('user-agent'),
        }
      );

      const response = await handler(req);

      // Track response status
      if (response.status >= 400) {
        errorTracker.addBreadcrumb(
          `HTTP ${response.status} response`,
          'http',
          response.status >= 500 ? 'error' : 'warning',
          {
            status: response.status,
            statusText: response.statusText,
          }
        );
      }

      return response;
    } catch (error) {
      // Capture the error with request context
      await errorTracker.captureException(
        error instanceof Error ? error : new Error(String(error)),
        req
      );

      // Return a generic error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          requestId: crypto.randomUUID(),
        },
        { status: 500 }
      );
    }
  };
}

// Global error boundary for API routes
export function createErrorBoundary(component: string) {
  return (error: Error, errorInfo: any) => {
    errorTracker.captureError(
      error,
      {
        component,
        errorInfo: JSON.stringify(errorInfo),
        boundary: true,
      },
      'error'
    );
  };
}

// Custom hook for client-side error tracking
export function useErrorTracking() {
  const captureError = (
    error: Error | string,
    context?: Record<string, any>
  ) => {
    errorTracker.captureError(error, context);
  };

  const addBreadcrumb = (
    message: string,
    category: string,
    data?: Record<string, any>
  ) => {
    errorTracker.addBreadcrumb(message, category, 'info', data);
  };

  return {
    captureError,
    addBreadcrumb,
  };
}

export default withErrorTracking;
