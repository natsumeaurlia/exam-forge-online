import { test, expect } from '@playwright/test';

test.describe('基本的なページ表示テスト', () => {
  test('ランディングページが表示される', async ({ page }) => {
    await page.goto('/ja');
    await expect(page).toHaveTitle(/ExamForge/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('サインインページが表示される', async ({ page }) => {
    await page.goto('/ja/auth/signin');
    await expect(page).toHaveTitle(/ExamForge/);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('プランページが表示される', async ({ page }) => {
    await page.goto('/ja/plans');
    await expect(page).toHaveTitle(/ExamForge/);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
