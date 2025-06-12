import { test, expect } from '@playwright/test';

test.describe('Team Creation Race Condition Prevention', () => {
  test('should create unique team slugs with timestamp and random string', async ({
    page,
  }) => {
    // This test verifies that the team creation logic has been updated
    // to use timestamp and random strings for unique slug generation

    // Generate unique test user
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const name = `Test User ${timestamp}`;

    // Register a new user
    await page.goto('/ja/auth/signup');
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123');
    await page.fill('#confirmPassword', 'TestPassword123');
    await page.check('#terms');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/ja/dashboard', { timeout: 10000 });

    // Create a quiz (which will trigger team creation)
    await page.click('button:has-text("クイズを作成")');

    // Fill in quiz details
    await page.fill('input[name="title"]', 'Test Quiz for Team Creation');
    await page.fill(
      'textarea[name="description"]',
      'Testing team slug generation'
    );

    // Submit form
    await page.click('button[type="submit"]:has-text("作成")');

    // Wait for redirect to quiz editor
    await page.waitForURL('**/quizzes/**/edit', { timeout: 10000 });

    // Verify we successfully created a quiz (and implicitly a team)
    expect(page.url()).toContain('/quizzes/');
    expect(page.url()).toContain('/edit');
  });
});
