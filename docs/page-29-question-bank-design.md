# 問題バンク設計書

## 1. 概要

問題バンクは、プロプラン以上で利用可能な機能で、問題を一元管理し、複数のクイズで再利用可能にするシステムです。タグ付け、カテゴリー分類、高度な検索機能、AIによる問題生成などの機能を提供します。

## 2. データベーススキーマ設計

### 2.1 新規テーブル

```prisma
// 問題バンクの問題
model BankQuestion {
  id              String                @id @default(cuid())
  type            QuestionType
  text            String
  points          Int                   @default(1) @db.SmallInt
  hint            String?
  explanation     String?
  correctAnswer   Json?
  gradingCriteria String?
  difficulty      QuestionDifficulty    @default(MEDIUM)
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  teamId          String
  createdById     String
  
  // リレーション
  team            Team                  @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdBy       User                  @relation(fields: [createdById], references: [id])
  media           BankQuestionMedia[]
  options         BankQuestionOption[]
  tags            BankQuestionTag[]
  categories      BankQuestionCategory[]
  quizQuestions   QuizBankQuestion[]    // クイズとの関連
  
  @@index([teamId])
  @@index([createdById])
  @@index([type])
  @@index([difficulty])
  @@index([teamId, type])
  @@index([teamId, difficulty])
}

// 問題バンクの選択肢
model BankQuestionOption {
  id               String         @id @default(cuid())
  text             String
  order            Int            @db.SmallInt
  isCorrect        Boolean        @default(false)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  bankQuestionId   String
  bankQuestion     BankQuestion   @relation(fields: [bankQuestionId], references: [id], onDelete: Cascade)
  
  @@index([bankQuestionId])
  @@index([bankQuestionId, order])
}

// 問題バンクのメディア
model BankQuestionMedia {
  id               String         @id @default(cuid())
  url              String
  type             MediaType
  fileName         String
  fileSize         Int
  mimeType         String
  order            Int            @default(0) @db.SmallInt
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  bankQuestionId   String
  bankQuestion     BankQuestion   @relation(fields: [bankQuestionId], references: [id], onDelete: Cascade)
  
  @@index([bankQuestionId])
  @@index([bankQuestionId, order])
}

// 問題バンクのタグ
model BankQuestionTag {
  id               String         @id @default(cuid())
  bankQuestionId   String
  tagId            String
  bankQuestion     BankQuestion   @relation(fields: [bankQuestionId], references: [id], onDelete: Cascade)
  tag              Tag            @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([bankQuestionId, tagId])
  @@index([bankQuestionId])
  @@index([tagId])
}

// カテゴリー（階層構造）
model Category {
  id               String                    @id @default(cuid())
  name             String
  slug             String                    @unique
  description      String?
  parentId         String?
  teamId           String
  createdAt        DateTime                  @default(now())
  updatedAt        DateTime                  @updatedAt
  
  // リレーション
  team             Team                      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  parent           Category?                 @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children         Category[]                @relation("CategoryHierarchy")
  questions        BankQuestionCategory[]
  
  @@index([teamId])
  @@index([parentId])
  @@index([slug])
}

// 問題とカテゴリーの関連
model BankQuestionCategory {
  id               String         @id @default(cuid())
  bankQuestionId   String
  categoryId       String
  bankQuestion     BankQuestion   @relation(fields: [bankQuestionId], references: [id], onDelete: Cascade)
  category         Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([bankQuestionId, categoryId])
  @@index([bankQuestionId])
  @@index([categoryId])
}

// クイズと問題バンクの関連（利用履歴）
model QuizBankQuestion {
  id               String         @id @default(cuid())
  quizId           String
  questionId       String         // 既存のQuestionテーブルのID
  bankQuestionId   String
  addedAt          DateTime       @default(now())
  
  quiz             Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question         Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  bankQuestion     BankQuestion   @relation(fields: [bankQuestionId], references: [id], onDelete: Restrict)
  
  @@unique([quizId, questionId])
  @@index([quizId])
  @@index([bankQuestionId])
  @@index([addedAt])
}

// 問題の難易度
enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
}
```

### 2.2 既存テーブルの更新

