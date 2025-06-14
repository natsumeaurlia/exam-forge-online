import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('🚨 Critical Path: Complete User Journey', () => {
  test('完全なユーザーフロー: 登録→チーム作成→クイズ作成→公開→回答→分析', async ({
    page,
  }) => {
    // テスト用データ
    const timestamp = Date.now();
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
    };
    const teamName = `Test Team ${timestamp}`;
    const quizTitle = `Test Quiz ${timestamp}`;

    // === 1. 新規登録フロー ===
    await page.goto('/ja/auth/signup');

    // 登録フォームの入力
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');

    // 登録実行
    await page.click('button[type="submit"]');

    // ダッシュボードへのリダイレクト確認
    await page.waitForURL('**/dashboard');
    await expect(page.locator(`text=${testUser.name}`)).toBeVisible();

    // === 2. チーム作成フロー ===
    // 初回ユーザーには自動でチームが作成されるか、またはチーム作成を促される
    // チーム設定ページへ移動（存在する場合）
    const teamSettingsLink = page.locator('a[href*="settings"]');
    if (await teamSettingsLink.isVisible()) {
      await teamSettingsLink.click();

      // チーム名を確認・更新
      const teamNameInput = page.locator('input[name="teamName"]');
      if (await teamNameInput.isVisible()) {
        await teamNameInput.clear();
        await teamNameInput.fill(teamName);
        await page.click('button:has-text("保存")');
      }
    }

    // === 3. クイズ作成フロー ===
    // クイズ一覧ページへ移動
    await page.goto('/ja/dashboard/quizzes');
    await expect(page.locator('h1:has-text("クイズ管理")')).toBeVisible();

    // 新規クイズ作成
    await page.click('button:has-text("新規作成")');

    // クイズエディターでの基本設定
    await page.fill('input[name="title"]', quizTitle);
    await page.fill('textarea[name="description"]', 'テスト用のクイズです');

    // 質問1: 選択式問題
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-MULTIPLE_CHOICE"]');

    await page.fill(
      'input[placeholder="質問文を入力"]',
      'TypeScriptはJavaScriptのスーパーセットですか？'
    );
    await page.fill('input[placeholder="選択肢1"]', 'はい');
    await page.fill('input[placeholder="選択肢2"]', 'いいえ');

    // 正解設定
    await page.click('input[name="correct-0"]'); // 1番目の選択肢を正解に

    // 質問2: 真偽問題
    await page.click('button[data-testid="add-question"]');
    await page.click('[data-testid="question-type-TRUE_FALSE"]');

    await page.fill(
      'input[placeholder="質問文を入力"]',
      'Next.js 15はApp Routerを使用していますか？'
    );
    await page.click('label:has-text("正しい")'); // 正解を設定

    // クイズ保存
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=保存しました')).toBeVisible();

    // === 4. クイズ公開フロー ===
    // 公開設定
    await page.click('button[data-testid="publish-settings"]');

    // URLでの共有を選択
    await page.click('input[value="URL"]');
    await page.check('input[name="collectParticipantInfo"]');
    await page.check('input[name="showCorrectAnswers"]');

    // 公開実行
    await page.click('button:has-text("公開")');
    await expect(page.locator('text=公開しました')).toBeVisible();

    // 公開URLを取得
    const shareUrl = page.locator('[data-testid="share-url"]');
    await expect(shareUrl).toBeVisible();
    const quizUrl = await shareUrl.textContent();

    // === 5. 匿名ユーザーでのクイズ回答フロー ===
    // 新しいコンテキストで匿名ユーザーとしてアクセス
    const anonymousPage = await page.context().newPage();

    // 公開クイズへアクセス
    if (quizUrl) {
      await anonymousPage.goto(quizUrl);
    } else {
      // URLが取得できない場合はクイズIDから直接アクセス
      await anonymousPage.goto(`/quiz/test-quiz-${timestamp}`);
    }

    // 参加者情報入力
    await anonymousPage.fill('input[id="name"]', '匿名参加者');
    await anonymousPage.fill('input[id="email"]', 'participant@example.com');

    // クイズ開始
    await anonymousPage.click('button:has-text("クイズを開始")');

    // 質問1に回答
    await expect(
      anonymousPage.locator(
        'text=TypeScriptはJavaScriptのスーパーセットですか？'
      )
    ).toBeVisible();
    await anonymousPage.click('label:has-text("はい")');
    await anonymousPage.click('button:has-text("次へ")');

    // 質問2に回答
    await expect(
      anonymousPage.locator('text=Next.js 15はApp Routerを使用していますか？')
    ).toBeVisible();
    await anonymousPage.click('label:has-text("正しい")');
    await anonymousPage.click('button:has-text("提出")');

    // 結果画面の確認
    await expect(anonymousPage.locator('text=100%')).toBeVisible();
    await expect(anonymousPage.locator('text=2/2')).toBeVisible();

    // === 6. 分析画面での結果確認 ===
    // 元のページに戻り、分析画面へ
    await page.bringToFront();
    await page.click('a[href*="analytics"]');

    // 分析データの確認
    await expect(page.locator('text=回答者数')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // 1人の回答者
    await expect(page.locator('text=平均スコア')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible(); // 平均100%

    // 回答詳細の確認
    const responseDetails = page.locator('[data-testid="response-details"]');
    if (await responseDetails.isVisible()) {
      await expect(responseDetails.locator('text=匿名参加者')).toBeVisible();
    }

    // 質問別統計の確認
    await expect(page.locator('text=質問別統計')).toBeVisible();
    await expect(page.locator('text=正解率: 100%')).toBeVisible();

    // === 検証完了 ===
    console.log('✅ Complete user journey test passed successfully');
  });

  test('エラーハンドリング: 不正なクイズアクセス', async ({ page }) => {
    // 存在しないクイズIDでアクセス
    await page.goto('/quiz/non-existent-quiz-id');

    // 404エラーページまたはエラーメッセージの確認
    await expect(
      page.locator('text=404').or(page.locator('text=クイズが見つかりません'))
    ).toBeVisible();
  });

  test('セキュリティ: 未公開クイズへの不正アクセス', async ({ page }) => {
    // DBに未公開のテストクイズを作成
    const team = await prisma.team.create({
      data: {
        name: 'Security Test Team',
        slug: 'security-test-team',
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: 'Private Quiz',
        teamId: team.id,
        status: 'DRAFT', // 未公開
        sharingMode: 'NONE',
      },
    });

    // 未公開クイズに直接アクセス
    await page.goto(`/quiz/${quiz.id}`);

    // アクセス拒否の確認
    await expect(
      page.locator('text=404').or(page.locator('text=アクセスできません'))
    ).toBeVisible();

    // クリーンアップ
    await prisma.quiz.delete({ where: { id: quiz.id } });
    await prisma.team.delete({ where: { id: team.id } });
  });
});

// テスト後のクリーンアップ
test.afterEach(async () => {
  // テストデータの削除
  await prisma.quizResponse.deleteMany({
    where: {
      participantEmail: 'participant@example.com',
    },
  });

  await prisma.quiz.deleteMany({
    where: {
      title: { contains: 'Test Quiz' },
    },
  });

  await prisma.team.deleteMany({
    where: {
      name: { contains: 'Test Team' },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { contains: `test-${Date.now()}@example.com` },
    },
  });
});
