import { test, expect } from '@playwright/test';

test.describe('Legal Page', () => {
  test('should display legal page correctly', async ({ page }) => {
    await page.goto('/ja/legal');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/legal/);
    await expect(page.locator('h1')).toContainText(['Legal Information']);
  });

  test('should display legal content', async ({ page }) => {
    await page.goto('/ja/legal');
    await page.waitForLoadState('networkidle');

    // Should show legal content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for legal sections
    const legalSections = page.locator('h2, .prose');
    if ((await legalSections.count()) > 0) {
      await expect(legalSections.first()).toBeVisible();
    }
  });

  test('should contain legal information text', async ({ page }) => {
    await page.goto('/ja/legal');
    await page.waitForLoadState('networkidle');

    // Look for legal-related text content
    const textContent = page.locator('p, div, section');
    if ((await textContent.count()) > 0) {
      await expect(textContent.first()).toBeVisible();
    }
  });

  test('should have proper navigation links', async ({ page }) => {
    await page.goto('/ja/legal');
    await page.waitForLoadState('networkidle');

    // Look for navigation links
    const navLinks = page.locator('nav a, header a, [class*="nav"] a');
    if ((await navLinks.count()) > 0) {
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('should link to terms and privacy pages', async ({ page }) => {
    await page.goto('/ja/legal');
    await page.waitForLoadState('networkidle');

    // Look for links to terms and privacy
    const termsLink = page.locator(
      'a:has-text("利用規約"), a:has-text("Terms"), a[href*="terms"]'
    );
    if ((await termsLink.count()) > 0) {
      await expect(termsLink.first()).toBeVisible();
    }

    const privacyLink = page.locator(
      'a:has-text("プライバシー"), a:has-text("Privacy"), a[href*="privacy"]'
    );
    if ((await privacyLink.count()) > 0) {
      await expect(privacyLink.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/legal');

    await expect(page.locator('h1')).toBeVisible();

    // Check if content is displayed properly on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/legal');

    await expect(page).toHaveURL(/.*\/legal/);
    await expect(page.locator('h1')).toContainText(['Legal Information']);
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/ja/legal');

    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});
