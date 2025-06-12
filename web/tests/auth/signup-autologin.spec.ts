import { test, expect } from '@playwright/test';

test.describe('Signup Auto-login', () => {
  test('should automatically login after successful signup', async ({
    page,
  }) => {
    // Generate unique email for test
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    // Navigate to signup page
    await page.goto('/ja/auth/signup');

    // Fill in the signup form
    await page.fill('#name', 'Test User');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123');
    await page.fill('#confirmPassword', 'TestPassword123');

    // Check the terms checkbox
    await page.check('#terms');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard with longer timeout
    await page.waitForURL('/ja/dashboard', {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    // Verify we're on the dashboard
    expect(page.url()).toContain('/ja/dashboard');

    // Verify user is logged in
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible({ timeout: 5000 });
  });

  test('should show error when signup fails', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/ja/auth/signup');

    // Fill in the form with existing email
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'TestPassword123');
    await page.fill('#confirmPassword', 'TestPassword123');

    // Check the terms checkbox
    await page.check('#terms');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should stay on signup page
    await expect(page).toHaveURL(/\/auth\/signup/);

    // Should show error message in the alert component
    const errorAlert = page
      .locator('[role="alert"]')
      .filter({ has: page.locator('svg') });
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Check for error text anywhere in the error alert
    await expect(errorAlert).toContainText(
      /登録されています|失敗しました|エラー/
    );
  });
});
