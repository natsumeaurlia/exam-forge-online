# CI/CD Issues and Solutions - ExamForge 

## 調査日：2025年6月12日

## Issue #174: CI/CDパイプラインの問題

### 1. 特定された問題

#### 1.1 E2Eテスト以外のテスト
- **問題**: ユニットテストやインテグレーションテストが未実装
- **影響**: コードカバレッジが低く、小規模な変更でのバグ検出が困難
- **現状**: VitestとStorybookテスト設定のみ存在するが、CI/CDには統合されていない

#### 1.2 pnpmバージョンとworking-directory
- **問題**: pnpmバージョンがCIワークフロー内でハードコード（9.15.2）
- **影響**: package.jsonのpackageManagerフィールドと不一致の可能性
- **現状**: working-directoryは正しく`web`に設定されている

#### 1.3 環境変数管理
- **問題**: 
  - データベースURLがワークフローファイルにハードコード
  - Stripe、OAuth、Storage等の重要な環境変数が未設定
  - GitHub Secretsが未使用
- **影響**: セキュリティリスクとアプリケーションの不完全な動作

### 2. 修正案

#### 2.1 GitHub Secretsの設定

以下の環境変数をGitHub Secretsに追加する必要があります：

```yaml
# 必須の環境変数
DATABASE_URL               # PostgreSQL接続文字列
NEXTAUTH_SECRET           # NextAuth.jsシークレット
NEXTAUTH_URL              # アプリケーションURL

# OAuth認証
GOOGLE_CLIENT_ID          # Google OAuth Client ID
GOOGLE_CLIENT_SECRET      # Google OAuth Client Secret
GITHUB_ID                 # GitHub OAuth App ID
GITHUB_SECRET             # GitHub OAuth App Secret

# Stripe決済
STRIPE_SECRET_KEY         # Stripe APIシークレットキー
STRIPE_PUBLISHABLE_KEY    # Stripe公開可能キー
STRIPE_WEBHOOK_SECRET     # Stripe Webhookシークレット
STRIPE_PRO_MONTHLY_PRICE_ID    # Pro月額プランのPrice ID
STRIPE_PRO_YEARLY_PRICE_ID     # Pro年額プランのPrice ID

# ストレージ（MinIO/S3）
S3_ENDPOINT               # S3互換エンドポイント
S3_ACCESS_KEY_ID          # アクセスキー
S3_SECRET_ACCESS_KEY      # シークレットキー
S3_BUCKET_NAME            # バケット名
S3_REGION                 # リージョン（デフォルト: us-east-1）

# メール（オプション）
RESEND_API_KEY            # Resend APIキー（メール送信用）
```

#### 2.2 CI/CDワークフローの改善

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
    paths:
      - 'web/**'
      - '.github/workflows/**'

defaults:
  run:
    working-directory: web

env:
  # GitHub Secretsから環境変数を設定
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
  # 他の環境変数も同様に追加

jobs:
  setup:
    name: Setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        # package.jsonからバージョンを読み取る
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: web/pnpm-lock.yaml
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

  # ユニットテストジョブを追加
  unit-tests:
    name: Unit Tests
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: web/pnpm-lock.yaml
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info

  # E2Eテストを拡張（全ブラウザ対応）
  e2e-tests:
    name: E2E Tests (${{ matrix.browser }})
    needs: [build, database]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      # ... 既存のセットアップ ...
      
      - name: Run E2E tests
        run: pnpm test:${{ matrix.browser }}
```

#### 2.3 package.jsonの更新

```json
{
  "packageManager": "pnpm@9.15.2",
  "scripts": {
    // ユニットテスト追加
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:coverage": "vitest run --coverage",
    
    // ブラウザ別E2Eテスト
    "test:chromium": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit"
  }
}
```

## Issue #177: OAuth認証プロバイダーの環境変数未設定エラー

### 1. 問題の詳細

`src/lib/auth.ts`でGoogleとGitHubのOAuthプロバイダーが設定されているが、環境変数が未設定の場合に空文字列がデフォルト値として使用される：

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
}),
GitHubProvider({
  clientId: process.env.GITHUB_ID || '',
  clientSecret: process.env.GITHUB_SECRET || '',
})
```

### 2. 解決策

#### 2.1 環境変数の検証追加

```typescript
// src/lib/auth.ts
import { NextAuthOptions, getServerSession } from 'next-auth';

// 環境変数の検証
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET,
};

// 開発環境でのみ警告を表示
if (process.env.NODE_ENV === 'development') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️  Missing environment variable: ${key}`);
    }
  });
}
```

#### 2.2 条件付きプロバイダー設定

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // 環境変数が設定されている場合のみプロバイダーを有効化
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    // Credentialsプロバイダーは常に有効
    CredentialsProvider({
      // ... 既存の設定 ...
    }),
  ],
  // ... 他の設定 ...
};
```

### 3. 環境変数設定ガイド

#### 3.1 Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択
5. アプリケーションタイプ：「ウェブアプリケーション」
6. 承認済みのリダイレクトURI：
   - 開発環境：`http://localhost:3000/api/auth/callback/google`
   - 本番環境：`https://your-domain.com/api/auth/callback/google`
7. クライアントIDとクライアントシークレットを取得

#### 3.2 GitHub OAuth設定

1. GitHubの[Developer Settings](https://github.com/settings/developers)にアクセス
2. 「OAuth Apps」→「New OAuth App」をクリック
3. 以下を設定：
   - Application name: ExamForge
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL：
     - 開発環境：`http://localhost:3000/api/auth/callback/github`
     - 本番環境：`https://your-domain.com/api/auth/callback/github`
4. Client IDとClient Secretを取得

#### 3.3 .envファイルの設定

```bash
# OAuth認証
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### 4. 推奨される追加改善

1. **環境変数の型安全性向上**：
   - `@t3-oss/env-nextjs`を使用した環境変数のスキーマ定義
   - ビルド時の環境変数検証

2. **セキュリティの強化**：
   - CSRFトークンの実装
   - レート制限の追加
   - セッション管理の改善

3. **モニタリング**：
   - 認証エラーのログ記録
   - メトリクスの収集

## 実装優先順位

1. **即座に対応すべき項目**（本日中）：
   - GitHub Secretsの設定
   - CI/CDワークフローの環境変数修正
   - OAuth環境変数の条件付き設定

2. **短期的に対応すべき項目**（今週中）：
   - ユニットテストの追加
   - 全ブラウザでのE2Eテスト実行
   - 環境変数検証の実装

3. **中期的に対応すべき項目**（今月中）：
   - コードカバレッジの向上
   - セキュリティスキャンの追加
   - デプロイメントパイプラインの構築

## 参考リンク

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Playwright Test Documentation](https://playwright.dev/docs/test-intro)
- [Vitest Documentation](https://vitest.dev/)