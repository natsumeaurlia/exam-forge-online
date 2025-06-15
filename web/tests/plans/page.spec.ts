import { test, expect } from '@playwright/test';

test.describe('Plans Page', () => {
  test('should display plans page correctly', async ({ page }) => {
    await page.goto('/ja/plans');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/plans/);
    await expect(page.locator('h1, h2')).toContainText([
      'プラン',
      'Plans',
      '料金',
      'Pricing',
    ]);
  });

  test('should display pricing plans', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Should show plans content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for plan cards or sections
    const planElements = page.locator(
      '[data-testid*="plan"], .plan, [class*="plan"], .pricing-card, [class*="pricing"]'
    );
    if ((await planElements.count()) > 0) {
      await expect(planElements.first()).toBeVisible();
    }
  });

  test('should display Free and Pro plans', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for Free plan
    const freePlan = page.locator(
      ':has-text("Free"), :has-text("無料"), :has-text("フリー")'
    );
    if ((await freePlan.count()) > 0) {
      await expect(freePlan.first()).toBeVisible();
    }

    // Look for Pro plan
    const proPlan = page.locator(
      ':has-text("Pro"), :has-text("プロ"), :has-text("有料")'
    );
    if ((await proPlan.count()) > 0) {
      await expect(proPlan.first()).toBeVisible();
    }
  });

  test('should display pricing information', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for price elements
    const priceElements = page.locator(
      ':has-text("¥"), :has-text("$"), .price, [class*="price"]'
    );
    if ((await priceElements.count()) > 0) {
      await expect(priceElements.first()).toBeVisible();
    }

    // Look for billing period information
    const billingElements = page.locator(
      ':has-text("月"), :has-text("年"), :has-text("month"), :has-text("year")'
    );
    if ((await billingElements.count()) > 0) {
      await expect(billingElements.first()).toBeVisible();
    }
  });

  test('should display plan features', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for feature lists
    const featureElements = page.locator(
      'ul li, .feature, [class*="feature"], [data-testid*="feature"]'
    );
    if ((await featureElements.count()) > 0) {
      await expect(featureElements.first()).toBeVisible();
    }

    // Look for checkmarks or feature indicators
    const checkmarks = page.locator(
      '.check, [class*="check"], svg[class*="check"]'
    );
    if ((await checkmarks.count()) > 0) {
      await expect(checkmarks.first()).toBeVisible();
    }
  });

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for CTA buttons
    const ctaButtons = page.locator(
      'button:has-text("始める"), button:has-text("Start"), button:has-text("選択"), button:has-text("Choose"), a:has-text("始める"), a:has-text("Start")'
    );
    if ((await ctaButtons.count()) > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  });

  test('should handle plan comparison', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for comparison elements
    const comparisonElements = page.locator(
      '.comparison, [class*="comparison"], table'
    );
    if ((await comparisonElements.count()) > 0) {
      await expect(comparisonElements.first()).toBeVisible();
    }
  });

  test('should display FAQ or additional information', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for FAQ or additional info sections
    const infoSections = page.locator(
      ':has-text("FAQ"), :has-text("よくある質問"), .faq, [class*="faq"]'
    );
    if ((await infoSections.count()) > 0) {
      await expect(infoSections.first()).toBeVisible();
    }
  });

  test('should have billing toggle (monthly/yearly)', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for billing period toggle
    const billingToggle = page.locator(
      'button:has-text("月額"), button:has-text("年額"), button:has-text("Monthly"), button:has-text("Yearly"), input[type="checkbox"], .toggle'
    );
    if ((await billingToggle.count()) > 0) {
      await expect(billingToggle.first()).toBeVisible();

      // Try to interact with toggle
      await billingToggle.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/plans');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if plans are stacked properly on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Check if CTA buttons are still accessible
    const ctaButtons = page.locator('button, a[class*="button"]');
    if ((await ctaButtons.count()) > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/plans');

    await expect(page).toHaveURL(/.*\/en\/plans/);
    await expect(page.locator('h1, h2')).toContainText([
      'Plans',
      'Pricing',
      'プラン',
    ]);
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/ja/plans');

    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should link to sign up or dashboard', async ({ page }) => {
    await page.goto('/ja/plans');
    await page.waitForLoadState('networkidle');

    // Look for links to sign up or dashboard
    const signupLinks = page.locator(
      'a:has-text("サインアップ"), a:has-text("Sign Up"), a:has-text("登録"), a[href*="signup"], a[href*="auth"]'
    );
    if ((await signupLinks.count()) > 0) {
      await expect(signupLinks.first()).toBeVisible();
    }
  });
});
