import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja'],

  // Used when no locale matches
  defaultLocale: 'ja',

  // Only add locale prefix when needed (not for default locale)
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  // Now includes paths without locale prefix for default locale
  matcher: ['/', '/(ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
