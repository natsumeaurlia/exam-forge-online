import { test, expect } from '@playwright/test';

test.describe.skip('Quiz Taking', () => {
  // Sample public quiz ID (you'll need to replace with actual ID)
  const publicQuizId = 'test-quiz-id';

  test('should display quiz start screen', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);

    // Should show quiz title and info
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/問/)).toBeVisible();

    // Should have start button
    const startButton = page.getByRole('button', { name: 'クイズを開始' });
    await expect(startButton).toBeVisible();
  });

  test('should require password for protected quiz', async ({ page }) => {
    // Navigate to password-protected quiz
    await page.goto(`/ja/quiz/${publicQuizId}/take`);

    // Check if password field exists
    const passwordField = page.locator('input[type="password"]');
    if (await passwordField.isVisible()) {
      // Try incorrect password
      await passwordField.fill('wrong-password');
      await page.getByRole('button', { name: 'クイズを開始' }).click();

      // Should show error
      await expect(
        page.getByText('パスワードが正しくありません')
      ).toBeVisible();
    }
  });

  test('should collect participant info when required', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);

    // Check if participant info fields exist
    const nameField = page.locator('input[id="name"]');
    if (await nameField.isVisible()) {
      // Fill participant info
      await nameField.fill('Test User');
      await page.locator('input[id="email"]').fill('test@example.com');
    }

    await page.getByRole('button', { name: 'クイズを開始' }).click();
  });

  test('should navigate through questions', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);
    await page.getByRole('button', { name: 'クイズを開始' }).click();

    // Wait for question to load
    await page
      .waitForSelector('[class*="question"]', { timeout: 5000 })
      .catch(() => {});

    // Check navigation buttons
    const previousButton = page.getByRole('button', { name: '前へ' });
    const nextButton = page.getByRole('button', { name: '次へ' });

    // First question should have disabled previous button
    await expect(previousButton).toBeDisabled();

    // Answer question if visible
    const radioButton = page.locator('input[type="radio"]').first();
    if (await radioButton.isVisible()) {
      await radioButton.click();
    }

    // Go to next question
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test('should display progress bar', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);
    await page.getByRole('button', { name: 'クイズを開始' }).click();

    // Check progress indicator
    const progressBar = page.locator('[role="progressbar"]');
    if (await progressBar.isVisible()) {
      await expect(progressBar).toHaveAttribute('aria-valuenow');
    }

    // Check question counter
    await expect(page.getByText(/質問.*\//).first()).toBeVisible();
  });

  test('should handle different question types', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);
    await page.getByRole('button', { name: 'クイズを開始' }).click();

    // Multiple choice
    const radioButton = page.locator('input[type="radio"]').first();
    if (await radioButton.isVisible()) {
      await radioButton.click();
      await expect(radioButton).toBeChecked();
    }

    // Checkbox (multiple selection)
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
      await expect(checkbox).toBeChecked();
    }

    // Text input
    const textInput = page.locator('textarea').first();
    if (await textInput.isVisible()) {
      await textInput.fill('Test answer');
      await expect(textInput).toHaveValue('Test answer');
    }

    // Number input
    const numberInput = page.locator('input[type="number"]').first();
    if (await numberInput.isVisible()) {
      await numberInput.fill('42');
      await expect(numberInput).toHaveValue('42');
    }
  });

  test('should show time limit countdown', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);

    // Check if time limit is displayed
    const timeLimit = page.getByText(/制限時間.*分/);
    if (await timeLimit.isVisible()) {
      await page.getByRole('button', { name: 'クイズを開始' }).click();

      // Should show remaining time
      await expect(page.getByText(/残り時間/)).toBeVisible();
    }
  });

  test('should submit quiz and show results', async ({ page }) => {
    await page.goto(`/ja/quiz/${publicQuizId}/take`);
    await page.getByRole('button', { name: 'クイズを開始' }).click();

    // Answer all questions (simplified - just click through)
    let hasNext = true;
    while (hasNext) {
      // Answer current question
      const radioButton = page.locator('input[type="radio"]').first();
      if (await radioButton.isVisible()) {
        await radioButton.click();
      }

      // Check if next button exists and is enabled
      const nextButton = page.getByRole('button', { name: '次へ' });
      const submitButton = page.getByRole('button', { name: '提出' });

      if (await submitButton.isVisible()) {
        await submitButton.click();
        hasNext = false;
      } else if (
        (await nextButton.isVisible()) &&
        (await nextButton.isEnabled())
      ) {
        await nextButton.click();
      } else {
        hasNext = false;
      }
    }

    // Should show results
    await expect(page.getByText('クイズ完了！')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/問正解/)).toBeVisible();
  });

  test('should show pass/fail status', async ({ page }) => {
    // Complete quiz and check results
    await page.goto(`/ja/quiz/${publicQuizId}/take`);
    await page.getByRole('button', { name: 'クイズを開始' }).click();

    // Quick submit (would normally answer questions)
    const submitButton = page.getByRole('button', { name: '提出' });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Check for pass/fail indicator
    const passedText = page.getByText('合格');
    const failedText = page.getByText('不合格');

    await expect(passedText.or(failedText)).toBeVisible({ timeout: 10000 });
  });
});
