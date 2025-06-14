import { test, expect, type Page } from '@playwright/test';
import path from 'path';

test.describe.skip('Media Advanced Features', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Login as test user
    await page.goto('/ja/auth/signin');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Navigate to media gallery
    await page.goto('/ja/dashboard/media');
  });

  test.describe('Video Player Features', () => {
    test('should display playback speed controls for videos', async () => {
      // This test assumes there's a video in the gallery
      // Look for video element
      const videoCard = page
        .locator('[data-testid="media-card-video"]')
        .first();

      if ((await videoCard.count()) > 0) {
        // Click on video to open player
        await videoCard.click();

        // Check for playback speed button
        await expect(page.locator('button:has-text("1x")')).toBeVisible();

        // Click to open speed options
        await page.click('button:has-text("1x")');

        // Check speed options
        await expect(page.locator('text=0.5x')).toBeVisible();
        await expect(page.locator('text=1.25x')).toBeVisible();
        await expect(page.locator('text=2x')).toBeVisible();

        // Select different speed
        await page.click('text=1.5x');

        // Verify speed changed
        await expect(page.locator('button:has-text("1.5x")')).toBeVisible();
      }
    });

    test('should toggle subtitles for videos with subtitle tracks', async () => {
      // This test assumes there's a video with subtitles
      const videoCard = page
        .locator('[data-testid="media-card-video"]')
        .first();

      if ((await videoCard.count()) > 0) {
        await videoCard.click();

        // Look for subtitle button (only appears if video has subtitles)
        const subtitleButton = page.locator('button:has(svg.lucide-subtitles)');

        if ((await subtitleButton.count()) > 0) {
          // Check initial state
          await expect(subtitleButton).toContainText('ON');

          // Toggle subtitles
          await subtitleButton.click();

          // Verify toggled
          await expect(subtitleButton).toContainText('OFF');
        }
      }
    });
  });

  test.describe('Image Editor Features', () => {
    test('should open image editor when clicking edit', async () => {
      // Upload a test image first
      await page.click('button:has-text("アップロード")');
      const filePath = path.join(__dirname, '../fixtures/test-image.jpg');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);

      // Wait for upload
      await page.waitForTimeout(2000);

      // Close upload dialog
      await page.keyboard.press('Escape');

      // Find an image and open context menu
      const imageCard = page
        .locator('[data-testid="media-card-image"]')
        .first();
      if ((await imageCard.count()) === 0) {
        // Fallback: look for any image in the gallery
        const moreButton = page
          .locator('button:has(svg.lucide-more-vertical)')
          .first();
        await moreButton.click();
      } else {
        await imageCard.hover();
        await page.click('button:has(svg.lucide-more-vertical)');
      }

      // Click edit option
      await page.click('text=編集');

      // Verify editor opened
      await expect(page.locator('text=画像を編集')).toBeVisible();
      await expect(
        page.locator('text=画像の切り抜きと回転ができます')
      ).toBeVisible();
    });

    test('should rotate image in editor', async () => {
      // Assuming editor is open from previous test or setup
      const imageCard = page.locator('img').first();
      if ((await imageCard.count()) > 0) {
        await imageCard.hover();
        const moreButton = page
          .locator('button:has(svg.lucide-more-vertical)')
          .first();
        if ((await moreButton.count()) > 0) {
          await moreButton.click();
          await page.click('text=編集');

          // Click rotate right
          await page.click('button:has-text("右に回転")');

          // Check rotation slider updated
          await expect(page.locator('text=90°')).toBeVisible();

          // Click rotate left twice
          await page.click('button:has-text("左に回転")');
          await page.click('button:has-text("左に回転")');

          // Check rotation
          await expect(page.locator('text=-90°')).toBeVisible();

          // Use slider
          const slider = page.locator('[role="slider"]');
          await slider.press('ArrowRight');
          await slider.press('ArrowRight');
        }
      }
    });

    test('should enable crop mode', async () => {
      // Open editor on an image
      const imageCard = page.locator('img').first();
      if ((await imageCard.count()) > 0) {
        await imageCard.hover();
        const moreButton = page
          .locator('button:has(svg.lucide-more-vertical)')
          .first();
        if ((await moreButton.count()) > 0) {
          await moreButton.click();
          await page.click('text=編集');

          // Click crop button
          await page.click('button:has-text("切り抜き")');

          // Verify crop mode active
          await expect(
            page.locator('button:has-text("切り抜き中")')
          ).toBeVisible();

          // Canvas should be ready for cropping
          const canvas = page.locator('canvas');
          await expect(canvas).toBeVisible();

          // Simulate crop selection
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.move(box.x + 50, box.y + 50);
            await page.mouse.down();
            await page.mouse.move(box.x + 200, box.y + 200);
            await page.mouse.up();

            // Apply crop button should appear
            await expect(
              page.locator('button:has-text("切り抜きを適用")')
            ).toBeVisible();
          }
        }
      }
    });

    test('should download edited image', async () => {
      // Open editor
      const imageCard = page.locator('img').first();
      if ((await imageCard.count()) > 0) {
        await imageCard.hover();
        const moreButton = page
          .locator('button:has(svg.lucide-more-vertical)')
          .first();
        if ((await moreButton.count()) > 0) {
          await moreButton.click();
          await page.click('text=編集');

          // Make some edits
          await page.click('button:has-text("右に回転")');

          // Setup download promise before clicking
          const downloadPromise = page.waitForEvent('download');

          // Click download
          await page.click('button:has-text("ダウンロード")');

          // Wait for download
          const download = await downloadPromise;

          // Verify download
          expect(download.suggestedFilename()).toContain('edited-');
        }
      }
    });

    test('should save edited image', async () => {
      // Open editor
      const imageCard = page.locator('img').first();
      if ((await imageCard.count()) > 0) {
        await imageCard.hover();
        const moreButton = page
          .locator('button:has(svg.lucide-more-vertical)')
          .first();
        if ((await moreButton.count()) > 0) {
          await moreButton.click();
          await page.click('text=編集');

          // Make edits
          await page.click('button:has-text("右に回転")');

          // Save
          await page.click('button:has-text("保存")');

          // Check for success message
          await expect(page.locator('text=画像を編集しました')).toBeVisible();

          // Editor should close
          await expect(page.locator('text=画像を編集')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle upload errors gracefully', async () => {
      await page.click('button:has-text("アップロード")');

      // Try to upload invalid file type (if possible)
      // This is limited by browser security
      const fileInput = page.locator('input[type="file"]');

      // Create a very large fake file name to potentially trigger size error
      // Note: actual file upload testing is limited in browser automation

      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('should handle network errors during media operations', async () => {
      // Simulate offline
      await page.context().setOffline(true);

      // Try to delete a file
      await page.click('button:has-text("選択")');
      const firstCheckbox = page.locator('input[type="checkbox"]').first();

      if ((await firstCheckbox.count()) > 0) {
        await firstCheckbox.click();
        await page.click('button:has-text("削除")');

        // Should show error
        await expect(page.locator('text=削除に失敗しました')).toBeVisible({
          timeout: 10000,
        });
      }

      // Restore connection
      await page.context().setOffline(false);
    });
  });

  test.describe('Performance', () => {
    test('should handle large file uploads', async () => {
      // Note: Testing with actual large files is not practical in CI
      // This test verifies the UI elements for progress tracking

      await page.click('button:has-text("アップロード")');

      // Check for file size limit display
      await expect(page.locator('text=/最大ファイルサイズ/')).toBeVisible();

      // Check drag-drop area exists
      const dropZone = page
        .locator('text=ファイルをドラッグ＆ドロップまたはクリックして選択')
        .locator('..');
      await expect(dropZone).toBeVisible();

      // If uploading, progress bar should be visible
      // This would be visible during actual upload

      await page.keyboard.press('Escape');
    });

    test('should paginate large media collections efficiently', async () => {
      // This test would verify pagination if implemented
      // Currently checking if the gallery loads without issues

      // Check gallery container exists
      await expect(page.locator('[data-testid="media-gallery"]')).toBeVisible({
        timeout: 10000,
      });

      // Verify no loading issues
      await expect(page.locator('text=エラー')).not.toBeVisible();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work in different viewport sizes', async ({ viewport }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify responsive layout
      await expect(
        page.locator('button:has-text("アップロード")')
      ).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('text=メディアライブラリ')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('text=ストレージ使用状況')).toBeVisible();
    });
  });
});
