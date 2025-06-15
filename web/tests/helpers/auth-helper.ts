/**
 * Authentication helper for E2E tests
 * Provides reusable authentication methods to improve test stability
 */

import { Page, expect } from '@playwright/test';
import { getTestDataFactory } from '../fixtures/test-data-factory';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export class AuthHelper {
  private factory = getTestDataFactory();

  /**
   * Create a test user and return credentials
   */
  async createTestUser(
    options: {
      email?: string;
      name?: string;
      password?: string;
    } = {}
  ): Promise<TestUser> {
    const email = options.email || `test-${Date.now()}@example.com`;
    const name = options.name || 'Test User';
    const password = options.password || 'TestPassword123!';

    const { user } = await this.factory.createUser({
      email,
      name,
      password,
    });

    return {
      id: user.id,
      email,
      name,
      password,
    };
  }

  /**
   * Sign in a user via the UI
   */
  async signIn(page: Page, credentials: { email: string; password: string }) {
    // Navigate to sign in page
    await page.goto('/ja/auth/signin');

    // Wait for form to be loaded
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill credentials
    await page.fill('[name="email"]', credentials.email);
    await page.fill('[name="password"]', credentials.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for successful redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify we're on the dashboard
    await expect(page.locator('h1, h2')).toContainText(
      ['ダッシュボード', 'Dashboard'],
      { timeout: 10000 }
    );
  }

  /**
   * Sign in with a newly created test user
   */
  async signInWithTestUser(
    page: Page,
    userOptions?: {
      email?: string;
      name?: string;
      password?: string;
    }
  ): Promise<TestUser> {
    const user = await this.createTestUser(userOptions);
    await this.signIn(page, { email: user.email, password: user.password });
    return user;
  }

  /**
   * Sign out the current user
   */
  async signOut(page: Page) {
    // Click user menu or sign out button
    const userMenuButton = page
      .locator(
        '[data-testid="user-menu"], [aria-label*="ユーザー"], button:has-text("ログアウト")'
      )
      .first();
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();

      // Look for sign out button
      const signOutButton = page.locator(
        'button:has-text("ログアウト"), button:has-text("Sign out")'
      );
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
      }
    } else {
      // Fallback: navigate to sign out URL
      await page.goto('/ja/auth/signout');
    }

    // Wait for redirect to sign in page or home page
    await page.waitForURL(/\/(ja|en)\/(auth\/signin|$)/, { timeout: 15000 });
  }

  /**
   * Check if user is currently signed in
   */
  async isSignedIn(page: Page): Promise<boolean> {
    try {
      // Try to navigate to a protected page
      await page.goto('/ja/dashboard');
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // If we're on dashboard, user is signed in
      const currentUrl = page.url();
      return currentUrl.includes('/dashboard');
    } catch {
      return false;
    }
  }

  /**
   * Ensure user is signed out
   */
  async ensureSignedOut(page: Page) {
    if (await this.isSignedIn(page)) {
      await this.signOut(page);
    }
  }

  /**
   * Create a test user with a team and quiz data
   */
  async createUserWithQuizData(
    options: {
      userEmail?: string;
      userName?: string;
      quizTitle?: string;
      questionCount?: number;
    } = {}
  ) {
    const { user, team } = await this.factory.createUser({
      email: options.userEmail,
      name: options.userName,
    });

    const { quiz } = await this.factory.createQuiz({
      title: options.quizTitle || 'Test Quiz',
      questionCount: options.questionCount || 5,
      status: 'PUBLISHED',
      createdById: user.id,
      teamId: team.id,
    });

    return { user, quiz };
  }
}

// Export singleton instance
export const authHelper = new AuthHelper();
