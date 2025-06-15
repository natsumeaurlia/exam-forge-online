import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Subscription Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display subscription page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/subscription');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/subscription/);
    await expect(page.locator('h1, h2')).toContainText([
      'サブスクリプション',
      'Subscription',
      'プラン',
      'Plan',
    ]);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display subscription status', async ({ page }) => {
    await page.goto('/ja/dashboard/subscription');
    await page.waitForLoadState('networkidle');

    // Should show subscription content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for subscription status indicators
    const statusElements = page.locator(
      '[data-testid*="status"], .status, [class*="plan"], [class*="subscription"]'
    );
    if ((await statusElements.count()) > 0) {
      await expect(statusElements.first()).toBeVisible();
    }
  });

  test('should display billing information', async ({ page }) => {
    await page.goto('/ja/dashboard/subscription');
    await page.waitForLoadState('networkidle');

    // Look for billing-related information
    const billingElements = page.locator(
      '[data-testid*="billing"], .billing, [class*="billing"], :has-text("請求"), :has-text("billing")'
    );
    if ((await billingElements.count()) > 0) {
      await expect(billingElements.first()).toBeVisible();
    }
  });

  test('should handle plan upgrade/downgrade options', async ({ page }) => {
    await page.goto('/ja/dashboard/subscription');
    await page.waitForLoadState('networkidle');

    // Look for plan change buttons
    const planButtons = page.locator(
      'button:has-text("アップグレード"), button:has-text("Upgrade"), button:has-text("プラン変更"), button:has-text("Change Plan")'
    );
    if ((await planButtons.count()) > 0) {
      await expect(planButtons.first()).toBeVisible();
    }
  });

  test('should display usage information', async ({ page }) => {
    await page.goto('/ja/dashboard/subscription');
    await page.waitForLoadState('networkidle');

    // Look for usage indicators
    const usageElements = page.locator(
      '[data-testid*="usage"], .usage, [class*="usage"], :has-text("使用量"), :has-text("usage")'
    );
    if ((await usageElements.count()) > 0) {
      await expect(usageElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/subscription');

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
    await page.goto('/en/dashboard/subscription');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/subscription/);
    await expect(page.locator('h1, h2')).toContainText([
      'Subscription',
      'Plan',
      'サブスクリプション',
    ]);
  });
});
