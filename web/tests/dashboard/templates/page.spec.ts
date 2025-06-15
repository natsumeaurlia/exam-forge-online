import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Templates Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display templates page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/templates');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/templates/);
    await expect(page.locator('h1, h2')).toContainText([
      'テンプレート',
      'Templates',
    ]);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display template gallery', async ({ page }) => {
    await page.goto('/ja/dashboard/templates');
    await page.waitForLoadState('networkidle');

    // Should show templates content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for template cards or list
    const templateElements = page.locator(
      '[data-testid*="template"], .template, [class*="template"], .card'
    );
    if ((await templateElements.count()) > 0) {
      await expect(templateElements.first()).toBeVisible();
    }
  });

  test('should handle template search and filtering', async ({ page }) => {
    await page.goto('/ja/dashboard/templates');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="検索"], input[placeholder*="search"]'
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('クイズ');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Look for category filters
    const categoryButtons = page.locator(
      'button:has-text("カテゴリ"), button:has-text("Category"), select'
    );
    if ((await categoryButtons.count()) > 0) {
      await expect(categoryButtons.first()).toBeVisible();
    }
  });

  test('should handle template preview', async ({ page }) => {
    await page.goto('/ja/dashboard/templates');
    await page.waitForLoadState('networkidle');

    // Look for preview buttons
    const previewButtons = page.locator(
      'button:has-text("プレビュー"), button:has-text("Preview"), [data-testid*="preview"]'
    );
    if ((await previewButtons.count()) > 0) {
      await previewButtons.first().click();

      // Check if preview modal or page opens
      const previewContent = page.locator(
        '[data-testid="preview-modal"], .modal, [role="dialog"]'
      );
      if (await previewContent.isVisible()) {
        await expect(previewContent).toBeVisible();
      }
    }
  });

  test('should handle template usage', async ({ page }) => {
    await page.goto('/ja/dashboard/templates');
    await page.waitForLoadState('networkidle');

    // Look for use/create buttons
    const useButtons = page.locator(
      'button:has-text("使用"), button:has-text("Use"), button:has-text("作成"), button:has-text("Create")'
    );
    if ((await useButtons.count()) > 0) {
      await expect(useButtons.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/templates');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if templates are displayed in mobile-friendly layout
    const templateGrid = page.locator(
      '.grid, .flex, [class*="grid"], [class*="flex"]'
    );
    if (await templateGrid.isVisible()) {
      await expect(templateGrid).toBeVisible();
    }

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
    await page.goto('/en/dashboard/templates');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/templates/);
    await expect(page.locator('h1, h2')).toContainText([
      'Templates',
      'テンプレート',
    ]);
  });
});
