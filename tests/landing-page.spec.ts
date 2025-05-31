import { test, expect } from '@playwright/test';

test.describe('ランディングページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // ランディングページにアクセス
    await page.goto('/');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // ヘッダーナビゲーションが表示されているか確認
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // メインのヒーローセクションが表示されているか確認
    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible();

    // スクリーンショットを撮影（デバッグ用）
    await page.screenshot({
      path: 'tests/screenshots/landing-page.png',
      fullPage: true,
    });
  });

  test('言語切り替え機能', async ({ page }) => {
    await page.goto('/');

    // 言語切り替えボタンを探す
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');

    // 言語切り替えボタンが存在する場合のテスト
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();

      // 英語を選択
      const englishOption = page.locator('text=English');
      if (await englishOption.isVisible()) {
        await englishOption.click();
        // URLが英語版に変わることを確認
        await expect(page).toHaveURL(/\/en/);
      }
    }
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/');

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // ナビゲーションが適切に表示されているか確認
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // モバイルでのスクリーンショット
    await page.screenshot({
      path: 'tests/screenshots/landing-page-mobile.png',
      fullPage: true,
    });

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });

    // デスクトップでのスクリーンショット
    await page.screenshot({
      path: 'tests/screenshots/landing-page-desktop.png',
      fullPage: true,
    });
  });
});
