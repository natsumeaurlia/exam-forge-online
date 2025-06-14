import { test, expect } from '@playwright/test';

test.describe('Password Reset Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/auth/forgot-password');
  });

  test('should display secure password reset form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'パスワードをお忘れですか？' })
    ).toBeVisible();
    await expect(
      page.getByText(
        'ご登録のメールアドレスにパスワードリセット用のリンクをお送りします'
      )
    ).toBeVisible();

    // セキュリティ情報の表示確認
    await expect(page.getByText('セキュリティについて')).toBeVisible();
    await expect(
      page.getByText('リセットリンクは1時間で有効期限が切れます')
    ).toBeVisible();
    await expect(page.getByText('リンクは1回のみ使用可能です')).toBeVisible();
    await expect(
      page.getByText('15分間に5回までリクエスト可能です')
    ).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText('有効なメールアドレスを入力してください')
    ).toBeVisible();
  });

  test('should handle non-existent email gracefully', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');

    // セキュリティのため、存在しないメールでも同じメッセージを表示
    await expect(
      page.getByText('パスワードリセット用のメールを送信しました')
    ).toBeVisible();
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');

    const submitButton = page.getByRole('button', {
      name: 'リセット用メールを送信',
    });
    await submitButton.click();

    await expect(page.getByText('送信中...')).toBeVisible();
  });

  test('should provide link back to login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'ログインページに戻る' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/ja/auth/signin');
  });

  test('should handle invalid reset token', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=invalid-token');

    await expect(page.getByText('無効なトークンです')).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: '新しいパスワードリセットをリクエストする',
      })
    ).toBeVisible();
  });

  test('should handle missing reset token', async ({ page }) => {
    await page.goto('/ja/auth/reset-password');

    await expect(page.getByText('無効なトークン')).toBeVisible();
    await expect(
      page.getByText('パスワードリセット用のトークンが見つかりません')
    ).toBeVisible();
  });

  test('should validate password strength on reset form', async ({ page }) => {
    // 有効なトークンでテスト（実際のトークンが必要な場合はモックを使用）
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    // パスワード強度チェックの表示確認
    await page.fill('input[id="newPassword"]', 'weak');

    await expect(page.getByText('パスワードの要件:')).toBeVisible();
    await expect(page.getByText('8文字以上')).toBeVisible();
    await expect(page.getByText('小文字を含む')).toBeVisible();
    await expect(page.getByText('大文字を含む')).toBeVisible();
    await expect(page.getByText('数字を含む')).toBeVisible();
    await expect(page.getByText('特殊文字(@$!%*?&)を含む')).toBeVisible();
  });

  test('should show/hide password fields', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    const passwordInput = page.locator('input[id="newPassword"]');
    const confirmPasswordInput = page.locator('input[id="confirmPassword"]');

    // 初期状態ではパスワードが隠されている
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // パスワード表示ボタンをクリック
    const showPasswordButtons = page
      .locator('button')
      .filter({ has: page.locator('svg') });
    await showPasswordButtons.first().click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    await page.fill('input[id="newPassword"]', 'SecurePass123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPass123!');

    await page.click('button[type="submit"]');

    await expect(page.getByText('パスワードが一致しません')).toBeVisible();
  });

  test('should disable submit button for weak passwords', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    await page.fill('input[id="newPassword"]', 'weak');

    const submitButton = page.getByRole('button', { name: 'パスワードを更新' });
    await expect(submitButton).toBeDisabled();
  });

  test('should display security warnings', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    await expect(page.getByText('セキュリティに関する注意')).toBeVisible();
    await expect(
      page.getByText('強力なパスワードを設定してください')
    ).toBeVisible();
    await expect(
      page.getByText('他のサービスと同じパスワードは避けてください')
    ).toBeVisible();
    await expect(
      page.getByText('パスワードは安全に保管してください')
    ).toBeVisible();
  });

  test('should handle successful password reset', async ({ page }) => {
    await page.goto('/ja/auth/reset-password?token=mock-valid-token');

    await page.fill('input[id="newPassword"]', 'SecureNewPass123!');
    await page.fill('input[id="confirmPassword"]', 'SecureNewPass123!');

    await page.click('button[type="submit"]');

    // 成功メッセージを確認（実際のAPIが必要）
    await expect(
      page.getByText('パスワードが正常に更新されました')
    ).toBeVisible();
    await expect(
      page.getByText('3秒後にログインページへ移動します')
    ).toBeVisible();
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // フォーカス管理の確認
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    // ラベルとinputの関連付け確認
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
  });

  test('should prevent rapid submissions (Redis rate limiting)', async ({
    page,
  }) => {
    const email = 'ratelimit-test@example.com';

    // 連続して複数回送信を試行
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(200); // 少し待機
    }

    // レート制限メッセージの確認
    await expect(
      page.getByText(/リクエストが多すぎます.*に再試行してください/)
    ).toBeVisible();
  });
});
