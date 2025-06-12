import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const locales = ['en', 'ja'];
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/signout',
  '/auth/error',
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

// Helper function to check if path is public
function isPublicPath(pathname: string): boolean {
  // Extract locale from path
  const pathSegments = pathname.split('/');
  const locale = locales.includes(pathSegments[1]) ? pathSegments[1] : null;

  // Get the path without locale
  const pathWithoutLocale = locale
    ? pathname.replace(`/${locale}`, '') || '/'
    : pathname;

  return publicPaths.includes(pathWithoutLocale);
}

// Helper function to extract locale from pathname
function extractLocale(pathname: string): string {
  const pathSegments = pathname.split('/');
  return locales.includes(pathSegments[1]) ? pathSegments[1] : 'ja';
}

// Helper function to check if path requires authentication
function requiresAuth(pathname: string): boolean {
  // API routes don't require middleware authentication check
  if (pathname.startsWith('/api')) {
    return false;
  }

  // Public paths don't require authentication
  if (isPublicPath(pathname)) {
    return false;
  }

  // Protected paths (dashboard, admin, etc.)
  const protectedPatterns = ['/dashboard', '/admin', '/settings', '/profile'];

  const locale = extractLocale(pathname);
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  return protectedPatterns.some(pattern =>
    pathWithoutLocale.startsWith(pattern)
  );
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Handle API routes with internationalization only
  if (pathname.startsWith('/api')) {
    return intlMiddleware(request);
  }

  // For public paths, use only i18n middleware
  if (isPublicPath(pathname)) {
    return intlMiddleware(request);
  }

  // For protected paths, check authentication
  if (requiresAuth(pathname)) {
    try {
      // Use getToken to properly verify JWT token
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        const locale = extractLocale(pathname);
        const signinUrl = new URL(`/${locale}/auth/signin`, request.url);

        // Preserve the original URL as callback
        signinUrl.searchParams.set('callbackUrl', pathname);

        return NextResponse.redirect(signinUrl);
      }
    } catch (error) {
      console.error('Token verification error:', error);

      // Fallback to cookie-based check if JWT verification fails
      const sessionCookie =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!sessionCookie) {
        const locale = extractLocale(pathname);
        const signinUrl = new URL(`/${locale}/auth/signin`, request.url);
        signinUrl.searchParams.set('callbackUrl', pathname);

        return NextResponse.redirect(signinUrl);
      }
    }
  }

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except API routes, Next.js internals, and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - .well-known (well-known files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|\\.well-known).*)',
  ],
};
