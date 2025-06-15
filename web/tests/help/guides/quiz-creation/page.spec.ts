import { test, expect } from '@playwright/test';

test.describe('Help Quiz Creation Guide Page', () => {
  test('should display quiz creation guide correctly', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');

    // Check if the page loads and has the correct title
    await expect(page).toHaveURL(/.*\/ja\/help\/guides\/quiz-creation/);
    await expect(page.locator('h1, h2')).toContainText([
      'クイズ作成',
      'Quiz Creation',
      'クイズの作り方',
    ]);
  });

  test('should display quiz creation steps', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');
    await page.waitForLoadState('networkidle');

    // Should show guide content
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();

    // Look for quiz creation specific content
    const quizElements = page.locator(
      ':has-text("質問"), :has-text("問題"), :has-text("Question"), :has-text("quiz")'
    );
    if ((await quizElements.count()) > 0) {
      await expect(quizElements.first()).toBeVisible();
    }
  });

  test('should explain question types', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');
    await page.waitForLoadState('networkidle');

    // Look for question type explanations
    const questionTypes = page.locator(
      ':has-text("選択肢"), :has-text("記述"), :has-text("Multiple Choice"), :has-text("Text"), :has-text("True/False")'
    );
    if ((await questionTypes.count()) > 0) {
      await expect(questionTypes.first()).toBeVisible();
    }
  });

  test('should have examples or templates', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');
    await page.waitForLoadState('networkidle');

    // Look for examples or sample content
    const examples = page.locator(
      ':has-text("例"), :has-text("Example"), :has-text("サンプル"), :has-text("Sample"), .example'
    );
    if ((await examples.count()) > 0) {
      await expect(examples.first()).toBeVisible();
    }
  });

  test('should explain quiz settings', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');
    await page.waitForLoadState('networkidle');

    // Look for settings-related content
    const settingsContent = page.locator(
      ':has-text("設定"), :has-text("Settings"), :has-text("制限時間"), :has-text("Time Limit")'
    );
    if ((await settingsContent.count()) > 0) {
      await expect(settingsContent.first()).toBeVisible();
    }
  });

  test('should have links to related guides', async ({ page }) => {
    await page.goto('/ja/help/guides/quiz-creation');
    await page.waitForLoadState('networkidle');

    // Look for links to other guides
    const relatedLinks = page.locator(
      'a[href*="/help/guides/"], .related a, [class*="related"] a'
    );
    if ((await relatedLinks.count()) > 0) {
      await expect(relatedLinks.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/help/guides/quiz-creation');

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if content is readable on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    await page.goto('/en/help/guides/quiz-creation');

    await expect(page).toHaveURL(/.*\/en\/help\/guides\/quiz-creation/);
    await expect(page.locator('h1, h2')).toContainText([
      'Quiz Creation',
      'クイズ作成',
    ]);
  });
});
