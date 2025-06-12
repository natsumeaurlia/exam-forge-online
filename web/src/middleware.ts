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

  // Check if this is a public API path (auth and webhook endpoints)
  const isPublicApiPath =
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/certificates/verify/');

  // For public paths and public API routes, use only i18n middleware
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
  // Match only internationalized pathnames
  // Exclude API routes, Next.js internals, and static files
  matcher: ['/', '/(ja|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
