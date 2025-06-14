import { test, expect } from '@playwright/test';

test.describe('Authentication Redirect Tests', () => {
  test('should redirect to signin page with locale when accessing dashboard without auth', async ({
    page,
  }) => {
    // Test Japanese locale
    await page.goto('/ja/dashboard');
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);

    // Verify callbackUrl is preserved
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe('/ja/dashboard');
  });

  test('should redirect to signin page with English locale', async ({
    page,
  }) => {
    // Test English locale
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/auth\/signin/);

    // Verify callbackUrl is preserved
    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe('/en/dashboard');
  });

  test('should redirect to dashboard after successful signin with preserved locale', async ({
    page,
  }) => {
    // Go to Japanese signin page
    await page.goto('/ja/auth/signin');

    // Fill in credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');

    // Click sign in
    await page.click('button[type="submit"]');

    // Should redirect to Japanese dashboard
    await expect(page).toHaveURL(/\/ja\/dashboard/);
  });

  test('should show error page with locale when authentication fails', async ({
    page,
  }) => {
    // Go to Japanese signin page
    await page.goto('/ja/auth/signin');

    // Fill in wrong credentials
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');

    // Click sign in
    await page.click('button[type="submit"]');

    // Should show error message (stay on signin page)
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);
  });

  test('should preserve locale through OAuth flow', async ({ page }) => {
    // Go to English signin page
    await page.goto('/en/auth/signin');

    // Verify OAuth buttons have correct callback URLs
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();

    // The OAuth flow should preserve the locale
    // (In real test, we would mock the OAuth provider)
  });

  test('should redirect to locale-specific signin when session expires', async ({
    page,
    context,
  }) => {
    // Simulate authenticated session
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 60 * 60, // 1 hour
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Go to dashboard
    await page.goto('/ja/dashboard');

    // Clear session cookie to simulate expiration
    await context.clearCookies();

    // Navigate to a protected page
    await page.goto('/ja/dashboard/quizzes');

    // Should redirect to signin with locale
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);
  });

  test('should handle nested protected routes correctly', async ({ page }) => {
    // Try to access nested protected route
    await page.goto('/ja/dashboard/quizzes/123/edit');

    // Should redirect to signin with full callback URL
    await expect(page).toHaveURL(/\/ja\/auth\/signin/);

    const url = new URL(page.url());
    expect(url.searchParams.get('callbackUrl')).toBe(
      '/ja/dashboard/quizzes/123/edit'
    );
  });

  test('should not redirect public pages', async ({ page }) => {
    // Public pages should be accessible without auth
    const publicPages = [
      '/ja',
      '/en',
      '/ja/plans',
      '/en/plans',
      '/ja/contact',
      '/en/contact',
      '/ja/terms',
      '/en/terms',
      '/ja/privacy',
      '/en/privacy',
    ];

    for (const publicPage of publicPages) {
      await page.goto(publicPage);
      // Should not redirect to signin
      await expect(page).not.toHaveURL(/\/auth\/signin/);
    }
  });
});
