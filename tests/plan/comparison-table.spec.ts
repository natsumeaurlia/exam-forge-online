import { test, expect } from '@playwright/test';

test.describe('機能詳細比較テーブル', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/plans');
  });

  test('テーブルが表示され基本機能と高度な機能が区分されている', async ({ page }) => {
    await expect(page.getByTestId('plans-page')).toBeVisible();
    await expect(page.getByTestId('feature-comparison-table')).toBeVisible();
    await expect(page.getByTestId('basic-features-header')).toBeVisible();
    await expect(page.getByTestId('advanced-features-header')).toBeVisible();
  });

  test('モバイルビューで横スクロールできる', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const container = page.getByTestId('feature-comparison-container');
    const scrollWidth = await container.evaluate(el => el.scrollWidth);
    const clientWidth = await container.evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('機能値が正しく表示される', async ({ page }) => {
    const quizzesFree = page.getByTestId('feature-quizzes-free');
    await expect(quizzesFree).toHaveText(/5|5件/);
    const subdomainFree = page.getByTestId('feature-subdomain-free');
    await expect(subdomainFree.getByTestId('x-icon')).toBeVisible();
  });
});
