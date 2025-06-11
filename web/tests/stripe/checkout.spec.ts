import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/ja/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/ja/dashboard');
  });

  test('should navigate to plans page from dashboard', async ({ page }) => {
    await page.goto('/ja/dashboard');

    // Check if upgrade prompt is visible for free users
    const upgradeButton = page.getByRole('link', {
      name: /アップグレード|Upgrade/i,
    });
    await expect(upgradeButton).toBeVisible();

    await upgradeButton.click();
    await expect(page).toHaveURL('/ja/plans');
  });

  test('should display pricing plans correctly', async ({ page }) => {
    await page.goto('/ja/plans');

    // Check Free plan
    const freePlan = page.locator('[data-testid="plan-FREE"]');
    await expect(freePlan).toBeVisible();
    await expect(freePlan).toContainText('無料');

    // Check Pro plan
    const proPlan = page.locator('[data-testid="plan-PRO"]');
    await expect(proPlan).toBeVisible();
    await expect(proPlan).toContainText('¥2,980');
    await expect(proPlan).toContainText('ユーザー/月');

    // Check Premium plan
    const premiumPlan = page.locator('[data-testid="plan-PREMIUM"]');
    await expect(premiumPlan).toBeVisible();
    await expect(premiumPlan).toContainText('¥4,980');
    await expect(premiumPlan).toContainText('ユーザー/月');
  });

  test('should toggle between monthly and yearly billing', async ({ page }) => {
    await page.goto('/ja/plans');

    // Check monthly prices
    await expect(page.locator('[data-testid="plan-PRO"]')).toContainText(
      '¥2,980'
    );

    // Toggle to yearly
    const yearlyToggle = page.getByRole('button', { name: /年払い|Yearly/i });
    await yearlyToggle.click();

    // Check yearly prices (with discount)
    await expect(page.locator('[data-testid="plan-PRO"]')).toContainText(
      '¥29,800'
    );
    await expect(page.locator('[data-testid="plan-PRO"]')).toContainText('17%');
  });

  test('should calculate team pricing correctly', async ({ page }) => {
    await page.goto('/ja/plans');

    // Assuming team has 3 members
    const proPlan = page.locator('[data-testid="plan-PRO"]');

    // Check if member count is displayed
    const memberCount = proPlan.locator('[data-testid="member-count"]');
    if (await memberCount.isVisible()) {
      await expect(memberCount).toContainText('3');

      // Check total price calculation
      const totalPrice = proPlan.locator('[data-testid="total-price"]');
      await expect(totalPrice).toContainText('¥8,940'); // 2,980 * 3
    }
  });

  test('should redirect to Stripe checkout', async ({ page, context }) => {
    await page.goto('/ja/plans');

    // Mock Stripe checkout redirect
    await context.route('**/api/stripe/checkout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
        }),
      });
    });

    // Click upgrade button
    const upgradeButton = page
      .locator('[data-testid="plan-PRO"]')
      .getByRole('button', { name: /アップグレード|Upgrade/i });
    await upgradeButton.click();

    // Should call checkout API
    await page.waitForRequest('**/api/stripe/checkout');
  });

  test('should show error for insufficient permissions', async ({
    page,
    context,
  }) => {
    // Mock API to return permission error
    await context.route('**/api/stripe/checkout', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient permissions',
        }),
      });
    });

    await page.goto('/ja/plans');

    const upgradeButton = page
      .locator('[data-testid="plan-PRO"]')
      .getByRole('button', { name: /アップグレード|Upgrade/i });
    await upgradeButton.click();

    // Should show error message
    await expect(
      page.getByText(/権限が不足しています|Insufficient permissions/i)
    ).toBeVisible();
  });
});
