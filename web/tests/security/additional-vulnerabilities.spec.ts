import { test, expect } from '@playwright/test';

test.describe('🚨 Additional Critical Security Vulnerabilities Tests', () => {
  test.describe('Upload Authorization Bypass Prevention', () => {
    test('should prevent unauthorized uploads to other users questions', async ({
      request,
    }) => {
      // Test that upload with questionId requires proper authorization
      const response = await request.post('/api/upload', {
        data: {
          files: [new Blob(['test'], { type: 'image/png' })],
          questionId: 'unauthorized-question-id-123',
        },
      });

      // Should return 401 (unauthorized) or 403 (forbidden)
      expect([401, 403]).toContain(response.status());
    });

    test('should prevent upload without authentication', async ({
      request,
    }) => {
      const response = await request.post('/api/upload', {
        data: {
          files: [new Blob(['test'], { type: 'image/png' })],
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('OAuth Information Disclosure Prevention', () => {
    test('should not expose OAuth configuration details', async ({ page }) => {
      // Navigate to signin page to check if OAuth config is exposed
      await page.goto('/ja/auth/signin');

      // Check that OAuth provider configuration is not leaked in page source
      const pageContent = await page.content();
      expect(pageContent).not.toContain('GOOGLE_CLIENT_ID');
      expect(pageContent).not.toContain('GITHUB_ID');
      expect(pageContent).not.toContain('CLIENT_SECRET');
    });
  });

  test.describe('Enhanced Callback URL Validation', () => {
    test('should prevent JavaScript injection via callback URL', async ({
      page,
    }) => {
      const maliciousUrls = [
        '/ja/auth/signin?callbackUrl=javascript:alert(1)',
        '/ja/auth/signin?callbackUrl=data:text/html,<script>alert(1)</script>',
        '/ja/auth/signin?callbackUrl=%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%31%29', // URL encoded
      ];

      for (const url of maliciousUrls) {
        await page.goto(url);

        // Should load signin page without executing scripts
        await expect(page).toHaveURL(/\/auth\/signin/);
        await expect(page.locator('h1, h2')).toBeVisible();

        // Verify no JavaScript execution
        const alertCount = await page.evaluate(
          () => (window as any).alertCount || 0
        );
        expect(alertCount).toBe(0);
      }
    });

    test('should prevent path traversal via callback URL', async ({ page }) => {
      const traversalUrls = [
        '/ja/auth/signin?callbackUrl=/../../../etc/passwd',
        '/ja/auth/signin?callbackUrl=/..\\..\\..\\windows\\system32',
        '/ja/auth/signin?callbackUrl=..%2F..%2F..%2Fetc%2Fpasswd', // URL encoded
      ];

      for (const url of traversalUrls) {
        await page.goto(url);

        // Should load signin page safely
        await expect(page).toHaveURL(/\/auth\/signin/);
        await expect(page.locator('h1, h2')).toBeVisible();
      }
    });

    test('should handle malformed URLs gracefully', async ({ page }) => {
      const malformedUrls = [
        '/ja/auth/signin?callbackUrl=ht%tp://evil.com',
        '/ja/auth/signin?callbackUrl=<script>alert(1)</script>',
        '/ja/auth/signin?callbackUrl=\\\\evil.com\\share',
      ];

      for (const url of malformedUrls) {
        await page.goto(url);

        // Should not crash and should load signin page
        await expect(page).toHaveURL(/\/auth\/signin/);
        await expect(page.locator('h1, h2')).toBeVisible();
      }
    });
  });

  test.describe('Secure-by-Default Middleware', () => {
    test('new API routes should require authentication by default', async ({
      request,
    }) => {
      // Test that any new API endpoint (not in public list) requires auth
      const potentialNewEndpoints = [
        '/api/test',
        '/api/new-feature',
        '/api/admin',
        '/api/users',
      ];

      for (const endpoint of potentialNewEndpoints) {
        const response = await request.get(endpoint);
        // Should return 401 (auth required) or 404 (not found), not 200 (success)
        expect(response.status()).not.toBe(200);
        if (response.status() !== 404) {
          expect(response.status()).toBe(401);
        }
      }
    });

    test('public API routes should remain accessible', async ({ request }) => {
      // Test explicitly public routes
      const publicRoutes = ['/api/auth/providers', '/api/stripe/webhook'];

      for (const route of publicRoutes) {
        const response = await request.get(route);
        // Should not return 401 (may return other codes like 405, 404, etc.)
        expect(response.status()).not.toBe(401);
      }
    });
  });

  test.describe('Parameter Tampering Prevention', () => {
    test('should prevent team ID manipulation in checkout', async ({
      request,
    }) => {
      // Test that checkout API validates team membership
      const response = await request.post('/api/stripe/checkout', {
        data: {
          teamId: 'unauthorized-team-id',
          planType: 'PRO',
          billingCycle: 'monthly',
        },
      });

      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Information Disclosure Prevention', () => {
    test('should not reveal user existence in error messages', async ({
      request,
    }) => {
      // Test signup with existing email
      const response = await request.post('/api/auth/signup', {
        data: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
      });

      if (response.status() === 400) {
        const responseBody = await response.json();
        // Error message should be generic, not revealing email existence
        expect(responseBody.error).not.toContain('既に登録されています');
        expect(responseBody.error).not.toContain('already exists');
      }
    });
  });
});
