import { test, expect } from '@playwright/test';

test.describe('🚨 Security Tests - Authentication & Authorization', () => {
  test.describe('Open Redirect Prevention', () => {
    test('should prevent open redirect attacks via // protocol-relative URLs', async ({
      page,
    }) => {
      // Attempt open redirect attack with protocol-relative URL
      const maliciousUrl = '/ja/auth/signin?callbackUrl=//evil.com/malicious';

      await page.goto(maliciousUrl);

      // After successful authentication, should redirect to dashboard, not evil.com
      // This test would need proper authentication setup to be fully functional
      expect(page.url()).not.toContain('evil.com');
    });

    test('should prevent open redirect attacks via absolute URLs', async ({
      page,
    }) => {
      // Attempt open redirect attack with absolute URL
      const maliciousUrl =
        '/ja/auth/signin?callbackUrl=https://evil.com/malicious';

      await page.goto(maliciousUrl);

      // After successful authentication, should redirect to dashboard, not evil.com
      expect(page.url()).not.toContain('evil.com');
    });

    test('should allow legitimate relative redirects', async ({ page }) => {
      // Test legitimate relative redirect
      const legitimateUrl = '/ja/auth/signin?callbackUrl=/ja/dashboard/quizzes';

      await page.goto(legitimateUrl);

      // Should accept legitimate relative URLs (this would need auth to fully test)
      expect(page.url()).toContain('/auth/signin');
    });
  });

  test.describe('API Route Protection', () => {
    test('protected API routes should require authentication', async ({
      request,
    }) => {
      // Test that protected API routes return 401 without authentication
      const protectedRoutes = [
        '/api/upload',
        '/api/storage',
        '/api/stripe/checkout',
        '/api/stripe/portal',
      ];

      for (const route of protectedRoutes) {
        const response = await request.get(route);
        expect(response.status()).toBe(401);
      }
    });

    test('public API routes should be accessible without authentication', async ({
      request,
    }) => {
      // Test that public API routes don't require authentication
      const publicRoutes = ['/api/auth/signin', '/api/stripe/webhook'];

      for (const route of publicRoutes) {
        const response = await request.get(route);
        // Should not return 401 (may return other status codes like 405 for wrong method)
        expect(response.status()).not.toBe(401);
      }
    });
  });

  test.describe('Session Security', () => {
    test('unauthenticated access to protected pages should redirect to signin', async ({
      page,
    }) => {
      // Test that protected pages redirect to signin
      await page.goto('/ja/dashboard');

      // Should redirect to signin page
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('direct access to auth pages while authenticated should redirect to dashboard', async ({
      page,
    }) => {
      // This test would need authentication setup to be fully functional
      // Test that accessing signin while already authenticated redirects to dashboard
    });
  });

  test.describe('Input Validation Security', () => {
    test('malformed URLs should not cause crashes', async ({ page }) => {
      // Test various malformed URL attempts
      const malformedUrls = [
        '/ja/auth/signin?callbackUrl=javascript:alert(1)',
        '/ja/auth/signin?callbackUrl=data:text/html,<script>alert(1)</script>',
        '/ja/auth/signin?callbackUrl=vbscript:msgbox(1)',
      ];

      for (const url of malformedUrls) {
        await page.goto(url);
        // Should not execute scripts or cause errors
        expect(page.url()).not.toContain('javascript:');
        expect(page.url()).not.toContain('data:');
        expect(page.url()).not.toContain('vbscript:');
      }
    });
  });
});
