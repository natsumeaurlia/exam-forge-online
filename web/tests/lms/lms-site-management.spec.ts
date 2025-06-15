import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('🎓 LMS Site Management', () => {
  let testUser: any;
  let testTeam: any;

  test.beforeEach(async () => {
    // Create test user and team
    testUser = await prisma.user.create({
      data: {
        email: `lms-test-${Date.now()}@example.com`,
        name: 'LMS Test User',
      },
    });

    testTeam = await prisma.team.create({
      data: {
        name: 'LMS Test Team',
        slug: `lms-test-team-${Date.now()}`,
        creator: { connect: { id: testUser.id } },
        members: {
          create: {
            userId: testUser.id,
            role: 'OWNER',
          },
        },
      },
    });
  });

  test.afterEach(async () => {
    // Cleanup test data
    await prisma.lMSSite.deleteMany({
      where: { teamId: testTeam.id },
    });
    await prisma.teamMember.deleteMany({
      where: { teamId: testTeam.id },
    });
    await prisma.team.delete({
      where: { id: testTeam.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  test('LMSサイト作成から公開まで完全フロー', async ({ page }) => {
    // Login simulation (assuming auth is set up)
    await page.goto('/ja/auth/signin');

    // Navigate to LMS dashboard
    await page.goto('/ja/dashboard/lms');

    // Verify LMS page loads
    await expect(page.locator('h1')).toContainText('LMS');

    // Create new LMS site
    await page.click('button:has-text("サイトを作成")');

    // Fill basic information
    const siteName = `Test LMS Site ${Date.now()}`;
    await page.fill('input[name="name"]', siteName);
    await page.fill('input[name="slug"]', `test-lms-${Date.now()}`);
    await page.fill(
      'textarea[name="description"]',
      'Test LMS site description'
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Verify site creation success
    await expect(page.locator('text=サイトが作成されました')).toBeVisible();

    // Verify site appears in list
    await expect(page.locator(`text=${siteName}`)).toBeVisible();
  });

  test('LMSサイト設定とカスタマイズ', async ({ page }) => {
    // Create test site first
    const testSite = await prisma.lMSSite.create({
      data: {
        name: 'Test Site for Settings',
        slug: `test-site-${Date.now()}`,
        teamId: testTeam.id,
        isPublished: false,
      },
    });

    await page.goto('/ja/dashboard/lms');

    // Click on site settings
    await page.click(`[data-testid="site-${testSite.id}-settings"]`);

    // Advanced settings tab
    await page.click('button:has-text("高度な設定")');

    // Configure subdomain
    await page.check('input[name="useSubdomain"]');
    await page.fill('input[name="subdomain"]', `custom-${Date.now()}`);

    // Save settings
    await page.click('button:has-text("保存")');

    // Verify subdomain preview
    await expect(
      page.locator('code').filter({ hasText: '.examforge.com' })
    ).toBeVisible();

    // Cleanup
    await prisma.lMSSite.delete({ where: { id: testSite.id } });
  });

  test('LMSコース作成と管理', async ({ page }) => {
    // Create test site
    const testSite = await prisma.lMSSite.create({
      data: {
        name: 'Course Test Site',
        slug: `course-site-${Date.now()}`,
        teamId: testTeam.id,
        isPublished: true,
      },
    });

    await page.goto(`/ja/lms/${testSite.slug}/admin`);

    // Navigate to courses
    await page.click('a:has-text("コース")');

    // Create new course
    await page.click('button:has-text("新規コース")');

    const courseName = `Test Course ${Date.now()}`;
    await page.fill('input[name="title"]', courseName);
    await page.fill('textarea[name="description"]', 'Test course description');

    // Set course settings
    await page.check('input[name="isPublic"]');
    await page.fill('input[name="price"]', '1000');

    // Create course
    await page.click('button[type="submit"]');

    // Verify course creation
    await expect(page.locator(`text=${courseName}`)).toBeVisible();

    // Add lesson to course
    await page.click(
      `[data-testid="course-${courseName.replace(' ', '-').toLowerCase()}-lessons"]`
    );
    await page.click('button:has-text("新規レッスン")');

    await page.fill('input[name="title"]', 'Lesson 1: Introduction');
    await page.fill(
      'textarea[name="content"]',
      'This is the first lesson content.'
    );

    // Save lesson
    await page.click('button:has-text("保存")');

    // Verify lesson appears
    await expect(page.locator('text=Lesson 1: Introduction')).toBeVisible();

    // Cleanup
    await prisma.lMSSite.delete({ where: { id: testSite.id } });
  });

  test('LMS学習者登録と進捗追跡', async ({ page }) => {
    // Create test site with course
    const testSite = await prisma.lMSSite.create({
      data: {
        name: 'Student Test Site',
        slug: `student-site-${Date.now()}`,
        teamId: testTeam.id,
        isPublished: true,
        courses: {
          create: {
            title: 'Test Course for Students',
            description: 'Course for testing student enrollment',
            isPublic: true,
            price: 0,
            lessons: {
              create: [
                {
                  title: 'Introduction Lesson',
                  content: 'Welcome to the course',
                  order: 1,
                },
                {
                  title: 'Advanced Lesson',
                  content: 'Advanced content here',
                  order: 2,
                },
              ],
            },
          },
        },
      },
      include: {
        courses: {
          include: {
            lessons: true,
          },
        },
      },
    });

    // Access LMS site as student
    await page.goto(`/lms/${testSite.slug}`);

    // Student registration
    await page.click('button:has-text("受講登録")');

    await page.fill('input[name="name"]', 'Test Student');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    // Enroll in course
    await page.click('button:has-text("コースに登録")');

    // Start first lesson
    await page.click('text=Introduction Lesson');

    // Mark lesson as complete
    await page.click('button:has-text("完了にする")');

    // Verify progress
    await expect(page.locator('text=進捗: 50%')).toBeVisible();

    // Start second lesson
    await page.click('text=Advanced Lesson');
    await page.click('button:has-text("完了にする")');

    // Verify course completion
    await expect(page.locator('text=コース完了')).toBeVisible();
    await expect(page.locator('text=進捗: 100%')).toBeVisible();

    // Cleanup
    await prisma.lMSSite.delete({
      where: { id: testSite.id },
      include: {
        courses: {
          include: {
            lessons: true,
            enrollments: true,
          },
        },
        users: true,
      },
    });
  });

  test('LMS分析とレポート機能', async ({ page }) => {
    // Create test site with sample data
    const testSite = await prisma.lMSSite.create({
      data: {
        name: 'Analytics Test Site',
        slug: `analytics-site-${Date.now()}`,
        teamId: testTeam.id,
        isPublished: true,
      },
    });

    // Navigate to LMS analytics
    await page.goto(`/ja/lms/${testSite.slug}/admin/analytics`);

    // Verify analytics dashboard
    await expect(page.locator('h2:has-text("サイト統計")')).toBeVisible();

    // Check key metrics
    await expect(page.locator('text=登録者数')).toBeVisible();
    await expect(page.locator('text=コース数')).toBeVisible();
    await expect(page.locator('text=完了率')).toBeVisible();

    // Test date range filter
    await page.click('button:has-text("期間を選択")');
    await page.click('text=過去30日');

    // Verify charts load
    await expect(
      page.locator('[data-testid="enrollment-chart"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();

    // Export report
    await page.click('button:has-text("レポート出力")');
    await page.click('text=CSV形式');

    // Verify download starts (we won't actually download in test)
    await expect(page.locator('text=ダウンロード準備中')).toBeVisible();

    // Cleanup
    await prisma.lMSSite.delete({ where: { id: testSite.id } });
  });

  test('マルチテナントLMS隔離性テスト', async ({ page }) => {
    // Create two separate LMS sites
    const site1 = await prisma.lMSSite.create({
      data: {
        name: 'Site 1',
        slug: 'site-1-test',
        teamId: testTeam.id,
        isPublished: true,
      },
    });

    const otherTeam = await prisma.team.create({
      data: {
        name: 'Other Team',
        slug: 'other-team-test',
        creator: { connect: { id: testUser.id } },
      },
    });

    const site2 = await prisma.lMSSite.create({
      data: {
        name: 'Site 2',
        slug: 'site-2-test',
        teamId: otherTeam.id,
        isPublished: true,
      },
    });

    // Access site 1 and verify isolation
    await page.goto(`/lms/${site1.slug}`);
    await expect(page.locator('text=Site 1')).toBeVisible();
    await expect(page.locator('text=Site 2')).not.toBeVisible();

    // Access site 2 and verify isolation
    await page.goto(`/lms/${site2.slug}`);
    await expect(page.locator('text=Site 2')).toBeVisible();
    await expect(page.locator('text=Site 1')).not.toBeVisible();

    // Try to access site 2's admin from site 1 context (should fail)
    await page.goto(`/ja/lms/${site2.slug}/admin`);
    await expect(
      page.locator('text=アクセス権限がありません').or(page.locator('text=404'))
    ).toBeVisible();

    // Cleanup
    await prisma.lMSSite.deleteMany({
      where: { id: { in: [site1.id, site2.id] } },
    });
    await prisma.team.delete({ where: { id: otherTeam.id } });
  });
});
