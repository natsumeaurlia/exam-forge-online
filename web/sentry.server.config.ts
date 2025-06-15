// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  integrations: [],

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  beforeSend(event) {
    // Filter sensitive information
    if (event.request?.data) {
      // Remove sensitive fields from request data
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      sensitiveFields.forEach(field => {
        if (event.request?.data && typeof event.request.data === 'object') {
          delete (event.request.data as Record<string, unknown>)[field];
        }
      });
    }

    // Filter out known development issues
    if (process.env.NODE_ENV === 'production') {
      if (event.exception) {
        const errorMessage = event.exception.values?.[0]?.value || '';
        if (
          errorMessage.includes('localhost') ||
          errorMessage.includes('127.0.0.1')
        ) {
          return null;
        }
      }
    }

    return event;
  },
});
