// This file configures the initialization of Sentry on the browser side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  integrations: [Sentry.replayIntegration()],

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV || 'development',

  beforeSend(event) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send localhost or development-related errors
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
