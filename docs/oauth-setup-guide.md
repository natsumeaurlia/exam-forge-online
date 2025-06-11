# OAuth認証プロバイダー設定ガイド - ExamForge

## 概要

ExamForgeは、ユーザー認証にNextAuth.jsを使用しており、以下の認証方法をサポートしています：

- **Google OAuth 2.0** - Googleアカウントでのログイン
- **GitHub OAuth Apps** - GitHubアカウントでのログイン  
- **Credentials認証** - メールアドレス＋パスワードでのログイン（常時有効）

本ドキュメントでは、OAuth認証プロバイダーの設定方法を詳しく説明します。

## 🔧 現在の実装状況

### ✅ 実装済み機能

1. **条件付きプロバイダー設定**: 環境変数が未設定の場合、該当するOAuthプロバイダーは自動的に無効化
2. **開発環境での警告表示**: 未設定の環境変数に対して警告を表示
3. **CI/CD対応**: GitHub Actionsで環境変数をSecrets経由で安全に管理

### 📍 Issue #177の修正内容

- **問題**: OAuth環境変数が未設定の場合にエラーが発生
- **解決策**: 環境変数が設定されている場合のみプロバイダーを有効化する条件分岐を実装

## 🌐 環境変数一覧

### 必須環境変数

```bash
# NextAuth.js基本設定
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000  # 本番環境では実際のURLに変更
```

### オプション環境変数（OAuth）

```bash
# Google OAuth（オプション）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（オプション）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

## 🔑 Google OAuth設定手順

### 1. Google Cloud Consoleでプロジェクト準備

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. プロジェクト名: 「ExamForge」など分かりやすい名前を設定

### 2. OAuth同意画面の設定

OAuth同意画面は、ユーザーがGoogleでログインする際に表示される画面です。

1. 左側のメニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプを選択：
   - **外部**を選択（一般ユーザー向け）
3. アプリ情報を入力：
   ```
   アプリ名: ExamForge
   ユーザーサポートメール: あなたのメールアドレス
   アプリのロゴ: （オプション）
   アプリドメイン: your-domain.com
   ```
4. 開発者連絡先情報: あなたのメールアドレス
5. スコープ設定:
   - 「スコープを追加または削除」をクリック
   - 以下のスコープを追加：
     - `email`
     - `profile`
     - `openid`

### 3. OAuth クライアントIDの作成

1. 「認証情報」タブを選択
2. 「認証情報を作成」→「OAuth クライアント ID」をクリック
3. アプリケーションタイプ: **ウェブアプリケーション**を選択
4. 名前: 「ExamForge Production」（環境に応じて変更）
5. 承認済みのJavaScript生成元:
   ```
   開発環境: http://localhost:3000
   本番環境: https://your-domain.com
   ```
6. 承認済みのリダイレクトURI:
   ```
   開発環境: http://localhost:3000/api/auth/callback/google
   本番環境: https://your-domain.com/api/auth/callback/google
   ```
7. 「作成」をクリック

### 4. 認証情報の取得

作成後、以下の情報が表示されます：
- **クライアントID**: `GOOGLE_CLIENT_ID`として使用
- **クライアントシークレット**: `GOOGLE_CLIENT_SECRET`として使用

## 🐙 GitHub OAuth設定手順

### 1. GitHub OAuth Appの作成

1. GitHubにログインし、[Developer Settings](https://github.com/settings/developers)にアクセス
2. 「OAuth Apps」タブを選択
3. 「New OAuth App」をクリック

### 2. アプリケーション情報の入力

以下の情報を入力：

```
Application name: ExamForge
Homepage URL: https://your-domain.com
Application description: オンラインクイズ・試験作成プラットフォーム（オプション）
Authorization callback URL: 
  開発環境: http://localhost:3000/api/auth/callback/github
  本番環境: https://your-domain.com/api/auth/callback/github
```

### 3. 認証情報の取得

1. 「Register application」をクリック
2. **Client ID**が表示される: `GITHUB_ID`として使用
3. 「Generate a new client secret」をクリック
4. **Client Secret**が生成される: `GITHUB_SECRET`として使用

## 🔐 環境変数の設定方法

### 開発環境（ローカル）

プロジェクトルートに`.env`ファイルを作成：

```bash
# NextAuth.js
NEXTAUTH_SECRET=your-secret-here-min-32-characters
NEXTAUTH_URL=http://localhost:3000

# Google OAuth（オプション）
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（オプション）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### 本番環境（Vercel）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」に移動
4. 各環境変数を追加（Production、Preview、Development環境に応じて設定）

### GitHub Actions（CI/CD）

