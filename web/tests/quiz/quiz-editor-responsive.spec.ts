import { test, expect } from '@playwright/test';

test.describe('Quiz Editor Responsive Design', () => {
  test('should display correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to quiz editor
    await page.goto('/ja/dashboard/quizzes/new');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();

    // Verify mobile layout
    const sidebar = page.locator('[data-testid="quiz-editor-sidebar"]');
    await expect(sidebar).toBeHidden();
  });

  test('should display correctly on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to quiz editor
    await page.goto('/ja/dashboard/quizzes/new');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display correctly on desktop devices', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to quiz editor
    await page.goto('/ja/dashboard/quizzes/new');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();

    // Verify desktop layout
    const sidebar = page.locator('[data-testid="quiz-editor-sidebar"]');
    await expect(sidebar).toBeVisible();
  });
});
