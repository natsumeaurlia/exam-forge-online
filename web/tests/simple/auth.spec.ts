import { test, expect } from '@playwright/test';

test.describe('簡単な認証テスト', () => {
  test('サインインページの基本要素', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // 基本的な要素の存在確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('フォーム入力テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // フォームに入力
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // 入力値確認
    await expect(page.locator('input[type="email"]')).toHaveValue(
      'test@example.com'
    );
    await expect(page.locator('input[type="password"]')).toHaveValue(
      'password123'
    );
  });
});
