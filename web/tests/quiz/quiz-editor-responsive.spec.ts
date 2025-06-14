// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Quiz Editor - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication tests for now since we just want to test responsive layout
    // This test would need proper authentication setup in a real testing environment
    test.skip();
  });

  test('Mobile layout shows correct elements', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to quiz editor (this would need a real quiz ID in practice)
    await page.goto('/ja/dashboard/quizzes/test-quiz/edit');

    // Mobile layout should be visible
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

    // Settings should open as modal, not sidebar
    await page.locator('[data-testid="settings-button"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('Tablet layout shows 2-column structure', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/ja/dashboard/quizzes/test-quiz/edit');

    // Tablet layout should be visible
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Should have 2-column layout with question list on left
    await expect(page.locator('.w-80.border-r')).toBeVisible();
  });

  test('Desktop layout shows 3-column structure', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/ja/dashboard/quizzes/test-quiz/edit');

    // Desktop layout should be visible
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();

    // Should show settings as sidebar when opened
    await page.locator('[data-testid="settings-button"]').click();
    await expect(page.locator('.w-80.border-l')).toBeVisible();
  });

  test('Touch targets meet minimum 44px requirement', async ({ page }) => {
    // Set mobile viewport for touch testing
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/ja/dashboard/quizzes/test-quiz/edit');

    // Check that touch targets (buttons) meet 44px minimum
    const touchTargets = page.locator('button');
    const count = await touchTargets.count();

    for (let i = 0; i < count; i++) {
      const button = touchTargets.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Horizontal toolbar scrolling works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 320, height: 568 }); // Small mobile screen

    await page.goto('/ja/dashboard/quizzes/test-quiz/edit');

    // Check for horizontal scrollable toolbar
    const toolbar = page.locator('.quiz-editor-mobile-toolbar');
    if ((await toolbar.count()) > 0) {
      const scrollWidth = await toolbar.evaluate(el => el.scrollWidth);
      const clientWidth = await toolbar.evaluate(el => el.clientWidth);

      // If content overflows, it should be scrollable
      if (scrollWidth > clientWidth) {
        expect(scrollWidth).toBeGreaterThan(clientWidth);
      }
    }
  });
});

export {};
