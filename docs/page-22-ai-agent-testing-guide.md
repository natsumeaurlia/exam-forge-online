# 開発者向けガイド - AI Agent用動作確認手順

このドキュメントは、AI Agentがこのプロジェクトで動作確認を行う際の詳細な手順を記載しています。

## 前提条件

- Docker および Docker Compose がインストールされていること
- Node.js 20以上がインストールされていること
- Playwright MCPが利用可能であること

## 1. 環境セットアップ

### データベースの起動

```bash
# PostgreSQLコンテナを起動
docker-compose up -d postgres

# データベースの接続確認
docker-compose exec postgres pg_isready -U postgres -d exam_forge

# ログ確認（問題がある場合）
docker-compose logs postgres
```

### 環境変数の設定

```bash
# .env.exampleをコピーして.envファイルを作成
cp .env.example .env

# 必要に応じて環境変数を編集
# 最低限、以下の変数が設定されていることを確認
# DATABASE_URL=postgresql://postgres:password@localhost:5432/exam_forge
# NEXTAUTH_SECRET=your-secret-key-here
```

### 依存関係のインストールとデータベースの初期化

```bash
# 依存関係のインストール
npm install

# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーションの実行
npx prisma migrate dev

# 初期データの投入（seed.tsが存在する場合）
npx prisma db seed
```

## 2. アプリケーションの起動

```bash
# 開発サーバーの起動
npm run dev

# サーバーが起動したら以下のURLでアクセス可能
# http://localhost:3000
```

## 3. Playwright MCPを使用した動作確認

### 基本的な動作確認

```javascript
// ブラウザを起動してアプリケーションにアクセス
await browser_navigate('http://localhost:3000');

// 初期表示の確認
await browser_snapshot();

// メインページのスクリーンショット
await browser_take_screenshot();
```

### 認証フローのテスト

```javascript
// ログインページへの遷移
await browser_click('text=ログイン');

// ログインフォームの入力
await browser_type("[data-testid='email']", 'test@example.com');
await browser_type("[data-testid='password']", 'password123');

// ログインボタンのクリック
await browser_click("[data-testid='login-button']");

// ダッシュボードへの遷移確認
await browser_wait_for('text=ダッシュボード');
await browser_take_screenshot();
```

### クイズ機能のテスト

```javascript
// クイズ一覧ページへの遷移
await browser_click('text=クイズ一覧');

// 新しいクイズの作成
await browser_click('text=新しいクイズ');

// クイズタイトルの入力
await browser_type("[data-testid='quiz-title']", 'テストクイズ');

// 質問の追加
await browser_click('text=質問を追加');
await browser_type("[data-testid='question-text']", 'これはテスト質問ですか？');

// 保存
await browser_click('text=保存');
```

### レスポンシブデザインのテスト

```javascript
// モバイルサイズでのテスト
await browser_resize(375, 667);
await browser_take_screenshot();

// タブレットサイズでのテスト
await browser_resize(768, 1024);
await browser_take_screenshot();

// デスクトップサイズでのテスト
await browser_resize(1920, 1080);
await browser_take_screenshot();
```

## 4. トラブルシューティング

### データベース接続の問題

```bash
# PostgreSQLコンテナの状態確認
docker-compose ps

# PostgreSQLコンテナの再起動
docker-compose restart postgres

# データベースへの直接接続確認
docker-compose exec postgres psql -U postgres -d exam_forge
```

### マイグレーションの問題

```bash
# マイグレーション状態の確認
npx prisma migrate status

# マイグレーションのリセット（開発環境のみ）
npx prisma migrate reset --force

# 新しいマイグレーションの生成
npx prisma migrate dev --name describe_your_changes
```

### ビルドエラーの対応

```bash
# TypeScriptの型チェック
npx tsc --noEmit

# Lintエラーの確認
npm run lint

# フォーマットの適用
npm run format
```

## 5. テスト完了の確認項目

- [ ] アプリケーションが正常に起動する
- [ ] データベース接続が正常に動作する
- [ ] 主要なページが表示される
- [ ] 認証フローが動作する
- [ ] CRUD操作が正常に機能する
- [ ] レスポンシブデザインが適切に表示される
- [ ] エラーハンドリングが適切に機能する

## 6. 日本語でのレポート作成

動作確認完了後は、以下の形式で日本語でレポートを作成してください：

```
## 動作確認レポート

### 確認日時
[確認日時を記載]

### 確認環境
- OS: [macOS/Windows/Linux]
- Node.js: [バージョン]
- ブラウザ: [Chrome/Firefox/Safari等]

### 確認項目と結果
1. アプリケーション起動: ✅/❌
2. データベース接続: ✅/❌
3. 主要機能動作: ✅/❌
4. レスポンシブ対応: ✅/❌

### 発見された問題
[問題があった場合は詳細を記載]

### スクリーンショット
[重要な画面のスクリーンショットを添付]

### 推奨事項
[改善提案があれば記載]
```
