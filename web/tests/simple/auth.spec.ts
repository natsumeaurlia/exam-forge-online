import { test, expect } from '@playwright/test';

test.describe('簡単な認証テスト', () => {
  test('サインインページの基本要素', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // 基本的な要素の存在確認
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('フォーム入力テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // フォームに入力
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');

    // 入力値確認
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    await expect(page.locator('#password')).toHaveValue('password123');
  });
});