```prisma
// Tagテーブルに問題バンクのタグ関連を追加
model Tag {
  id               String              @id @default(cuid())
  name             String              @unique
  color            String?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  quizzes          QuizTag[]
  bankQuestions    BankQuestionTag[]   // 追加
}

// Teamテーブルに関連を追加
model Team {
  // ... 既存フィールド
  bankQuestions    BankQuestion[]      // 追加
  categories       Category[]          // 追加
}

// Userテーブルに関連を追加
model User {
  // ... 既存フィールド
  bankQuestions    BankQuestion[]      @relation("BankQuestionCreator")  // 追加
}

// Questionテーブルに関連を追加
model Question {
  // ... 既存フィールド
  bankRelations    QuizBankQuestion[]  // 追加
}

// Quizテーブルに関連を追加
model Quiz {
  // ... 既存フィールド
  bankQuestions    QuizBankQuestion[]  // 追加
}
```

## 3. API設計

### 3.1 Server Actions (src/lib/actions/question-bank.ts)

```typescript
// 問題バンクのServer Actions
export interface BankQuestionFilter {
  teamId: string;
  type?: QuestionType[];
  difficulty?: QuestionDifficulty[];
  tags?: string[];
  categoryIds?: string[];
  searchQuery?: string;
  createdByUserId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface BankQuestionSort {
  field: 'createdAt' | 'updatedAt' | 'usageCount' | 'difficulty' | 'text';
  order: 'asc' | 'desc';
}

export interface BankQuestionWithRelations extends BankQuestion {
  options: BankQuestionOption[];
  media: BankQuestionMedia[];
  tags: Array<{ tag: Tag }>;
  categories: Array<{ category: Category }>;
  _count: {
    quizQuestions: number;  // 使用回数
  };
}

// 問題一覧取得
export async function getBankQuestions({
  filter,
  sort = { field: 'createdAt', order: 'desc' },
  page = 1,
  limit = 20,
}: {
  filter: BankQuestionFilter;
  sort?: BankQuestionSort;
  page?: number;
  limit?: number;
}): Promise<{
  questions: BankQuestionWithRelations[];
  total: number;
  pages: number;
}> {
  // 実装
}

// 問題作成
export async function createBankQuestion(
  teamId: string,
  data: {
    type: QuestionType;
    text: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    correctAnswer?: any;
    points?: number;
    hint?: string;
    explanation?: string;
    difficulty?: QuestionDifficulty;
    tagIds?: string[];
    categoryIds?: string[];
    media?: Array<{
      url: string;
      type: MediaType;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>;
  }
): Promise<BankQuestionWithRelations> {
  // 実装
}

// 問題更新
export async function updateBankQuestion(
  questionId: string,
  data: Partial<Parameters<typeof createBankQuestion>[1]>
): Promise<BankQuestionWithRelations> {
  // 実装
}

// 問題削除
export async function deleteBankQuestion(
  questionId: string
): Promise<void> {
  // 実装
}

// 問題をクイズに追加
export async function addBankQuestionsToQuiz(
  quizId: string,
  bankQuestionIds: string[],
  options?: {
    sectionId?: string;
    startOrder?: number;
  }
): Promise<Question[]> {
  // 実装：問題バンクの問題をコピーしてクイズに追加
}

// カテゴリー管理
export async function getCategories(
  teamId: string
): Promise<Category[]> {
  // 実装：階層構造を保持したカテゴリーツリーを返す
}

export async function createCategory(
  teamId: string,
  data: {
    name: string;
    description?: string;
    parentId?: string;
  }
): Promise<Category> {
  // 実装
}

// AI問題生成
export async function generateBankQuestions(
  teamId: string,
  params: {
    topic: string;
    difficulty: QuestionDifficulty;
    count: number;
    types: QuestionType[];
    language: 'ja' | 'en';
  }
): Promise<BankQuestionWithRelations[]> {
  // 実装：AI APIを呼び出して問題を生成
}

// インポート/エクスポート
export async function importBankQuestions(
  teamId: string,
  file: File,
  options: {
    format: 'csv' | 'excel';
    mapping: Record<string, string>;
  }
): Promise<{
  imported: number;
  failed: Array<{ row: number; error: string }>;
}> {
  // 実装
}

export async function exportBankQuestions(
  filter: BankQuestionFilter,
  format: 'csv' | 'excel'
): Promise<Blob> {
  // 実装
}
```

### 3.2 API Routes

```typescript
// /api/question-bank/import/route.ts
export async function POST(request: Request) {
  // ファイルアップロードとインポート処理
}

// /api/question-bank/export/route.ts
export async function POST(request: Request) {
  // エクスポート処理とファイルダウンロード
}

// /api/question-bank/ai-generate/route.ts
export async function POST(request: Request) {
  // AI生成処理（ストリーミングレスポンス対応）
}
```

## 4. UI/UXコンポーネント設計

### 4.1 ページ構成

