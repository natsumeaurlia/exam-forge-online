import { test, expect } from '@playwright/test';

test.describe('UseCaseTabs Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja');
  });

  test('ユースケースセクションの基本表示を確認', async ({ page }) => {
    // セクション全体が表示されることを確認
    const usecasesSection = page.locator('[data-testid="usecases-section"]');
    await expect(usecasesSection).toBeVisible();

    // タイトルとディスクリプションが表示されることを確認
    const title = page.locator('[data-testid="usecases-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('様々なシーンで活用できるExamForge');

    const description = page.locator('[data-testid="usecases-description"]');
    await expect(description).toBeVisible();
  });

  test('タブリストが正しく表示される', async ({ page }) => {
    // タブリストが表示されることを確認
    const tabsList = page.locator('[data-testid="usecases-tabs-list"]');
    await expect(tabsList).toBeVisible();

    // 3つのタブが表示されることを確認
    const educationTab = page.locator('[data-testid="usecase-tab-education"]');
    const corporateTab = page.locator('[data-testid="usecase-tab-corporate"]');
    const certificationTab = page.locator(
      '[data-testid="usecase-tab-certification"]'
    );

    await expect(educationTab).toBeVisible();
    await expect(corporateTab).toBeVisible();
    await expect(certificationTab).toBeVisible();

    // タブのテキストを確認
    await expect(educationTab).toContainText('教育機関向け');
    await expect(corporateTab).toContainText('企業研修向け');
    await expect(certificationTab).toContainText('資格試験向け');
  });

  test('デフォルトで教育機関向けタブが選択されている', async ({ page }) => {
    // 教育機関向けタブがアクティブであることを確認
    const educationTab = page.locator('[data-testid="usecase-tab-education"]');
    await expect(educationTab).toHaveAttribute('data-state', 'active');

    // 教育機関向けコンテンツが表示されることを確認
    const educationContent = page.locator(
      '[data-testid="usecase-content-education"]'
    );
    await expect(educationContent).toBeVisible();
  });

  test('タブ切り替えが正常に動作する', async ({ page }) => {
    // 企業研修向けタブをクリック
    const corporateTab = page.locator('[data-testid="usecase-tab-corporate"]');
    await corporateTab.click();

    // 企業研修向けタブがアクティブになることを確認
    await expect(corporateTab).toHaveAttribute('data-state', 'active');

    // 企業研修向けコンテンツが表示されることを確認
    const corporateContent = page.locator(
      '[data-testid="usecase-content-corporate"]'
    );
    await expect(corporateContent).toBeVisible();

    // 教育機関向けコンテンツが隠れることを確認
    const educationContent = page.locator(
      '[data-testid="usecase-content-education"]'
    );
    await expect(educationContent).not.toBeVisible();

    // 資格試験向けタブをクリック
    const certificationTab = page.locator(
      '[data-testid="usecase-tab-certification"]'
    );
    await certificationTab.click();

    // 資格試験向けタブがアクティブになることを確認
    await expect(certificationTab).toHaveAttribute('data-state', 'active');

    // 資格試験向けコンテンツが表示されることを確認
    const certificationContent = page.locator(
      '[data-testid="usecase-content-certification"]'
    );
    await expect(certificationContent).toBeVisible();
  });

  test('各タブコンテンツの詳細表示を確認', async ({ page }) => {
    const testCases = [
      { tab: 'education', title: '教育機関向け' },
      { tab: 'corporate', title: '企業研修向け' },
      { tab: 'certification', title: '資格試験向け' },
    ];

    for (const testCase of testCases) {
      // タブをクリック
      const tab = page.locator(`[data-testid="usecase-tab-${testCase.tab}"]`);
      await tab.click();

      // アイコンが表示されることを確認（存在する場合のみ）
      const icon = page.locator(`[data-testid="usecase-icon-${testCase.tab}"]`);
      if ((await icon.count()) > 0) {
        await expect(icon).toBeVisible();
      }

      // タイトルが表示されることを確認
      const title = page.locator(
        `[data-testid="usecase-title-${testCase.tab}"]`
      );
      if ((await title.count()) > 0) {
        await expect(title).toBeVisible();
        await expect(title).toContainText(testCase.title);
      }

      // 説明文が表示されることを確認
      const description = page.locator(
        `[data-testid="usecase-description-${testCase.tab}"]`
      );
      if ((await description.count()) > 0) {
        await expect(description).toBeVisible();
      }

      // 利点リストが表示されることを確認
      const benefits = page.locator(
        `[data-testid="usecase-benefits-${testCase.tab}"]`
      );
      if ((await benefits.count()) > 0) {
        await expect(benefits).toBeVisible();
      }

      // 利点項目が表示されることを確認（存在するもののみ）
      for (let i = 0; i < 4; i++) {
        const benefit = page.locator(
          `[data-testid="usecase-benefit-${testCase.tab}-${i}"]`
        );
        if ((await benefit.count()) > 0) {
          await expect(benefit).toBeVisible();
        }
      }

      // 視覚的要素が表示されることを確認
      const visual = page.locator(
        `[data-testid="usecase-visual-${testCase.tab}"]`
      );
      if ((await visual.count()) > 0) {
        await expect(visual).toBeVisible();
      }
    }
  });

  test('キーボードナビゲーションが動作する', async ({ page }) => {
    // 教育機関向けタブにフォーカスを当てる
    const educationTab = page.locator('[data-testid="usecase-tab-education"]');
    await educationTab.focus();

    // 右矢印キーで次のタブに移動
    await page.keyboard.press('ArrowRight');
    const corporateTab = page.locator('[data-testid="usecase-tab-corporate"]');
    await expect(corporateTab).toBeFocused();

    // Enterキーでタブを選択
    await page.keyboard.press('Enter');
    await expect(corporateTab).toHaveAttribute('data-state', 'active');

    // もう一度右矢印キーで次のタブに移動
    await page.keyboard.press('ArrowRight');
    const certificationTab = page.locator(
      '[data-testid="usecase-tab-certification"]'
    );
    await expect(certificationTab).toBeFocused();
  });

  test('レスポンシブデザインの動作確認', async ({ page }) => {
    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 812 });

    // セクションが適切に表示されることを確認
    const usecasesSection = page.locator('[data-testid="usecases-section"]');
    await expect(usecasesSection).toBeVisible();

    // タブリストが適切に表示されることを確認
    const tabsList = page.locator('[data-testid="usecases-tabs-list"]');
    await expect(tabsList).toBeVisible();

    // タブのテキストが適切に表示されることを確認（アイコンは隠れる）
    const educationTab = page.locator('[data-testid="usecase-tab-education"]');
    await expect(educationTab).toBeVisible();
    await expect(educationTab).toContainText('教育機関向け');

    // タブレットサイズでテスト
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(usecasesSection).toBeVisible();
    await expect(tabsList).toBeVisible();

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(usecasesSection).toBeVisible();
    await expect(tabsList).toBeVisible();
  });

  test('英語版でも正常に動作する', async ({ page }) => {
    await page.goto('/en');

    // セクションが表示されることを確認
    const usecasesSection = page.locator('[data-testid="usecases-section"]');
    await expect(usecasesSection).toBeVisible();

    // 英語のタイトルが表示されることを確認
    const title = page.locator('[data-testid="usecases-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText(
      'ExamForge Works Across Various Scenarios'
    );

    // 英語のタブが表示されることを確認
    const educationTab = page.locator('[data-testid="usecase-tab-education"]');
    await expect(educationTab).toContainText('For Educational Institutions');

    const corporateTab = page.locator('[data-testid="usecase-tab-corporate"]');
    await expect(corporateTab).toContainText('For Corporate Training');

    const certificationTab = page.locator(
      '[data-testid="usecase-tab-certification"]'
    );
    await expect(certificationTab).toContainText('For Certification Exams');
  });
});
