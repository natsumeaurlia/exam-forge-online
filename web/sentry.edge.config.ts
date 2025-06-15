// This file configures the initialization of Sentry for edge runtime.
// The config you add here will be used whenever the server handles a request with the edge runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  beforeSend(event) {
    // Filter sensitive information for edge runtime
    if (event.request?.data) {
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      sensitiveFields.forEach(field => {
        if (event.request?.data && typeof event.request.data === 'object') {
          delete (event.request.data as Record<string, unknown>)[field];
        }
      });
    }

    return event;
  },
});
