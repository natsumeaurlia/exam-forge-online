# 11. テナント設定ページ

## 概要

テナント（組織）全体の設定を管理するページ。基本設定、ブランディング、セキュリティ、統合など、テナントレベルの設定を構成できる。テナントオーナーとテナント管理者のみがアクセス可能。

## ページ構成

1. **設定ナビゲーション**

   - タブまたはサイドナビゲーション
     - 基本設定
     - ブランディング（プロプラン）
     - セキュリティ
     - 統合（プロプラン）
     - プランと請求
     - 詳細設定

2. **基本設定タブ**

   - テナント名
   - サブドメイン設定（プロプラン）
   - タイムゾーン設定
   - 言語設定
   - 連絡先情報
   - 通知設定

3. **ブランディングタブ**（プロプラン）

   - ロゴアップロード
   - カラーテーマ設定
     - プライマリカラー
     - セカンダリカラー
     - アクセントカラー
   - カスタムフォント設定
   - カスタムCSS（上級者向け）
   - プレビュー表示

4. **セキュリティタブ**

   - パスワードポリシー設定
   - 2要素認証の要求設定
   - セッションタイムアウト設定
   - IPアドレス制限（プロプラン）
   - シングルサインオン設定（エンタープライズプラン）

5. **統合タブ**（プロプラン）

   - APIキー管理
   - Webhookの設定
   - 外部サービス連携
     - Google Workspace
     - Microsoft 365
     - Slack
     - LMS連携（Moodle、Canvasなど）

6. **プランと請求タブ**

   - 現在のプラン表示
   - 使用量と制限の表示
   - 請求情報設定
   - 支払い方法管理
   - 請求履歴

7. **詳細設定タブ**
   - データエクスポート
   - アカウント削除
   - テナント削除
   - 詳細ログ設定（エンタープライズプラン）

## 技術仕様

- **コンポーネント構成**

  - `SettingsNavigation.tsx`
  - `BasicSettingsForm.tsx`
  - `BrandingSettingsForm.tsx`
  - `ThemeCustomizer.tsx`
  - `SecuritySettingsForm.tsx`
  - `IntegrationsPanel.tsx`
  - `ApiKeyManager.tsx`
  - `BillingSettingsForm.tsx`
  - `AdvancedSettingsForm.tsx`

- **状態管理**

  - `useSettingsStore.ts` - Zustandストア
    - 現在のタブ
    - フォーム状態
    - 変更の検出
  - TanStack Query
    - 設定データ取得
    - 請求情報取得
    - APIキー管理

- **フォームバリデーション**

  ```typescript
  const basicSettingsSchema = z.object({
    name: z.string().min(2, 'テナント名は2文字以上必要です'),
    subdomain: z
      .string()
      .min(3, 'サブドメインは3文字以上必要です')
      .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です'),
    timezone: z.string(),
    language: z.string(),
    contactEmail: z.string().email('有効なメールアドレスを入力してください'),
  });

  const securitySettingsSchema = z.object({
    passwordMinLength: z.number().min(8).max(64),
    requireMfa: z.boolean(),
    sessionTimeout: z.number().min(5).max(1440),
    // その他のセキュリティ設定
  });
  ```

- **API連携**

  - 設定取得: `/api/tenant/settings`
  - 設定更新: `/api/tenant/settings`
  - ロゴアップロード: `/api/tenant/logo`
  - APIキー管理: `/api/tenant/api-keys`
  - 請求情報: `/api/billing`

- **リアルタイムプレビュー**

  - テーマ変更のリアルタイム反映
  - CSSプレビュー
  - ロゴプレビュー

- **プラン機能制限**

  - プランに基づく設定項目の表示/非表示
  - アップグレードプロモーション表示

- **レスポンシブ設計**
  - モバイル: スタック表示、タブ切り替え
  - タブレット/デスクトップ: サイドナビゲーション + 設定フォーム

## Next.js移行考慮事項

- 設定フォーム自体はクライアントコンポーネント化
- 設定データ初期取得はServer Componentで実装
- 設定更新はServer Actionとして実装
- ファイルアップロードはAPI Routesとして維持
- プラン制限チェックはServer Componentで実装
