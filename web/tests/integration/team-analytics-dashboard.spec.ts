import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

test.describe('Team Analytics Dashboard', () => {
  let userId: string;
  let teamId: string;
  let quizId: string;

  test.beforeEach(async ({ page }) => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User Analytics',
        email: `analytics-test-${Date.now()}@example.com`,
        emailVerified: new Date(),
      },
    });
    userId = user.id;

    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Analytics Test Team',
        slug: `analytics-team-${Date.now()}`,
        creator: {
          connect: { id: userId },
        },
        members: {
          create: {
            userId: userId,
            role: 'OWNER',
          },
        },
      },
    });
    teamId = team.id;

    // Create test quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Test Analytics Quiz',
        description: 'Quiz for analytics testing',
        status: 'PUBLISHED',
        teamId: teamId,
        createdById: userId,
        passingScore: 80,
        questions: {
          create: [
            {
              type: 'MULTIPLE_CHOICE',
              text: 'What is 2+2?',
              points: 10,
              order: 1,
              options: {
                create: [
                  { text: '3', isCorrect: false, order: 1 },
                  { text: '4', isCorrect: true, order: 2 },
                  { text: '5', isCorrect: false, order: 3 },
                ],
              },
            },
            {
              type: 'TRUE_FALSE',
              text: 'The sky is blue',
              points: 10,
              order: 2,
              options: {
                create: [
                  { text: 'True', isCorrect: true, order: 1 },
                  { text: 'False', isCorrect: false, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    quizId = quiz.id;

    // Create test responses
    const responses = [
      {
        quizId: quizId,
        participantName: 'Alice Johnson',
        participantEmail: 'alice@example.com',
        score: 18,
        totalPoints: 20,
        isPassed: true,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 300000), // 5 min later
        answers: JSON.stringify([
          { questionId: 'q1', selectedOptions: ['4'] },
          { questionId: 'q2', selectedOptions: ['True'] },
        ]),
      },
      {
        quizId: quizId,
        participantName: 'Bob Smith',
        participantEmail: 'bob@example.com',
        score: 10,
        totalPoints: 20,
        isPassed: false,
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 420000), // 7 min later
        answers: JSON.stringify([
          { questionId: 'q1', selectedOptions: ['3'] },
          { questionId: 'q2', selectedOptions: ['True'] },
        ]),
      },
      {
        quizId: quizId,
        participantName: 'Carol Davis',
        participantEmail: 'carol@example.com',
        score: 20,
        totalPoints: 20,
        isPassed: true,
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 180000), // 3 min later
        answers: JSON.stringify([
          { questionId: 'q1', selectedOptions: ['4'] },
          { questionId: 'q2', selectedOptions: ['True'] },
        ]),
      },
    ];

    await prisma.quizResponse.createMany({ data: responses });

    // Mock authentication
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: userId,
            name: 'Test User Analytics',
            email: `analytics-test-${Date.now()}@example.com`,
          },
        }),
      });
    });
  });

  test.afterEach(async () => {
    // Clean up test data
    await prisma.quizResponse.deleteMany({ where: { quizId } });
    await prisma.question.deleteMany({ where: { quizId } });
    await prisma.quiz.delete({ where: { id: quizId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.team.delete({ where: { id: teamId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  test('should display team analytics dashboard', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Check if page loads correctly
    await expect(page.locator('h1')).toContainText('チーム全体分析');
    await expect(
      page.locator('text=チーム全体のクイズ統計と詳細分析')
    ).toBeVisible();

    // Check analytics header with filters
    await expect(page.locator('select')).toBeVisible(); // Range selector
    await expect(page.locator('button:has-text("エクスポート")')).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check overview statistics cards
    await expect(page.locator('text=総クイズ数')).toBeVisible();
    await expect(page.locator('text=総参加者数')).toBeVisible();
    await expect(page.locator('text=総回答数')).toBeVisible();
    await expect(page.locator('text=平均スコア')).toBeVisible();
    await expect(page.locator('text=全体合格率')).toBeVisible();
    await expect(page.locator('text=総問題数')).toBeVisible();

    // The actual values should be visible (not just loading states)
    await expect(page.locator('text=1')).toBeVisible(); // 1 quiz
    await expect(page.locator('text=3')).toBeVisible(); // 3 responses
    await expect(page.locator('text=2')).toBeVisible(); // 2 questions
  });

  test('should display analytics charts', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Wait for charts to load
    await page.waitForTimeout(3000);

    // Check trends section
    await expect(page.locator('h2:has-text("トレンドと洞察")')).toBeVisible();

    // Check chart controls
    await expect(page.locator('button:has-text("日次")')).toBeVisible();
    await expect(page.locator('button:has-text("週次")')).toBeVisible();
    await expect(page.locator('button:has-text("月次")')).toBeVisible();

    // Check chart containers (recharts creates SVG elements)
    await expect(page.locator('svg')).toBeVisible();

    // Test switching intervals
    await page.click('button:has-text("週次")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("週次")')).toHaveClass(
      /default/
    );

    await page.click('button:has-text("月次")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("月次")')).toHaveClass(
      /default/
    );
  });

  test('should display quiz rankings', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Wait for rankings to load
    await page.waitForTimeout(2000);

    // Check rankings section
    await expect(page.locator('h2:has-text("クイズランキング")')).toBeVisible();

    // Check ranking tabs
    await expect(page.locator('button:has-text("人気クイズ")')).toBeVisible();
    await expect(page.locator('button:has-text("高得点クイズ")')).toBeVisible();
    await expect(
      page.locator('button:has-text("難易度の高いクイズ")')
    ).toBeVisible();

    // Check top performers section
    await expect(
      page.locator('h3:has-text("トップパフォーマー")').first()
    ).toBeVisible();

    // Test switching ranking types
    await page.click('button:has-text("高得点クイズ")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("高得点クイズ")')).toHaveClass(
      /default/
    );

    await page.click('button:has-text("難易度の高いクイズ")');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('button:has-text("難易度の高いクイズ")')
    ).toHaveClass(/default/);
  });

  test('should handle date range filtering', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Test different date ranges
    const ranges = ['過去7日', '過去30日', '過去90日', '全期間'];

    for (const range of ranges) {
      await page.selectOption('select', { label: range });
      await page.waitForTimeout(2000);

      // Verify the page reloaded with new data
      await expect(page.locator('h1')).toContainText('チーム全体分析');

      // Check that URL contains the range parameter
      const url = page.url();
      if (range === '過去7日') {
        expect(url).toContain('range=7d');
      } else if (range === '過去30日') {
        expect(url).toContain('range=30d');
      } else if (range === '過去90日') {
        expect(url).toContain('range=90d');
      } else if (range === '全期間') {
        expect(url).toContain('range=all');
      }
    }
  });

  test('should show export functionality', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check export button exists
    const exportButton = page.locator('button:has-text("エクスポート")');
    await expect(exportButton).toBeVisible();

    // Click export (will show "Pro plan required" message for free plan)
    await exportButton.click();

    // Should show toast message about Pro plan requirement
    await expect(
      page.locator('text=エクスポート機能にはプロプランが必要です')
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/ja/dashboard/analytics');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check back to dashboard link
    const backLink = page.locator('a:has-text("ダッシュボードに戻る")');
    await expect(backLink).toBeVisible();

    // Click back link
    await backLink.click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/ja\/dashboard$/);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/analytics/team**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/ja/dashboard/analytics');

    // Should show error message
    await expect(page.locator('text=エラーが発生しました')).toBeVisible();
    await expect(
      page.locator('text=分析データの取得に失敗しました')
    ).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/ja/dashboard/analytics');
    await page.waitForTimeout(2000);

    // Check that content is visible and properly arranged on mobile
    await expect(page.locator('h1')).toContainText('チーム全体分析');

    // Statistics cards should stack vertically on mobile
    const statsCards = page.locator('[class*="grid"]').first();
    await expect(statsCards).toBeVisible();

    // Export button should be visible
    await expect(page.locator('button:has-text("エクスポート")')).toBeVisible();

    // Charts should be responsive
    await expect(page.locator('svg')).toBeVisible();
  });
});
