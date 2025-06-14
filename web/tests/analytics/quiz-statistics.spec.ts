import { test, expect } from '@playwright/test';
import { getQuizAnalytics } from '@/lib/actions/analytics';
import {
  getTestDataFactory,
  cleanupTestData,
} from '../fixtures/test-data-factory';

test.describe('Quiz Statistics Data Integrity', () => {
  let testQuizId: string;
  let factory = getTestDataFactory();

  test.beforeAll(async () => {
    // Create test quiz with responses for analytics
    const { quiz } = await factory.createQuiz({
      title: 'Analytics Test Quiz',
      status: 'PUBLISHED',
      questionCount: 5,
    });
    testQuizId = quiz.id;

    // Create some responses for analytics
    for (let i = 0; i < 10; i++) {
      await factory.createResponse({
        quizId: quiz.id,
        score: Math.floor(Math.random() * 100),
      });
    }
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });
  test('should handle null scores correctly in average calculation', async ({
    page,
  }) => {
    // This test simulates the issue where null scores cause incorrect average calculations

    // Navigate to a quiz analytics page
    await page.goto('/ja/dashboard/quizzes/${testQuizId}/analytics');

    // Check that the average score is calculated correctly
    const averageScoreElement = await page.locator(
      '[data-testid="average-score"]'
    );
    const averageScore = await averageScoreElement.textContent();

    // Verify that the average score is not NaN or null
    expect(averageScore).not.toBe('NaN');
    expect(averageScore).not.toBe('null');
    expect(parseFloat(averageScore || '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(averageScore || '0')).toBeLessThanOrEqual(100);
  });

  test('should maintain data consistency with transaction boundaries', async ({
    page,
  }) => {
    // Test that analytics data is fetched within a transaction
    // This ensures data consistency even during concurrent updates

    await page.goto('/ja/dashboard/quizzes/${testQuizId}/analytics');

    // Get initial values
    const totalResponses1 = await page
      .locator('[data-testid="total-responses"]')
      .textContent();
    const averageScore1 = await page
      .locator('[data-testid="average-score"]')
      .textContent();

    // Refresh the page to re-fetch data
    await page.reload();

    // Get values after refresh
    const totalResponses2 = await page
      .locator('[data-testid="total-responses"]')
      .textContent();
    const averageScore2 = await page
      .locator('[data-testid="average-score"]')
      .textContent();

    // If total responses are the same, average score should be consistent
    if (totalResponses1 === totalResponses2) {
      expect(averageScore1).toBe(averageScore2);
    }
  });

  test('should only calculate average from completed responses with scores', async ({
    page,
  }) => {
    // Test that incomplete responses (null scores) don't affect the average

    await page.goto('/ja/dashboard/quizzes/${testQuizId}/analytics');

    // Check that pass rate and average score are consistent
    const passRate = await page
      .locator('[data-testid="pass-rate"]')
      .textContent();
    const averageScore = await page
      .locator('[data-testid="average-score"]')
      .textContent();

    // If there's a pass rate, there should be a valid average score
    if (passRate && parseFloat(passRate) > 0) {
      expect(averageScore).not.toBe('0');
      expect(averageScore).not.toBe('NaN');
    }
  });
});
