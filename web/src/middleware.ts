import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'ja'];
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
];

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

  // For public paths, use only i18n middleware
  if (isPublicPath || pathname.startsWith('/api')) {
    return intlMiddleware(request);
  }

  // For protected paths, check authentication first
  // If not authenticated, redirect to the locale-specific signin page
  const token =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token && pathname.includes('/dashboard')) {
    const signinUrl = new URL(`/${locale}/auth/signin`, request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Otherwise, use the combined auth + i18n middleware
  return authMiddleware(request as any);
}

export const config = {
  // Match only internationalized pathnames
  // Exclude API routes, Next.js internals, and static files
  matcher: ['/', '/(ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
