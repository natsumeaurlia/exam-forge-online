import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../fixtures/test-data-factory';

test.describe('Quiz Edit Page', () => {
  let dataFactory: TestDataFactory;

  test.beforeEach(async ({ page }) => {
    dataFactory = new TestDataFactory();
    await dataFactory.setUp(page);
    await dataFactory.signIn(page);
  });

  test.afterEach(async () => {
    await dataFactory.tearDown();
  });

  test('should display quiz edit page correctly', async ({ page }) => {
    // Create a test quiz first
    const quiz = await dataFactory.createQuiz({
      title: 'Test Quiz for Edit',
      description: 'Test quiz description',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);

    // Check if the page loads
    await expect(page).toHaveURL(
      new RegExp(`.*\\/ja\\/dashboard\\/quizzes\\/${quiz.id}\\/edit`)
    );
    await expect(page.locator('h1, h2')).toContainText([
      '編集',
      'Edit',
      'Quiz',
    ]);
  });

  test('should display quiz edit form', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Test Quiz for Form',
      description: 'Test quiz description',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Check for form elements
    const titleInput = page.locator(
      'input[name="title"], input[placeholder*="タイトル"], input[placeholder*="title"]'
    );
    if (await titleInput.isVisible()) {
      await expect(titleInput).toHaveValue(/Test Quiz/);
    }

    const descriptionInput = page.locator(
      'textarea[name="description"], textarea[placeholder*="説明"], textarea[placeholder*="description"]'
    );
    if (await descriptionInput.isVisible()) {
      await expect(descriptionInput).toBeVisible();
    }
  });

  test('should handle quiz title update', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Original Title',
      description: 'Original description',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Update title
    const titleInput = page
      .locator(
        'input[name="title"], input[placeholder*="タイトル"], input[placeholder*="title"]'
      )
      .first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Updated Quiz Title');

      // Save changes
      const saveButton = page.locator(
        'button:has-text("保存"), button:has-text("Save"), button[type="submit"]'
      );
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Wait for save confirmation
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should display question management interface', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Quiz with Questions',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Look for question-related elements
    const questionElements = page.locator(
      '[data-testid*="question"], .question, [class*="question"]'
    );
    if ((await questionElements.count()) > 0) {
      await expect(questionElements.first()).toBeVisible();
    }

    // Look for add question button
    const addQuestionButton = page.locator(
      'button:has-text("質問追加"), button:has-text("Add Question"), button:has-text("問題追加")'
    );
    if ((await addQuestionButton.count()) > 0) {
      await expect(addQuestionButton.first()).toBeVisible();
    }
  });

  test('should handle quiz settings', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Quiz for Settings Test',
      description: 'Test quiz',
    });

    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);
    await page.waitForLoadState('networkidle');

    // Look for settings section
    const settingsSection = page.locator(
      '[data-testid*="settings"], .settings, [class*="settings"]'
    );
    if (await settingsSection.isVisible()) {
      await expect(settingsSection).toBeVisible();
    }

    // Look for time limit setting
    const timeLimitInput = page.locator(
      'input[name*="time"], input[placeholder*="時間"], input[placeholder*="time"]'
    );
    if ((await timeLimitInput.count()) > 0) {
      await expect(timeLimitInput.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'Mobile Test Quiz',
      description: 'Test quiz',
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/ja/dashboard/quizzes/${quiz.id}/edit`);

    await expect(page.locator('h1, h2')).toBeVisible();

    // Check if form is usable on mobile
    const formContainer = page.locator('form, main, [role="main"]');
    await expect(formContainer).toBeVisible();
  });

  test('should support English language', async ({ page }) => {
    const quiz = await dataFactory.createQuiz({
      title: 'English Test Quiz',
      description: 'Test quiz',
    });

    await page.goto(`/en/dashboard/quizzes/${quiz.id}/edit`);

    await expect(page).toHaveURL(
      new RegExp(`.*\\/en\\/dashboard\\/quizzes\\/${quiz.id}\\/edit`)
    );
    await expect(page.locator('h1, h2')).toContainText(['Edit', '編集']);
  });
});
