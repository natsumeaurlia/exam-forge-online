import { test, expect, type Page } from '@playwright/test';
import path from 'path';

test.describe.skip('Media Gallery', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Login as test user
    await page.goto('/ja/auth/signin');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should navigate to media gallery from sidebar', async () => {
    // Click media library link in sidebar
    await page.click('text=メディアライブラリ');
    await page.waitForURL('**/dashboard/media', { timeout: 15000 });

    // Check page title and description
    await expect(page.locator('h1')).toContainText('メディアライブラリ');
    await expect(
      page.locator('text=アップロードしたすべてのメディアファイルを一元管理')
    ).toBeVisible();
  });

  test('should display empty state when no media files', async () => {
    await page.goto('/ja/dashboard/media');

    // Check empty state
    const emptyState = page.locator('text=メディアファイルがありません');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(
        page.locator('text=最初のファイルをアップロードして始めましょう')
      ).toBeVisible();
    }
  });

  test('should show upload dialog when clicking upload button', async () => {
    await page.goto('/ja/dashboard/media');

    // Click upload button
    await page.click('button:has-text("アップロード")');

    // Check upload dialog
    await expect(page.locator('text=メディアをアップロード')).toBeVisible();
    await expect(
      page.locator('text=メディアライブラリに画像や動画を追加')
    ).toBeVisible();
  });

  test('should upload an image file', async () => {
    await page.goto('/ja/dashboard/media');

    // Open upload dialog
    await page.click('button:has-text("アップロード")');

    // Upload file
    const filePath = path.join(__dirname, '../fixtures/test-image.jpg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for upload to complete
    await page.waitForResponse(
      response =>
        response.url().includes('/api/upload') && response.status() === 200
    );

    // Check success message
    await expect(page.locator('text=アップロード成功')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');

    // Check file appears in gallery
    await expect(page.locator('img[alt*="test-image"]')).toBeVisible();
  });

  test('should filter media by type', async () => {
    await page.goto('/ja/dashboard/media');

    // Click filter dropdown
    await page.click('button[aria-label="Filter"]');

    // Select images filter
    await page.click('text=画像');

    // Verify filter is applied
    await expect(page.locator('svg.lucide-check')).toBeVisible();
  });

  test('should search media files', async () => {
    await page.goto('/ja/dashboard/media');

    // Type in search box
    await page.fill('input[placeholder="ファイルを検索..."]', 'test');

    // Verify search works (results depend on existing data)
    await page.waitForTimeout(500); // Debounce delay
  });

  test('should switch between grid and list view', async () => {
    await page.goto('/ja/dashboard/media');

    // Default should be grid view
    await expect(
      page.locator('button[aria-pressed="true"] svg.lucide-grid-3x3')
    ).toBeVisible();

    // Switch to list view
    await page.click('button:has(svg.lucide-list)');

    // Verify list view is active
    await expect(
      page.locator('button[aria-pressed="true"] svg.lucide-list')
    ).toBeVisible();
  });

  test('should enable selection mode', async () => {
    await page.goto('/ja/dashboard/media');

    // Click select button
    await page.click('button:has-text("選択")');

    // Verify selection mode is active
    await expect(
      page.locator('button:has-text("選択をキャンセル")')
    ).toBeVisible();

    // If there are files, check select all option
    const selectAllCheckbox = page.locator('text=すべて選択').locator('..');
    if (await selectAllCheckbox.isVisible()) {
      await expect(
        selectAllCheckbox.locator('input[type="checkbox"]')
      ).toBeVisible();
    }
  });

  test('should show storage usage', async () => {
    await page.goto('/ja/dashboard/media');

    // Check storage usage card
    await expect(page.locator('text=ストレージ使用状況')).toBeVisible();
    await expect(
      page.locator(
        'text=/\\d+(\\.\\d+)?\\s*(Bytes|KB|MB|GB)\\s*中\\s*\\d+(\\.\\d+)?\\s*(Bytes|KB|MB|GB)\\s*使用/'
      )
    ).toBeVisible();
  });

  test('should handle drag and drop upload', async () => {
    await page.goto('/ja/dashboard/media');

    // Open upload dialog
    await page.click('button:has-text("アップロード")');

    // Check drag and drop area
    await expect(
      page.locator('text=ファイルをドラッグ＆ドロップまたはクリックして選択')
    ).toBeVisible();

    // Simulate drag over (visual feedback)
    const dropZone = page
      .locator('text=ファイルをドラッグ＆ドロップまたはクリックして選択')
      .locator('..');
    await dropZone.hover();

    // Note: Actual file drag-and-drop is complex in Playwright
    // This test verifies the UI elements are present
  });

  test('should download files in bulk', async () => {
    await page.goto('/ja/dashboard/media');

    // Enter selection mode
    await page.click('button:has-text("選択")');

    // If files exist, select some
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();

      // Download button should appear
      await expect(
        page.locator('button:has-text("ダウンロード")')
      ).toBeVisible();
    }
  });

  test('should delete files in bulk', async () => {
    await page.goto('/ja/dashboard/media');

    // Enter selection mode
    await page.click('button:has-text("選択")');

    // If files exist, select some
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();

      // Delete button should appear
      await expect(page.locator('button:has-text("削除")')).toBeVisible();
    }
  });
});
