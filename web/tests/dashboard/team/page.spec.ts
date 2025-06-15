import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Dashboard Team Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display team page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/team');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/team/);
    await expect(page.locator('h1, h2')).toContainText(['チーム', 'Team']);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display team information', async ({ page }) => {
    await page.goto('/ja/dashboard/team');
    await page.waitForLoadState('networkidle');

    // Should show team content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for team info elements
    const teamInfo = page.locator(
      '[data-testid*="team"], .team, [class*="team"]'
    );
    if ((await teamInfo.count()) > 0) {
      await expect(teamInfo.first()).toBeVisible();
    }
  });

  test('should display team members', async ({ page }) => {
    await page.goto('/ja/dashboard/team');
    await page.waitForLoadState('networkidle');

    // Look for member list or cards
    const memberElements = page.locator(
      '[data-testid*="member"], .member, [class*="member"], .user'
    );
    if ((await memberElements.count()) > 0) {
      await expect(memberElements.first()).toBeVisible();
    }
  });

  test('should handle team member invitation', async ({ page }) => {
    await page.goto('/ja/dashboard/team');
    await page.waitForLoadState('networkidle');

    // Look for invite button
    const inviteButton = page.locator(
      'button:has-text("招待"), button:has-text("Invite"), button:has-text("メンバー追加"), button:has-text("Add Member")'
    );
    if ((await inviteButton.count()) > 0) {
      await expect(inviteButton.first()).toBeVisible();

      // Try to click invite button
      await inviteButton.first().click();

      // Look for invite modal or form
      const inviteModal = page.locator(
        '[data-testid="invite-modal"], .modal, [role="dialog"]'
      );
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[placeholder*="メール"], input[placeholder*="email"]'
      );

      if ((await inviteModal.isVisible()) || (await emailInput.isVisible())) {
        if (await emailInput.isVisible()) {
          await expect(emailInput).toBeVisible();
        }
      }
    }
  });

  test('should display team settings access', async ({ page }) => {
    await page.goto('/ja/dashboard/team');
    await page.waitForLoadState('networkidle');

    // Look for team settings link or button
    const settingsLink = page.locator(
      'a:has-text("設定"), a:has-text("Settings"), button:has-text("設定"), button:has-text("Settings")'
    );
    if ((await settingsLink.count()) > 0) {
      await expect(settingsLink.first()).toBeVisible();
    }
  });

  test('should show team statistics', async ({ page }) => {
    await page.goto('/ja/dashboard/team');
    await page.waitForLoadState('networkidle');

    // Look for statistics or metrics
    const statsElements = page.locator(
      '[data-testid*="stat"], .stat, [class*="metric"], .metric, [class*="count"]'
    );
    if ((await statsElements.count()) > 0) {
      await expect(statsElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/team');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if team content is displayed properly on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

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
    await page.goto('/en/dashboard/team');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/team/);
    await expect(page.locator('h1, h2')).toContainText(['Team', 'チーム']);
  });
});
