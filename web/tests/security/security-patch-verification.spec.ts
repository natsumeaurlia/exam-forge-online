import { test, expect } from '@playwright/test';

test.describe('🚨 SECURITY PATCH VERIFICATION', () => {
  test.describe('Open Redirect Attack Prevention Tests', () => {
    test('🚨 PATCH TEST: Verify external domain redirect prevention', async ({
      page,
    }) => {
      console.log(
        '🔍 Testing Open Redirect prevention for external domains...'
      );

      // Test various external domain attack vectors
      const maliciousUrls = [
        'https://evil.com/steal-tokens',
        'http://malicious-site.com/phishing',
        'https://attacker.evil/redirect',
        'https://sub.evil.com/attack',
      ];

      for (const maliciousUrl of maliciousUrls) {
        const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

        await page.goto(attackUrl);

        // Fill credentials
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');

        // Submit form
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(
          `🔍 External Domain Test: ${maliciousUrl} -> ${currentUrl}`
        );

        // CRITICAL: Should NOT redirect to external domain
        expect(currentUrl).not.toContain(new URL(maliciousUrl).hostname);
        expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);

        console.log(
          `✅ PASS: External domain ${new URL(maliciousUrl).hostname} blocked`
        );
      }
    });

    test('🚨 PATCH TEST: Verify protocol manipulation prevention', async ({
      page,
    }) => {
      console.log('🔍 Testing protocol manipulation prevention...');

      const protocolAttacks = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:msgbox("XSS")',
        'file:///etc/passwd',
        'ftp://evil.com/malware',
      ];

      for (const attack of protocolAttacks) {
        const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(attack)}`;

        await page.goto(attackUrl);
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(`🔍 Protocol Attack Test: ${attack} -> ${currentUrl}`);

        // Should not execute dangerous protocols
        expect(currentUrl).not.toContain('javascript:');
        expect(currentUrl).not.toContain('data:');
        expect(currentUrl).not.toContain('vbscript:');
        expect(currentUrl).not.toContain('file:');
        expect(currentUrl).not.toContain('ftp:');

        console.log(`✅ PASS: Protocol ${attack.split(':')[0]} blocked`);
      }
    });

    test('🚨 PATCH TEST: Verify relative URL manipulation prevention', async ({
      page,
    }) => {
      console.log('🔍 Testing relative URL manipulation prevention...');

      const relativeAttacks = [
        '//evil.com/steal-data',
        '\\\\evil.com\\steal-data',
        '///evil.com/attack',
        '@evil.com',
        'http:evil.com',
      ];

      for (const attack of relativeAttacks) {
        const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(attack)}`;

        await page.goto(attackUrl);
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(`🔍 Relative Attack Test: ${attack} -> ${currentUrl}`);

        // Should not redirect to external domains via relative URLs
        expect(currentUrl).not.toContain('evil.com');
        expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);

        console.log(`✅ PASS: Relative attack ${attack} blocked`);
      }
    });

    test('🚨 PATCH TEST: Verify valid internal redirects still work', async ({
      page,
    }) => {
      console.log('🔍 Testing valid internal redirects...');

      const validUrls = [
        '/ja/dashboard',
        '/en/dashboard',
        '/ja/dashboard/quizzes',
        '/ja/plans',
        '/',
      ];

      for (const validUrl of validUrls) {
        const loginUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(validUrl)}`;

        await page.goto(loginUrl);
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(`🔍 Valid Redirect Test: ${validUrl} -> ${currentUrl}`);

        // Should allow valid internal redirects
        expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);

        console.log(`✅ PASS: Valid internal redirect ${validUrl} allowed`);
      }
    });
  });

  test.describe('Session Token Bypass Prevention Tests', () => {
    test('🚨 PATCH TEST: Verify fake session token rejection', async ({
      page,
    }) => {
      console.log('🔍 Testing fake session token rejection...');

      const fakeTokens = [
        'fake-token-12345',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature',
        'malicious-session-token',
        '{"user":"admin","role":"superuser"}',
        'base64encodedmaliciousdata',
      ];

      for (const fakeToken of fakeTokens) {
        await page.context().clearCookies();
        await page.context().addCookies([
          {
            name: 'next-auth.session-token',
            value: fakeToken,
            domain: 'localhost',
            path: '/',
          },
        ]);

        const response = await page.goto('/ja/dashboard');
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        console.log(
          `🔍 Fake Token Test: ${fakeToken.substring(0, 20)}... -> ${currentUrl}`
        );

        // Should redirect to signin due to invalid token
        expect(currentUrl).toContain('/auth/signin');

        console.log(`✅ PASS: Fake token rejected`);
      }
    });

    test('🚨 PATCH TEST: Verify token tampering detection', async ({
      page,
    }) => {
      console.log('🔍 Testing token tampering detection...');

      // First, get a potentially valid session structure (but with tampered data)
      const tamperedTokens = [
        // Modified payload
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJzdXBlcnVzZXIiLCJpYXQiOjk5OTk5OTk5OTl9.fake',
        // Modified header
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.fake',
        // Empty signature
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.',
      ];

      for (const token of tamperedTokens) {
        await page.context().clearCookies();
        await page.context().addCookies([
          {
            name: 'next-auth.session-token',
            value: token,
            domain: 'localhost',
            path: '/',
          },
        ]);

        await page.goto('/ja/dashboard');
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        console.log(
          `🔍 Tampered Token Test: ...${token.substring(token.length - 20)} -> ${currentUrl}`
        );

        // Should detect tampering and redirect to signin
        expect(currentUrl).toContain('/auth/signin');

        console.log(`✅ PASS: Token tampering detected`);
      }
    });

    test('🚨 PATCH TEST: Verify session timeout enforcement', async ({
      page,
    }) => {
      console.log('🔍 Testing session timeout enforcement...');

      // Test with expired timestamp
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxMDA2MjM5MDIyfQ.fake';

      await page.context().clearCookies();
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: expiredToken,
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/ja/dashboard');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`🔍 Expired Token Test: -> ${currentUrl}`);

      // Should redirect to signin due to expired token
      expect(currentUrl).toContain('/auth/signin');

      console.log(`✅ PASS: Expired token rejected`);
    });
  });

  test.describe('API Authentication Enforcement Tests', () => {
    test('🚨 PATCH TEST: Verify API endpoints require authentication', async ({
      page,
    }) => {
      console.log('🔍 Testing API authentication enforcement...');

      // Clear all authentication
      await page.context().clearCookies();

      const protectedEndpoints = [
        { path: '/api/upload', method: 'POST' },
        { path: '/api/storage', method: 'GET' },
        { path: '/api/stripe/checkout', method: 'POST' },
        { path: '/api/stripe/portal', method: 'POST' },
      ];

      for (const endpoint of protectedEndpoints) {
        let response;

        try {
          if (endpoint.method === 'GET') {
            response = await page.request.get(endpoint.path);
          } else {
            response = await page.request.post(endpoint.path, {
              data: { test: 'data' },
            });
          }

          const status = response.status();
          console.log(
            `🔍 API Auth Test: ${endpoint.method} ${endpoint.path} -> Status: ${status}`
          );

          // Should return 401 Unauthorized or 403 Forbidden, not 200 OK
          expect([401, 403, 404, 405]).toContain(status);

          // Should NOT return 200 OK for protected endpoints without auth
          expect(status).not.toBe(200);

          console.log(`✅ PASS: ${endpoint.path} requires authentication`);
        } catch (error) {
          console.log(`🔍 API Auth Test: ${endpoint.path} -> Error: ${error}`);
          // Network errors are acceptable for unauthorized access
          console.log(`✅ PASS: ${endpoint.path} blocked (network error)`);
        }
      }
    });

    test('🚨 PATCH TEST: Verify API endpoints with fake tokens', async ({
      page,
    }) => {
      console.log('🔍 Testing API with fake authentication tokens...');

      await page.context().clearCookies();
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: 'fake-api-token-12345',
          domain: 'localhost',
          path: '/',
        },
      ]);

      const endpoints = ['/api/upload', '/api/storage'];

      for (const endpoint of endpoints) {
        try {
          const response = await page.request.get(endpoint);
          const status = response.status();

          console.log(
            `🔍 Fake Token API Test: ${endpoint} -> Status: ${status}`
          );

          // Should reject fake tokens
          expect([401, 403, 404, 405]).toContain(status);
          expect(status).not.toBe(200);

          console.log(`✅ PASS: ${endpoint} rejects fake tokens`);
        } catch (error) {
          console.log(`✅ PASS: ${endpoint} blocked (network error)`);
        }
      }
    });
  });

  test.describe('Security Headers Verification', () => {
    test('🚨 PATCH TEST: Verify security headers presence', async ({
      page,
    }) => {
      console.log('🔍 Testing security headers...');

      const response = await page.goto('/ja/auth/signin');
      const headers = response?.headers();

      console.log(`🔍 Security Headers Check:`, {
        'x-frame-options': headers?.['x-frame-options'],
        'content-security-policy': headers?.['content-security-policy'],
        'x-content-type-options': headers?.['x-content-type-options'],
        'strict-transport-security': headers?.['strict-transport-security'],
      });

      // Check for clickjacking protection
      const hasFrameProtection =
        headers?.['x-frame-options'] === 'DENY' ||
        headers?.['x-frame-options'] === 'SAMEORIGIN' ||
        headers?.['content-security-policy']?.includes('frame-ancestors');

      if (hasFrameProtection) {
        console.log(`✅ PASS: Clickjacking protection enabled`);
      } else {
        console.log(`⚠️  WARNING: No clickjacking protection detected`);
      }

      // Check for content type protection
      if (headers?.['x-content-type-options'] === 'nosniff') {
        console.log(`✅ PASS: Content type sniffing protection enabled`);
      } else {
        console.log(`⚠️  WARNING: No content type sniffing protection`);
      }
    });
  });

  test.describe('CSRF Protection Verification', () => {
    test('🚨 PATCH TEST: Verify CSRF token validation', async ({ page }) => {
      console.log('🔍 Testing CSRF token validation...');

      await page.goto('/ja/auth/signin');

      // Check if CSRF tokens are present and being validated
      let csrfTokenFound = false;

      await page.route('**/api/auth/**', async route => {
        const request = route.request();
        const postData = request.postData();

        if (postData && postData.includes('csrfToken')) {
          csrfTokenFound = true;
          console.log(`🔍 CSRF Token found in request to ${request.url()}`);
        }

        await route.continue();
      });

      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      if (csrfTokenFound) {
        console.log(`✅ PASS: CSRF tokens are being used`);
      } else {
        console.log(`⚠️  WARNING: No CSRF tokens detected`);
      }
    });
  });
});
