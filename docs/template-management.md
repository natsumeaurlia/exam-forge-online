# テンプレート管理機能 実装仕様書

## 概要

ExamForgeにクイズテンプレート管理機能を追加。ユーザーがテンプレートを作成・管理・共有し、効率的にクイズを作成できる機能を提供。

## 実装完了項目

### 1. データベース設計

#### QuizTemplate モデル
```prisma
model QuizTemplate {
  id              String        @id @default(cuid())
  title           String        @db.VarChar(200)
  description     String?
  thumbnail       String?       // Preview image URL
  category        String?       @db.VarChar(100)
  isPublic        Boolean       @default(false)
  usageCount      Int           @default(0)
  
  // Template content (JSON structure matching Quiz fields)
  questions       Json          // Array of question objects with their structure
  settings        Json          // Quiz settings like timeLimit, passingScore, etc.
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  teamId          String
  createdById     String
  
  team            Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdBy       User          @relation("TemplateCreator", fields: [createdById], references: [id], onDelete: Restrict)
  tags            TemplateTag[]
}
```

#### TemplateTag モデル
```prisma
model TemplateTag {
  id         String       @id @default(cuid())
  templateId String
  tagId      String
  template   QuizTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  tag        Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([templateId, tagId])
}
```

### 2. サーバーアクション

#### 実装済みアクション
- `createTemplate`: 新規テンプレート作成
- `updateTemplate`: テンプレート更新
- `deleteTemplate`: テンプレート削除
- `getTemplates`: テンプレート一覧取得（フィルター・ページング対応）
- `createTemplateFromQuiz`: 既存クイズからテンプレート作成
- `createQuizFromTemplate`: テンプレートからクイズ作成
- `getTemplateStats`: テンプレート統計取得

#### 機能詳細
- **権限管理**: チーム基盤アクセス制御
- **公開/プライベート**: `isPublic`フラグで制御
- **使用統計**: `usageCount`による利用回数追跡
- **タグ管理**: 既存Tagシステムとの連携

### 3. UI実装

#### ページ構成
```
/app/[lng]/dashboard/templates/
├── page.tsx                    # メインテンプレート管理ページ
```

#### コンポーネント構成
```
/components/template/
├── TemplateListHeader.tsx      # ヘッダー（作成ボタン含む）
├── TemplateListContent.tsx     # サーバーコンポーネント（データ取得）
├── TemplateGrid.tsx           # グリッドレイアウト
├── TemplateCardContainer.tsx   # カードコンテナ（ロジック）
├── TemplateCardPresentation.tsx # カードプレゼンテーション
├── CreateTemplateModal.tsx     # 作成モーダル
├── ui/
│   ├── TemplateCardActions.tsx # アクションメニュー
│   ├── TemplateCardStats.tsx   # 統計表示
│   ├── TemplateCardTags.tsx    # タグ表示
│   └── TemplateCardDeleteDialog.tsx # 削除確認
└── hooks/
    └── useTemplateCardActions.ts # カードアクション管理
```

#### 主要機能
- **テンプレート一覧**: カード形式でテンプレート表示
- **作成機能**: モーダルから新規テンプレート作成
- **アクション**: プレビュー・編集・複製・削除・クイズ作成
- **ページネーション**: 大量データ対応
- **レスポンシブ**: モバイル・デスクトップ対応

### 4. テンプレートカテゴリー

実装済みカテゴリー:
- `education`: 教育
- `business`: ビジネス  
- `training`: 研修
- `assessment`: 評価
- `survey`: アンケート
- `certification`: 認定
- `onboarding`: オンボーディング
- `compliance`: コンプライアンス
- `feedback`: フィードバック
- `general`: 一般

### 5. 国際化対応

#### 翻訳キー追加
- `templateManagement.page.*`: ページ関連
- `templateManagement.header.*`: ヘッダー関連
- `templateManagement.cardActions.*`: アクション関連
- `templateManagement.cardPresentation.*`: カード表示関連
- `templateManagement.cardStats.*`: 統計関連
- `templateManagement.deleteDialog.*`: 削除確認関連
- `templateManagement.createModal.*`: 作成モーダル関連

## 技術仕様

### データ構造

#### テンプレート設定 (JSON)
```typescript
interface TemplateSettings {
  timeLimit?: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts?: number;
  sharingMode: string;
  password?: string;
  difficultyLevel?: string;
}
```

#### テンプレート質問 (JSON)
```typescript
interface TemplateQuestionData {
  type: string;
  text: string;
  points: number;
  order: number;
  hint?: string;
  explanation?: string;
  correctAnswer?: any;
  gradingCriteria?: string;
  isRequired: boolean;
  difficultyLevel?: string;
  options?: Array<{
    text: string;
    order: number;
    isCorrect: boolean;
  }>;
  media?: Array<{
    url: string;
    type: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    order: number;
  }>;
}
```

### セキュリティ

#### アクセス制御
- チーム基盤権限管理
- 作成者・チームメンバーのみアクセス可能
- 公開テンプレートは全ユーザー閲覧可能

#### データ検証
- Zodスキーマによる入力検証
- next-safe-actionによる型安全なアクション
- SQLインジェクション防止

## 今後の拡張予定

### 未実装機能
1. **検索・フィルター機能**
   - カテゴリー別フィルター
   - タグベース検索
   - 人気順・新着順ソート

2. **テンプレート詳細機能**
   - テンプレートプレビューページ
   - テンプレート編集ページ
   - 使用統計詳細表示

3. **高度な機能**
   - テンプレート複製機能
   - 共有テンプレート機能
   - インポート/エクスポート機能

### パフォーマンス最適化
- クエリ最適化
- キャッシュ戦略
- 画像最適化

## 品質保証

### テスト状況
- ✅ TypeScript型チェック: 通過
- ✅ ESLint: 通過  
- ✅ ビルド: 成功
- ⏳ E2Eテスト: 未実装

### 動作確認項目
- [x] テンプレート一覧表示
- [x] テンプレート作成機能
- [x] アクションメニュー動作
- [x] モーダル機能
- [x] 翻訳表示
- [x] レスポンシブ対応

## 関連ファイル

### 新規作成ファイル
- `src/types/template-schemas.ts`: Zodスキーマ定義
- `src/types/template.ts`: TypeScript型定義
- `src/lib/actions/template.ts`: サーバーアクション
- `src/app/[lng]/dashboard/templates/page.tsx`: メインページ
- `src/components/template/*`: テンプレート関連コンポーネント

### 更新ファイル
- `prisma/schema.prisma`: QuizTemplate・TemplateTagモデル追加
- `src/i18n/locales/ja.json`: 日本語翻訳追加
- `src/i18n/locales/en.json`: 英語翻訳追加
- `src/lib/actions/utils.ts`: 'use server'ディレクティブ削除

### マイグレーション
- `20250614112318_add_quiz_template_models`: テンプレートモデル追加

## 開発者ガイド

### 新しいテンプレートアクション追加手順
1. `src/types/template-schemas.ts`にスキーマ追加
2. `src/lib/actions/template.ts`にアクション実装
3. 必要に応じてコンポーネント更新
4. 翻訳ファイル更新

### デバッグ方法
- サーバーアクションエラー: `console.error`で詳細確認
- UI表示問題: ブラウザ開発者ツールで検証
- データベース問題: Prisma Studioで確認

---

**作成者**: エンジニア3  
**作成日**: 2025-06-14  
**バージョン**: 1.0  
**ステータス**: 基本実装完了