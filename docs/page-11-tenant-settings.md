# 11. チーム設定ページ

## 概要

チーム全体の設定を管理するページ。基本設定、ブランディング、セキュリティ、統合など、チームレベルの設定を構成できる。チームオーナーとチーム管理者のみがアクセス可能。

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

   - チーム名
   - チームスラッグ（URL用の識別子）
   - チーム説明
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
   - チームメンバー数と料金
     - 現在のメンバー数
     - プランに含まれるメンバー数
     - 追加メンバーの料金（メンバー単価）
     - 月額/年額の合計料金計算
   - 使用量と制限の表示
     - ストレージ使用量グラフ（プロプラン）
     - メディアファイル数とサイズの内訳
     - 残り容量の表示（10GB中）
     - クイズ数の使用状況
     - 月間レスポンス数の使用状況
   - 請求情報設定
   - 支払い方法管理
   - 請求履歴
   - メンバー追加時の料金シミュレーション

7. **詳細設定タブ**
   - データエクスポート
   - メンバーの一括招待（CSVインポート）
   - チーム所有者の変更
   - アカウント削除
   - チーム削除
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
    - `StorageUsageChart.tsx` - ストレージ使用量グラフ
    - `MediaUsageBreakdown.tsx` - メディア使用量内訳
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
    name: z.string().min(2, 'チーム名は2文字以上必要です'),
    slug: z
      .string()
      .min(3, 'スラッグは3文字以上必要です')
      .max(50, 'スラッグは50文字以内にしてください')
      .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です'),
    description: z.string().optional(),
    subdomain: z
      .string()
      .min(3, 'サブドメインは3文字以上必要です')
      .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です')
      .optional(),
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

  - 設定取得: `/api/teams/[teamId]/settings`
  - 設定更新: `/api/teams/[teamId]/settings`
  - ロゴアップロード: `/api/teams/[teamId]/logo`
  - APIキー管理: `/api/teams/[teamId]/api-keys`
  - 請求情報: `/api/teams/[teamId]/billing`
  - メンバー管理: `/api/teams/[teamId]/members`
  - 招待管理: `/api/teams/[teamId]/invitations`

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

## チーム構造とデータベース設計

### チームモデル
```typescript
model Team {
  id           String           @id @default(cuid())
  name         String           // チーム名
  slug         String           @unique @db.VarChar(50) // URL識別子
  description  String?          // チーム説明
  logo         String?          // ロゴURL
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  creatorId    String
  
  // リレーション
  creator      User             @relation("TeamCreator")
  members      TeamMember[]     // チームメンバー
  invitations  TeamInvitation[] // 招待
  quizzes      Quiz[]           // チームのクイズ
  subscription Subscription?    // サブスクリプション
  teamSettings TeamSettings?    // チーム設定
  invoices     Invoice[]        // 請求書
  usageRecords UsageRecord[]    // 使用記録
}
```

### チームメンバーの役割
```typescript
enum TeamRole {
  OWNER    // オーナー（全権限）
  ADMIN    // 管理者（メンバー管理、設定変更）
  MEMBER   // メンバー（クイズ作成・編集）
  VIEWER   // 閲覧者（閲覧のみ）
}
```

## 料金体系

### メンバーベースの課金

1. **基本料金構造**
   - Freeプラン: 1名のみ（個人利用）
   - Proプラン: 
     - 月額: 1ユーザーあたり2,980円
     - 年額: 1ユーザーあたり29,760円/年（月額換算2,480円）
     - 最大50名まで
   - Enterpriseプラン: カスタム見積もり

2. **料金計算例（Proプラン）**
   ```typescript
   // 月額料金計算
   const calculateMonthlyPrice = (memberCount: number, billingCycle: 'monthly' | 'yearly') => {
     const pricePerMember = billingCycle === 'monthly' 
       ? plan.monthlyPricePerMember  // 2,980円/user
       : plan.yearlyPricePerMember / 12; // 2,480円/user (年額を月換算)
     
     return memberCount * pricePerMember;
   };
   
   // 例: 5名のチームの場合
   // 月額契約: 5 × 2,980円 = 14,900円/月
   // 年額契約: 5 × 2,480円 = 12,400円/月（年額148,800円）
   
   // 例: 10名のチームの場合
   // 月額契約: 10 × 2,980円 = 29,800円/月
   // 年額契約: 10 × 2,480円 = 24,800円/月（年額297,600円）
   ```

3. **請求タイミング**
   - メンバー追加時: 即時課金（日割り計算）
   - メンバー削除時: 次回請求時に反映
   - プラン変更時: 差額を日割り計算

## Next.js移行考慮事項

- 設定フォーム自体はクライアントコンポーネント化
- 設定データ初期取得はServer Componentで実装
- 設定更新はServer Actionとして実装
- ファイルアップロードはAPI Routesとして維持
- プラン制限チェックはServer Componentで実装
- チーム切り替え機能の実装（複数チーム所属の場合）
