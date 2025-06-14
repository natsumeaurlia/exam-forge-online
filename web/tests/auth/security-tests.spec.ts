import { test, expect } from '@playwright/test';

test.describe('不正アクセス防止テスト', () => {
  test.describe('CSRF対策', () => {
    test('CSRFトークンなしでのフォーム送信拒否', async ({ page, request }) => {
      // 直接APIにPOSTリクエストを送信
      const response = await request.post('/api/auth/signup', {
        data: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
      });

      // CSRFトークンなしのリクエストは拒否されることを確認
      expect(response.status()).toBe(403);
    });
  });

  test.describe('権限管理', () => {
    test('他ユーザーのリソースへのアクセス拒否', async ({ page }) => {
      // ユーザーAとしてログイン
      await page.goto('/ja/auth/signin');
      await page.fill('#email', 'userA@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // 他ユーザーのクイズにアクセスしようとする
      await page.goto('/ja/dashboard/quizzes/other-user-quiz-id/edit');

      // アクセス拒否メッセージまたはリダイレクトを確認
      await expect(page.locator('text=アクセス権限がありません')).toBeVisible();
    });

    test('未認証での管理画面アクセス拒否', async ({ page }) => {
      const protectedPages = [
        '/ja/dashboard',
        '/ja/dashboard/quizzes',
        '/ja/dashboard/media',
        '/ja/dashboard/settings',
      ];

      for (const url of protectedPages) {
        await page.goto(url);
        // ログインページへリダイレクトされることを確認
        await page.waitForURL('**/auth/signin');
      }
    });
  });

  test.describe('ブルートフォース対策', () => {
    test('複数回のログイン失敗後のアカウントロック', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // 5回連続で間違ったパスワードでログインを試みる
      for (let i = 0; i < 5; i++) {
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', `WrongPassword${i}`);
        await page.click('button[type="submit"]');

        if (i < 4) {
          await expect(
            page.locator(
              'text=メールアドレスまたはパスワードが正しくありません'
            )
          ).toBeVisible();
        }
      }

      // 5回目の失敗後、アカウントロックメッセージを確認
      await expect(
        page.locator(
          'text=セキュリティのため、一時的にアカウントがロックされました'
        )
      ).toBeVisible();
    });

    test('レート制限の確認', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // 短時間に多数のリクエストを送信
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          page.evaluate(async () => {
            const response = await fetch('/api/auth/signin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'test@example.com',
                password: 'password',
              }),
            });
            return response.status;
          })
        );
      }

      const results = await Promise.all(promises);

      // 一部のリクエストがレート制限（429）で拒否されることを確認
      expect(results.some(status => status === 429)).toBeTruthy();
    });
  });

  test.describe('入力検証', () => {
    test('SQLインジェクション対策', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // SQLインジェクションを試みる
      await page.fill('#email', "test@example.com' OR '1'='1");
      await page.fill('#password', "password' OR '1'='1");
      await page.click('button[type="submit"]');

      // 通常のエラーメッセージが表示され、インジェクションが無効化されていることを確認
      await expect(
        page.locator('text=メールアドレスまたはパスワードが正しくありません')
      ).toBeVisible();
    });

    test('XSS対策', async ({ page }) => {
      await page.goto('/ja/auth/signup');

      // XSSを試みる
      const xssPayload = '<script>alert("XSS")</script>';
      await page.fill('#name', xssPayload);
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.fill('#confirmPassword', 'password123');
      await page.check('#terms');
      await page.click('button[type="submit"]');

      // スクリプトが実行されず、エスケープされて表示されることを確認
      await page.waitForURL('**/dashboard');
      const displayedName = await page
        .locator('[data-testid="user-name"]')
        .textContent();
      expect(displayedName).not.toContain('<script>');
      expect(displayedName).toContain('&lt;script&gt;');
    });
  });

  test.describe('セキュアな通信', () => {
    test('HTTPSリダイレクト', async ({ page }) => {
      // HTTPでアクセスした場合（本番環境でのテスト）
      if (process.env.NODE_ENV === 'production') {
        const httpUrl =
          process.env.PLAYWRIGHT_TEST_BASE_URL?.replace(
            'https://',
            'http://'
          ) || '';
        await page.goto(httpUrl);

        // HTTPSにリダイレクトされることを確認
        expect(page.url()).toMatch(/^https:\/\//);
      }
    });

    test('セキュアなCookie設定', async ({ page, context }) => {
      // ログイン
      await page.goto('/ja/auth/signin');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Cookieの設定を確認
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(cookie =>
        cookie.name.includes('session')
      );

      // セキュアフラグとHttpOnlyフラグが設定されていることを確認
      expect(sessionCookie?.secure).toBeTruthy();
      expect(sessionCookie?.httpOnly).toBeTruthy();
      expect(sessionCookie?.sameSite).toBe('Lax');
    });
  });
});
