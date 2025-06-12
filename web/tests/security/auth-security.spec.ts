import { test, expect } from '@playwright/test';

test.describe('🚨 Security Tests - Authentication & Authorization', () => {
  test.describe('Open Redirect Prevention', () => {
    test('should load signin page with malicious callback URL safely', async ({
      page,
    }) => {
      // Attempt open redirect attack with protocol-relative URL
      const maliciousUrl = '/ja/auth/signin?callbackUrl=//evil.com/malicious';

      await page.goto(maliciousUrl);

      // Should load signin page normally (not crash or redirect immediately)
      await expect(page).toHaveURL(/\/auth\/signin/);
      expect(page.url()).toContain('callbackUrl='); // URL parameter should be preserved

      // Check that the page loads properly and doesn't redirect to evil.com
      await expect(page.locator('h1, h2')).toBeVisible(); // Signin page should load
    });

    test('should load signin page with absolute malicious URL safely', async ({
      page,
    }) => {
      // Attempt open redirect attack with absolute URL
      const maliciousUrl =
        '/ja/auth/signin?callbackUrl=https://evil.com/malicious';

      await page.goto(maliciousUrl);

      // Should load signin page normally
      await expect(page).toHaveURL(/\/auth\/signin/);
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should load signin page with legitimate callback URL', async ({
      page,
    }) => {
      // Test legitimate relative redirect
      const legitimateUrl = '/ja/auth/signin?callbackUrl=/ja/dashboard/quizzes';

      await page.goto(legitimateUrl);

      // Should load signin page normally
      await expect(page).toHaveURL(/\/auth\/signin/);
      await expect(page.locator('h1, h2')).toBeVisible();
    });
  });

  test.describe('API Route Protection', () => {
    test('protected API routes should require authentication', async ({
      request,
    }) => {
      // Test storage endpoint (supports GET)
      const storageResponse = await request.get('/api/storage');
      expect(storageResponse.status()).toBe(401);

      // Test upload endpoint (POST only, but should still require auth)
      const uploadResponse = await request.post('/api/upload');
      expect(uploadResponse.status()).toBe(401);
    });

    test('public API routes should not require authentication', async ({
      request,
    }) => {
      // Test webhook endpoint (POST only, but shouldn't require session auth)
      const webhookResponse = await request.post('/api/stripe/webhook');
      // Should return 400 (bad request) or 405 (method not allowed), but not 401 (unauthorized)
      expect([400, 405, 422]).toContain(webhookResponse.status());
      expect(webhookResponse.status()).not.toBe(401);
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
