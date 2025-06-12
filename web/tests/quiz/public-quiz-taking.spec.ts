import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

// Helper function to create a public quiz
async function createPublicQuiz(
  sharingMode: 'URL' | 'PASSWORD',
  password?: string
) {
  const team = await prisma.team.create({
    data: {
      name: 'Test Team',
      slug: 'test-team',
    },
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: 'Public Quiz Test',
      description: 'A test quiz for public access',
      teamId: team.id,
      status: 'PUBLISHED',
      sharingMode,
      password,
      collectParticipantInfo: true,
      showCorrectAnswers: true,
      questions: {
        create: [
          {
            text: 'What is 2 + 2?',
            type: 'MULTIPLE_CHOICE',
            points: 10,
            order: 1,
            required: true,
            options: {
              create: [
                { text: '3', order: 1, isCorrect: false },
                { text: '4', order: 2, isCorrect: true },
                { text: '5', order: 3, isCorrect: false },
              ],
            },
          },
          {
            text: 'Is TypeScript a superset of JavaScript?',
            type: 'TRUE_FALSE',
            points: 5,
            order: 2,
            required: true,
            correctAnswer: 'true',
          },
        ],
      },
    },
  });

  return { quiz, team };
}

test.describe('Public Quiz Taking', () => {
  test('should allow anonymous users to access public quiz with URL sharing', async ({
    page,
  }) => {
    const { quiz } = await createPublicQuiz('URL');

    // Navigate to public quiz
    await page.goto(`/quiz/${quiz.id}`);

    // Should see quiz start screen
    await expect(page.getByText(quiz.title)).toBeVisible();
    await expect(page.getByText(quiz.description!)).toBeVisible();

    // Enter participant info
    await page.fill('input[id="name"]', 'Test User');
    await page.fill('input[id="email"]', 'test@example.com');

    // Start quiz
    await page.click('button:has-text("クイズを開始")');

    // Answer first question
    await expect(page.getByText('What is 2 + 2?')).toBeVisible();
    await page.click('label:has-text("4")');
    await page.click('button:has-text("次へ")');

    // Answer second question
    await expect(
      page.getByText('Is TypeScript a superset of JavaScript?')
    ).toBeVisible();
    await page.click('label:has-text("正しい")');
    await page.click('button:has-text("提出")');

    // Should see results
    await expect(page.getByText('100%')).toBeVisible();
    await expect(page.getByText('15/15')).toBeVisible();
  });

  test('should require password for password-protected quiz', async ({
    page,
  }) => {
    const { quiz } = await createPublicQuiz('PASSWORD', 'secret123');

    // Navigate to public quiz
    await page.goto(`/quiz/${quiz.id}`);

    // Should see password screen
    await expect(page.getByText('パスワードが必要です')).toBeVisible();

    // Try wrong password
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("続行")');
    await expect(page.getByText('パスワードが間違っています')).toBeVisible();

    // Enter correct password
    await page.fill('input[type="password"]', 'secret123');
    await page.click('button:has-text("続行")');

    // Should now see quiz start screen
    await expect(page.getByText(quiz.title)).toBeVisible();
  });

  test('should block access to non-public quiz', async ({ page }) => {
    const team = await prisma.team.create({
      data: {
        name: 'Private Team',
        slug: 'private-team',
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: 'Private Quiz',
        teamId: team.id,
        status: 'PUBLISHED',
        sharingMode: 'NONE', // Not public
      },
    });

    // Navigate to quiz
    await page.goto(`/quiz/${quiz.id}`);

    // Should show 404 page
    await expect(page.getByText('404')).toBeVisible();
  });

  test('should enforce rate limiting on submissions', async ({ page }) => {
    const { quiz } = await createPublicQuiz('URL');

    // Create 10 previous submissions to trigger rate limit
    for (let i = 0; i < 10; i++) {
      await prisma.quizResponse.create({
        data: {
          quizId: quiz.id,
          score: 10,
          duration: 60,
          participantName: `User ${i}`,
          participantEmail: `user${i}@example.com`,
        },
      });
    }

    // Navigate to public quiz
    await page.goto(`/quiz/${quiz.id}`);

    // Start quiz
    await page.fill('input[id="name"]', 'Rate Limited User');
    await page.fill('input[id="email"]', 'ratelimited@example.com');
    await page.click('button:has-text("クイズを開始")');

    // Answer questions quickly
    await page.click('label:has-text("4")');
    await page.click('button:has-text("次へ")');
    await page.click('label:has-text("正しい")');
    await page.click('button:has-text("提出")');

    // Should see rate limit error
    await expect(page.getByText('送信エラー')).toBeVisible();
  });

  test('should handle quiz with various question types', async ({ page }) => {
    const team = await prisma.team.create({
      data: {
        name: 'Complex Quiz Team',
        slug: 'complex-quiz-team',
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: 'Complex Public Quiz',
        teamId: team.id,
        status: 'PUBLISHED',
        sharingMode: 'URL',
        showCorrectAnswers: true,
        questions: {
          create: [
            {
              text: 'Short answer question',
              type: 'SHORT_ANSWER',
              points: 5,
              order: 1,
              correctAnswer: 'test answer',
            },
            {
              text: 'Enter a number',
              type: 'NUMERIC',
              points: 5,
              order: 2,
              correctAnswer: '42',
              tolerance: '0.1',
            },
            {
              text: 'Select all that apply',
              type: 'CHECKBOX',
              points: 10,
              order: 3,
              options: {
                create: [
                  { text: 'Option A', order: 1, isCorrect: true },
                  { text: 'Option B', order: 2, isCorrect: false },
                  { text: 'Option C', order: 3, isCorrect: true },
                ],
              },
            },
          ],
        },
      },
    });

    await page.goto(`/quiz/${quiz.id}`);
    await page.click('button:has-text("クイズを開始")');

    // Answer short answer
    await page.fill('input[placeholder="回答を入力"]', 'test answer');
    await page.click('button:has-text("次へ")');

    // Answer numeric
    await page.fill('input[type="number"]', '42');
    await page.click('button:has-text("次へ")');

    // Answer checkbox
    await page.check('label:has-text("Option A")');
    await page.check('label:has-text("Option C")');
    await page.click('button:has-text("提出")');

    // Should see perfect score
    await expect(page.getByText('100%')).toBeVisible();
  });
});

// Clean up after tests
test.afterEach(async () => {
  // Clean up test data
  await prisma.rateLimitEntry.deleteMany();
  await prisma.quizResponse.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.team.deleteMany();
});
