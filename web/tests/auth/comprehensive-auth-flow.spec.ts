import { test, expect } from '@playwright/test';

test.describe('包括的認証フローテスト', () => {
  const baseURL =
    process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.describe('新規登録フロー', () => {
    test('メールアドレスでの新規登録', async ({ page }) => {
      // テスト用のユニークなメールアドレスを生成
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      const testName = `Test User ${Date.now()}`;

      // サインアップページへ移動
      await page.goto('/ja/auth/signup');

      // フォームが表示されるまで待機
      await expect(
        page.getByRole('heading', { name: 'アカウント作成' })
      ).toBeVisible();

      // フォーム入力
      await page.fill('input[name="name"]', testName);
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);

      // 利用規約に同意
      await page.check('input[name="terms"]');

      // 登録ボタンをクリック
      await page.click('button[type="submit"]');

      // ダッシュボードへのリダイレクトを確認
      await page.waitForURL('**/dashboard');
      await expect(page.locator('text=' + testName)).toBeVisible();
    });

    test('パスワード強度の検証', async ({ page }) => {
      await page.goto('/ja/auth/signup');

      // 弱いパスワードでエラーメッセージを確認
      await page.fill('input[name="password"]', '123');
      await page.click('input[name="confirmPassword"]'); // フォーカスを移動

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=パスワードは8文字以上')).toBeVisible();
    });

    test('既存メールアドレスでの登録エラー', async ({ page }) => {
      await page.goto('/ja/auth/signup');

      // 既存のメールアドレスで登録を試みる
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'existing@example.com'); // 事前に登録済みと仮定
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.check('input[name="terms"]');
      await page.click('button[type="submit"]');

      // エラーメッセージを確認
      await expect(
        page.locator('text=このメールアドレスは既に登録されています')
      ).toBeVisible();
    });
  });

  test.describe('ログインフロー', () => {
    test('正常なログイン', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // ログインフォームが表示されるまで待機
      await expect(
        page.getByRole('heading', { name: 'ログイン' })
      ).toBeVisible();

      // 既存ユーザーでログイン
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // ダッシュボードへのリダイレクトを確認
      await page.waitForURL('**/dashboard');
      await expect(page.locator('text=ダッシュボード')).toBeVisible();
    });

    test('無効な認証情報でのログインエラー', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');

      // エラーメッセージを確認
      await expect(
        page.locator('text=メールアドレスまたはパスワードが正しくありません')
      ).toBeVisible();
    });

    test('空のフィールドでのバリデーション', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // 空のフォームで送信
      await page.click('button[type="submit"]');

      // バリデーションエラーを確認
      await expect(
        page.locator('text=メールアドレスを入力してください')
      ).toBeVisible();
      await expect(
        page.locator('text=パスワードを入力してください')
      ).toBeVisible();
    });
  });

  test.describe('ログアウトフロー', () => {
    test('正常なログアウト', async ({ page }) => {
      // まずログインする
      await page.goto('/ja/auth/signin');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // ユーザーメニューを開く
      await page.click('[data-testid="user-menu-trigger"]');

      // ログアウトをクリック
      await page.click('text=ログアウト');

      // ログアウト確認ページへのリダイレクトを確認
      await page.waitForURL('**/auth/signout');

      // ログアウトボタンをクリック
      await page.click('button:has-text("ログアウト")');

      // トップページへのリダイレクトを確認
      await page.waitForURL('/ja');
      await expect(page.locator('text=ログイン')).toBeVisible();
    });
  });

  test.describe('セッション管理', () => {
    test('未認証時の保護ページへのアクセス', async ({ page }) => {
      // 未ログイン状態でダッシュボードにアクセス
      await page.goto('/ja/dashboard');

      // ログインページへリダイレクトされることを確認
      await page.waitForURL('**/auth/signin');
      await expect(
        page.getByRole('heading', { name: 'ログイン' })
      ).toBeVisible();
    });

    test('ログイン後のリダイレクト', async ({ page }) => {
      // 保護ページにアクセスしようとする
      await page.goto('/ja/dashboard/quizzes');

      // ログインページへリダイレクト
      await page.waitForURL('**/auth/signin');

      // ログイン
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // 元々アクセスしようとしていたページへリダイレクトされることを確認
      await page.waitForURL('**/dashboard/quizzes');
      await expect(page.locator('h1:has-text("クイズ管理")')).toBeVisible();
    });
  });

  test.describe('ソーシャルログイン', () => {
    test('Googleログインボタンの表示', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // Googleログインボタンが表示されることを確認
      const googleButton = page.locator('button:has-text("Googleでログイン")');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('GitHubログインボタンの表示', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // GitHubログインボタンが表示されることを確認
      const githubButton = page.locator('button:has-text("GitHubでログイン")');
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();
    });
  });

  test.describe('言語切り替え', () => {
    test('英語での認証フロー', async ({ page }) => {
      // 英語版のサインインページへ
      await page.goto('/en/auth/signin');

      // 英語のUIが表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'Sign In' })
      ).toBeVisible();
      await expect(page.locator('label:has-text("Email")')).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('言語切り替えボタンの動作', async ({ page }) => {
      await page.goto('/ja/auth/signin');

      // 言語切り替えボタンをクリック
      await page.click('[data-testid="language-switcher"]');
      await page.click('text=English');

      // 英語版にリダイレクトされることを確認
      await page.waitForURL('/en/auth/signin');
      await expect(
        page.getByRole('heading', { name: 'Sign In' })
      ).toBeVisible();
    });
  });

  test.describe('エラーハンドリング', () => {
    test('ネットワークエラー時の表示', async ({ page, context }) => {
      // ネットワークをオフラインにする
      await context.setOffline(true);

      await page.goto('/ja/auth/signin');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      // エラーメッセージが表示されることを確認
      await expect(
        page.locator('text=ネットワークエラーが発生しました')
      ).toBeVisible();

      // ネットワークを復旧
      await context.setOffline(false);
    });
  });
});
