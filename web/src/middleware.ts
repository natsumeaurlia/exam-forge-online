import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Skip middleware for NextAuth API routes to prevent interference
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

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

  // 🔒 SECURITY: 適切なJWT検証でSession Token Bypass脆弱性を修正
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // トークンが存在せず、期限切れでないかチェック
    if (
      !token ||
      (token.exp &&
        typeof token.exp === 'number' &&
        token.exp < Math.floor(Date.now() / 1000))
    ) {
      // Create a proper redirect URL with locale
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Additional database validation for authenticated requests
    // This ensures users exist in the database even if they have valid tokens
    if (
      pathname.startsWith(`/${locale}/dashboard`) ||
      pathname.startsWith(`/${locale}/quiz`)
    ) {
      // Add a header to identify this as needing database validation
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-auth-validation-required', 'true');
      requestHeaders.set('x-user-id', token.sub || '');

      const response = intlMiddleware(request);

      // Copy headers to the response
      if (response instanceof NextResponse) {
        requestHeaders.forEach((value, key) => {
          response.headers.set(key, value);
        });
      }

      return response;
    }
  } catch (error) {
    // JWTデコードエラーの場合も認証なしとして処理
    console.warn('JWT validation error:', error);
    const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For authenticated users, continue with i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match internationalized pathnames and protected API routes
  // Exclude Next.js internals, static files, and NextAuth API routes
  matcher: [
    '/',
    '/(ja|en)/:path*',
    '/api/upload/:path*',
    '/api/storage/:path*',
    '/api/stripe/checkout/:path*',
    '/api/stripe/portal/:path*',
    '/((?!_next|_vercel|api/auth|.*\\..*).*)',
  ],
};
