import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('📊 Integration: Analytics Dashboard Flow', () => {
  let testTeam: any;
  let testQuiz: any;

  test.beforeEach(async () => {
    // テストデータ準備
    const testUser = await prisma.user.create({
      data: {
        email: 'analytics-test@example.com',
        name: 'Analytics Test User',
      },
    });

    testTeam = await prisma.team.create({
      data: {
        name: 'Analytics Test Team',
        slug: 'analytics-test-team',
        creator: { connect: { id: testUser.id } },
      },
    });

    testQuiz = await prisma.quiz.create({
      data: {
        title: 'Analytics Test Quiz',
        description: 'テスト用分析クイズ',
        teamId: testTeam.id,
        createdById: testUser.id,
        status: 'PUBLISHED',
        sharingMode: 'URL',
        questions: {
          create: [
            {
              text: '分析テスト質問1',
              type: 'MULTIPLE_CHOICE',
              points: 10,
              order: 1,
              options: {
                create: [
                  { text: '正解選択肢', order: 1, isCorrect: true },
                  { text: '不正解選択肢A', order: 2, isCorrect: false },
                  { text: '不正解選択肢B', order: 3, isCorrect: false },
                ],
              },
            },
            {
              text: '分析テスト質問2',
              type: 'TRUE_FALSE',
              points: 5,
              order: 2,
              correctAnswer: 'true',
            },
          ],
        },
      },
    });

    // テスト回答データを作成
    const responses = [];
    for (let i = 0; i < 25; i++) {
      const score = Math.floor(Math.random() * 16); // 0-15点
      responses.push({
        quizId: testQuiz.id,
        score: score,
        totalPoints: 15, // 合計点数
        isPassed: score >= 10, // 10点以上で合格
        timeTaken: 120 + Math.floor(Math.random() * 300), // 2-7分
        participantName: `テスト参加者${i + 1}`,
        participantEmail: `test-participant-${i + 1}@example.com`,
        completedAt: new Date(),
      });
    }

    await prisma.quizResponse.createMany({ data: responses });
  });

  test('ダッシュボード→クイズ詳細→分析画面の統合フロー', async ({ page }) => {
    // === 1. ダッシュボードでの統計概要確認 ===
    await page.goto('/ja/dashboard');

    // 基本統計の表示確認
    await expect(page.locator('[data-testid="total-quizzes"]')).toContainText(
      '1'
    );
    await expect(
      page.locator('[data-testid="monthly-participants"]')
    ).toContainText('25');

    // 平均スコア表示（0-100%範囲）
    const avgScoreElement = page.locator('[data-testid="average-score"]');
    await expect(avgScoreElement).toBeVisible();

    // 最近のアクティビティ表示
    await expect(
      page.locator('[data-testid="recent-activities"]')
    ).toBeVisible();
    await expect(page.locator('text=Analytics Test Quiz')).toBeVisible();

    // === 2. クイズ一覧からクイズ詳細へ ===
    await page.click('nav a[href*="quizzes"]');
    await expect(page.locator('h1:has-text("クイズ管理")')).toBeVisible();

    // クイズカードの統計確認
    const quizCard = page.locator(`[data-testid="quiz-card-${testQuiz.id}"]`);
    await expect(
      quizCard.locator('[data-testid="response-count"]')
    ).toContainText('25');
    await expect(
      quizCard.locator('[data-testid="average-score"]')
    ).toBeVisible();

    // クイズ詳細ページへ
    await quizCard.click();

    // === 3. クイズ詳細ページの分析サマリー ===
    await expect(
      page.locator('h1:has-text("Analytics Test Quiz")')
    ).toBeVisible();

    // クイック統計の確認
    await expect(
      page.locator('[data-testid="quiz-total-responses"]')
    ).toContainText('25');
    await expect(page.locator('[data-testid="quiz-avg-score"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="quiz-completion-rate"]')
    ).toBeVisible();

    // === 4. 詳細分析ページへの遷移 ===
    await page.click('a[href*="analytics"]');
    await expect(page.locator('h1:has-text("分析レポート")')).toBeVisible();

    // === 5. 分析ダッシュボードの包括的確認 ===

    // 概要統計セクション
    const overviewSection = page.locator('[data-testid="analytics-overview"]');
    await expect(overviewSection.locator('text=総回答数')).toBeVisible();
    await expect(overviewSection.locator('text=25')).toBeVisible();
    await expect(overviewSection.locator('text=平均所要時間')).toBeVisible();

    // スコア分布チャート
    await expect(
      page.locator('[data-testid="score-distribution-chart"]')
    ).toBeVisible();
    await expect(page.locator('text=スコア分布')).toBeVisible();

    // 質問別正解率
    const questionAnalysis = page.locator('[data-testid="question-analysis"]');
    await expect(questionAnalysis.locator('text=質問別正解率')).toBeVisible();
    await expect(
      questionAnalysis.locator('text=分析テスト質問1')
    ).toBeVisible();
    await expect(
      questionAnalysis.locator('text=分析テスト質問2')
    ).toBeVisible();

    // 時系列データ
    await expect(
      page.locator('[data-testid="time-series-chart"]')
    ).toBeVisible();
    await expect(page.locator('text=回答数推移')).toBeVisible();

    // === 6. フィルタリング機能の確認 ===

    // 期間フィルター
    await page.click('[data-testid="date-range-filter"]');
    await page.click('text=過去7日間');

    // フィルター適用後のデータ更新確認
    await expect(
      page.locator('[data-testid="filtered-results"]')
    ).toBeVisible();

    // スコア範囲フィルター
    await page.click('[data-testid="score-range-filter"]');
    await page.fill('input[name="minScore"]', '10');
    await page.fill('input[name="maxScore"]', '15');
    await page.click('button:has-text("適用")');

    // === 7. 詳細回答データの確認 ===
    await page.click('tab:has-text("詳細データ")');

    // 回答一覧テーブル
    const responseTable = page.locator('[data-testid="response-table"]');
    await expect(responseTable).toBeVisible();
    await expect(
      responseTable.locator('th:has-text("参加者名")')
    ).toBeVisible();
    await expect(responseTable.locator('th:has-text("スコア")')).toBeVisible();
    await expect(
      responseTable.locator('th:has-text("所要時間")')
    ).toBeVisible();

    // ページネーション確認
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

    // === 8. エクスポート機能の確認 ===
    await page.click('button[data-testid="export-data"]');

    // エクスポートオプション
    await expect(page.locator('text=CSV形式でダウンロード')).toBeVisible();
    await expect(page.locator('text=PDF形式でダウンロード')).toBeVisible();

    // CSVエクスポート実行
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("CSV形式でダウンロード")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    // === 9. リアルタイム更新の確認 ===

    // 新しい回答を模擬的に追加（別タブで回答）
    const responseContext = await page.context().newPage();
    await responseContext.goto(`/quiz/${testQuiz.id}`);

    // 簡単な回答フロー
    await responseContext.fill('input[id="name"]', '新規参加者');
    await responseContext.fill('input[id="email"]', 'new@example.com');
    await responseContext.click('button:has-text("クイズを開始")');
    await responseContext.click('label:has-text("正解選択肢")');
    await responseContext.click('button:has-text("次へ")');
    await responseContext.click('label:has-text("正しい")');
    await responseContext.click('button:has-text("提出")');

    // 元の分析ページでリアルタイム更新確認
    await page.click('button[data-testid="refresh-analytics"]');
    await expect(page.locator('text=26')).toBeVisible(); // 回答数が増加

    await responseContext.close();
  });

  test('モバイル対応: レスポンシブ分析ダッシュボード', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`/ja/dashboard/quizzes/${testQuiz.id}/analytics`);

    // === 1. モバイルレイアウトの確認 ===

    // コンパクトな統計表示
    const mobileStats = page.locator('[data-testid="mobile-stats"]');
    await expect(mobileStats).toBeVisible();

    // スワイプ可能なチャート
    const chartContainer = page.locator(
      '[data-testid="mobile-chart-container"]'
    );
    await expect(chartContainer).toBeVisible();

    // === 2. タッチインタラクション ===

    // タブ切り替え
    await page.tap('text=詳細データ');
    await expect(page.locator('[data-testid="mobile-table"]')).toBeVisible();

    // フィルターメニュー（ハンバーガー）
    await page.tap('[data-testid="mobile-filter-menu"]');
    await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();

    // === 3. タブレットサイズでの確認 ===
    await page.setViewportSize({ width: 768, height: 1024 });

    // タブレット向けレイアウト
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // サイドバー表示
    await expect(
      page.locator('[data-testid="analytics-sidebar"]')
    ).toBeVisible();
  });

  test('分析データの精度とパフォーマンス検証', async ({ page }) => {
    await page.goto(`/ja/dashboard/quizzes/${testQuiz.id}/analytics`);

    // === 1. データ精度の確認 ===

    // 計算された統計の検証
    const totalResponses = await page
      .locator('[data-testid="total-responses"]')
      .textContent();
    expect(parseInt(totalResponses!)).toBe(25);

    // 平均スコアの妥当性確認（0-100%範囲）
    const avgScoreText = await page
      .locator('[data-testid="average-score"]')
      .textContent();
    const avgScore = parseFloat(avgScoreText!.replace('%', ''));
    expect(avgScore).toBeGreaterThanOrEqual(0);
    expect(avgScore).toBeLessThanOrEqual(100);

    // === 2. パフォーマンス測定 ===

    const startTime = Date.now();

    // 大量データでのフィルタリング
    await page.click('[data-testid="date-range-filter"]');
    await page.click('text=全期間');

    const filterTime = Date.now() - startTime;
    expect(filterTime).toBeLessThan(3000); // 3秒以内

    // チャート描画時間
    const chartStartTime = Date.now();
    await page.click('tab:has-text("詳細チャート")');
    await page.waitForSelector('[data-testid="complex-chart"]');
    const chartTime = Date.now() - chartStartTime;
    expect(chartTime).toBeLessThan(5000); // 5秒以内

    // === 3. エラーハンドリング ===

    // 無効なフィルター値
    await page.fill('input[name="minScore"]', '150'); // 無効値
    await page.click('button:has-text("適用")');
    await expect(page.locator('text=無効な値です')).toBeVisible();

    // ネットワークエラー模擬
    await page.route('**/api/analytics/**', route => route.abort());
    await page.click('button[data-testid="refresh-analytics"]');
    await expect(
      page.locator('text=データの読み込みに失敗しました')
    ).toBeVisible();
  });

  test.afterEach(async () => {
    // テストデータクリーンアップ
    await prisma.quizResponse.deleteMany({
      where: { quizId: testQuiz.id },
    });
    await prisma.quiz.delete({ where: { id: testQuiz.id } });
    await prisma.team.delete({ where: { id: testTeam.id } });
  });
});
