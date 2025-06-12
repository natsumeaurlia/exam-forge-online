import { Page } from '@playwright/test';

/**
 * テスト用認証ヘルパー
 * 認証が必要なページテストで使用
 */
export async function signInAsTestUser(page: Page) {
  // サインインページに移動
  await page.goto('/ja/auth/signin');

  // テスト用認証情報でログイン
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');

  // サインインボタンをクリック
  await page.click('button[type="submit"]');

  // ダッシュボードにリダイレクトされるまで待機
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * 認証状態をモックする（より高速）
 */
export async function mockAuthenticatedUser(page: Page) {
  // セッションCookieを設定
  await page.addInitScript(() => {
    // LocalStorageに認証情報を設定
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'テストユーザー',
      })
    );
  });

  // 認証が必要なページに直接アクセス
  await page.goto('/ja/dashboard');
}

/**
 * 認証Cookieを設定してログイン状態にする
 */
export async function setupAuthCookies(page: Page) {
  // NextAuth.jsのセッションCookieを模擬
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
    {
      name: 'next-auth.csrf-token',
      value: 'mock-csrf-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);
}
