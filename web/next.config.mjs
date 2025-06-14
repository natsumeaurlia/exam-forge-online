import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  compiler: {
    reactRemoveProperties:
      process.env.NODE_ENV === 'production'
        ? { properties: ['^data-testid$'] }
        : false,
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

// Wrap Next.js config with Sentry
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source maps upload in development
  silent: true,

  // Upload source maps in production only
  hideSourceMaps: process.env.NODE_ENV === 'production',

  // Disable source maps upload for now (can be enabled later)
  dryRun: process.env.NODE_ENV !== 'production',

  // Suppress warnings in CI environment
  suppressWarnings: true,
};

export default withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions
);
