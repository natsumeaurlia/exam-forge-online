import { test, expect } from '@playwright/test';

test.describe.skip('パスワードリセットフロー', () => {
  test('パスワードリセットリンクの表示と遷移', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // パスワードを忘れた場合のリンクが表示されることを確認
    const forgotPasswordLink = page.locator(
      'a:has-text("パスワードをお忘れですか？")'
    );
    await expect(forgotPasswordLink).toBeVisible();

    // リンクをクリック
    await forgotPasswordLink.click();

    // パスワードリセットページへの遷移を確認
    await page.waitForURL('**/auth/forgot-password');
    await expect(
      page.getByRole('heading', { name: 'パスワードリセット' })
    ).toBeVisible();
  });

  test('パスワードリセットメール送信', async ({ page }) => {
    await page.goto('/ja/auth/forgot-password');

    // メールアドレスを入力
    await page.fill('#email', 'test@example.com');

    // 送信ボタンをクリック
    await page.click('button:has-text("リセットメールを送信")');

    // 成功メッセージを確認
    await expect(
      page.locator('text=パスワードリセットメールを送信しました')
    ).toBeVisible();
  });

  test('無効なメールアドレスでのエラー', async ({ page }) => {
    await page.goto('/ja/auth/forgot-password');

    // 無効なメールアドレスを入力
    await page.fill('#email', 'invalid-email');
    await page.click('button:has-text("リセットメールを送信")');

    // エラーメッセージを確認
    await expect(
      page.locator('text=有効なメールアドレスを入力してください')
    ).toBeVisible();
  });

  test('存在しないメールアドレスでの処理', async ({ page }) => {
    await page.goto('/ja/auth/forgot-password');

    // 存在しないメールアドレスを入力
    await page.fill('#email', 'nonexistent@example.com');
    await page.click('button:has-text("リセットメールを送信")');

    // セキュリティのため、同じ成功メッセージを表示することを確認
    await expect(
      page.locator('text=パスワードリセットメールを送信しました')
    ).toBeVisible();
  });
});

test.describe('セッションタイムアウト', () => {
  test('長時間未操作後の自動ログアウト', async ({ page }) => {
    // ログイン
    await page.goto('/ja/auth/signin');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // セッションタイムアウトをシミュレート（実際のテストでは時間を進める必要がある）
    // ここでは、セッションCookieを削除してシミュレート
    await page.context().clearCookies();

    // ページをリロード
    await page.reload();

    // ログインページへリダイレクトされることを確認
    await page.waitForURL('**/auth/signin');
    await expect(
      page.locator('text=セッションがタイムアウトしました')
    ).toBeVisible();
  });

  test('アクティブな操作中はセッション維持', async ({ page }) => {
    // ログイン
    await page.goto('/ja/auth/signin');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 複数のページを移動してアクティビティをシミュレート
    await page.goto('/ja/dashboard/quizzes');
    await expect(page.locator('h1:has-text("クイズ管理")')).toBeVisible();

    await page.goto('/ja/dashboard/media');
    await expect(page.locator('h1:has-text("メディア管理")')).toBeVisible();

    // セッションが維持されていることを確認
    await page.goto('/ja/dashboard');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });
});
