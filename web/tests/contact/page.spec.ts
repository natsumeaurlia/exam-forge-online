import { test, expect } from '@playwright/test';

test.describe('コンタクトページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // コンタクトページにアクセス
    await page.goto('/ja/contact');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // ナビゲーションが表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // コンタクトページのメインコンテンツが表示されているか確認
    const contactPage = page.locator('[data-testid="contact-page"]');
    await expect(contactPage).toBeVisible();

    // タイトルが表示されているか確認
    const title = page.locator('[data-testid="contact-title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('お問い合わせ');

    // 説明文が表示されているか確認
    const description = page.locator('[data-testid="contact-description"]');
    await expect(description).toBeVisible();

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/contact/screenshot/contact-page.png',
      fullPage: true,
    });
  });

  test('コンタクトフォームの表示テスト', async ({ page }) => {
    await page.goto('/ja/contact');

    // フォームが表示されているか確認
    const form = page.locator('[data-testid="contact-form"]');
    await expect(form).toBeVisible();

    // 名前フィールドが表示されているか確認
    const nameField = page.locator('[data-testid="name-field"]');
    await expect(nameField).toBeVisible();

    const nameLabel = page.locator('[data-testid="name-label"]');
    await expect(nameLabel).toBeVisible();

    const nameInput = page.locator('[data-testid="name-input"]');
    await expect(nameInput).toBeVisible();

    // メールフィールドが表示されているか確認
    const emailField = page.locator('[data-testid="email-field"]');
    await expect(emailField).toBeVisible();

    const emailLabel = page.locator('[data-testid="email-label"]');
    await expect(emailLabel).toBeVisible();

    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toBeVisible();

    // メッセージフィールドが表示されているか確認
    const messageField = page.locator('[data-testid="message-field"]');
    await expect(messageField).toBeVisible();

    const messageLabel = page.locator('[data-testid="message-label"]');
    await expect(messageLabel).toBeVisible();

    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();

    // 送信ボタンが表示されているか確認
    const submitButton = page.locator('[data-testid="submit-button"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('送信する');
  });

  test('フォーム入力テスト', async ({ page }) => {
    await page.goto('/ja/contact');

    // フォームに入力
    const nameInput = page.locator('[data-testid="name-input"]');
    await nameInput.fill('テスト太郎');

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('test@example.com');

    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('これはテストメッセージです。');

    // 入力値が正しく設定されているか確認
    await expect(nameInput).toHaveValue('テスト太郎');
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(messageInput).toHaveValue('これはテストメッセージです。');

    // フォーム入力後のスクリーンショット
    await page.screenshot({
      path: 'tests/contact/screenshot/contact-form-filled.png',
      fullPage: true,
    });
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/ja/contact');

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // フォームが適切に表示されているか確認
    const form = page.locator('[data-testid="contact-form"]');
    await expect(form).toBeVisible();

    // ナビゲーションが適切に表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // モバイルでのスクリーンショット
    await page.screenshot({
      path: 'tests/contact/screenshot/contact-page-mobile.png',
      fullPage: true,
    });

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });

    // デスクトップでのスクリーンショット
    await page.screenshot({
      path: 'tests/contact/screenshot/contact-page-desktop.png',
      fullPage: true,
    });
  });
});
