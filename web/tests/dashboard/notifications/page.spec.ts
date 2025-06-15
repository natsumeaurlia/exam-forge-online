import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Notifications Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display notifications page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/notifications');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/notifications/);
    await expect(page.locator('h1, h2')).toContainText([
      '通知',
      'Notifications',
    ]);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should handle empty notifications state', async ({ page }) => {
    await page.goto('/ja/dashboard/notifications');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show some content or empty state
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/notifications');

    await expect(page.locator('h1, h2')).toBeVisible();

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
    await page.goto('/en/dashboard/notifications');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/notifications/);
    await expect(page.locator('h1, h2')).toContainText([
      'Notifications',
      '通知',
    ]);
  });
});
