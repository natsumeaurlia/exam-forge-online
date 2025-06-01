import { test, expect } from '@playwright/test';

test.describe('プラン切り替えトグル', () => {
  test.beforeEach(async ({ page }) => {
    // トップページの価格セクションにアクセス
    await page.goto('/ja');
    // 価格セクションまでスクロール
    await page.locator('#pricing').scrollIntoViewIfNeeded();
  });

  test('月額/年額切り替えトグルが表示される', async ({ page }) => {
    // 月額ラベルが表示されることを確認
    const monthlyLabel = page.getByTestId('plan-toggle-monthly-label');
    await expect(monthlyLabel).toBeVisible();
    await expect(monthlyLabel).toHaveText('月額');

    // 年額ラベルが表示されることを確認
    const annualLabel = page.getByTestId('plan-toggle-annual-label');
    await expect(annualLabel).toBeVisible();
    await expect(annualLabel).toHaveText('年額');

    // スイッチが表示されることを確認
    const toggle = page.getByTestId('plan-toggle-switch');
    await expect(toggle).toBeVisible();
  });

  test('初期状態では月額が選択されている', async ({ page }) => {
    const toggle = page.getByTestId('plan-toggle-switch');

    // スイッチが月額（オフ）になっていることを確認
    await expect(toggle).not.toBeChecked();

    // 割引バッジが表示されていないことを確認
    const discountBadge = page.getByTestId('plan-toggle-discount-badge');
    await expect(discountBadge).not.toBeVisible();
  });

  test('年額に切り替えると割引バッジが表示される', async ({ page }) => {
    const toggle = page.getByTestId('plan-toggle-switch');

    // 年額に切り替え
    await toggle.click();

    // スイッチが年額（オン）になっていることを確認
    await expect(toggle).toBeChecked();

    // 割引バッジが表示されることを確認
    const discountBadge = page.getByTestId('plan-toggle-discount-badge');
    await expect(discountBadge).toBeVisible();
    await expect(discountBadge).toHaveText('約17%割引');
  });

  test('プラン価格が切り替わることを確認', async ({ page }) => {
    const toggle = page.getByTestId('plan-toggle-switch');
    const proPrice = page.getByTestId('plan-price-1');

    // 初期状態（月額）の価格を確認
    await expect(proPrice).toContainText('¥2,980');

    // 年額に切り替え
    await toggle.click();

    // 年額価格に変わることを確認
    await expect(proPrice).toContainText('¥2,480');

    // 月額に戻す
    await toggle.click();

    // 月額価格に戻ることを確認
    await expect(proPrice).toContainText('¥2,980');
  });

  test('月額から年額、年額から月額への切り替えが正常に動作する', async ({
    page,
  }) => {
    const toggle = page.getByTestId('plan-toggle-switch');
    const discountBadge = page.getByTestId('plan-toggle-discount-badge');

    // 初期状態：月額
    await expect(toggle).not.toBeChecked();
    await expect(discountBadge).not.toBeVisible();

    // 年額に切り替え
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(discountBadge).toBeVisible();

    // 月額に戻す
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(discountBadge).not.toBeVisible();
  });

  test('アクセシビリティ：適切なaria-labelが設定されている', async ({
    page,
  }) => {
    const toggle = page.getByTestId('plan-toggle-switch');

    // 初期状態（月額）のaria-labelを確認
    await expect(toggle).toHaveAttribute('aria-label', '月額');

    // 年額に切り替え
    await toggle.click();

    // 年額のaria-labelを確認
    await expect(toggle).toHaveAttribute('aria-label', '年額');
  });
});

test.describe('プラン切り替えトグル（English）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
    // 価格セクションまでスクロール
    await page.locator('#pricing').scrollIntoViewIfNeeded();
  });

  test('英語環境でのラベル表示', async ({ page }) => {
    const monthlyLabel = page.getByTestId('plan-toggle-monthly-label');
    await expect(monthlyLabel).toBeVisible();
    await expect(monthlyLabel).toHaveText('Monthly');

    const annualLabel = page.getByTestId('plan-toggle-annual-label');
    await expect(annualLabel).toBeVisible();
    await expect(annualLabel).toHaveText('Annually');
  });

  test('英語環境でのプラン価格切り替え', async ({ page }) => {
    const toggle = page.getByTestId('plan-toggle-switch');
    const proPrice = page.getByTestId('plan-price-1');

    // 初期状態（月額）の価格を確認
    await expect(proPrice).toContainText('$29');

    // 年額に切り替え
    await toggle.click();

    // 年額価格に変わることを確認
    await expect(proPrice).toContainText('$24');
  });

  test('英語環境での割引バッジ表示', async ({ page }) => {
    const toggle = page.getByTestId('plan-toggle-switch');

    // 年額に切り替え
    await toggle.click();

    // 英語の割引バッジが表示されることを確認
    const discountBadge = page.getByTestId('plan-toggle-discount-badge');
    await expect(discountBadge).toBeVisible();
    await expect(discountBadge).toHaveText('Save ~17%');
  });
});
