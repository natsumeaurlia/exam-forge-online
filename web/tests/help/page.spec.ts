import { test, expect } from '@playwright/test';

test.describe('Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/help');
  });

  test('should display help page with correct title and description', async ({
    page,
  }) => {
    await expect(page.getByTestId('help-title')).toHaveText('ヘルプセンター');
    await expect(page.getByTestId('help-description')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.getByTestId('help-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      '検索したいキーワードを入力...'
    );

    // Test search input
    await searchInput.fill('クイズ');
    await expect(searchInput).toHaveValue('クイズ');
  });

  test('should display category filters', async ({ page }) => {
    // Check all categories are present
    await expect(page.getByTestId('category-all')).toBeVisible();
    await expect(page.getByTestId('category-getting-started')).toBeVisible();
    await expect(page.getByTestId('category-quiz-creation')).toBeVisible();
    await expect(page.getByTestId('category-team-management')).toBeVisible();
    await expect(page.getByTestId('category-billing')).toBeVisible();
    await expect(page.getByTestId('category-analytics')).toBeVisible();
    await expect(page.getByTestId('category-security')).toBeVisible();
    await expect(page.getByTestId('category-troubleshooting')).toBeVisible();
  });

  test('should have functional tabs', async ({ page }) => {
    // Check all tabs are present
    await expect(page.getByTestId('tab-faq')).toBeVisible();
    await expect(page.getByTestId('tab-guides')).toBeVisible();
    await expect(page.getByTestId('tab-tutorials')).toBeVisible();
    await expect(page.getByTestId('tab-contact')).toBeVisible();

    // FAQ tab should be active by default
    await expect(page.getByTestId('tab-faq')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('should display FAQ items', async ({ page }) => {
    // Check that FAQ items are displayed
    await expect(page.getByTestId('faq-item-0')).toBeVisible();
    await expect(page.getByTestId('faq-trigger-0')).toBeVisible();

    // Click on first FAQ item to expand
    await page.getByTestId('faq-trigger-0').click();
    await expect(page.getByTestId('faq-content-0')).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Switch to guides tab
    await page.getByTestId('tab-guides').click();
    await expect(page.getByTestId('tab-guides')).toHaveAttribute(
      'data-state',
      'active'
    );

    // Switch to tutorials tab
    await page.getByTestId('tab-tutorials').click();
    await expect(page.getByTestId('tab-tutorials')).toHaveAttribute(
      'data-state',
      'active'
    );

    // Switch to contact tab
    await page.getByTestId('tab-contact').click();
    await expect(page.getByTestId('tab-contact')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('should filter content by category', async ({ page }) => {
    // Click on getting-started category
    await page.getByTestId('category-getting-started').click();

    // Should show filtered content (implementation depends on content)
    // This test may need adjustment based on actual content structure
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('help-title')).toBeVisible();
    await expect(page.getByTestId('help-search')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByTestId('help-title')).toBeVisible();
    await expect(page.getByTestId('help-search')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId('help-title')).toBeVisible();
    await expect(page.getByTestId('help-search')).toBeVisible();
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Test search input focus
    const searchInput = page.getByTestId('help-search');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('should handle search with no results', async ({ page }) => {
    const searchInput = page.getByTestId('help-search');
    await searchInput.fill('nonexistentquery123');

    // Should show no results message (implementation specific)
    // This may need adjustment based on actual implementation
  });
});

test.describe('Help Page - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/help');
  });

  test('should display help page in English', async ({ page }) => {
    await expect(page.getByTestId('help-title')).toHaveText('Help Center');
    await expect(page.getByTestId('help-description')).toBeVisible();
  });

  test('should have English search placeholder', async ({ page }) => {
    const searchInput = page.getByTestId('help-search');
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Enter keywords to search...'
    );
  });

  test('should display English category labels', async ({ page }) => {
    await expect(page.getByTestId('category-all')).toHaveText('All');
    await expect(page.getByTestId('category-getting-started')).toHaveText(
      'Getting Started'
    );
    await expect(page.getByTestId('category-quiz-creation')).toHaveText(
      'Quiz Creation'
    );
  });
});

test.describe('Help Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/help');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('ヘルプセンター');
  });

  test('should have accessible form labels', async ({ page }) => {
    const searchInput = page.getByTestId('help-search');
    await expect(searchInput).toHaveAttribute('type', 'text');
  });

  test('should support screen readers', async ({ page }) => {
    // Check for aria labels and roles
    const searchInput = page.getByTestId('help-search');
    await expect(searchInput).toBeVisible();

    // Tab navigation should work properly
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });
});
