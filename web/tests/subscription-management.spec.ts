import { test, expect } from '@playwright/test';

test.describe('Subscription Management UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display real-time usage data', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Check if UserPlanStatus component is visible
    await expect(
      page.locator('[data-testid="user-plan-status"]')
    ).toBeVisible();

    // Check for usage meters
    await expect(page.getByText(/quizzes/i)).toBeVisible();
    await expect(page.getByText(/responses/i)).toBeVisible();

    // Verify progress bars are displayed
    await expect(page.locator('[role="progressbar"]')).toHaveCount({ min: 1 });
  });

  test('should show usage alerts when near limits', async ({ page }) => {
    // Mock high usage scenario
    await page.route('/api/usage/team', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            usage: {
              quizzes: { total: 47, thisMonth: 15, thisYear: 47 }, // Close to PRO limit of 50
              responses: { total: 4800, thisMonth: 800, thisYear: 4800 }, // Close to PRO limit of 5000
              questions: { maxPerQuiz: 50, totalQuestions: 500 },
              members: { total: 3, active: 3 },
              storage: { usedBytes: 1000000000, maxBytes: 10000000000 },
            },
            teamId: 'team123',
            teamName: 'Test Team',
            planType: 'PRO',
          },
        },
      });
    });

    await page.goto('/dashboard');

    // Should show usage alert
    await expect(page.getByText(/near limit/i)).toBeVisible();
    await expect(page.getByText(/upgrade/i)).toBeVisible();
  });

  test('should open plan change modal', async ({ page }) => {
    await page.goto('/dashboard');

    // Click manage plan button
    await page.click('[data-testid="manage-plan-button"]');

    // Verify modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/change plan/i)).toBeVisible();

    // Check plan cards are displayed
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Premium')).toBeVisible();
  });

  test('should handle plan upgrade flow', async ({ page }) => {
    await page.goto('/dashboard');

    // Open plan change modal
    await page.click('[data-testid="manage-plan-button"]');

    // Select Pro plan
    await page.click('[data-testid="plan-card-pro"]');

    // Verify upgrade confirmation
    await expect(page.getByText(/confirm upgrade/i)).toBeVisible();

    // Mock Stripe checkout creation
    await page.route('/api/stripe/checkout', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: { url: 'https://checkout.stripe.com/test-session' },
        },
      });
    });

    // Click upgrade button
    await page.click('[data-testid="upgrade-now-button"]');

    // Should redirect to Stripe (we'll just check the URL would change)
    await page.waitForFunction(() =>
      window.location.href.includes('stripe.com')
    );
  });

  test('should display storage usage', async ({ page }) => {
    await page.goto('/dashboard');

    // Check storage meter is displayed
    await expect(page.getByText(/storage/i)).toBeVisible();
    await expect(page.getByText(/GB/)).toBeVisible();
  });

  test('should show monthly usage breakdown', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for monthly usage indicators
    await expect(page.getByText(/this month/i)).toBeVisible();
  });
});
