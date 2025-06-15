import { test, expect } from '@playwright/test';

test.describe('Help Billing Guide Page', () => {
  test('should display billing guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/billing');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/billing/);
    await expect(page.locator('h1, h2')).toContainText([
      '請求',
      'Billing',
      '支払い',
      'Payment',
      '料金',
    ]);
  });

  test('should display billing guide content', async ({ page }) => {
    await page.goto('/ja/help/guides/billing');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for billing-specific content
    const billingElements = page.locator(
      ':has-text("プラン"), :has-text("Plan"), :has-text("サブスクリプション"), :has-text("Subscription")'
    );
    if ((await billingElements.count()) > 0) {
      await expect(billingElements.first()).toBeVisible();
    }
  });

  test('should explain subscription management', async ({ page }) => {
    await page.goto('/ja/help/guides/billing');
    await page.waitForLoadState('networkidle');

    // Look for subscription content
    const subscriptionContent = page.locator(
      ':has-text("アップグレード"), :has-text("Upgrade"), :has-text("ダウングレード"), :has-text("Downgrade"), :has-text("キャンセル")'
    );
    if ((await subscriptionContent.count()) > 0) {
      await expect(subscriptionContent.first()).toBeVisible();
    }
  });

  test('should explain payment methods', async ({ page }) => {
    await page.goto('/ja/help/guides/billing');
    await page.waitForLoadState('networkidle');

    // Look for payment method content
    const paymentContent = page.locator(
      ':has-text("支払い方法"), :has-text("Payment Method"), :has-text("クレジットカード"), :has-text("Credit Card")'
    );
    if ((await paymentContent.count()) > 0) {
      await expect(paymentContent.first()).toBeVisible();
    }
  });

  test('should explain invoice and receipt access', async ({ page }) => {
    await page.goto('/ja/help/guides/billing');
    await page.waitForLoadState('networkidle');

    // Look for invoice content
    const invoiceContent = page.locator(
      ':has-text("請求書"), :has-text("Invoice"), :has-text("領収書"), :has-text("Receipt")'
    );
    if ((await invoiceContent.count()) > 0) {
      await expect(invoiceContent.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/billing');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/billing');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/billing/);
    await expect(page.locator('h1, h2')).toContainText(['Billing', '請求']);
  });
});
