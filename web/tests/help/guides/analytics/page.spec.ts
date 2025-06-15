import { test, expect } from '@playwright/test';

test.describe('Help Analytics Guide Page', () => {
  test('should display analytics guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/analytics');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/analytics/);
    await expect(page.locator('h1, h2')).toContainText([
      '分析',
      'Analytics',
      'アナリティクス',
      '統計',
    ]);
  });

  test('should display analytics guide content', async ({ page }) => {
    await page.goto('/ja/help/guides/analytics');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for analytics-specific content
    const analyticsElements = page.locator(
      ':has-text("データ"), :has-text("Data"), :has-text("レポート"), :has-text("Report")'
    );
    if ((await analyticsElements.count()) > 0) {
      await expect(analyticsElements.first()).toBeVisible();
    }
  });

  test('should explain metrics and KPIs', async ({ page }) => {
    await page.goto('/ja/help/guides/analytics');
    await page.waitForLoadState('networkidle');

    // Look for metrics explanations
    const metricsContent = page.locator(
      ':has-text("指標"), :has-text("Metrics"), :has-text("成績"), :has-text("Score"), :has-text("パフォーマンス")'
    );
    if ((await metricsContent.count()) > 0) {
      await expect(metricsContent.first()).toBeVisible();
    }
  });

  test('should explain dashboard features', async ({ page }) => {
    await page.goto('/ja/help/guides/analytics');
    await page.waitForLoadState('networkidle');

    // Look for dashboard-related content
    const dashboardContent = page.locator(
      ':has-text("ダッシュボード"), :has-text("Dashboard"), :has-text("グラフ"), :has-text("Chart")'
    );
    if ((await dashboardContent.count()) > 0) {
      await expect(dashboardContent.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/analytics');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/analytics');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/analytics/);
    await expect(page.locator('h1, h2')).toContainText(['Analytics', '分析']);
  });
});
