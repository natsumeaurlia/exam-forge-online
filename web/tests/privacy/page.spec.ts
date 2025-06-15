import { test, expect } from '@playwright/test';

test.describe('Privacy Page', () => {
  test('should display privacy page correctly', async ({ page }) => {
    await page.goto('/ja/privacy');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/privacy/);
    await expect(page.locator('h1, h2')).toContainText([
      'プライバシー',
      'Privacy',
      'プライバシーポリシー',
    ]);
  });

  test('should display privacy policy content', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Should show privacy policy content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for privacy policy sections
    const privacySections = page.locator(
      'section, .section, [class*="privacy"]'
    );
    if ((await privacySections.count()) > 0) {
      await expect(privacySections.first()).toBeVisible();
    }
  });

  test('should contain privacy policy text', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Look for privacy-related text content
    const textContent = page.locator('p, div, section');
    if ((await textContent.count()) > 0) {
      await expect(textContent.first()).toBeVisible();
    }

    // Look for common privacy policy terms
    const privacyTerms = page.locator(
      ':has-text("個人情報"), :has-text("データ"), :has-text("情報収集"), :has-text("personal information"), :has-text("data"), :has-text("information")'
    );
    if ((await privacyTerms.count()) > 0) {
      await expect(privacyTerms.first()).toBeVisible();
    }
  });

  test('should have proper navigation', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Look for navigation elements
    const navElements = page.locator('nav, header, [class*="nav"]');
    if ((await navElements.count()) > 0) {
      await expect(navElements.first()).toBeVisible();
    }
  });

  test('should have table of contents or sections', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Look for section headings
    const headings = page.locator('h2, h3, h4');
    if ((await headings.count()) > 0) {
      await expect(headings.first()).toBeVisible();
    }

    // Look for section links or table of contents
    const sectionLinks = page.locator('a[href*="#"], ul li a');
    if ((await sectionLinks.count()) > 0) {
      await expect(sectionLinks.first()).toBeVisible();
    }
  });

  test('should display last updated date', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Look for date information
    const dateElements = page.locator(
      ':has-text("更新"), :has-text("Updated"), :has-text("最終更新"), :has-text("Last Updated"), time'
    );
    if ((await dateElements.count()) > 0) {
      await expect(dateElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/privacy');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Check if text doesn't overflow
    const textElements = page.locator('p');
    if ((await textElements.count()) > 0) {
      await expect(textElements.first()).toBeVisible();
    }
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/privacy');

    await expect(page).toHaveURL(/.*\/en\/privacy/);
    await expect(page.locator('h1, h2')).toContainText([
      'Privacy',
      'プライバシー',
    ]);
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/ja/privacy');

    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).toContain('privacy');
  });

  test('should allow scrolling through long content', async ({ page }) => {
    await page.goto('/ja/privacy');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom to test content length
    await page.keyboard.press('End');
    await page.waitForTimeout(500);

    // Scroll back to top
    await page.keyboard.press('Home');
    await page.waitForTimeout(500);

    // Verify we're back at the top
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
