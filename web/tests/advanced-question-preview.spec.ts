import { test, expect } from '@playwright/test';

test.describe('Advanced Question Type Preview', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('DIAGRAM Question Type', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a quiz with diagram questions
      await page.goto('/quiz/test-diagram-quiz/preview');
    });

    test('should display diagram with zoom controls', async ({ page }) => {
      // Check for diagram container
      await expect(
        page.locator('[data-testid="diagram-container"]')
      ).toBeVisible();

      // Check zoom controls
      await expect(
        page.getByRole('button', { name: /zoom in/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /zoom out/i })
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /reset/i })).toBeVisible();

      // Check zoom percentage display
      await expect(page.getByText(/100%/)).toBeVisible();
    });

    test('should handle zoom functionality', async ({ page }) => {
      // Click zoom in
      await page.click('[data-testid="zoom-in-button"]');
      await expect(page.getByText(/125%/)).toBeVisible();

      // Click zoom out
      await page.click('[data-testid="zoom-out-button"]');
      await expect(page.getByText(/100%/)).toBeVisible();

      // Click reset
      await page.click('[data-testid="zoom-in-button"]');
      await page.click('[data-testid="zoom-in-button"]');
      await page.click('[data-testid="reset-zoom-button"]');
      await expect(page.getByText(/100%/)).toBeVisible();
    });

    test('should display hot spots on diagram', async ({ page }) => {
      // Check for hot spot indicators
      await expect(
        page.locator('[data-testid="hotspot-indicator"]')
      ).toHaveCount({ min: 1 });

      // Check hot spot numbers
      await expect(page.getByText('1')).toBeVisible();
    });

    test('should handle hot spot interaction', async ({ page }) => {
      // Click on a hot spot
      await page.click('[data-testid="hotspot-indicator"]:first-child');

      // Should focus corresponding input field
      await expect(
        page.locator('[data-testid^="hotspot-input-"]:first-child')
      ).toBeFocused();
    });

    test('should save answers for hot spots', async ({ page }) => {
      // Fill in answer for first hot spot
      await page.fill('[data-testid^="hotspot-input-"]:first-child', 'Heart');

      // Check that the hot spot indicator changes color/state
      await expect(
        page.locator('[data-testid="hotspot-indicator"]:first-child')
      ).toHaveClass(/bg-green-500/);

      // Check progress indicator
      await expect(page.getByText(/1.*\/.*\d+.*completed/i)).toBeVisible();
    });

    test('should show tooltip on hot spot hover', async ({ page }) => {
      // Hover over hot spot
      await page.hover('[data-testid="hotspot-indicator"]:first-child');

      // Check for tooltip
      await expect(
        page.locator('[data-testid="hotspot-tooltip"]')
      ).toBeVisible();
    });

    test('should toggle hot spot visibility', async ({ page }) => {
      // Click hide/show button
      await page.click('[data-testid="toggle-hotspots-button"]');

      // Hot spots should be hidden
      await expect(
        page.locator('[data-testid="hotspot-indicator"]')
      ).toHaveCount(0);

      // Click show button
      await page.click('[data-testid="toggle-hotspots-button"]');

      // Hot spots should be visible again
      await expect(
        page.locator('[data-testid="hotspot-indicator"]')
      ).toHaveCount({ min: 1 });
    });
  });

  test.describe('MATCHING Question Type', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a quiz with matching questions
      await page.goto('/quiz/test-matching-quiz/preview');
    });

    test('should display left and right columns', async ({ page }) => {
      // Check for left column
      await expect(page.getByText(/left column/i)).toBeVisible();

      // Check for right column
      await expect(page.getByText(/right column/i)).toBeVisible();

      // Check for matching items
      await expect(page.locator('[data-testid="left-item"]')).toHaveCount({
        min: 1,
      });
      await expect(page.locator('[data-testid="right-item"]')).toHaveCount({
        min: 1,
      });
    });

    test('should handle drag and drop matching', async ({ page }) => {
      // Get first left item and first right item
      const leftItem = page.locator('[data-testid="left-item"]').first();
      const rightItem = page.locator('[data-testid="right-item"]').first();

      // Perform drag and drop
      await leftItem.dragTo(rightItem);

      // Check that connection is established
      await expect(leftItem).toHaveClass(/border-green-500/);
      await expect(rightItem).toHaveClass(/border-green-500/);

      // Check progress counter
      await expect(page.getByText(/1.*\/.*\d+.*connected/i)).toBeVisible();
    });

    test('should handle click-to-connect', async ({ page }) => {
      // Click on left item to select
      await page.click('[data-testid="left-item"]:first-child');

      // Item should be highlighted as selected
      await expect(
        page.locator('[data-testid="left-item"]:first-child')
      ).toHaveClass(/ring-2/);

      // Click on right item to connect
      await page.click('[data-testid="right-item"]:first-child');

      // Connection should be established
      await expect(
        page.locator('[data-testid="left-item"]:first-child')
      ).toHaveClass(/border-green-500/);
    });

    test('should use dropdown for quick connect', async ({ page }) => {
      // Find the first dropdown
      const dropdown = page
        .locator('[data-testid="quick-connect-dropdown"]')
        .first();

      // Select an option
      await dropdown.selectOption({ index: 1 });

      // Check that connection is made
      await expect(page.getByText(/1.*\/.*\d+.*connected/i)).toBeVisible();
    });

    test('should reset all connections', async ({ page }) => {
      // Make a connection first
      await page
        .locator('[data-testid="quick-connect-dropdown"]')
        .first()
        .selectOption({ index: 1 });

      // Click reset button
      await page.click('[data-testid="reset-matching-button"]');

      // Check that connections are cleared
      await expect(page.getByText(/0.*\/.*\d+.*connected/i)).toBeVisible();
    });

    test('should prevent duplicate connections', async ({ page }) => {
      // Connect first left item to first right item
      await page
        .locator('[data-testid="quick-connect-dropdown"]')
        .first()
        .selectOption({ index: 1 });

      // Try to connect second left item to same right item
      const secondDropdown = page
        .locator('[data-testid="quick-connect-dropdown"]')
        .nth(1);

      // The already connected option should be disabled or marked as taken
      await expect(secondDropdown.locator('option:disabled')).toHaveCount({
        min: 1,
      });
    });

    test('should show completion status', async ({ page }) => {
      // Get total number of possible connections
      const leftItems = await page.locator('[data-testid="left-item"]').count();
      const rightItems = await page
        .locator('[data-testid="right-item"]')
        .count();
      const maxConnections = Math.min(leftItems, rightItems);

      // Make all possible connections
      for (let i = 0; i < maxConnections; i++) {
        await page
          .locator('[data-testid="quick-connect-dropdown"]')
          .nth(i)
          .selectOption({ index: i + 1 });
      }

      // Check completion status
      await expect(page.getByText(/all connected/i)).toBeVisible();
    });
  });

  test.describe('SORTING Question Type', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a quiz with sorting questions
      await page.goto('/quiz/test-sorting-quiz/preview');
    });

    test('should display sortable items', async ({ page }) => {
      // Check for sortable items
      await expect(page.locator('[data-testid="sorting-item"]')).toHaveCount({
        min: 2,
      });

      // Check for drag handles
      await expect(page.locator('[data-testid="drag-handle"]')).toHaveCount({
        min: 2,
      });
    });

    test('should handle drag and drop sorting', async ({ page }) => {
      // Get first and second items
      const firstItem = page.locator('[data-testid="sorting-item"]').first();
      const secondItem = page.locator('[data-testid="sorting-item"]').nth(1);

      // Get initial text content
      const firstText = await firstItem.textContent();
      const secondText = await secondItem.textContent();

      // Drag first item to second position
      await firstItem.dragTo(secondItem);

      // Check that order has changed
      const newFirstText = await page
        .locator('[data-testid="sorting-item"]')
        .first()
        .textContent();
      expect(newFirstText).toBe(secondText);
    });

    test('should show item numbers', async ({ page }) => {
      // Check that items are numbered
      await expect(page.getByText('1.')).toBeVisible();
      await expect(page.getByText('2.')).toBeVisible();
    });

    test('should maintain visual feedback during drag', async ({ page }) => {
      const item = page.locator('[data-testid="sorting-item"]').first();

      // Start drag (we can't easily test mid-drag state, but we can check initial state)
      await expect(item).toHaveClass(/cursor-move/);
    });
  });
});
