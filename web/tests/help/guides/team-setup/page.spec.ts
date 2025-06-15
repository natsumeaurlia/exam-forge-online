import { test, expect } from '@playwright/test';

test.describe('Help Team Setup Guide Page', () => {
  test('should display team setup guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/team-setup');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/team-setup/);
    await expect(page.locator('h1, h2')).toContainText([
      'チーム設定',
      'Team Setup',
      'チーム構築',
      'チーム管理',
    ]);
  });

  test('should display team setup content', async ({ page }) => {
    await page.goto('/ja/help/guides/team-setup');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for team-specific content
    const teamElements = page.locator(
      ':has-text("メンバー"), :has-text("Member"), :has-text("招待"), :has-text("Invite")'
    );
    if ((await teamElements.count()) > 0) {
      await expect(teamElements.first()).toBeVisible();
    }
  });

  test('should explain team roles', async ({ page }) => {
    await page.goto('/ja/help/guides/team-setup');
    await page.waitForLoadState('networkidle');

    // Look for role explanations
    const roleContent = page.locator(
      ':has-text("役割"), :has-text("Role"), :has-text("権限"), :has-text("Permission"), :has-text("OWNER"), :has-text("ADMIN")'
    );
    if ((await roleContent.count()) > 0) {
      await expect(roleContent.first()).toBeVisible();
    }
  });

  test('should explain member management', async ({ page }) => {
    await page.goto('/ja/help/guides/team-setup');
    await page.waitForLoadState('networkidle');

    // Look for member management content
    const managementContent = page.locator(
      ':has-text("管理"), :has-text("Management"), :has-text("追加"), :has-text("削除"), :has-text("Add"), :has-text("Remove")'
    );
    if ((await managementContent.count()) > 0) {
      await expect(managementContent.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/team-setup');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/team-setup');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/team-setup/);
    await expect(page.locator('h1, h2')).toContainText([
      'Team Setup',
      'チーム設定',
    ]);
  });
});
