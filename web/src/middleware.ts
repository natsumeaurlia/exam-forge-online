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

// SECURITY: API routes that require authentication
const protectedApiPaths = [
  '/api/upload',
  '/api/storage',
  '/api/stripe/checkout',
  '/api/stripe/portal',
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
      authorized({ token }) {
        return token != null;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export default function middleware(request: NextRequest) {
  // Extract locale from path
  const pathname = request.nextUrl.pathname;
  const pathSegments = pathname.split('/');
  const locale = locales.includes(pathSegments[1]) ? pathSegments[1] : 'ja';

  // Check if this is a public path (doesn't require authentication)
  const isPublicPath = publicPaths.some(path => {
    const fullPath = `/${locale}${path === '/' ? '' : path}`;
    return pathname === fullPath || pathname === path;
  });

  // SECURITY FIX: Check if API route requires authentication
  const isProtectedApiPath = protectedApiPaths.some(path =>
    pathname.startsWith(path)
  );

  // Check if this is a public API path (auth and webhook endpoints)
  const isPublicApiPath =
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/certificates/verify/');

  // For public paths and public API routes, use only i18n middleware
  if (isPublicPath || (pathname.startsWith('/api') && isPublicApiPath)) {
    return intlMiddleware(request);
  }

  // For protected paths, use the combined auth + i18n middleware
  // The authMiddleware will handle the authentication check
  // SECURITY FIX: Remove unsafe type casting for type safety
  return authMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  // Exclude API routes, Next.js internals, and static files
  matcher: ['/', '/(ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
