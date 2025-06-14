import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('🔄 Integration: Team-Quiz Workflow', () => {
  test.beforeEach(async () => {
    // テストデータクリーンアップ
    await prisma.quizResponse.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration-test' } },
    });
  });

  test('チーム作成→メンバー招待→共同クイズ作成→権限管理', async ({ page }) => {
    const timestamp = Date.now();
    const ownerData = {
      name: `Team Owner ${timestamp}`,
      email: `owner-${timestamp}@integration-test.com`,
      password: 'TestPassword123!',
    };

    // === 1. チームオーナーの登録とログイン ===
    await page.goto('/ja/auth/signup');
    await page.fill('input[name="name"]', ownerData.name);
    await page.fill('input[name="email"]', ownerData.email);
    await page.fill('input[name="password"]', ownerData.password);
    await page.fill('input[name="confirmPassword"]', ownerData.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');

    // === 2. チーム設定とメンバー管理 ===
    // チーム設定ページへ移動
    await page.goto('/ja/dashboard/settings');

    // チーム名設定
    const teamName = `Integration Test Team ${timestamp}`;
    await page.fill('input[name="teamName"]', teamName);
    await page.click('button:has-text("保存")');

    // メンバー招待セクション
    const memberEmail = `member-${timestamp}@integration-test.com`;
    await page.fill('input[name="inviteEmail"]', memberEmail);
    await page.selectOption('select[name="role"]', 'ADMIN');
    await page.click('button:has-text("招待")');

    await expect(page.locator(`text=${memberEmail}`)).toBeVisible();
    await expect(page.locator('text=ADMIN')).toBeVisible();

    // === 3. 共同クイズ作成フロー ===
    await page.goto('/ja/dashboard/quizzes');
    await page.click('button:has-text("新規作成")');

    const quizTitle = `Team Collaboration Quiz ${timestamp}`;
    await page.fill('input[name="title"]', quizTitle);
    await page.fill('textarea[name="description"]', 'チーム共同作成クイズ');

    // チーム共同編集設定
    await page.check('input[name="allowTeamEdit"]');

    // 複数の質問を作成
    for (let i = 1; i <= 3; i++) {
      await page.click('button[data-testid="add-question"]');
      await page.click('[data-testid="question-type-MULTIPLE_CHOICE"]');
      await page.fill('input[placeholder="質問文を入力"]', `チーム質問 ${i}`);
      await page.fill('input[placeholder="選択肢1"]', `選択肢A-${i}`);
      await page.fill('input[placeholder="選択肢2"]', `選択肢B-${i}`);
      await page.click('input[name="correct-0"]');
    }

    await page.click('button:has-text("保存")');

    // === 4. 権限管理テスト ===
    // 編集履歴の確認
    await page.click('button[data-testid="edit-history"]');
    await expect(page.locator(`text=${ownerData.name}`)).toBeVisible();
    await expect(page.locator('text=作成')).toBeVisible();

    // 共有設定での権限確認
    await page.click('button[data-testid="share-settings"]');
    await expect(page.locator('text=チームメンバーのみ')).toBeVisible();
    await expect(page.locator('text=編集可能')).toBeVisible();

    // === 5. 分析権限の確認 ===
    await page.goto('/ja/dashboard/quizzes');
    await page.locator(`text=${quizTitle}`).click();

    await page.click('a[href*="analytics"]');
    await expect(page.locator('text=アクセス権限')).toBeVisible();
    await expect(page.locator('text=チーム全体')).toBeVisible();
  });

  test('プランアップグレード→機能制限解除フロー', async ({ page }) => {
    // === 1. フリープランユーザーでログイン ===
    const userData = {
      email: 'free-user@integration-test.com',
      password: 'TestPassword123!',
    };

    // フリープランユーザーを事前作成
    await prisma.user.create({
      data: {
        name: 'Free Plan User',
        email: userData.email,
        hashedPassword: 'hashed-password', // 実際のハッシュ化は省略
        teams: {
          create: {
            team: {
              create: {
                name: 'Free Team',
                slug: 'free-team',
                plan: 'FREE',
              },
            },
            role: 'OWNER',
          },
        },
      },
    });

    await page.goto('/ja/auth/signin');
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="password"]', userData.password);
    await page.click('button[type="submit"]');

    // === 2. フリープラン制限の確認 ===
    await page.goto('/ja/dashboard/quizzes');

    // クイズ作成制限
    const createButton = page.locator('button:has-text("新規作成")');
    await createButton.click();

    // Pro機能の制限表示
    await expect(page.locator('text=Proプランが必要')).toBeVisible();
    await expect(page.locator('text=アップグレード')).toBeVisible();

    // === 3. プランアップグレードフロー ===
    await page.click('button:has-text("アップグレード")');
    await page.waitForURL('**/plans');

    // プラン比較表示の確認
    await expect(page.locator('text=無料プラン')).toBeVisible();
    await expect(page.locator('text=Proプラン')).toBeVisible();
    await expect(page.locator('text=¥2,980')).toBeVisible();

    // Pro機能リストの確認
    await expect(page.locator('text=無制限のクイズ作成')).toBeVisible();
    await expect(page.locator('text=チーム機能')).toBeVisible();
    await expect(page.locator('text=詳細分析')).toBeVisible();

    // === 4. 模擬決済フロー ===
    await page.click('button:has-text("Proプランを選択")');

    // Stripe Checkoutリダイレクト確認（実際の決済は行わない）
    await expect(page).toHaveURL(/stripe|checkout/);
  });

  test('多言語対応: 日英切り替えでの機能一貫性', async ({ page }) => {
    // === 1. 日本語でクイズ作成 ===
    await page.goto('/ja/dashboard/quizzes/new');

    const quizData = {
      title: 'マルチ言語テストクイズ',
      description: 'このクイズは日本語で作成されました',
    };

    await page.fill('input[name="title"]', quizData.title);
    await page.fill('textarea[name="description"]', quizData.description);

    // 日本語での質問作成
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-TRUE_FALSE"]');
    await page.fill(
      'input[placeholder="質問文を入力"]',
      'これは日本語の質問ですか？'
    );
    await page.click('label:has-text("正しい")');

    await page.click('button:has-text("保存")');

    // === 2. 英語に切り替えて編集継続 ===
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=English');
    await page.waitForURL('/en/**');

    // 英語UIでの表示確認
    await expect(page.locator('text=Quiz Editor')).toBeVisible();
    await expect(page.locator('text=Save')).toBeVisible();

    // データが保持されていることを確認
    await expect(page.locator(`text=${quizData.title}`)).toBeVisible();

    // 英語で追加質問作成
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-MULTIPLE_CHOICE"]');
    await page.fill(
      'input[placeholder="Enter question text"]',
      'Is this an English question?'
    );
    await page.fill('input[placeholder="Option 1"]', 'Yes');
    await page.fill('input[placeholder="Option 2"]', 'No');
    await page.click('input[name="correct-0"]');

    await page.click('button:has-text("Save")');

    // === 3. プレビューでの多言語表示確認 ===
    await page.click('button[data-testid="preview"]');

    // 混在コンテンツの表示確認
    await expect(page.locator('text=これは日本語の質問ですか？')).toBeVisible();
    await expect(
      page.locator('text=Is this an English question?')
    ).toBeVisible();

    // === 4. 日本語に戻して確認 ===
    await page.click('[data-testid="language-switcher"]');
    await page.click('text=日本語');
    await page.waitForURL('/ja/**');

    // 日本語UIでデータ保持確認
    await expect(page.locator('text=クイズエディター')).toBeVisible();
    await expect(page.locator(`text=${quizData.title}`)).toBeVisible();
  });

  test('メディアアップロード→エディター統合→プレビュー表示', async ({
    page,
  }) => {
    await page.goto('/ja/dashboard/quizzes/new');

    // === 1. 基本クイズ設定 ===
    const quizTitle = `Media Integration Quiz ${Date.now()}`;
    await page.fill('input[name="title"]', quizTitle);

    // === 2. 画像付き質問の作成 ===
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-MULTIPLE_CHOICE"]');
    await page.fill(
      'input[placeholder="質問文を入力"]',
      'この画像に写っているものは何ですか？'
    );

    // 画像アップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      '/Users/takahashimotoki/product/exam-forge-4/web/tests/fixtures/test-image.jpg'
    );

    // アップロード完了待機
    await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible();

    // 選択肢入力
    await page.fill('input[placeholder="選択肢1"]', '猫');
    await page.fill('input[placeholder="選択肢2"]', '犬');
    await page.fill('input[placeholder="選択肢3"]', '鳥');
    await page.click('input[name="correct-0"]');

    // === 3. 動画付き質問の作成 ===
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-SHORT_ANSWER"]');
    await page.fill(
      'input[placeholder="質問文を入力"]',
      'この動画の内容を説明してください'
    );

    // 動画URL入力
    await page.fill(
      'input[name="videoUrl"]',
      'https://example.com/test-video.mp4'
    );
    await page.click('button:has-text("動画を追加")');

    await page.click('button:has-text("保存")');

    // === 4. メディアギャラリーでの管理確認 ===
    await page.goto('/ja/dashboard/media');

    // アップロードした画像の確認
    await expect(page.locator('[data-testid="media-item"]')).toBeVisible();
    await expect(page.locator('text=test-image.jpg')).toBeVisible();

    // メディア詳細表示
    await page.click('[data-testid="media-item"]');
    await expect(page.locator('[data-testid="media-details"]')).toBeVisible();
    await expect(page.locator('text=使用中のクイズ')).toBeVisible();
    await expect(page.locator(`text=${quizTitle}`)).toBeVisible();

    // === 5. プレビューでのメディア表示確認 ===
    await page.goto('/ja/dashboard/quizzes');
    await page.locator(`text=${quizTitle}`).click();
    await page.click('button[data-testid="preview"]');

    // 画像付き質問の表示確認
    await expect(page.locator('img[src*="test-image"]')).toBeVisible();
    await expect(
      page.locator('text=この画像に写っているものは何ですか？')
    ).toBeVisible();

    // 動画付き質問への移動
    await page.click('button:has-text("次へ")');
    await expect(page.locator('video')).toBeVisible();
    await expect(
      page.locator('text=この動画の内容を説明してください')
    ).toBeVisible();
  });
});

test.afterEach(async () => {
  // テストデータクリーンアップ
  await prisma.quizResponse.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { contains: 'integration-test' } },
  });
});
