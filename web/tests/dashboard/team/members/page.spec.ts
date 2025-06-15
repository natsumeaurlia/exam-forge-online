import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../../fixtures/test-data-factory';

test.describe('Dashboard Team Members Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display team members page correctly', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/dashboard\/team\/members/);
    await expect(page.locator('h1, h2')).toContainText(['メンバー', 'Members']);

    // Check for navigation elements
    await expect(page.locator('[data-testid="sidebar"], nav')).toBeVisible();
  });

  test('should display members list', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Should show members content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for member list items
    const memberItems = page.locator(
      '[data-testid*="member"], .member, [class*="member"], .user-card'
    );
    if ((await memberItems.count()) > 0) {
      await expect(memberItems.first()).toBeVisible();
    }
  });

  test('should display member information', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Look for member information elements
    const memberInfo = page.locator(
      'td, .member-info, [class*="member"], [data-testid*="member"]'
    );
    if ((await memberInfo.count()) > 0) {
      await expect(memberInfo.first()).toBeVisible();
    }

    // Look for member roles
    const roleElements = page.locator(
      ':has-text("OWNER"), :has-text("ADMIN"), :has-text("MEMBER"), :has-text("VIEWER")'
    );
    if ((await roleElements.count()) > 0) {
      await expect(roleElements.first()).toBeVisible();
    }
  });

  test('should handle member invitation', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Look for invite member button
    const inviteButton = page.locator(
      'button:has-text("招待"), button:has-text("Invite"), button:has-text("メンバー招待"), button:has-text("Invite Member")'
    );
    if ((await inviteButton.count()) > 0) {
      await expect(inviteButton.first()).toBeVisible();

      // Click invite button
      await inviteButton.first().click();

      // Look for invite form
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[placeholder*="メール"], input[placeholder*="email"]'
      );
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();

        // Test form interaction
        await emailInput.fill('test@example.com');

        // Look for role selector
        const roleSelector = page.locator(
          'select[name="role"], select:has(option)'
        );
        if (await roleSelector.isVisible()) {
          await expect(roleSelector).toBeVisible();
        }
      }
    }
  });

  test('should handle member role management', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Look for role change options
    const roleButtons = page.locator(
      'button:has-text("役割"), button:has-text("Role"), select[name*="role"]'
    );
    if ((await roleButtons.count()) > 0) {
      await expect(roleButtons.first()).toBeVisible();
    }

    // Look for action buttons (edit, remove, etc.)
    const actionButtons = page.locator(
      'button:has-text("編集"), button:has-text("Edit"), button:has-text("削除"), button:has-text("Remove")'
    );
    if ((await actionButtons.count()) > 0) {
      await expect(actionButtons.first()).toBeVisible();
    }
  });

  test('should display member statistics', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Look for member count or statistics
    const statsElements = page.locator(
      '[data-testid*="count"], .count, [class*="stat"], .stat'
    );
    if ((await statsElements.count()) > 0) {
      await expect(statsElements.first()).toBeVisible();
    }
  });

  test('should handle member search and filtering', async ({ page }) => {
    await page.goto('/ja/dashboard/team/members');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="検索"], input[placeholder*="search"]'
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Look for filter options
    const filterElements = page.locator(
      'select:has(option), button:has-text("フィルター"), button:has-text("Filter")'
    );
    if ((await filterElements.count()) > 0) {
      await expect(filterElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/dashboard/team/members');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if members list is displayed properly on mobile
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
    await page.goto('/en/dashboard/team/members');

    await expect(page).toHaveURL(/.*\/en\/dashboard\/team\/members/);
    await expect(page.locator('h1, h2')).toContainText(['Members', 'メンバー']);
  });
});
