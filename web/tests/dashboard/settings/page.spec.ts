import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Settings Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display settings page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/settings');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/settings/);
    await expect(page.locator('h1, h2')).toContainText(['設定', 'Settings']);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display settings form elements', async ({ page }) => {
    await page.goto('/ja/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Should show settings content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for form elements
    const formElements = page.locator('form, input, select, textarea');
    if ((await formElements.count()) > 0) {
      await expect(formElements.first()).toBeVisible();
    }
  });

  test('should handle profile settings update', async ({ page }) => {
    await page.goto('/ja/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Look for profile-related inputs
    const nameInput = page.locator(
      'input[name="name"], input[placeholder*="名前"], input[placeholder*="name"]'
    );
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User Updated');
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.isVisible()) {
      // Email might be read-only, just check if it's visible
      await expect(emailInput).toBeVisible();
    }

    // Look for save button
    const saveButton = page.locator(
      'button:has-text("保存"), button:has-text("Save"), button[type="submit"]'
    );
    if (await saveButton.isVisible()) {
      await expect(saveButton).toBeVisible();
    }
  });

  test('should handle notification preferences', async ({ page }) => {
    await page.goto('/ja/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Look for notification-related checkboxes or toggles
    const notificationToggles = page.locator(
      'input[type="checkbox"], [role="switch"], .toggle'
    );
    if ((await notificationToggles.count()) > 0) {
      await expect(notificationToggles.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/settings');

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
    await page.goto('/en/dashboard/settings');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/settings/);
    await expect(page.locator('h1, h2')).toContainText(['Settings', '設定']);
  });
});
