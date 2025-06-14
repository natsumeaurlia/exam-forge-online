import { test, expect } from '@playwright/test';

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      // Mock NextAuth session
      window.localStorage.setItem('test-user', 'authenticated');
    });

    // Mock API responses
    await page.route('/api/notifications/preferences', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            teamInvitations: true,
            subscriptionUpdates: true,
            paymentReminders: true,
            trialExpirations: true,
            memberJoined: true,
            memberLeft: false,
            quizShared: true,
            emailEnabled: true,
          }),
        });
      }
    });

    // Navigate to settings page
    await page.goto('/ja/dashboard/settings');

    // Click on notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Wait for the notifications tab content to be visible
    await page.waitForSelector('text=通知設定', { timeout: 10000 });
  });

  test('should display notification settings correctly', async ({ page }) => {
    // Check that the main title is visible
    await expect(
      page.locator('h1[data-testid="settings-title"]')
    ).toContainText('設定');

    // Check that notification settings content is visible
    await expect(page.locator('text=通知設定')).toBeVisible();
    await expect(
      page.locator('text=メール通知とアラートの設定を管理します')
    ).toBeVisible();

    // Check for email enabled toggle
    await expect(page.locator('text=メール通知を有効にする')).toBeVisible();

    // Check for team notifications section
    await expect(page.locator('text=チーム通知')).toBeVisible();
    await expect(page.locator('text=チーム招待')).toBeVisible();
    await expect(page.locator('text=メンバー参加')).toBeVisible();

    // Check for billing notifications section
    await expect(
      page.locator('text=請求・サブスクリプション通知')
    ).toBeVisible();
    await expect(page.locator('text=サブスクリプション更新')).toBeVisible();
    await expect(page.locator('text=支払いリマインダー')).toBeVisible();

    // Check for save button
    await expect(page.locator('text=設定を保存')).toBeVisible();
  });

  test('should toggle email notifications', async ({ page }) => {
    // Find the main email toggle
    const emailToggle = page
      .locator('text=メール通知を有効にする')
      .locator('..')
      .locator('button[role="switch"]');

    // Click to disable email notifications
    await emailToggle.click();

    // Check that other toggles become disabled
    const teamInviteToggle = page
      .locator('text=チーム招待')
      .locator('..')
      .locator('button[role="switch"]');
    await expect(teamInviteToggle).toBeDisabled();

    // Re-enable email notifications
    await emailToggle.click();

    // Check that other toggles become enabled again
    await expect(teamInviteToggle).toBeEnabled();
  });

  test('should save notification preferences', async ({ page }) => {
    // Mock the API response
    await page.route('/api/notifications/preferences', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            teamInvitations: true,
            subscriptionUpdates: true,
            paymentReminders: true,
            trialExpirations: true,
            memberJoined: true,
            memberLeft: false,
            quizShared: true,
            emailEnabled: true,
          }),
        });
      }
    });

    // Wait for settings to load
    await page.waitForTimeout(1000);

    // Click save button
    await page.click('text=設定を保存');

    // Check for success message
    await expect(page.locator('text=設定が保存されました')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error for loading preferences
    await page.route('/api/notifications/preferences', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    // Reload the page to trigger the error
    await page.reload();
    await page.click('[data-testid="tab-notifications"]');

    // Check that error message is displayed
    await expect(
      page.locator('text=通知設定の読み込みに失敗しました')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=再試行')).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    // Navigate to English version
    await page.goto('/en/dashboard/settings');

    // Click on notifications tab
    await page.click('[data-testid="tab-notifications"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="notification-settings"]', {
      timeout: 10000,
    });

    // Check English text
    await expect(page.locator('text=Notification Settings')).toBeVisible();
    await expect(page.locator('text=Enable email notifications')).toBeVisible();
    await expect(page.locator('text=Team Notifications')).toBeVisible();
    await expect(
      page.locator('text=Billing & Subscription Notifications')
    ).toBeVisible();
    await expect(page.locator('text=Save Settings')).toBeVisible();
  });
});
