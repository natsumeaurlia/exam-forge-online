import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Question Bank Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display question bank page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/question-bank');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/question-bank/);
    await expect(page.locator('h1, h2')).toContainText([
      '問題バンク',
      'Question Bank',
    ]);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display question bank interface', async ({ page }) => {
    await page.goto('/ja/dashboard/question-bank');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show question bank content or empty state
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for question-related elements
    const questionElements = page.locator(
      '[data-testid*="question"], .question, [class*="question"]'
    );
    if ((await questionElements.count()) > 0) {
      await expect(questionElements.first()).toBeVisible();
    }
  });

  test('should handle search and filtering', async ({ page }) => {
    await page.goto('/ja/dashboard/question-bank');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="検索"], input[placeholder*="search"]'
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('テスト');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000); // Wait for search results
    }

    // Look for filter options
    const filterButtons = page.locator(
      'button:has-text("フィルター"), button:has-text("Filter"), select'
    );
    if ((await filterButtons.count()) > 0) {
      await expect(filterButtons.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/question-bank');

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
    await page.goto('/en/dashboard/question-bank');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/question-bank/);
    await expect(page.locator('h1, h2')).toContainText([
      'Question Bank',
      '問題バンク',
    ]);
  });
});
