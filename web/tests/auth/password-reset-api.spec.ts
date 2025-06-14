import { test, expect } from '@playwright/test';

test.describe('Password Reset API Security Tests', () => {
  test.describe('Request Password Reset API', () => {
    test('should handle valid email correctly', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/request', {
        data: {
          email: 'test@example.com',
        },
      });

      // API が正常に応答することを確認
      expect(response.status()).toBe(200);
    });

    test('should handle invalid email format', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/request', {
        data: {
          email: 'invalid-email',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing email field', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/request', {
        data: {},
      });

      expect(response.status()).toBe(400);
    });

    test('should handle Redis-based rate limiting', async ({ request }) => {
      const email = 'ratelimit@example.com';

      // 短時間に多数のリクエストを送信（Redis永続化レート制限）
      const promises = Array.from({ length: 8 }, (_, i) =>
        request.post('/api/auth/password-reset/request', {
          data: { email: `${email}-${i}` }, // 一意のメールアドレス
        })
      );

      const responses = await Promise.all(promises);

      // レート制限が正常に動作することを確認
      const successResponses = responses.filter(res => res.status() === 200);
      const errorResponses = responses.filter(res => res.status() === 400);

      // 一部のリクエストは成功し、制限を超えた分はエラーになることを確認
      expect(successResponses.length).toBeLessThanOrEqual(5); // 15分間に5回まで
      expect(errorResponses.length).toBeGreaterThan(0);
    });

    test('should not reveal user existence', async ({ request }) => {
      // 存在しないユーザーでも同じ応答を返すことを確認
      const nonExistentResponse = await request.post(
        '/api/auth/password-reset/request',
        {
          data: {
            email: 'nonexistent@example.com',
          },
        }
      );

      const existentResponse = await request.post(
        '/api/auth/password-reset/request',
        {
          data: {
            email: 'test@example.com',
          },
        }
      );

      // 両方とも同じステータスコードを返すことを確認
      expect(nonExistentResponse.status()).toBe(existentResponse.status());
    });
  });

  test.describe('Reset Password API', () => {
    test('should handle invalid token', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/reset', {
        data: {
          token: 'invalid-token',
          newPassword: 'SecureNewPass123!',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should validate password strength', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/reset', {
        data: {
          token: 'valid-token',
          newPassword: 'weak',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing fields', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/reset', {
        data: {
          token: 'valid-token',
          // newPassword missing
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should prevent token reuse', async ({ request }) => {
      const token = 'valid-token';
      const newPassword = 'SecureNewPass123!';

      // 最初のリクエスト
      const firstResponse = await request.post(
        '/api/auth/password-reset/reset',
        {
          data: { token, newPassword },
        }
      );

      // 同じトークンで2回目のリクエスト
      const secondResponse = await request.post(
        '/api/auth/password-reset/reset',
        {
          data: { token, newPassword },
        }
      );

      // 2回目は失敗することを確認
      expect(secondResponse.status()).toBe(400);
    });
  });

  test.describe('Token Verification API', () => {
    test('should handle valid token', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/verify', {
        data: {
          token: 'valid-token',
        },
      });

      expect(response.status()).toBe(200);
    });

    test('should handle invalid token', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/verify', {
        data: {
          token: 'invalid-token',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle expired token', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/verify', {
        data: {
          token: 'expired-token',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle missing token', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/verify', {
        data: {},
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Security Headers', () => {
    test('should include security headers', async ({ request }) => {
      const response = await request.post('/api/auth/password-reset/request', {
        data: {
          email: 'test@example.com',
        },
      });

      // セキュリティヘッダーの確認
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['x-frame-options']).toBe('DENY');
    });
  });

  test.describe('Input Sanitization', () => {
    test('should handle malicious email input', async ({ request }) => {
      const maliciousEmails = [
        '<script>alert("xss")</script>@example.com',
        'test@example.com<script>alert("xss")</script>',
        'test+<script>alert("xss")</script>@example.com',
      ];

      for (const email of maliciousEmails) {
        const response = await request.post(
          '/api/auth/password-reset/request',
          {
            data: { email },
          }
        );

        // 悪意のある入力でもサーバーエラーにならないことを確認
        expect(response.status()).not.toBe(500);
      }
    });

    test('should handle malicious token input', async ({ request }) => {
      const maliciousTokens = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        '../../../etc/passwd',
      ];

      for (const token of maliciousTokens) {
        const response = await request.post('/api/auth/password-reset/verify', {
          data: { token },
        });

        // 悪意のある入力でもサーバーエラーにならないことを確認
        expect(response.status()).not.toBe(500);
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should require proper authentication', async ({ request }) => {
      // CSRFトークンなしでのリクエスト
      const response = await request.post('/api/auth/password-reset/request', {
        data: {
          email: 'test@example.com',
        },
        headers: {
          Origin: 'http://malicious-site.com',
        },
      });

      // CSRF保護が機能していることを確認
      expect(response.status()).toBe(403);
    });
  });
});
