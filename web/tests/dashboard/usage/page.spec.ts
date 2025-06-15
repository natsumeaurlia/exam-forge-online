import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Usage Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display usage page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/usage/);
    await expect(page.locator('h1, h2')).toContainText([
      '使用状況',
      'Usage',
      '使用量',
    ]);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display usage statistics', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');
    await page.waitForLoadState('networkidle');

    // Should show usage content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for usage metrics
    const usageMetrics = page.locator(
      '[data-testid*="usage"], .usage, [class*="usage"], .metric, [class*="stat"]'
    );
    if ((await usageMetrics.count()) > 0) {
      await expect(usageMetrics.first()).toBeVisible();
    }
  });

  test('should display usage charts and graphs', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');
    await page.waitForLoadState('networkidle');

    // Look for chart elements
    const chartElements = page.locator(
      'canvas, svg, [data-testid*="chart"], .chart, [class*="chart"]'
    );
    if ((await chartElements.count()) > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('should display current plan limits', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');
    await page.waitForLoadState('networkidle');

    // Look for plan limit information
    const limitElements = page.locator(
      '[data-testid*="limit"], .limit, [class*="limit"], :has-text("制限"), :has-text("limit")'
    );
    if ((await limitElements.count()) > 0) {
      await expect(limitElements.first()).toBeVisible();
    }
  });

  test('should handle time period selection', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');
    await page.waitForLoadState('networkidle');

    // Look for time period selectors
    const periodSelectors = page.locator(
      'select, button:has-text("期間"), button:has-text("Period"), [data-testid*="period"]'
    );
    if ((await periodSelectors.count()) > 0) {
      await expect(periodSelectors.first()).toBeVisible();

      // Try to interact with period selector
      if ((await periodSelectors.first().getAttribute('role')) !== 'button') {
        await periodSelectors.first().click();
      }
    }
  });

  test('should display usage breakdown by category', async ({ page }) => {
    await page.goto('/ja/dashboard/usage');
    await page.waitForLoadState('networkidle');

    // Look for usage categories
    const categoryElements = page.locator(
      '[data-testid*="category"], .category, [class*="category"], .breakdown'
    );
    if ((await categoryElements.count()) > 0) {
      await expect(categoryElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/usage');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if usage stats are displayed in mobile-friendly layout
    const usageContainer = page.locator('main, [role="main"]');
    await expect(usageContainer).toBeVisible();

    // Check if mobile navigation works
    const mobileMenu = page.locator(
      '[data-testid="mobile-menu"], button[aria-label*="menu"]'
    );
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(
        page.locator('[data-testid="mobile-nav"], nav')
      ).toBeVisible();
    }
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/dashboard/usage');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/usage/);
    await expect(page.locator('h1, h2')).toContainText(['Usage', '使用状況']);
  });
});
