import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'ja'] as const;
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/signout',
  '/plans',
  '/contact',
  '/terms',
  '/privacy',
  '/legal',
] as const;

// SECURITY FIX: Switch to secure-by-default - all API routes require auth unless explicitly excluded
const publicApiPaths = [
  '/api/auth/',
  '/api/stripe/webhook',
  '/api/certificates/verify/',
] as const;

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
});

// Create the authentication middleware
const authMiddleware = withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
  }
);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split('/');
  const locale = locales.includes(pathSegments[1] as 'en' | 'ja')
    ? (pathSegments[1] as 'en' | 'ja')
    : 'ja';

  // Check if this is a public path (doesn't require authentication)
  const isPublicPath = publicPaths.some(path => {
    const fullPath = `/${locale}${path === '/' ? '' : path}`;
    return pathname === fullPath || pathname === path;
  });

  // SECURITY FIX: Secure-by-default - check if API route is explicitly public
  const isPublicApiPath = publicApiPaths.some(path =>
    pathname.startsWith(path)
  );

  // For public paths and explicitly public API routes, use only i18n middleware
  if (isPublicPath || (pathname.startsWith('/api') && isPublicApiPath)) {
    return intlMiddleware(request);
  }

  // For protected paths, use the combined auth + i18n middleware
  // The authMiddleware will handle the authentication check
  return authMiddleware(request as any, undefined as any);
}

export const config = {
  // Match internationalized pathnames and protected API routes
  // Exclude Next.js internals and static files
  matcher: [
    '/',
    '/(ja|en)/:path*',
    '/api/upload/:path*',
    '/api/storage/:path*',
    '/api/stripe/checkout/:path*',
    '/api/stripe/portal/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