GitHub Secretsとして設定：

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」で以下を追加：
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`（オプション）
   - `GOOGLE_CLIENT_SECRET`（オプション）
   - `GITHUB_ID`（オプション）
   - `GITHUB_SECRET`（オプション）

## 🛡️ セキュリティベストプラクティス

### NEXTAUTH_SECRETの生成

NEXTAUTH_SECRETは32文字以上のランダム文字列が必要です：

```bash
# OpenSSLを使用して生成
openssl rand -base64 32

# または、Node.jsを使用
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### セキュリティ注意事項

1. **絶対にコミットしない**: `.env`ファイルは`.gitignore`に含める
2. **環境ごとに異なるシークレット**: 開発・ステージング・本番で異なる値を使用
3. **定期的な更新**: 特にClient Secretは定期的に再生成
4. **最小権限の原則**: 必要最小限のスコープのみを要求
5. **HTTPS必須**: 本番環境では必ずHTTPSを使用

## 🔧 動作確認

### 1. 環境変数の確認

開発環境で以下を確認：

```bash
cd web
pnpm dev
```

コンソールに以下のような警告が表示されない場合、正常に設定されています：
```
⚠️  Missing environment variable: GOOGLE_CLIENT_ID
⚠️  Missing environment variable: GOOGLE_CLIENT_SECRET
```

### 2. 認証機能のテスト

1. ブラウザで`http://localhost:3000/ja/auth/signin`にアクセス
2. 設定したOAuthプロバイダーのボタンが表示されることを確認
3. 各プロバイダーでログインを試行

## 🚨 トラブルシューティング

### エラー: "OAuth provider not configured"

**原因**: 環境変数が設定されていない

**解決方法**:
1. 環境変数が正しく設定されているか確認
2. `.env`ファイルがプロジェクトルートにあるか確認
3. アプリケーションを再起動

### エラー: "Invalid redirect URI"

**原因**: OAuth設定のリダイレクトURIと実際のURIが一致しない

**解決方法**:
1. Google/GitHub設定でリダイレクトURIを確認
2. HTTPSとHTTPの違いに注意
3. 末尾のスラッシュの有無を確認

### エラー: "Access blocked: This app's request is invalid"

**原因**: Google OAuth同意画面が正しく設定されていない

**解決方法**:
1. OAuth同意画面で必要な情報がすべて入力されているか確認
2. スコープ（email, profile）が選択されているか確認
3. 開発中の場合、テストユーザーを追加

### エラー: セッションが維持されない

**原因**: NEXTAUTH_SECRETが適切に設定されていない

**解決方法**:
1. NEXTAUTH_SECRETが32文字以上であることを確認
2. 本番環境とローカル環境で異なる値を使用
3. 環境変数が正しく読み込まれているか確認

## 📋 チェックリスト

### Google OAuth設定
- [ ] Google Cloud Projectを作成
- [ ] OAuth同意画面を設定
- [ ] 正しいリダイレクトURIを設定
- [ ] Client IDとClient Secretを取得
- [ ] 環境変数に設定

### GitHub OAuth設定
- [ ] GitHub OAuth Appを作成
- [ ] アプリケーション情報を入力
- [ ] 正しいCallback URLを設定
- [ ] Client IDとClient Secretを取得
- [ ] 環境変数に設定

### セキュリティ
- [ ] 強力なNEXTAUTH_SECRETを生成
- [ ] .envファイルを.gitignoreに追加
- [ ] 本番環境でHTTPSを使用
- [ ] 環境変数をGitHub Secretsに設定

## 📚 関連ドキュメント

- [NextAuth.js公式ドキュメント](https://next-auth.js.org/)
- [Google OAuth 2.0設定ガイド](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps設定ガイド](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Vercel環境変数設定](https://vercel.com/docs/concepts/projects/environment-variables)

## ❓ よくある質問

**Q: OAuth プロバイダーを使用しない場合は設定が必要ですか？**
A: いいえ、環境変数を設定しなければ、自動的にそのプロバイダーは無効化されます。Credentialsプロバイダー（メール＋パスワード）は常に有効です。

**Q: 複数環境で異なる設定を使いたい場合は？**
A: 環境ごとに異なるOAuth アプリケーションを作成し、それぞれの環境変数を設定してください。

**Q: ローカル開発でOAuthテストはできますか？**
A: はい、`http://localhost:3000`を承認済みドメインとして設定すれば可能です。

**Q: CI/CDでOAuth認証のテストはどうすれば？**
A: CI環境では環境変数を空文字列に設定することで、OAuthプロバイダーを無効化してテストできます。

## 📞 サポート

設定で問題が発生した場合：

1. 本ドキュメントのトラブルシューティングセクションを確認
2. 環境変数の設定を再確認
3. ブラウザのキャッシュをクリア
4. GitHubのIssueで質問を投稿

---

**更新日**: 2025年6月12日  
**バージョン**: 1.0.0