```typescript
// /app/[lng]/dashboard/question-bank/page.tsx
interface QuestionBankPageProps {
  params: { lng: string };
  searchParams: {
    page?: string;
    type?: string;
    difficulty?: string;
    tag?: string;
    category?: string;
    search?: string;
  };
}

// メインページコンポーネント
export default async function QuestionBankPage({
  params,
  searchParams,
}: QuestionBankPageProps) {
  // Server Componentで初期データ取得
}
```

### 4.2 コンポーネント構成

```
src/components/question-bank/
├── QuestionBankHeader.tsx          # ヘッダー（タイトル、追加ボタン等）
├── QuestionBankFilters.tsx         # 検索・フィルターバー
├── CategoryNavigation.tsx          # カテゴリーツリーナビゲーション
├── TagCloud.tsx                    # タグクラウド表示
├── QuestionList.tsx                # 問題一覧（リスト/グリッド切替対応）
├── QuestionCard.tsx                # 個別問題カード
├── QuestionPreviewModal.tsx        # 問題プレビューモーダル
├── QuestionEditModal.tsx           # 問題編集モーダル
├── BulkActions.tsx                 # 一括操作（削除、エクスポート等）
├── ImportExportPanel.tsx           # インポート/エクスポートパネル
├── AiGenerationPanel.tsx           # AI生成パネル
├── QuestionMediaManager.tsx        # メディア管理コンポーネント
└── hooks/
    ├── useQuestionBank.ts          # 問題バンクのカスタムフック
    ├── useQuestionFilters.ts       # フィルター管理
    └── useQuestionSelection.ts     # 選択状態管理
```

### 4.3 状態管理

```typescript
// src/stores/useQuestionBankStore.ts
interface QuestionBankStore {
  // フィルター状態
  filters: {
    types: QuestionType[];
    difficulty: QuestionDifficulty[];
    tags: string[];
    categoryIds: string[];
    searchQuery: string;
  };
  
  // UI状態
  viewMode: 'list' | 'grid';
  selectedQuestions: Set<string>;
  
  // モーダル状態
  editingQuestion: BankQuestionWithRelations | null;
  isImportModalOpen: boolean;
  isAiGenerationModalOpen: boolean;
  
  // アクション
  setFilter: (filter: Partial<QuestionBankStore['filters']>) => void;
  toggleQuestionSelection: (questionId: string) => void;
  selectAllQuestions: (questionIds: string[]) => void;
  clearSelection: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  openEditModal: (question: BankQuestionWithRelations) => void;
  closeEditModal: () => void;
}
```

## 5. 機能実装詳細

### 5.1 検索・フィルタリング

- 全文検索（問題文、選択肢、解説を対象）
- 複数条件でのAND/OR検索
- タグによる絞り込み（複数選択可）
- カテゴリー階層での絞り込み
- 難易度フィルター
- 作成日時での範囲指定
- 使用回数でのソート

### 5.2 問題の再利用

- クイズ作成画面から問題バンクを参照
- 問題をコピーしてクイズに追加（参照関係を保持）
- 問題の使用履歴トラッキング
- 元の問題が更新された場合の通知機能

### 5.3 カテゴリー管理

- 階層構造（最大3階層）
- ドラッグ&ドロップでの並び替え
- カテゴリー別の問題数表示
- パンくずナビゲーション

### 5.4 AI問題生成

- トピックと難易度を指定して生成
- 生成後の編集・調整機能
- 生成履歴の保存
- バッチ生成（最大20問）

### 5.5 インポート/エクスポート

- CSV/Excelフォーマット対応
- テンプレートファイル提供
- カラムマッピング機能
- バリデーションエラーの詳細表示
- 進捗表示とキャンセル機能

## 6. セキュリティ・権限管理

### 6.1 アクセス制御

- プロプラン以上でのみ利用可能
- チーム内での問題共有
- 作成者による編集・削除権限
- 管理者による一括管理

### 6.2 データ保護

- 問題の完全削除時の確認
- 使用中の問題の削除防止
- バックアップ・リストア機能

## 7. パフォーマンス最適化

### 7.1 データベース

- 適切なインデックス設定
- ページネーション（20問/ページ）
- 検索クエリの最適化
- キャッシュ戦略

### 7.2 UI/UX

- 仮想スクロール（大量データ表示時）
- 遅延ローディング（画像・動画）
- オプティミスティックUI更新
- デバウンス検索

## 8. 今後の拡張計画

- 問題のバージョン管理
- 問題の共同編集機能
- 外部問題バンクとの連携
- 問題の自動タグ付け（AI活用）
- 問題の品質スコアリング