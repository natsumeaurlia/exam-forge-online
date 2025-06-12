import { test, expect } from '@playwright/test';

test.describe('基本的なページ表示テスト', () => {
  // 各テストの前にサーバーの起動を待機
  test.beforeEach(async ({ page }) => {
    // サーバーの起動を待つ
    await page.waitForTimeout(2000);
  });

  test('ランディングページが表示される', async ({ page }) => {
    try {
      await page.goto('/ja', { waitUntil: 'networkidle' });

      // ページタイトルの確認
      await expect(page).toHaveTitle(/ExamForge/);

      // 基本的な要素の確認
      await expect(page.locator('h1').first()).toBeVisible();

      console.log('ランディングページテスト完了');
    } catch (error) {
      console.error('ランディングページテストエラー:', error);
      throw error;
    }
  });

  test('サインインページが表示される', async ({ page }) => {
    try {
      await page.goto('/ja/auth/signin', { waitUntil: 'networkidle' });

      // ページタイトルの確認
      await expect(page).toHaveTitle(/ExamForge/);

      // フォーム要素の確認
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
      await expect(
        page.locator('input[type="password"]').first()
      ).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();

      console.log('サインインページテスト完了');
    } catch (error) {
      console.error('サインインページテストエラー:', error);
      throw error;
    }
  });

  test('プランページが表示される', async ({ page }) => {
    try {
      await page.goto('/ja/plans', { waitUntil: 'networkidle' });

      // ページタイトルの確認
      await expect(page).toHaveTitle(/ExamForge/);

      // 基本的な要素の確認
      await expect(page.locator('h1').first()).toBeVisible();

      console.log('プランページテスト完了');
    } catch (error) {
      console.error('プランページテストエラー:', error);
      throw error;
    }
  });
});
