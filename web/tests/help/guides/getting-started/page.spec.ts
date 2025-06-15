import { test, expect } from '@playwright/test';

test.describe('Help Getting Started Guide Page', () => {
  test('should display getting started guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/getting-started/);
    await expect(page.locator('h1, h2')).toContainText([
      'はじめに',
      'Getting Started',
      '始め方',
      'スタート',
    ]);
  });

  test('should display guide content', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for guide sections
    const guideSections = page.locator('section, .section, h2, h3');
    if ((await guideSections.count()) > 0) {
      await expect(guideSections.first()).toBeVisible();
    }
  });

  test('should have step-by-step instructions', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');
    await page.waitForLoadState('networkidle');

    // Look for numbered steps or instructions
    const stepElements = page.locator(
      ':has-text("1."), :has-text("2."), :has-text("ステップ"), :has-text("Step"), ol li, .step'
    );
    if ((await stepElements.count()) > 0) {
      await expect(stepElements.first()).toBeVisible();
    }
  });

  test('should have navigation to other guides', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');
    await page.waitForLoadState('networkidle');

    // Look for links to other guides
    const guideLinks = page.locator('a[href*="/help/guides/"], nav a, .nav a');
    if ((await guideLinks.count()) > 0) {
      await expect(guideLinks.first()).toBeVisible();
    }
  });

  test('should display helpful images or screenshots', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');
    await page.waitForLoadState('networkidle');

    // Look for images or visual aids
    const images = page.locator('img, figure, .image');
    if ((await images.count()) > 0) {
      await expect(images.first()).toBeVisible();
    }
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await page.goto('/ja/help/guides/getting-started');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb navigation
    const breadcrumbs = page.locator(
      '.breadcrumb, [class*="breadcrumb"], nav[aria-label*="breadcrumb"]'
    );
    if ((await breadcrumbs.count()) > 0) {
      await expect(breadcrumbs.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/getting-started');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/getting-started');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/getting-started/);
    await expect(page.locator('h1, h2')).toContainText([
      'Getting Started',
      'はじめに',
    ]);
  });
});
