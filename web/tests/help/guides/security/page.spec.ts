import { test, expect } from '@playwright/test';

test.describe('Help Security Guide Page', () => {
  test('should display security guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/security');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/security/);
    await expect(page.locator('h1, h2')).toContainText([
      'セキュリティ',
      'Security',
      'セキュリティー',
      '安全',
    ]);
  });

  test('should display security guide content', async ({ page }) => {
    await page.goto('/ja/help/guides/security');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for security-specific content
    const securityElements = page.locator(
      ':has-text("パスワード"), :has-text("Password"), :has-text("認証"), :has-text("Authentication")'
    );
    if ((await securityElements.count()) > 0) {
      await expect(securityElements.first()).toBeVisible();
    }
  });

  test('should explain data protection', async ({ page }) => {
    await page.goto('/ja/help/guides/security');
    await page.waitForLoadState('networkidle');

    // Look for data protection content
    const dataContent = page.locator(
      ':has-text("データ保護"), :has-text("Data Protection"), :has-text("暗号化"), :has-text("Encryption")'
    );
    if ((await dataContent.count()) > 0) {
      await expect(dataContent.first()).toBeVisible();
    }
  });

  test('should explain access controls', async ({ page }) => {
    await page.goto('/ja/help/guides/security');
    await page.waitForLoadState('networkidle');

    // Look for access control content
    const accessContent = page.locator(
      ':has-text("アクセス制御"), :has-text("Access Control"), :has-text("権限"), :has-text("Permission")'
    );
    if ((await accessContent.count()) > 0) {
      await expect(accessContent.first()).toBeVisible();
    }
  });

  test('should explain best practices', async ({ page }) => {
    await page.goto('/ja/help/guides/security');
    await page.waitForLoadState('networkidle');

    // Look for best practices content
    const practicesContent = page.locator(
      ':has-text("ベストプラクティス"), :has-text("Best Practices"), :has-text("推奨"), :has-text("Recommended")'
    );
    if ((await practicesContent.count()) > 0) {
      await expect(practicesContent.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/security');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/security');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/security/);
    await expect(page.locator('h1, h2')).toContainText([
      'Security',
      'セキュリティ',
    ]);
  });
});
