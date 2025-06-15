import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('💳 Enhanced Payment Flow Testing', () => {
  let testUser: any;
  let testTeam: any;

  test.beforeEach(async () => {
    // Create test user and team for payment flow testing
    testUser = await prisma.user.create({
      data: {
        email: `payment-test-${Date.now()}@example.com`,
        name: 'Payment Test User',
      },
    });

    testTeam = await prisma.team.create({
      data: {
        name: 'Payment Test Team',
        slug: `payment-test-team-${Date.now()}`,
        creator: { connect: { id: testUser.id } },
        members: {
          create: {
            userId: testUser.id,
            role: 'OWNER',
          },
        },
      },
    });
  });

  test.afterEach(async () => {
    // Cleanup test data
    await prisma.subscription.deleteMany({
      where: { teamId: testTeam.id },
    });
    await prisma.teamMember.deleteMany({
      where: { teamId: testTeam.id },
    });
    await prisma.team.delete({
      where: { id: testTeam.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  test('プロプランアップグレード完全フロー', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/ja/plans');

    // Verify pricing page loads
    await expect(page.locator('h1')).toContainText('プラン');

    // Select Pro plan
    await page.click('[data-testid="pro-plan-button"]');

    // Should redirect to checkout
    await page.waitForURL('**/stripe/checkout**');

    // Verify Stripe checkout elements are present
    await expect(page.locator('#stripe-checkout')).toBeVisible();

    // Test form fields (using Stripe test mode)
    await page.fill('[data-testid="email"]', testUser.email);

    // Stripe test card number
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');

    // Fill billing details
    await page.fill('[name="billing_name"]', 'Test User');
    await page.fill('[name="billing_address_line1"]', '123 Test Street');
    await page.fill('[name="billing_address_city"]', 'Tokyo');
    await page.fill('[name="billing_address_postal_code"]', '100-0001');

    // Note: In actual test, we would not complete the payment
    // This is just testing the form validation and UI

    // Test form validation
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Declined card
    await page.click('[data-testid="submit-payment"]');

    // Should show error message
    await expect(page.locator('.stripe-error, [role="alert"]')).toBeVisible();
  });

  test('サブスクリプション管理とキャンセル', async ({ page }) => {
    // Create mock subscription for testing
    const mockSubscription = await prisma.subscription.create({
      data: {
        teamId: testTeam.id,
        planId: 'pro-monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: 'sub_test_123',
        stripeCustomerId: 'cus_test_123',
      },
    });

    // Navigate to subscription management
    await page.goto('/ja/dashboard/subscription');

    // Verify subscription details are displayed
    await expect(page.locator('text=プロプラン')).toBeVisible();
    await expect(page.locator('text=アクティブ')).toBeVisible();

    // Test billing portal access
    await page.click('[data-testid="manage-billing"]');

    // Should redirect to Stripe billing portal (or show modal)
    await expect(
      page.locator('text=請求ポータル').or(page.locator('text=Billing Portal'))
    ).toBeVisible();

    // Test subscription cancellation flow
    await page.click('[data-testid="cancel-subscription"]');

    // Should show confirmation dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=キャンセルしますか')).toBeVisible();

    // Cancel the cancellation (don't actually cancel)
    await page.click('[data-testid="cancel-dialog-close"]');

    // Test downgrade flow
    await page.click('[data-testid="change-plan"]');
    await page.click('[data-testid="free-plan-option"]');

    // Should show downgrade confirmation
    await expect(page.locator('text=プランを変更')).toBeVisible();

    // Cleanup
    await prisma.subscription.delete({ where: { id: mockSubscription.id } });
  });

  test('多言語決済フロー', async ({ page }) => {
    // Test Japanese checkout flow
    await page.goto('/ja/plans');
    await page.click('[data-testid="pro-plan-button"]');

    // Verify Japanese language in checkout
    await expect(
      page.locator('text=月額プラン').or(page.locator('text=¥'))
    ).toBeVisible();

    // Switch to English
    await page.goto('/en/plans');
    await page.click('[data-testid="pro-plan-button"]');

    // Verify English language in checkout
    await expect(
      page.locator('text=Monthly Plan').or(page.locator('text=per month'))
    ).toBeVisible();

    // Test currency display
    const priceElements = page.locator('[data-testid="price"], .price');
    const priceText = await priceElements.first().textContent();

    // Should show currency symbol
    expect(priceText).toMatch(/[¥$€]/);
  });

  test('決済エラーハンドリング', async ({ page }) => {
    await page.goto('/ja/plans');

    // Intercept and mock payment API calls
    await page.route('**/api/stripe/checkout', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'カードが拒否されました',
        }),
      });
    });

    await page.click('[data-testid="pro-plan-button"]');

    // Should show error message
    await expect(page.locator('[role="alert"], .error')).toBeVisible();
    await expect(page.locator('text=カードが拒否されました')).toBeVisible();

    // Test retry functionality
    await page.click('[data-testid="retry-payment"]');

    // Should attempt payment again
    await expect(page.locator('text=処理中')).toBeVisible();
  });

  test('VAT/Tax計算テスト', async ({ page }) => {
    // Test tax calculation for different regions
    await page.goto('/ja/plans');

    // Mock geolocation for different tax regions
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => {
            success({
              coords: {
                latitude: 35.6762, // Tokyo coordinates
                longitude: 139.6503,
              },
            });
          },
        },
      });
    });

    await page.reload();
    await page.click('[data-testid="pro-plan-button"]');

    // Check if tax is calculated for Japanese location
    const taxElement = page.locator('[data-testid="tax-amount"], .tax, .vat');
    if ((await taxElement.count()) > 0) {
      const taxText = await taxElement.textContent();
      expect(taxText).toMatch(/税|Tax|VAT/i);
    }

    // Test price including tax
    const totalElement = page.locator('[data-testid="total-amount"], .total');
    const totalText = await totalElement.textContent();
    expect(totalText).toMatch(/¥\d+/);
  });

  test('プラン制限とアップグレード促進', async ({ page }) => {
    // Test free plan limitations
    await page.goto('/ja/dashboard/quizzes');

    // Create 5 quizzes (free plan limit)
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="create-quiz"]');
      await page.fill('[name="title"]', `Test Quiz ${i + 1}`);
      await page.click('[data-testid="save-quiz"]');
      await page.waitForSelector('[data-testid="quiz-saved"]');
    }

    // Try to create 6th quiz (should hit limit)
    await page.click('[data-testid="create-quiz"]');

    // Should show upgrade prompt
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
    await expect(page.locator('text=プロプランにアップグレード')).toBeVisible();

    // Click upgrade button
    await page.click('[data-testid="upgrade-now"]');

    // Should redirect to pricing page
    await page.waitForURL('**/plans');

    // Should highlight recommended plan
    await expect(
      page.locator('[data-testid="pro-plan"].highlighted')
    ).toBeVisible();
  });

  test('チームメンバー課金テスト', async ({ page }) => {
    // Add team members to test per-seat pricing
    await page.goto('/ja/dashboard/team');

    // Add team member
    await page.click('[data-testid="invite-member"]');
    await page.fill('[name="email"]', 'member@example.com');
    await page.click('[data-testid="send-invite"]');

    // Navigate to billing
    await page.goto('/ja/dashboard/subscription');

    // Should show per-seat pricing
    await expect(page.locator('text=メンバー数')).toBeVisible();
    await expect(page.locator('text=2名')).toBeVisible(); // Owner + 1 member

    // Price should reflect member count
    const priceElement = page.locator('[data-testid="monthly-cost"]');
    const priceText = await priceElement.textContent();

    // Should be 2x the per-user price
    expect(priceText).toMatch(/¥5,960/); // 2 × ¥2,980
  });

  test('決済セキュリティテスト', async ({ page }) => {
    // Test PCI compliance indicators
    await page.goto('/ja/plans');
    await page.click('[data-testid="pro-plan-button"]');

    // Should load Stripe's secure form
    await expect(page.locator('iframe[src*="stripe.com"]')).toBeVisible();

    // Verify secure connection
    const url = page.url();
    expect(url).toMatch(/^https:/);

    // Check for security indicators
    await expect(
      page.locator('text=安全な決済').or(page.locator('.security-badge'))
    ).toBeVisible();

    // Test for XSS protection in payment form
    await page.fill('[data-testid="email"]', '<script>alert("xss")</script>');

    // Script should be escaped, not executed
    const emailValue = await page.inputValue('[data-testid="email"]');
    expect(emailValue).toContain('&lt;script&gt;');
  });

  test('Webhook処理と同期テスト', async ({ page }) => {
    // Mock webhook events
    await page.route('**/api/stripe/webhook', async route => {
      const requestBody = route.request().postData();

      // Simulate successful payment webhook
      if (requestBody?.includes('invoice.payment_succeeded')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ received: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Simulate payment completion flow
    await page.goto('/ja/dashboard/subscription');

    // Trigger webhook simulation
    await page.evaluate(() => {
      fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test-signature',
        },
        body: JSON.stringify({
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              subscription: 'sub_test_123',
              status: 'paid',
            },
          },
        }),
      });
    });

    // Should update subscription status
    await page.reload();
    await expect(page.locator('text=支払い完了')).toBeVisible();
  });

  test('返金とチャージバック処理', async ({ page }) => {
    // Create subscription with refund scenario
    const subscription = await prisma.subscription.create({
      data: {
        teamId: testTeam.id,
        planId: 'pro-monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: 'sub_refund_test',
        stripeCustomerId: 'cus_refund_test',
      },
    });

    await page.goto('/ja/dashboard/subscription');

    // Test refund request flow
    await page.click('[data-testid="request-refund"]');

    // Fill refund form
    await page.fill('[name="reason"]', 'Service did not meet expectations');
    await page.click('[data-testid="submit-refund-request"]');

    // Should show confirmation
    await expect(
      page.locator('text=返金リクエストを受け付けました')
    ).toBeVisible();

    // Should show pending status
    await expect(page.locator('text=返金処理中')).toBeVisible();

    // Cleanup
    await prisma.subscription.delete({ where: { id: subscription.id } });
  });
});
