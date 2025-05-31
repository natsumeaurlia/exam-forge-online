import { test, expect } from '@playwright/test';

test.describe('PlanToggle コンポーネント', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test assumes there's a test page that renders the PlanToggle component
    // You may need to create a dedicated test page or integrate this with an existing page
    await page.goto('/ja/plan-comparison'); // Adjust URL as needed
  });

  test('月額/年額トグルが正しく表示される', async ({ page }) => {
    // トグルコンテナが表示されることを確認
    const toggleContainer = page.locator('[data-testid="plan-toggle-container"]');
    await expect(toggleContainer).toBeVisible();

    // 月額ラベルが表示されることを確認
    const monthlyLabel = page.locator('[data-testid="plan-toggle-monthly-label"]');
    await expect(monthlyLabel).toBeVisible();
    await expect(monthlyLabel).toHaveText('月額');

    // 年額ラベルが表示されることを確認
    const yearlyLabel = page.locator('[data-testid="plan-toggle-yearly-label"]');
    await expect(yearlyLabel).toBeVisible();
    await expect(yearlyLabel).toHaveText('年額');

    // スイッチが表示されることを確認
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    await expect(toggleSwitch).toBeVisible();
  });

  test('デフォルトで月額が選択されている', async ({ page }) => {
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    
    // スイッチが月額（unchecked）状態であることを確認
    await expect(toggleSwitch).not.toBeChecked();

    // 割引バッジが表示されていないことを確認
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    await expect(discountBadge).not.toBeVisible();

    // 月額ラベルがアクティブな色で表示されることを確認
    const monthlyLabel = page.locator('[data-testid="plan-toggle-monthly-label"]');
    await expect(monthlyLabel).toHaveClass(/text-foreground/);
  });

  test('年額に切り替えると割引バッジが表示される', async ({ page }) => {
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    
    // 年額に切り替え
    await toggleSwitch.click();
    
    // スイッチが年額（checked）状態であることを確認
    await expect(toggleSwitch).toBeChecked();

    // 割引バッジが表示されることを確認
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    await expect(discountBadge).toBeVisible();
    await expect(discountBadge).toHaveText('約17%割引');

    // 年額ラベルがアクティブな色で表示されることを確認
    const yearlyLabel = page.locator('[data-testid="plan-toggle-yearly-label"]');
    await expect(yearlyLabel).toHaveClass(/text-foreground/);

    // 月額ラベルが非アクティブな色で表示されることを確認
    const monthlyLabel = page.locator('[data-testid="plan-toggle-monthly-label"]');
    await expect(monthlyLabel).toHaveClass(/text-muted-foreground/);
  });

  test('トグルを複数回切り替えても正しく動作する', async ({ page }) => {
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    
    // 初期状態（月額）を確認
    await expect(toggleSwitch).not.toBeChecked();
    await expect(discountBadge).not.toBeVisible();

    // 年額に切り替え
    await toggleSwitch.click();
    await expect(toggleSwitch).toBeChecked();
    await expect(discountBadge).toBeVisible();

    // 月額に戻す
    await toggleSwitch.click();
    await expect(toggleSwitch).not.toBeChecked();
    await expect(discountBadge).not.toBeVisible();

    // 再度年額に切り替え
    await toggleSwitch.click();
    await expect(toggleSwitch).toBeChecked();
    await expect(discountBadge).toBeVisible();
  });

  test('レスポンシブデザインが正しく動作する', async ({ page }) => {
    const toggleContainer = page.locator('[data-testid="plan-toggle-container"]');
    
    // デスクトップサイズでテスト
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(toggleContainer).toBeVisible();
    
    // タブレットサイズでテスト
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(toggleContainer).toBeVisible();
    
    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(toggleContainer).toBeVisible();
    
    // すべてのサイズでコンポーネントが機能することを確認
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    await toggleSwitch.click();
    
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    await expect(discountBadge).toBeVisible();
  });

  test('キーボードアクセシビリティが正しく動作する', async ({ page }) => {
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    
    // タブキーでスイッチにフォーカスを当てる
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // 必要に応じて調整
    
    // スペースキーでトグルを切り替え
    await page.keyboard.press('Space');
    
    // 年額が選択されることを確認
    await expect(toggleSwitch).toBeChecked();
    
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    await expect(discountBadge).toBeVisible();
    
    // もう一度スペースキーで月額に戻す
    await page.keyboard.press('Space');
    await expect(toggleSwitch).not.toBeChecked();
    await expect(discountBadge).not.toBeVisible();
  });

  test('割引バッジのスタイリングが正しい', async ({ page }) => {
    const toggleSwitch = page.locator('[data-testid="plan-toggle-switch"]');
    
    // 年額に切り替え
    await toggleSwitch.click();
    
    const discountBadge = page.locator('[data-testid="plan-toggle-discount-badge"]');
    await expect(discountBadge).toBeVisible();
    
    // 割引バッジが適切なスタイルを持つことを確認
    await expect(discountBadge).toHaveClass(/bg-primary\/10/);
    await expect(discountBadge).toHaveClass(/text-primary/);
    await expect(discountBadge).toHaveClass(/rounded-full/);
  });
});