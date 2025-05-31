<!-- I want to review in Japanese. -->
## 変更概要 📝

<!-- この PR で何を変更したか簡潔に記述してください -->

## 変更理由 🤔

<!-- なぜこの変更が必要なのか説明してください -->

## 変更内容 🔧

<!-- 具体的な変更内容をリスト形式で記述してください -->

- [ ]
- [ ]
- [ ]

## テスト 🧪

<!-- 実装した機能のテスト方法を記述してください -->

### AI Agent向け動作確認手順 🤖

#### 1. データベース環境の準備

```bash
# PostgreSQLコンテナを起動
docker-compose up -d postgres

# データベースの接続確認
docker-compose exec postgres pg_isready -U postgres

# Prismaマイグレーションの実行
npx prisma migrate dev --seed
```

#### 2. アプリケーションの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

#### 3. Playwright MCP を使用した動作確認

**重要：この PR の動作確認は必ず日本語で行ってください**

以下のPlaywright MCPコマンドを使用して、ブラウザでの動作確認を実行してください：

```javascript
// ブラウザを起動してアプリケーションにアクセス
await browser_navigate('http://localhost:3000');

// 初期表示のスクリーンショットを撮影
await browser_take_screenshot('landing-page-initial');

// メイン機能の動作確認
// 例1：ランディングページの表示確認
await browser_wait_for_element('h1', { timeout: 5000 });
await browser_take_screenshot('hero-section');

// 例2：ナビゲーションメニューの動作確認
await browser_click("[data-testid='menu-button']");
await browser_take_screenshot('navigation-menu');

// 例3：ログインフローのテスト（該当する場合）
await browser_click("[data-testid='login-button']");
await browser_type("[data-testid='email-input']", 'test@example.com');
await browser_type("[data-testid='password-input']", 'password123');
await browser_click("[data-testid='submit-button']");
await browser_take_screenshot('login-result');

// 例4：レスポンシブデザインの確認
await browser_set_viewport_size(375, 667); // iPhone SE
await browser_take_screenshot('mobile-view');
await browser_set_viewport_size(1920, 1080); // Desktop
await browser_take_screenshot('desktop-view');

// 例5：フォーム入力のテスト（該当する場合）
await browser_click("[data-testid='create-quiz-button']");
await browser_type("[data-testid='quiz-title-input']", 'テストクイズ');
await browser_select("[data-testid='quiz-type-select']", 'multiple-choice');
await browser_take_screenshot('form-filled');

// 例6：エラーハンドリングの確認
await browser_click("[data-testid='submit-empty-form']");
await browser_wait_for_element("[data-testid='error-message']");
await browser_take_screenshot('error-handling');
```

#### 4. データベース連携機能のテスト

```javascript
// データベース操作を伴う機能のテスト
// 例：クイズデータの作成・読み取り・更新・削除

// 新規作成
await browser_click("[data-testid='create-new-quiz']");
await browser_type("[data-testid='quiz-title']", 'Playwright テストクイズ');
await browser_click("[data-testid='save-quiz']");
await browser_wait_for_element("[data-testid='success-message']");
await browser_take_screenshot('quiz-created');

// データ一覧の確認
await browser_navigate('http://localhost:3000/dashboard/quizzes');
await browser_wait_for_element("[data-testid='quiz-list']");
await browser_take_screenshot('quiz-list');

// データの詳細表示
await browser_click("[data-testid='quiz-item']:first-child");
await browser_wait_for_element("[data-testid='quiz-detail']");
await browser_take_screenshot('quiz-detail');
```

#### 5. 確認ポイント

- [ ] ページが正常に表示される（初期表示のスクリーンショット確認）
- [ ] データベース接続が正常に動作する（マイグレーション成功確認）
- [ ] 新機能が期待通りに動作する（機能別テスト実行）
- [ ] レスポンシブデザインが適切に動作する（モバイル・デスクトップ表示確認）
- [ ] エラーハンドリングが適切に機能する（エラーケースのテスト）
- [ ] パフォーマンスが適切（ページ読み込み時間の確認）
- [ ] アクセシビリティ要件を満たしている
- [ ] 多言語対応が正常に動作する（日本語・英語切り替え）

#### 6. Playwright自動テストの実行

```bash
# 全てのE2Eテストを実行
pnpm run test

# UIモードでインタラクティブにテスト実行
pnpm run test:ui

# デバッグモードでステップ実行
pnpm run test:debug

# ヘッドありモードで実際のブラウザを表示してテスト
pnpm run test:headed

# テストレポートを表示
pnpm run test:report
```

## スクリーンショット 📸

<!-- 必要に応じて変更前後のスクリーンショットを添付してください -->

## 関連Issue 🔗

<!-- 関連するIssue番号があれば記述してください -->

Closes #

## チェックリスト ✅

- [ ] TypeScriptコンパイルエラーがない（`pnpm run type-check`）
- [ ] フォーマットが適用されている（`pnpm run format:check`）
- [ ] Lintエラーがない（`pnpm run lint`）
- [ ] ビルドが正常に完了する（`pnpm run build`）
- [ ] Prismaマイグレーションが正常に動作する（`pnpm exec prisma migrate deploy`）
- [ ] 自動E2Eテストが全て成功する（`pnpm run test`）
- [ ] Playwright MCPを使用した手動動作確認を完了
- [ ] 日本語でのテスト・レビューが完了
- [ ] 必要に応じてドキュメントを更新
- [ ] 破壊的変更がある場合は適切にマークされている
- [ ] セキュリティ要件を満たしている
- [ ] パフォーマンスが適切な範囲内である

## 注意事項 ⚠️

<!-- 他の開発者が知っておくべき重要な情報があれば記述してください -->

---

**AI Agentへの追加指示：**

- この PR のレビューとテストは必ず日本語で行ってください
- Playwright MCPを使用して実際のブラウザ操作による動作確認を実施してください
- データベースが正常に動作していることを確認してから機能テストを開始してください
- 問題が発見された場合は、具体的なエラーメッセージとスクリーンショットを含めて報告してください
<!-- I want to review in Japanese. -->
