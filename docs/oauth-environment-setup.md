# OAuth環境変数設定ガイド - ExamForge

## 概要

ExamForgeでは、ユーザー認証にNextAuth.jsを使用しており、以下のプロバイダーをサポートしています：

- Google OAuth 2.0
- GitHub OAuth Apps
- Credentials（メールアドレス＋パスワード）

本ドキュメントでは、OAuth認証プロバイダーの環境変数設定方法を説明します。

## 環境変数一覧

### 必須の環境変数

```bash
# NextAuth.js基本設定
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000  # 本番環境では実際のURLに変更
```

### オプションの環境変数（OAuth プロバイダー）

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

## Google OAuth設定手順

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択

### 2. OAuth 2.0クライアントIDを作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」ボタンをクリック
3. 「OAuth クライアント ID」を選択

### 3. OAuth同意画面を設定

初回のみ、OAuth同意画面の設定が必要です：

1. 「OAuth同意画面」タブを選択
2. ユーザータイプを選択（外部を推奨）
3. 必要な情報を入力：
   - アプリケーション名：ExamForge
   - ユーザーサポートメール：あなたのメールアドレス
   - 開発者連絡先情報：あなたのメールアドレス
4. スコープは「email」と「profile」を選択

### 4. クライアントIDの設定

1. アプリケーションタイプ：「ウェブアプリケーション」を選択
2. 名前：「ExamForge Production」（環境に応じて変更）
3. 承認済みのJavaScript生成元：
   ```
   開発環境：http://localhost:3000
   本番環境：https://your-domain.com
   ```
4. 承認済みのリダイレクトURI：
   ```
   開発環境：http://localhost:3000/api/auth/callback/google
   本番環境：https://your-domain.com/api/auth/callback/google
   ```
5. 「作成」をクリック

### 5. 認証情報を取得

作成後、以下の情報が表示されます：
- クライアントID
- クライアントシークレット

これらを環境変数に設定してください。

## GitHub OAuth設定手順

### 1. GitHub OAuth Appを作成

1. GitHubにログイン
2. [Developer Settings](https://github.com/settings/developers)にアクセス
3. 「OAuth Apps」タブを選択
4. 「New OAuth App」をクリック

### 2. アプリケーション情報を入力

以下の情報を入力します：

```
Application name: ExamForge
Homepage URL: https://your-domain.com
Application description: オンラインクイズ・試験作成プラットフォーム（オプション）
Authorization callback URL:
  開発環境：http://localhost:3000/api/auth/callback/github
  本番環境：https://your-domain.com/api/auth/callback/github
```

### 3. Client IDとClient Secretを取得

1. 「Register application」をクリック
2. Client IDが表示されます
3. 「Generate a new client secret」をクリックしてClient Secretを生成

これらを環境変数に設定してください。

## 環境変数の設定方法

### 開発環境（ローカル）

プロジェクトルートの`.env`ファイルに追加：

```bash
# NextAuth.js
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth（オプション）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（オプション）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### 本番環境（Vercel）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」に移動
4. 各環境変数を追加

### GitHub Actions（CI/CD）

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」に移動
2. 「New repository secret」をクリック
3. 各環境変数をシークレットとして追加

## セキュリティに関する注意事項

### NEXTAUTH_SECRETの生成

NEXTAUTH_SECRETは、JWTトークンの署名に使用される重要なシークレットです。以下のコマンドで安全なランダム文字列を生成できます：

```bash
openssl rand -base64 32
```

### 環境変数の管理

- **絶対にコミットしない**：`.env`ファイルは`.gitignore`に含まれていることを確認
- **本番環境では環境変数を使用**：ハードコードは避ける
- **定期的に更新**：特にClient Secretは定期的に再生成することを推奨
- **最小権限の原則**：必要最小限のスコープのみを要求

## トラブルシューティング

### エラー：「OAuth provider not configured」

**原因**：環境変数が設定されていない、または空文字列

**解決方法**：
1. 環境変数が正しく設定されているか確認
2. アプリケーションを再起動
3. `.env`ファイルの読み込みを確認

### エラー：「Invalid redirect URI」

**原因**：OAuth プロバイダーに登録したリダイレクトURIと実際のURIが一致しない

**解決方法**：
1. OAuth プロバイダーの設定で正しいリダイレクトURIが登録されているか確認
2. HTTPSとHTTPの違いに注意
3. 末尾のスラッシュの有無を確認

### エラー：「Access blocked: This app's request is invalid」

**原因**：Google OAuthの場合、OAuth同意画面が正しく設定されていない

**解決方法**：
1. Google Cloud ConsoleでOAuth同意画面の設定を確認
2. 必要なスコープ（email, profile）が選択されているか確認
3. テストユーザーを追加（開発中の場合）

## 動作確認

環境変数を設定後、以下の手順で動作確認を行います：

1. アプリケーションを起動
   ```bash
   cd web
   pnpm dev
   ```

2. ブラウザで`http://localhost:3000/ja/auth/signin`にアクセス

3. 設定したOAuthプロバイダーのボタンが表示されることを確認

4. 各プロバイダーでログインを試行

## よくある質問

### Q: OAuth プロバイダーを使用しない場合は？

A: 環境変数を設定しなければ、自動的にそのプロバイダーは無効化されます。Credentialsプロバイダー（メール＋パスワード）は常に有効です。

### Q: 複数の環境（開発、ステージング、本番）で異なる設定を使うには？

A: 各環境で異なるOAuth アプリケーションを作成し、それぞれの環境変数を設定してください。

### Q: OAuth プロバイダーのアイコンやボタンのカスタマイズは？

A: `src/app/[lng]/auth/signin/page.tsx`でUIをカスタマイズできます。

## 関連ドキュメント

- [NextAuth.js公式ドキュメント](https://next-auth.js.org/)
- [Google OAuth 2.0ガイド](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Appsドキュメント](https://docs.github.com/en/developers/apps/building-oauth-apps)

## サポート

設定で問題が発生した場合は、以下をご確認ください：

1. 環境変数が正しく設定されているか
2. アプリケーションを再起動したか
3. ブラウザのキャッシュをクリアしたか

それでも解決しない場合は、GitHubのIssueでお問い合わせください。