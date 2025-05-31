import { test, expect } from '@playwright/test';

test.describe('サインインページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // サインインページにアクセス
    await page.goto('/ja/auth/signin');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // サインインページのメインコンテンツが表示されているか確認
    const signinPage = page.locator('[data-testid="signin-page"]');
    await expect(signinPage).toBeVisible();

    // サインインコンテナが表示されているか確認
    const signinContainer = page.locator('[data-testid="signin-container"]');
    await expect(signinContainer).toBeVisible();

    // ヘッダーセクションが表示されているか確認
    const header = page.locator('[data-testid="signin-header"]');
    await expect(header).toBeVisible();

    // タイトルが表示されているか確認
    const title = page.locator('[data-testid="signin-title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('アカウントにサインイン');

    // サブタイトルが表示されているか確認
    const subtitle = page.locator('[data-testid="signin-subtitle"]');
    await expect(subtitle).toBeVisible();

    // ホームリンクが表示されているか確認
    const homeLink = page.locator('[data-testid="home-link"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveText('ホームに戻る');

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-page.png',
      fullPage: true,
    });
  });

  test('認証フォームの表示テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // 認証コンテンツが表示されているか確認
    const signinContent = page.locator('[data-testid="signin-content"]');
    await expect(signinContent).toBeVisible();

    // 認証情報フォームが表示されているか確認
    const credentialsForm = page.locator('[data-testid="credentials-form"]');
    await expect(credentialsForm).toBeVisible();

    // メールフィールドが表示されているか確認
    const emailField = page.locator('[data-testid="email-field"]');
    await expect(emailField).toBeVisible();

    const emailLabel = page.locator('[data-testid="email-label"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toHaveText('メールアドレス');

    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toBeVisible();

    // パスワードフィールドが表示されているか確認
    const passwordField = page.locator('[data-testid="password-field"]');
    await expect(passwordField).toBeVisible();

    const passwordLabel = page.locator('[data-testid="password-label"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toHaveText('パスワード');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toBeVisible();

    // サインインボタンが表示されているか確認
    const submitButton = page.locator('[data-testid="signin-submit-button"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('サインイン');
  });

  test('テスト用認証情報の表示テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // テスト用認証情報セクションが表示されているか確認
    const testCredentials = page.locator('[data-testid="test-credentials"]');
    await expect(testCredentials).toBeVisible();

    // テスト用認証情報のタイトルが表示されているか確認
    const testCredentialsTitle = page.locator(
      '[data-testid="test-credentials-title"]'
    );
    await expect(testCredentialsTitle).toBeVisible();
    await expect(testCredentialsTitle).toHaveText('テスト用アカウント:');

    // テスト用認証情報の内容が表示されているか確認
    const testCredentialsInfo = page.locator(
      '[data-testid="test-credentials-info"]'
    );
    await expect(testCredentialsInfo).toBeVisible();
    await expect(testCredentialsInfo).toContainText('test@example.com');
    await expect(testCredentialsInfo).toContainText('password');
  });

  test('フォーム入力テスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // フォームに入力
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('test@example.com');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('password');

    // 入力値が正しく設定されているか確認
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password');

    // フォーム入力後のスクリーンショット
    await page.screenshot({
      path: 'tests/auth/signin/screenshot/signin-form-filled.png',
      fullPage: true,
    });
  });

  test('ホームリンクのクリックテスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // ホームリンクをクリック
    const homeLink = page.locator('[data-testid="home-link"]');
    await homeLink.click();

    // ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/ja$/);
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/ja/auth/signin');

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // フォームが適切に表示されているか確認
    const signinContainer = page.locator('[data-testid="signin-container"]');
    await expect(signinContainer).toBeVisible();

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
});
