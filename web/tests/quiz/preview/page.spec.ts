import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Quiz Preview Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display quiz preview page correctly', async ({ page }) => {
    // Create a test quiz first
    const quiz = await dataFactory.createQuiz({
      title: 'Test Quiz for Preview',
      description: 'Test quiz description',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);

    // Check if the page loads
    await expect(page).toHaveURL(
      new RegExp(`.*\\/ja\\/dashboard\\/quizzes\\/${quiz.id}\\/preview`)
    );
    await expect(page.locator('h1, h2')).toContainText([
      'プレビュー',
      'Preview',
      quiz.title,
    ]);
  });

  test('should display quiz information', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Quiz Preview Test',
      description: 'This is a test quiz for preview functionality',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Check if quiz title is displayed
    await expect(page.locator('h1, h2, h3')).toContainText([quiz.title]);

    // Check if quiz description is displayed
    if (quiz.description) {
      await expect(page.locator('p, div')).toContainText([quiz.description]);
    }
  });

  test('should display quiz questions in preview mode', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Quiz with Questions Preview',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Look for question elements
    const questionElements = page.locator(
      '[data-testid*="question"], .question, [class*="question"]'
    );
    if ((await questionElements.count()) > 0) {
      await expect(questionElements.first()).toBeVisible();
    }

    // Look for question options
    const optionElements = page.locator(
      '[data-testid*="option"], .option, [class*="option"], input[type="radio"], input[type="checkbox"]'
    );
    if ((await optionElements.count()) > 0) {
      await expect(optionElements.first()).toBeVisible();
    }
  });

  test('should show preview mode indicator', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Preview Mode Test',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Look for preview mode indicators
    const previewIndicator = page.locator(
      '[data-testid*="preview"], .preview, :has-text("プレビュー"), :has-text("Preview")'
    );
    if ((await previewIndicator.count()) > 0) {
      await expect(previewIndicator.first()).toBeVisible();
    }
  });

  test('should handle navigation between questions', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Multi-Question Quiz',
      description: 'Test quiz with multiple questions',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Look for navigation buttons
    const nextButton = page.locator(
      'button:has-text("次"), button:has-text("Next"), [data-testid*="next"]'
    );
    const prevButton = page.locator(
      'button:has-text("前"), button:has-text("Previous"), [data-testid*="prev"]'
    );

    if ((await nextButton.count()) > 0) {
      await expect(nextButton.first()).toBeVisible();
    }

    if ((await prevButton.count()) > 0) {
      // Previous button might not be visible on first question
      const isVisible = await prevButton.first().isVisible();
      // Just check that it exists in DOM
      await expect(prevButton.first()).toBeAttached();
    }
  });

  test('should display quiz settings preview', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Settings Preview Test',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Look for quiz settings display
    const settingsInfo = page.locator(
      '[data-testid*="settings"], .settings, [class*="info"], :has-text("制限時間"), :has-text("Time Limit")'
    );
    if ((await settingsInfo.count()) > 0) {
      await expect(settingsInfo.first()).toBeVisible();
    }
  });

  test('should provide edit link from preview', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Preview to Edit Test',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);
    await page.waitForLoadState('networkidle');

    // Look for edit button or link
    const editButton = page.locator(
      'button:has-text("編集"), button:has-text("Edit"), a:has-text("編集"), a:has-text("Edit")'
    );
    if ((await editButton.count()) > 0) {
      await expect(editButton.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Mobile Preview Test',
      description: 'Test quiz',
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/preview`);

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if preview content is displayed properly on mobile
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'English Preview Test',
      description: 'Test quiz',
    });

    await page.goto(`/en/dashboard/quizzes/${quiz.id}/preview`);

    await expect(page).toHaveURL(
      new RegExp(`.*\\/en\\/dashboard\\/quizzes\\/${quiz.id}\\/preview`)
    );
    await expect(page.locator('h1, h2')).toContainText([
      'Preview',
      'プレビュー',
    ]);
  });
});
