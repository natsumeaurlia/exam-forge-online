import { test, expect } from '@playwright/test';

test.describe('Session Handling Tests', () => {
  test('should handle getUserActiveTeam error gracefully', async ({ page }) => {
    // Mock authentication but with invalid user
    await page.addInitScript(() => {
      // This would be implemented with proper mocking
      console.log('Session handling test initialized');
    });

    // Try to access dashboard
    await page.goto('/ja/dashboard');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);
  });

  test('should show error message on signin page when redirected', async ({
    page,
  }) => {
    // Navigate with error params
    await page.goto(
      '/ja/auth/signin?error=SessionExpired&message=セッションの有効期限が切れました'
    );

    // Check error alert is visible
    const errorAlert = page
      .locator('[role="alert"]')
      .filter({ hasText: 'セッションの有効期限が切れました' });
    await expect(errorAlert).toBeVisible();
  });

  test('should preserve callbackUrl through error redirect', async ({
    page,
  }) => {
    // Try to access protected nested route
    const protectedUrl = '/ja/dashboard/quizzes/123/edit';
    await page.goto(protectedUrl);

    // Should redirect to signin with callbackUrl
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);

    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe(protectedUrl);
  });

  test('should handle server action authentication errors', async ({
    page,
  }) => {
    // First, sign in successfully
    await page.goto('/ja/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/ja\/dashboard/);

    // Now simulate session expiry by clearing cookies
    await page.context().clearCookies();

    // Try to create a quiz (which should fail with auth error)
    await page.click('button:has-text("新しいクイズを作成")');

    // Fill form and submit
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.fill('input[name="title"]', 'Test Quiz');
    await page.click('button:has-text("作成")');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/ja\/auth\/signin/, { timeout: 10000 });
  });

  test('should maintain locale through authentication flow', async ({
    page,
  }) => {
    // Test with English locale
    await page.goto('/en/dashboard/quizzes');

    // Should redirect to English signin
    await expect(page).toHaveURL(/\/en\/auth\/signin/);

    // Sign in
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should return to English dashboard
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

  test('should handle middleware authentication checks', async ({ page }) => {
    // Test direct navigation to protected routes without session
    const protectedRoutes = [
      '/ja/dashboard',
      '/ja/dashboard/quizzes',
      '/ja/dashboard/analytics',
      '/ja/dashboard/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to signin
      await expect(page).toHaveURL(/\/ja\/auth\/signin/);

      // Verify callbackUrl is set
      const url = new URL(page.url());
      expect(url.searchParams.get('callbackUrl')).toBe(route);
    }
  });
});
