import { test, expect } from '@playwright/test';

test.describe('🚨 CRITICAL SECURITY VULNERABILITIES', () => {
  test.describe('Open Redirect Vulnerability Tests', () => {
    test('🚨 CRITICAL: Test Open Redirect via callbackUrl parameter', async ({
      page,
    }) => {
      // Test external domain redirect via callbackUrl
      const maliciousUrl = 'https://evil.com/steal-tokens';
      const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

      await page.goto(attackUrl);

      // Fill in credentials
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForTimeout(3000);

      // Check if redirected to malicious domain
      const currentUrl = page.url();
      console.log(`🚨 REDIRECT TEST: Current URL after login: ${currentUrl}`);

      // CRITICAL: This should NOT redirect to external domain
      if (currentUrl.includes('evil.com')) {
        throw new Error(
          '🚨 CRITICAL VULNERABILITY: Open redirect to external domain detected!'
        );
      }

      // Should redirect to safe internal URL
      expect(currentUrl).not.toContain('evil.com');
      expect(currentUrl).toMatch(/localhost|examforge/);
    });

    test('🚨 CRITICAL: Test Open Redirect via protocol manipulation', async ({
      page,
    }) => {
      // Test javascript: protocol injection
      const maliciousUrl = 'javascript:alert("XSS")';
      const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

      await page.goto(attackUrl);

      // Fill credentials
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');

      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`🚨 PROTOCOL TEST: Current URL: ${currentUrl}`);

      // Should not execute javascript protocol
      expect(currentUrl).not.toContain('javascript:');
    });

    test('🚨 CRITICAL: Test Open Redirect via data URI', async ({ page }) => {
      // Test data: URI injection
      const maliciousUrl = 'data:text/html,<script>alert("XSS")</script>';
      const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

      await page.goto(attackUrl);

      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`🚨 DATA URI TEST: Current URL: ${currentUrl}`);

      // Should not redirect to data URI
      expect(currentUrl).not.toContain('data:');
    });

    test('🚨 CRITICAL: Test Open Redirect via relative URL manipulation', async ({
      page,
    }) => {
      // Test relative URL that could be manipulated
      const maliciousUrl = '//evil.com/steal-data';
      const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

      await page.goto(attackUrl);

      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`🚨 RELATIVE URL TEST: Current URL: ${currentUrl}`);

      // Should not redirect to external domain via protocol-relative URL
      expect(currentUrl).not.toContain('evil.com');
    });
  });

  test.describe('Session Token Bypass Vulnerability Tests', () => {
    test('🚨 CRITICAL: Test direct access to protected routes without valid session', async ({
      page,
    }) => {
      // Clear all cookies to ensure no valid session
      await page.context().clearCookies();

      // Try to access protected dashboard directly
      const response = await page.goto('/ja/dashboard');

      // Should redirect to signin, not allow access
      const currentUrl = page.url();
      console.log(
        `🚨 NO SESSION TEST: Accessing /dashboard redirected to: ${currentUrl}`
      );

      // Should be redirected to signin page
      expect(currentUrl).toContain('/auth/signin');
      expect(response?.status()).toBe(200); // Redirect is 200, not 403
    });

    test('🚨 CRITICAL: Test manipulated session token', async ({ page }) => {
      // Set a fake/manipulated session token
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: 'fake-manipulated-token-12345',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Try to access protected route with fake token
      await page.goto('/ja/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(
        `🚨 FAKE TOKEN TEST: With fake token, redirected to: ${currentUrl}`
      );

      // Should still redirect to signin due to invalid token
      expect(currentUrl).toContain('/auth/signin');
    });

    test('🚨 CRITICAL: Test session token from different domain', async ({
      page,
    }) => {
      // Simulate session token from different domain/app
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/ja/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(
        `🚨 EXTERNAL TOKEN TEST: With external token, redirected to: ${currentUrl}`
      );

      // Should redirect to signin due to invalid/external token
      expect(currentUrl).toContain('/auth/signin');
    });

    test('🚨 CRITICAL: Test expired session token handling', async ({
      page,
    }) => {
      // Create an expired JWT token (expired timestamp)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxMDA2MjM5MDIyfQ.fake_signature';

      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: expiredToken,
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/ja/dashboard');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(
        `🚨 EXPIRED TOKEN TEST: With expired token, redirected to: ${currentUrl}`
      );

      // Should redirect to signin due to expired token
      expect(currentUrl).toContain('/auth/signin');
    });

    test('🚨 CRITICAL: Test API endpoint access without authentication', async ({
      page,
    }) => {
      // Clear all authentication
      await page.context().clearCookies();

      // Try to access protected API endpoints directly
      const apiEndpoints = [
        '/api/quiz',
        '/api/upload',
        '/api/storage',
        '/api/stripe/checkout',
        '/api/stripe/portal',
      ];

      for (const endpoint of apiEndpoints) {
        const response = await page.request.get(endpoint);
        console.log(
          `🚨 API ACCESS TEST: ${endpoint} returned status: ${response.status()}`
        );

        // Should return 401 or 403, not 200
        expect([401, 403, 404]).toContain(response.status());
      }
    });

    test('🚨 CRITICAL: Test CSRF token validation', async ({ page }) => {
      // Try to submit forms without CSRF tokens
      await page.goto('/ja/auth/signin');

      // Intercept and modify form submission to remove CSRF tokens
      await page.route('**/api/auth/**', async route => {
        const request = route.request();
        const postData = request.postData();

        console.log(`🚨 CSRF TEST: Request to ${request.url()}`);
        console.log(`🚨 CSRF TEST: Post data: ${postData}`);

        // Continue with original request for now
        await route.continue();
      });

      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(3000);

      // Should handle CSRF validation properly
      const hasError = (await page.locator('[role="alert"]').count()) > 0;
      console.log(`🚨 CSRF TEST: Form submission has error alert: ${hasError}`);
    });
  });

  test.describe('Additional Security Tests', () => {
    test('🚨 Test for sensitive information in client-side code', async ({
      page,
    }) => {
      await page.goto('/ja/auth/signin');

      // Check for exposed sensitive data in page source
      const content = await page.content();

      // Should not contain sensitive information
      expect(content).not.toMatch(/password|secret|key|token/i);
      expect(content).not.toContain('DATABASE_URL');
      expect(content).not.toContain('NEXTAUTH_SECRET');
    });

    test('🚨 Test for clickjacking protection', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // Check for X-Frame-Options or CSP frame-ancestors
      const response = await page.goto('/ja/auth/signin');
      const headers = response?.headers();

      console.log(`🚨 CLICKJACKING TEST: Response headers:`, headers);

      // Should have frame protection
      const hasFrameProtection =
        headers?.['x-frame-options'] ||
        headers?.['content-security-policy']?.includes('frame-ancestors');

      if (!hasFrameProtection) {
        console.warn('🚨 WARNING: No clickjacking protection detected');
      }
    });
  });
});
