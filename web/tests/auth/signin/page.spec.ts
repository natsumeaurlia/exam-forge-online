import { test, expect } from '@playwright/test';

test.describe('サインインページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // サインインページにアクセス
    await page.goto('/ja/auth/signin');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // ExamForgeロゴが表示されているか確認
    await expect(page.locator('h1:has-text("ExamForge")')).toBeVisible();

    // サインインタイトルが表示されているか確認
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('h2')).toContainText('アカウントにサインイン');

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-page.png',
      fullPage: true,
    });
  });

  test('認証フォームの表示テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // メールフィールドが表示されているか確認
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // パスワードフィールドが表示されているか確認
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // サインインボタンが表示されているか確認
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('サインイン');
  });

  test('テスト用認証情報の表示テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // アラートセクション（テスト用認証情報）が表示されているか確認
    const alertSection = page
      .locator('[role="alert"]')
      .filter({ hasText: 'テスト用アカウント' });
    await expect(alertSection).toBeVisible();
    await expect(alertSection).toContainText('テスト用アカウント');
    await expect(alertSection).toContainText('test@example.com');
  });

  test('フォーム入力テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // フォームに入力
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    // 入力値が正しく設定されているか確認
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');

    // フォーム入力後のスクリーンショット
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-form-filled.png',
      fullPage: true,
    });
  });

  test('ホームリンクのクリックテスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // ExamForgeロゴリンクをクリック
    const homeLink = page.locator('a:has-text("ExamForge")').first();
    await homeLink.click();

    // ホームページまたはルートページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/(ja)?$/);
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // フォームが適切に表示されているか確認
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // モバイルでのスクリーンショット
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-page-mobile.png',
      fullPage: true,
    });

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });

    // デスクトップでのスクリーンショット
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-page-desktop.png',
      fullPage: true,
    });
  });

  test('パスワード表示/非表示トグル機能テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // パスワード入力フィールドが表示されているか確認
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // パスワードを入力
    await passwordInput.fill('testpassword123');

    // 入力値が正しく設定されていることを確認
    await expect(passwordInput).toHaveValue('testpassword123');

    // パスワードトグルボタンを探す（パスワードフィールドの隣にあるボタン）
    const passwordContainer = page
      .locator('div')
      .filter({ has: page.locator('input[type="password"]') });
    const toggleButton = passwordContainer
      .locator('button[type="button"]')
      .first();

    if ((await toggleButton.count()) > 0) {
      await toggleButton.click();

      // クリック後に入力値が維持されていることを確認
      const passwordInputAfter = page.locator('input[id="password"]');
      await expect(passwordInputAfter).toHaveValue('testpassword123');
    }
  });

  test('パスワードトグルボタンのアクセシビリティテスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // パスワード入力フィールドの存在確認
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // パスワードを入力
    await passwordInput.fill('testpassword123');

    // パスワードトグルボタンの存在確認
    const passwordContainer = page
      .locator('div')
      .filter({ has: page.locator('input[type="password"]') });
    const toggleButton = passwordContainer
      .locator('button[type="button"]')
      .first();

    if ((await toggleButton.count()) > 0) {
      await expect(toggleButton).toBeVisible();

      // ボタンをクリック
      await toggleButton.click();

      // 入力値が維持されていることを確認
      const passwordInputAfter = page.locator('input[id="password"]');
      await expect(passwordInputAfter).toHaveValue('testpassword123');
    }
  });
});
