import { test, expect } from '@playwright/test';

test.describe('クイズエディタ自動保存機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のログインを実行
    await page.goto('/ja/auth/signin');

    // ログインフォームに入力
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');

    // サインインボタンをクリック
    await page.click('button[type="submit"]');

    // ログイン完了を待つ
    await page.waitForURL('/ja/dashboard');
  });

  test('タイトル変更時の自動保存', async ({ page }) => {
    // クイズ一覧ページに移動
    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    // 新規クイズ作成
    await page.click('button:has-text("新規クイズ作成")');
    await page.fill('input[name="title"]', '自動保存テストクイズ');
    await page.fill('textarea[name="description"]', '自動保存機能のテスト');
    await page.selectOption('select[name="scoringType"]', 'TOTAL_SCORE');
    await page.selectOption('select[name="sharingMode"]', 'PUBLIC');
    await page.click('button[type="submit"]');

    // クイズエディタへの遷移を待つ
    await page.waitForURL('**/dashboard/quizzes/**/edit');
    await page.waitForLoadState('networkidle');

    // タイトルを変更
    await page.click('h1:has-text("自動保存テストクイズ")');
    const titleInput = page.locator('input.text-xl');
    await titleInput.clear();
    await titleInput.fill('更新されたタイトル');
    await page.keyboard.press('Enter');

    // 自動保存の表示を確認（3秒のデバウンス後）
    await expect(page.locator('text=自動保存中...')).toBeVisible({
      timeout: 5000,
    });

    // 自動保存完了の表示を確認
    await expect(page.locator('text=自動保存済み')).toBeVisible({
      timeout: 10000,
    });

    // ページをリロードして変更が保存されていることを確認
    await page.reload();
    await expect(
      page.locator('h1:has-text("更新されたタイトル")')
    ).toBeVisible();
  });

  test('問題追加時の自動保存', async ({ page }) => {
    // クイズ一覧ページから新規作成
    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("新規クイズ作成")');
    await page.fill('input[name="title"]', '問題自動保存テスト');
    await page.fill(
      'textarea[name="description"]',
      '問題追加時の自動保存テスト'
    );
    await page.selectOption('select[name="scoringType"]', 'TOTAL_SCORE');
    await page.selectOption('select[name="sharingMode"]', 'PUBLIC');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/quizzes/**/edit');
    await page.waitForLoadState('networkidle');

    // 新しい問題を追加
    await page.click('button:has-text("○×問題")');

    // 問題文を入力
    const questionTextarea = page
      .locator('textarea[placeholder="問題文を入力してください"]')
      .first();
    await questionTextarea.fill('自動保存のテスト問題です');

    // 自動保存の表示を確認
    await expect(page.locator('text=自動保存中...')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=自動保存済み')).toBeVisible({
      timeout: 10000,
    });

    // ページをリロードして問題が保存されていることを確認
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=自動保存のテスト問題です')).toBeVisible();
  });

  test('自動保存エラー時の表示', async ({ page, context }) => {
    // クイズ一覧ページから新規作成
    await page.goto('/ja/dashboard/quizzes');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("新規クイズ作成")');
    await page.fill('input[name="title"]', 'エラーハンドリングテスト');
    await page.fill('textarea[name="description"]', 'エラー時の動作確認');
    await page.selectOption('select[name="scoringType"]', 'TOTAL_SCORE');
    await page.selectOption('select[name="sharingMode"]', 'PUBLIC');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/quizzes/**/edit');
    await page.waitForLoadState('networkidle');

    // 自動保存APIへのリクエストをブロック
    await context.route('**/action/saveQuizWithQuestions', route => {
      route.abort('failed');
    });

    // タイトルを変更してエラーを発生させる
    await page.click('h1:has-text("エラーハンドリングテスト")');
    const titleInput = page.locator('input.text-xl');
    await titleInput.clear();
    await titleInput.fill('エラーを発生させる変更');
    await page.keyboard.press('Enter');

    // エラー表示を確認
    await expect(page.locator('text=自動保存エラー')).toBeVisible({
      timeout: 15000,
    });

    // エラー通知の詳細を確認
    await expect(
      page.locator('.fixed.bottom-20 .text-red-800:has-text("自動保存エラー")')
    ).toBeVisible();
  });
});
