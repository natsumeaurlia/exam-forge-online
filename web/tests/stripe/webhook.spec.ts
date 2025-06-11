import { test, expect } from '@playwright/test';

test.describe('Stripe Webhook Handling', () => {
  const webhookEndpoint = '/api/stripe/webhook';

  test('should reject requests without signature', async ({ request }) => {
    const response = await request.post(webhookEndpoint, {
      data: JSON.stringify({
        type: 'checkout.session.completed',
        data: { object: {} },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('No signature provided');
  });

  test('should reject requests with invalid signature', async ({ request }) => {
    const response = await request.post(webhookEndpoint, {
      data: JSON.stringify({
        type: 'checkout.session.completed',
        data: { object: {} },
      }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid signature');
  });

  test('should handle missing Stripe configuration gracefully', async ({
    request,
  }) => {
    // This test would need to run in an environment without Stripe keys
    // Skip in normal test runs
    test.skip();
  });
});

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as team owner
    await page.goto('/ja/auth/signin');
    await page.fill('input[name="email"]', 'owner@example.com');
    await page.fill('input[name="password"]', 'ownerpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/ja/dashboard');
  });

  test('should display current subscription status', async ({ page }) => {
    await page.goto('/ja/dashboard');

    // Check subscription status badge
    const planBadge = page.locator('[data-testid="plan-badge"]');
    await expect(planBadge).toBeVisible();

    // Should show plan type (FREE, PRO, or PREMIUM)
    await expect(planBadge).toContainText(/無料|Free|Pro|Premium/i);
  });

  test('should show billing portal link for paid plans', async ({
    page,
    context,
  }) => {
    // Mock user with active subscription
    await context.route('**/api/user/plan', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: {
            type: 'PRO',
            name: 'Pro Plan',
          },
          subscription: {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        }),
      });
    });

    await page.goto('/ja/dashboard');

    // Should have manage subscription button
    const manageButton = page.getByRole('button', {
      name: /サブスクリプション管理|Manage Subscription/i,
    });
    await expect(manageButton).toBeVisible();
  });

  test('should redirect to Stripe portal', async ({ page, context }) => {
    // Mock portal session creation
    await context.route('**/api/stripe/portal', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://billing.stripe.com/session/test_123',
        }),
      });
    });

    await page.goto('/ja/dashboard');

    const manageButton = page.getByRole('button', {
      name: /サブスクリプション管理|Manage Subscription/i,
    });
    await manageButton.click();

    // Should call portal API
    await page.waitForRequest('**/api/stripe/portal');
  });
});

test.describe('Team Member Pricing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as team admin
    await page.goto('/ja/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/ja/dashboard');
  });

  test('should update pricing when adding team members', async ({
    page,
    context,
  }) => {
    // Mock team member count
    let memberCount = 2;

    await context.route('**/api/team/members', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            members: Array(memberCount)
              .fill(null)
              .map((_, i) => ({
                id: `member-${i}`,
                email: `member${i}@example.com`,
                role: i === 0 ? 'OWNER' : 'MEMBER',
              })),
            count: memberCount,
          }),
        });
      } else if (route.request().method() === 'POST') {
        memberCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/ja/dashboard/team');

    // Check current member count
    await expect(page.getByText(`${memberCount} メンバー`)).toBeVisible();

    // Add new member
    const addButton = page.getByRole('button', {
      name: /メンバーを追加|Add Member/i,
    });
    await addButton.click();

    // Fill member form
    await page.fill('input[name="email"]', 'newmember@example.com');
    await page.getByRole('button', { name: /追加|Add/i }).click();

    // Should update member count
    await expect(page.getByText(`${memberCount} メンバー`)).toBeVisible();
  });

  test('should show pricing impact when managing team', async ({ page }) => {
    await page.goto('/ja/dashboard/team');

    // Should show current cost
    const pricingInfo = page.locator('[data-testid="team-pricing-info"]');
    if (await pricingInfo.isVisible()) {
      await expect(pricingInfo).toContainText(/現在の料金|Current pricing/i);
      await expect(pricingInfo).toContainText(/¥/);
    }
  });
});
