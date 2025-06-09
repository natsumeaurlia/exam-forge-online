import { test, expect } from '@playwright/test';

test.describe('利用規約ページ', () => {
  test('基本的なページ表示テスト', async ({ page }) => {
    // 利用規約ページにアクセス
    await page.goto('/ja/terms');

    // ページタイトルが正しく表示されているか確認
    await expect(page).toHaveTitle(/ExamForge/i);

    // ナビゲーションが表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // 利用規約ページのメインコンテンツが表示されているか確認
    const termsPage = page.locator('[data-testid="terms-page"]');
    await expect(termsPage).toBeVisible();

    // タイトルが表示されているか確認
    const title = page.locator('[data-testid="terms-title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('利用規約');

    // コンテンツが表示されているか確認
    const content = page.locator('[data-testid="terms-content"]');
    await expect(content).toBeVisible();

    // 最終更新日が表示されているか確認
    const lastUpdated = page.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toBeVisible();
    await expect(lastUpdated).toContainText('最終更新日:');

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/terms/screenshot/terms-page.png',
      fullPage: true,
    });
  });

  test('利用規約セクションの表示テスト', async ({ page }) => {
    await page.goto('/ja/terms');

    // 1. 利用規約の同意 セクション
    const sectionAcceptance = page.locator(
      '[data-testid="section-acceptance"]'
    );
    await expect(sectionAcceptance).toBeVisible();
    await expect(sectionAcceptance).toHaveText('1. 利用規約の同意');

    const acceptanceContent = page.locator(
      '[data-testid="acceptance-content"]'
    );
    await expect(acceptanceContent).toBeVisible();
    await expect(acceptanceContent).toContainText(
      'ExamForgeのサービスにアクセス'
    );

    // 2. サービスの利用 セクション
    const sectionUse = page.locator('[data-testid="section-use"]');
    await expect(sectionUse).toBeVisible();
    await expect(sectionUse).toHaveText('2. サービスの利用');

    const useContent = page.locator('[data-testid="use-content"]');
    await expect(useContent).toBeVisible();
    await expect(useContent).toContainText('法律で許可され');

    // 3. ユーザーアカウント セクション
    const sectionAccounts = page.locator('[data-testid="section-accounts"]');
    await expect(sectionAccounts).toBeVisible();
    await expect(sectionAccounts).toHaveText('3. ユーザーアカウント');

    const accountsContent = page.locator('[data-testid="accounts-content"]');
    await expect(accountsContent).toBeVisible();
    await expect(accountsContent).toContainText('パスワードを保護する責任');

    // 4. 知的財産権 セクション
    const sectionIp = page.locator('[data-testid="section-ip"]');
    await expect(sectionIp).toBeVisible();
    await expect(sectionIp).toHaveText('4. 知的財産権');

    const ipContent = page.locator('[data-testid="ip-content"]');
    await expect(ipContent).toBeVisible();
    await expect(ipContent).toContainText(
      'ExamForgeまたはそのライセンサーの財産'
    );

    // 5. 利用停止 セクション
    const sectionTermination = page.locator(
      '[data-testid="section-termination"]'
    );
    await expect(sectionTermination).toBeVisible();
    await expect(sectionTermination).toHaveText('5. 利用停止');

    const terminationContent = page.locator(
      '[data-testid="termination-content"]'
    );
    await expect(terminationContent).toBeVisible();
    await expect(terminationContent).toContainText(
      'アクセスを直ちに終了または停止'
    );

    // 6. 規約の変更 セクション
    const sectionChanges = page.locator('[data-testid="section-changes"]');
    await expect(sectionChanges).toBeVisible();
    await expect(sectionChanges).toHaveText('6. 規約の変更');

    const changesContent = page.locator('[data-testid="changes-content"]');
    await expect(changesContent).toBeVisible();
    await expect(changesContent).toContainText(
      '本規約を変更または置き換える権利'
    );

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/terms/screenshot/terms-sections.png',
      fullPage: true,
    });
  });

  test('スクロールテスト', async ({ page }) => {
    await page.goto('/ja/terms');

    // ページの最上部にいることを確認
    const title = page.locator('[data-testid="terms-title"]');
    await expect(title).toBeVisible();

    // ページの最下部までスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 最後のセクションが表示されているか確認
    const lastSection = page.locator('[data-testid="section-changes"]');
    await expect(lastSection).toBeVisible();

    // ページの最上部に戻る
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(title).toBeVisible();

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/terms/screenshot/terms-scroll.png',
      fullPage: true,
    });
  });

  test('レスポンシブデザインテスト', async ({ page }) => {
    await page.goto('/ja/terms');

    // デスクトップサイズでの表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    const termsPage = page.locator('[data-testid="terms-page"]');
    await expect(termsPage).toBeVisible();

    // タブレットサイズでの表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(termsPage).toBeVisible();

    // モバイルサイズでの表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(termsPage).toBeVisible();

    // ナビゲーションが適切に表示されているか確認
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/terms/screenshot/terms-mobile.png',
      fullPage: true,
    });
  });

  test('テキスト内容の検証テスト', async ({ page }) => {
    await page.goto('/ja/terms');

    // メインコンテンツエリアを取得
    const content = page.locator('[data-testid="terms-content"]');
    await expect(content).toBeVisible();

    // ExamForgeの名前が含まれているか確認
    await expect(content).toContainText('ExamForge');

    // 重要な法的用語が含まれているか確認
    await expect(content).toContainText('利用規約');
    await expect(content).toContainText('サービス');
    await expect(content).toContainText('アカウント');
    await expect(content).toContainText('知的財産権');

    // 日付形式の確認
    const lastUpdated = page.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toContainText('2025年');

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/terms/screenshot/terms-content.png',
      fullPage: true,
    });
  });
});
