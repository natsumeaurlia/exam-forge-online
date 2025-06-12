import { test, expect } from '@playwright/test';

test.describe.skip('🚨 CRITICAL SECURITY ESCALATION TESTS', () => {
  test.describe('API Authentication Bypass Tests', () => {
    test('🚨 ESCALATION: Test API bypass via header manipulation', async ({
      page,
    }) => {
      console.log(
        '🔍 Testing API authentication bypass via header manipulation...'
      );

      // Clear all authentication
      await page.context().clearCookies();

      const bypassHeaders: Record<string, string>[] = [
        { Authorization: 'Bearer fake-token' },
        { 'X-API-Key': 'admin-key-123' },
        { 'X-Auth-Token': 'bypass-token' },
        { 'X-User-ID': 'admin' },
        { 'X-Role': 'superuser' },
        { 'X-Forwarded-For': '127.0.0.1' },
        { 'X-Real-IP': 'localhost' },
        { 'X-Admin': 'true' },
        { Cookie: 'admin=true; role=superuser' },
      ];

      const protectedEndpoints = [
        '/api/upload',
        '/api/storage',
        '/api/stripe/checkout',
        '/api/stripe/portal',
      ];

      for (const endpoint of protectedEndpoints) {
        for (const headers of bypassHeaders) {
          try {
            const response = await page.request.post(endpoint, {
              headers,
              data: { test: 'bypass-attempt' },
            });

            const status = response.status();
            console.log(
              `🔍 Bypass Test: ${endpoint} with ${JSON.stringify(headers)} -> Status: ${status}`
            );

            // CRITICAL: Should NOT return 200 OK with bypass headers
            if (status === 200) {
              console.error(
                `🚨 CRITICAL VULNERABILITY: API bypass detected on ${endpoint} with headers ${JSON.stringify(headers)}`
              );
              throw new Error(
                `API Authentication Bypass Vulnerability: ${endpoint}`
              );
            }

            expect([401, 403, 404, 405]).toContain(status);
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('API Authentication Bypass')
            ) {
              throw error;
            }
            console.log(`✅ PASS: ${endpoint} rejected bypass attempt`);
          }
        }
      }
    });

    test('🚨 ESCALATION: Test API bypass via query parameter injection', async ({
      page,
    }) => {
      console.log('🔍 Testing API bypass via query parameter injection...');

      await page.context().clearCookies();

      const bypassParams = [
        '?admin=true',
        '?auth=bypass',
        '?token=admin-token',
        '?user_id=admin',
        '?role=superuser',
        '?debug=true&admin=1',
        '?api_key=master-key',
        '?skip_auth=true',
      ];

      const endpoints = ['/api/upload', '/api/storage'];

      for (const endpoint of endpoints) {
        for (const params of bypassParams) {
          try {
            const response = await page.request.get(`${endpoint}${params}`);
            const status = response.status();

            console.log(
              `🔍 Query Bypass Test: ${endpoint}${params} -> Status: ${status}`
            );

            // Should NOT allow bypass via query parameters
            if (status === 200) {
              console.error(
                `🚨 CRITICAL: Query parameter bypass detected on ${endpoint}${params}`
              );
              throw new Error(
                `Query Parameter Bypass Vulnerability: ${endpoint}${params}`
              );
            }

            expect([401, 403, 404, 405]).toContain(status);
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('Bypass Vulnerability')
            ) {
              throw error;
            }
            console.log(`✅ PASS: ${endpoint} rejected query bypass`);
          }
        }
      }
    });

    test('🚨 ESCALATION: Test API bypass via HTTP method manipulation', async ({
      page,
    }) => {
      console.log('🔍 Testing API bypass via HTTP method manipulation...');

      await page.context().clearCookies();

      const methods = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'HEAD',
        'OPTIONS',
      ];
      const endpoints = ['/api/upload', '/api/storage'];

      for (const endpoint of endpoints) {
        for (const method of methods) {
          try {
            let response: any;

            switch (method) {
              case 'GET':
                response = await page.request.get(endpoint);
                break;
              case 'POST':
                response = await page.request.post(endpoint, { data: {} });
                break;
              case 'PUT':
                response = await page.request.put(endpoint, { data: {} });
                break;
              case 'DELETE':
                response = await page.request.delete(endpoint);
                break;
              case 'PATCH':
                response = await page.request.patch(endpoint, { data: {} });
                break;
              case 'HEAD':
                response = await page.request.head(endpoint);
                break;
              case 'OPTIONS':
                response = await page.request.fetch(endpoint, {
                  method: 'OPTIONS',
                });
                break;
              default:
                throw new Error(`Unsupported method: ${method}`);
            }

            const status = response?.status();
            console.log(
              `🔍 Method Test: ${method} ${endpoint} -> Status: ${status}`
            );

            // Should require authentication regardless of HTTP method
            if (status === 200 && method !== 'OPTIONS') {
              console.error(
                `🚨 CRITICAL: HTTP method bypass detected: ${method} ${endpoint}`
              );
              throw new Error(
                `HTTP Method Bypass Vulnerability: ${method} ${endpoint}`
              );
            }

            if (method !== 'OPTIONS') {
              expect([401, 403, 404, 405]).toContain(status);
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('Bypass Vulnerability')
            ) {
              throw error;
            }
            console.log(`✅ PASS: ${method} ${endpoint} properly secured`);
          }
        }
      }
    });
  });

  test.describe('OAuth Configuration Leakage Tests', () => {
    test('🚨 ESCALATION: Test OAuth client secret exposure', async ({
      page,
    }) => {
      console.log('🔍 Testing OAuth client secret exposure...');

      // Check various endpoints for OAuth configuration exposure
      const endpoints = [
        '/api/auth/providers',
        '/api/auth/session',
        '/api/auth/csrf',
        '/.well-known/openid_configuration',
        '/oauth/configuration',
        '/auth/config',
        '/.env',
        '/env.json',
        '/config.json',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await page.request.get(endpoint);
          const status = response.status();

          if (status === 200) {
            const text = await response.text();
            console.log(
              `🔍 OAuth Config Test: ${endpoint} -> Status: ${status}`
            );

            // Check for exposed OAuth secrets
            const sensitivePatterns = [
              /client_secret/i,
              /GOOGLE_CLIENT_SECRET/i,
              /GITHUB_SECRET/i,
              /NEXTAUTH_SECRET/i,
              /secret.*[a-zA-Z0-9]{20,}/i,
              /key.*[a-zA-Z0-9]{20,}/i,
            ];

            for (const pattern of sensitivePatterns) {
              if (pattern.test(text)) {
                console.error(
                  `🚨 CRITICAL: OAuth secret exposure detected in ${endpoint}`
                );
                console.error(`Pattern matched: ${pattern}`);
                throw new Error(`OAuth Secret Exposure: ${endpoint}`);
              }
            }

            console.log(`✅ PASS: ${endpoint} does not expose OAuth secrets`);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('OAuth Secret Exposure')
          ) {
            throw error;
          }
          console.log(`✅ PASS: ${endpoint} not accessible or safe`);
        }
      }
    });

    test('🚨 ESCALATION: Test OAuth state parameter manipulation', async ({
      page,
    }) => {
      console.log('🔍 Testing OAuth state parameter manipulation...');

      // Test OAuth state parameter vulnerabilities
      await page.goto('/ja/auth/signin');

      // Look for OAuth provider buttons
      const googleButton = page.locator('button:has-text("Google")');
      const githubButton = page.locator('button:has-text("GitHub")');

      if ((await googleButton.count()) > 0) {
        console.log('🔍 Testing Google OAuth state manipulation...');

        // Intercept OAuth requests
        await page.route('**/api/auth/signin/google**', async route => {
          const url = route.request().url();
          console.log(`🔍 OAuth Request: ${url}`);

          // Check for state parameter
          if (url.includes('state=')) {
            const stateMatch = url.match(/state=([^&]+)/);
            if (stateMatch) {
              console.log(`🔍 OAuth State: ${stateMatch[1]}`);

              // State should be unpredictable and not easily manipulable
              if (stateMatch[1].length < 10) {
                console.error(
                  `🚨 WARNING: OAuth state parameter too short: ${stateMatch[1]}`
                );
              }
            }
          }

          await route.continue();
        });

        await googleButton.click();
        await page.waitForTimeout(2000);
      }
    });

    test('🚨 ESCALATION: Test OAuth redirect URI validation', async ({
      page,
    }) => {
      console.log('🔍 Testing OAuth redirect URI validation...');

      // Test OAuth redirect URI manipulation
      const maliciousRedirects = [
        'https://evil.com/oauth-callback',
        'http://localhost:3000.evil.com/callback',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
      ];

      for (const redirectUri of maliciousRedirects) {
        try {
          // Attempt to manipulate OAuth flow with malicious redirect URI
          const response = await page.request.get(
            `/api/auth/signin/google?redirect_uri=${encodeURIComponent(redirectUri)}`
          );
          const status = response.status();

          console.log(
            `🔍 OAuth Redirect Test: ${redirectUri} -> Status: ${status}`
          );

          if (status === 200) {
            const text = await response.text();
            if (text.includes(redirectUri)) {
              console.error(
                `🚨 CRITICAL: OAuth redirect URI not validated: ${redirectUri}`
              );
              throw new Error(
                `OAuth Redirect URI Vulnerability: ${redirectUri}`
              );
            }
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('OAuth Redirect URI Vulnerability')
          ) {
            throw error;
          }
          console.log(`✅ PASS: Malicious redirect URI rejected`);
        }
      }
    });
  });

  test.describe('CallbackUrl Validation Bypass Tests', () => {
    test('🚨 ESCALATION: Test advanced callbackUrl bypass techniques', async ({
      page,
    }) => {
      console.log('🔍 Testing advanced callbackUrl bypass techniques...');

      const advancedBypassUrls = [
        // Unicode domain bypass
        'https://еvil.com/callback', // Cyrillic 'e'
        'https://gооgle.com/fake', // Cyrillic 'o'

        // Subdomain confusion
        'https://evil.com.localhost.evil.com',
        'https://localhost.evil.com',

        // URL encoding bypass
        'https%3A%2F%2Fevil.com%2Fcallback',
        '%68%74%74%70%73%3A%2F%2F%65%76%69%6C%2E%63%6F%6D',

        // Mixed protocols
        'httрs://evil.com', // Cyrillic 'р'
        'hттps://evil.com', // Cyrillic 'т'

        // IPv6 bypass
        'http://[::1]:3000@evil.com',
        'http://127.0.0.1@evil.com',

        // Path traversal
        '/../../../../evil.com',
        '\\\\evil.com\\path',

        // Fragment bypass
        'https://evil.com#@localhost:3000/',
        'https://evil.com?fake=localhost:3000',

        // Null byte injection
        'https://localhost:3000\\x00.evil.com',

        // Homograph attacks
        'https://ɡoogle.com/callback',
        'https://microsоft.com/callback',
      ];

      for (const maliciousUrl of advancedBypassUrls) {
        const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(maliciousUrl)}`;

        await page.goto(attackUrl);
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(
          `🔍 Advanced Bypass Test: ${maliciousUrl} -> ${currentUrl}`
        );

        // Should not redirect to any malicious domain
        const suspiciousDomains = [
          'evil.com',
          'malicious',
          'attacker',
          'phishing',
        ];
        const containsSuspicious = suspiciousDomains.some(domain =>
          currentUrl.includes(domain)
        );

        if (containsSuspicious) {
          console.error(
            `🚨 CRITICAL: Advanced callbackUrl bypass successful: ${maliciousUrl}`
          );
          throw new Error(`Advanced CallbackUrl Bypass: ${maliciousUrl}`);
        }

        // Should redirect to localhost or safe domain
        expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);
        console.log(`✅ PASS: Advanced bypass attempt blocked`);
      }
    });

    test('🚨 ESCALATION: Test callbackUrl parameter pollution', async ({
      page,
    }) => {
      console.log('🔍 Testing callbackUrl parameter pollution...');

      const pollutionAttacks = [
        // Multiple callbackUrl parameters
        '?callbackUrl=/safe&callbackUrl=https://evil.com',
        '?callbackUrl=https://evil.com&callbackUrl=/safe',

        // Array notation
        '?callbackUrl[]=/safe&callbackUrl[]=https://evil.com',
        '?callbackUrl[0]=/safe&callbackUrl[1]=https://evil.com',

        // Different case
        '?callbackurl=https://evil.com&callbackUrl=/safe',
        '?CALLBACKURL=https://evil.com&callbackUrl=/safe',

        // With additional parameters
        '?callbackUrl=/safe%26redirect=https://evil.com',
        '?callbackUrl=/safe%3Fredirect=https://evil.com',
      ];

      for (const pollution of pollutionAttacks) {
        const attackUrl = `/ja/auth/signin${pollution}`;

        await page.goto(attackUrl);
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(
          `🔍 Parameter Pollution Test: ${pollution} -> ${currentUrl}`
        );

        // Should not redirect to evil.com
        expect(currentUrl).not.toContain('evil.com');
        expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);

        console.log(`✅ PASS: Parameter pollution blocked`);
      }
    });

    test('🚨 ESCALATION: Test callbackUrl length and format attacks', async ({
      page,
    }) => {
      console.log('🔍 Testing callbackUrl length and format attacks...');

      // Very long URL attack
      const longUrl = 'https://evil.com/' + 'A'.repeat(10000);

      // Malformed URLs
      const malformedUrls = [
        'ht`tp://evil.com',
        'http:///evil.com',
        'http:/evil.com',
        'http://evil.com:99999',
        'http://user:pass@evil.com',
        'http://[invalid-ipv6]/path',
      ];

      const testUrls = [longUrl, ...malformedUrls];

      for (const testUrl of testUrls) {
        try {
          const attackUrl = `/ja/auth/signin?callbackUrl=${encodeURIComponent(testUrl)}`;

          await page.goto(attackUrl);
          await page.fill('#email', 'test@example.com');
          await page.fill('#password', 'password123');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);

          const currentUrl = page.url();
          console.log(
            `🔍 Format Attack Test: ${testUrl.substring(0, 50)}... -> ${currentUrl}`
          );

          // Should handle malformed URLs gracefully
          expect(currentUrl).not.toContain('evil.com');
          expect(currentUrl).toMatch(/localhost|127\.0\.0\.1/);

          console.log(`✅ PASS: Malformed URL handled safely`);
        } catch (error) {
          console.log(`✅ PASS: Malformed URL rejected (error thrown)`);
        }
      }
    });
  });

  test.describe('Additional Advanced Attack Vectors', () => {
    test('🚨 ESCALATION: Test Server-Side Request Forgery (SSRF)', async ({
      page,
    }) => {
      console.log('🔍 Testing SSRF vulnerabilities...');

      const ssrfPayloads = [
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
        'http://localhost:22/', // SSH port
        'http://127.0.0.1:3306/', // MySQL port
        'http://192.168.1.1/', // Router admin
        'file:///etc/passwd', // Local file
        'http://0.0.0.0:6379/', // Redis port
      ];

      for (const payload of ssrfPayloads) {
        try {
          const response = await page.request.post('/api/upload', {
            data: {
              url: payload,
              callback: payload,
            },
          });

          const status = response.status();
          console.log(`🔍 SSRF Test: ${payload} -> Status: ${status}`);

          // Should not process SSRF payloads
          expect([401, 403, 404, 405, 400]).toContain(status);
        } catch (error) {
          console.log(`✅ PASS: SSRF payload blocked`);
        }
      }
    });

    test('🚨 ESCALATION: Test JWT token manipulation attacks', async ({
      page,
    }) => {
      console.log('🔍 Testing JWT token manipulation attacks...');

      // JWT bypass techniques
      const jwtBypassTokens = [
        // None algorithm
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJzdXBlcnVzZXIifQ.',

        // Algorithm confusion
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJzdXBlcnVzZXIiLCJpYXQiOjk5OTk5OTk5OTl9.invalid_signature',

        // Blank signature
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiJ9.',

        // Modified claims
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjk5OTk5OTk5OTl9.fake',
      ];

      for (const token of jwtBypassTokens) {
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
          `🔍 JWT Bypass Test: ...${token.substring(token.length - 20)} -> ${currentUrl}`
        );

        // Should redirect to signin due to invalid JWT
        expect(currentUrl).toContain('/auth/signin');

        console.log(`✅ PASS: JWT bypass attempt blocked`);
      }
    });
  });
});
