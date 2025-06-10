# ナレッジベース機能 総合設計書

## 概要

ナレッジベースシステムは、ExamForgeのAI搭載自動問題生成をサポートするために設計されています。様々な科目と難易度レベルにわたって文脈に関連した問題を生成するために使用できる教育コンテンツの中央リポジトリとして機能します。

## 1. システムアーキテクチャ

### 1.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    ユーザーインターフェース                    │
├─────────────────────────────────────────────────────────┤
│                      ビジネスロジック層                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ コンテンツ   │  │   AI生成    │  │  品質管理   │     │
│  │   管理      │  │   エンジン   │  │  システム   │     │
│  └────────────┘  └────────────┘  └────────────┘     │
├─────────────────────────────────────────────────────────┤
│                      データアクセス層                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ PostgreSQL │  │   MinIO    │  │   Redis    │     │
│  │    DB      │  │  Storage   │  │   Cache    │     │
│  └────────────┘  └────────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 コアコンポーネント

1. **ナレッジベースストレージ**
   - 構造化されたコンテンツリポジトリ
   - 複数のコンテンツタイプのサポート（テキスト、画像、図表、数式）
   - コンテンツ更新のバージョン管理
   - 効率的な取得のためのメタデータタグ付け

2. **コンテンツ処理パイプライン**
   - ドキュメント取り込み（PDF、DOCX、TXT、MD）
   - コンテンツの解析と構造化
   - エンティティ抽出と関係マッピング
   - AI検索のためのセマンティックインデックス

3. **AI問題生成エンジン**
   - コンテキスト認識型問題生成
   - 複数の問題タイプサポート
   - 難易度レベルの校正
   - 解答検証システム

4. **品質保証システム**
   - 生成された問題のレビューワークフロー
   - ヒューマン・イン・ザ・ループ検証
   - パフォーマンスメトリクスの追跡
   - 継続的改善フィードバックループ

## 2. データベーススキーマ

### 2.1 schema.prismaへの追加

以下のモデルを既存の`schema.prisma`ファイルに追加します：

```prisma
// ==========================================
// ナレッジベースモデル
// ==========================================

model KnowledgeDomain {
  id              String            @id @default(cuid())
  name            String
  description     String?
  parentId        String?
  parent          KnowledgeDomain?  @relation("SubDomains", fields: [parentId], references: [id])
  subDomains      KnowledgeDomain[] @relation("SubDomains")
  
  // リレーション
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  entries         KnowledgeEntry[]
  templates       QuestionTemplate[]
  
  // タイムスタンプ
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([parentId])
}

model KnowledgeEntry {
  id              String            @id @default(cuid())
  title           String
  content         String            @db.Text
  contentType     ContentType       @default(TEXT)
  summary         String?           @db.Text
  
  // ドメイン関係
  domainId        String
  domain          KnowledgeDomain   @relation(fields: [domainId], references: [id], onDelete: Cascade)
  
  // メタデータと検索
  metadata        Json?             @db.Json
  tags            String[]
  keywords        String[]
  
  // セマンティック検索用埋め込み（オプション - pgvector拡張が必要）
  // embedding     Float[]          @db.Vector(1536) // OpenAI埋め込み用
  
  // 所有権
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])
  
  // バージョン管理
  version         Int               @default(1)
  status          KnowledgeStatus   @default(DRAFT)
  publishedAt     DateTime?
  
  // リレーション
  sources         KnowledgeSource[]
  usedInQuestions GeneratedQuestionKnowledge[]
  
  // タイムスタンプ
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([domainId])
  @@index([status])
  @@index([createdById])
  @@fulltext([title, content])
}

model KnowledgeSource {
  id              String            @id @default(cuid())
  name            String
  type            SourceType
  url             String?
  fileKey         String?           // アップロードファイル用のS3/MinIOキー
  fileName        String?
  fileSize        Int?              // バイト単位
  mimeType        String?
  
  // 親エントリー
  entryId         String
  entry           KnowledgeEntry    @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  // メタデータ
  metadata        Json?             @db.Json
  
  // タイムスタンプ
  createdAt       DateTime          @default(now())
  
  @@index([entryId])
}

model QuestionTemplate {
  id              String            @id @default(cuid())
  name            String
  description     String?
  
  // 問題設定
  questionType    QuestionType
  prompt          String            @db.Text // プロンプトテンプレート
  systemPrompt    String?           @db.Text // AI用システム指示
  
  // ドメイン特性（オプション）
  domainId        String?
  domain          KnowledgeDomain?  @relation(fields: [domainId], references: [id], onDelete: SetNull)
  
  // 設定
  difficulty      DifficultyLevel
  maxTokens       Int               @default(500)
  temperature     Float             @default(0.7)
  
  // 設定
  isActive        Boolean           @default(true)
  requiresReview  Boolean           @default(true)
  
  // 所有権
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // 使用状況追跡
  usageCount      Int               @default(0)
  successRate     Float?            // 承認された問題の割合
  
  // リレーション
  generatedQuestions GeneratedQuestion[]
  
  // タイムスタンプ
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([domainId])
  @@index([isActive])
}

model GeneratedQuestion {
  id              String            @id @default(cuid())
  
  // 実際の問題へのリンク
  questionId      String            @unique
  question        Question          @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  // 生成詳細
  templateId      String
  template        QuestionTemplate  @relation(fields: [templateId], references: [id])
  prompt          String            @db.Text // 実際に使用されたプロンプト
  response        String            @db.Text // 完全なAIレスポンス
  
  // AI詳細
  model           String            // 例："gpt-4"、"claude-3"
  modelVersion    String?
  confidence      Float?            // AI信頼スコア（0-1）
  tokensUsed      Int?
  
  // ナレッジソース
  knowledgeSources GeneratedQuestionKnowledge[]
  
  // レビューワークフロー
  status          GenerationStatus  @default(PENDING_REVIEW)
  reviewedById    String?
  reviewedBy      User?             @relation(fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  reviewNotes     String?           @db.Text
  
  // 品質メトリクス
  editCount       Int               @default(0) // 編集回数
  originalText    String?           @db.Text // 編集された場合のオリジナルを保存
  
  // タイムスタンプ
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([templateId])
  @@index([status])
  @@index([reviewedById])
  @@index([createdAt])
}

// 多対多関係のためのジャンクションテーブル
model GeneratedQuestionKnowledge {
  id              String            @id @default(cuid())
  
  generatedQuestionId String
  generatedQuestion   GeneratedQuestion @relation(fields: [generatedQuestionId], references: [id], onDelete: Cascade)
  
  knowledgeEntryId    String
  knowledgeEntry      KnowledgeEntry    @relation(fields: [knowledgeEntryId], references: [id], onDelete: Cascade)
  
  relevanceScore  Float?            // このナレッジの関連性（0-1）
  
  @@unique([generatedQuestionId, knowledgeEntryId])
  @@index([generatedQuestionId])
  @@index([knowledgeEntryId])
}

// ==========================================
// Enum定義
// ==========================================

enum ContentType {
  TEXT
  MARKDOWN
  HTML
  PDF
  IMAGE
  VIDEO
  FORMULA
  DIAGRAM
  CODE
}

enum SourceType {
  UPLOAD
  WEB_SCRAPE
  MANUAL_ENTRY
  API_IMPORT
  YOUTUBE
  WIKIPEDIA
}

enum KnowledgeStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  PROCESSING
  ERROR
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum GenerationStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  EDITED
  AUTO_APPROVED
}
```

### 2.2 マイグレーション手順

1. **スキーマを`schema.prisma`ファイルに追加**
2. **マイグレーションを生成**：
   ```bash
   cd web
   pnpm db:migrate
   ```

3. **Prismaクライアントを更新**：
   ```bash
   pnpm db:generate
   ```

### 2.3 インデックスとパフォーマンス

#### 推奨される追加インデックス

```sql
-- 高速ナレッジ検索用
CREATE INDEX idx_knowledge_entry_search ON "KnowledgeEntry" USING GIN (to_tsvector('english', title || ' ' || content));

-- タグベースのフィルタリング用
CREATE INDEX idx_knowledge_entry_tags ON "KnowledgeEntry" USING GIN (tags);

-- キーワード検索用
CREATE INDEX idx_knowledge_entry_keywords ON "KnowledgeEntry" USING GIN (keywords);

-- パフォーマンストラッキング用
CREATE INDEX idx_generated_question_created ON "GeneratedQuestion" (created_at DESC);
CREATE INDEX idx_generated_question_template_status ON "GeneratedQuestion" (template_id, status);
```

#### オプション：pgvectorを使用したベクトル検索

セマンティック検索を有効にする場合：

```sql
-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 埋め込みカラムを追加
ALTER TABLE "KnowledgeEntry" ADD COLUMN embedding vector(1536);

-- 類似性検索用のインデックスを作成
CREATE INDEX idx_knowledge_entry_embedding ON "KnowledgeEntry" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## 3. UI/UX設計

### 3.1 ナレッジベース管理画面

#### 3.1.1 メイン画面構成
```
┌─────────────────────────────────────────────────┐
│ [←] ナレッジベース  [検索____] [+新規] [⚙設定]   │
├─────────────┬───────────────────────────────────┤
│ 分野一覧     │  コンテンツ一覧                    │
│             │ ┌─────────────────────────────┐ │
│ ▼ 数学      │ │ □ 二次関数の基礎        │ │
│   ▷ 代数    │ │    2024/01/15 PDF 15頁   │ │
│   ▼ 幾何    │ ├─────────────────────────────┤ │
│     • 図形  │ │ □ 三角形の性質          │ │
│     • 証明  │ │    2024/01/10 Word 8頁   │ │
│ ▷ 英語      │ └─────────────────────────────┘ │
│             │ [1] [2] [3] ... [10]  次へ →     │
└─────────────┴───────────────────────────────────┘
```

#### 3.1.2 コンテンツ詳細画面
```
┌─────────────────────────────────────────────────┐
│ [←戻る]  二次関数の基礎  [編集] [削除]          │
├─────────────────────────────────────────────────┤
│ 基本情報                                        │
│ ├ 分野: 数学 > 代数 > 二次関数                  │
│ ├ 対象: 高校1年生                              │
│ ├ 作成: 2024/01/15 山田太郎                    │
│ └ ソース: textbook_ch3.pdf                     │
├─────────────────────────────────────────────────┤
│ コンテンツプレビュー                            │
│ ┌─────────────────────────────────────────┐ │
│ │ 二次関数 y = ax² + bx + c について...     │ │
│ │                                          │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ 関連情報                                        │
│ • タグ: #二次関数 #グラフ #頂点               │
│ • 生成済み問題: 45問                          │
│ • 最終利用: 2024/02/01                        │
└─────────────────────────────────────────────────┘
```

### 3.2 AI問題生成画面

#### 3.2.1 生成ウィザード（ステップ1: コンテンツ選択）
```
┌─────────────────────────────────────────────────┐
│ AI問題生成 - ステップ 1/4                       │
├─────────────────────────────────────────────────┤
│ 📚 出題範囲を選択してください                   │
│                                                │
│ □ 分野から選択                                 │
│   [数学 > 代数 > 二次関数 ▼]                  │
│                                                │
│ ☑ 特定のコンテンツを選択                       │
│   ├ ☑ 二次関数の基礎                         │
│   ├ ☑ 二次関数のグラフ                       │
│   └ □ 二次関数の応用                         │
│                                                │
│ □ キーワードで絞り込み                         │
│   [頂点、軸、判別式_____]                     │
│                                                │
│ 選択済み: 2件                                  │
├─────────────────────────────────────────────────┤
│ [キャンセル]              [次へ: 問題設定 →]    │
└─────────────────────────────────────────────────┘
```

#### 3.2.2 生成ウィザード（ステップ2: 問題設定）
```
┌─────────────────────────────────────────────────┐
│ AI問題生成 - ステップ 2/4                       │
├─────────────────────────────────────────────────┤
│ ⚙️ 生成する問題の設定                          │
│                                                │
│ 問題数: [10_____] 問                          │
│                                                │
│ 問題形式:                                      │
│ ☑ 選択式（4択）    [6] 問                    │
│ ☑ 正誤問題         [2] 問                    │
│ ☑ 穴埋め問題       [2] 問                    │
│ □ 記述式           [0] 問                    │
│                                                │
│ 難易度配分:                                    │
│ 初級 [###___] 30%                             │
│ 中級 [#####_] 50%                             │
│ 上級 [##____] 20%                             │
│                                                │
│ 詳細オプション ▼                              │
├─────────────────────────────────────────────────┤
│ [← 戻る]                    [次へ: 確認 →]     │
└─────────────────────────────────────────────────┘
```

#### 3.2.3 生成結果確認画面
```
┌─────────────────────────────────────────────────┐
│ AI問題生成 - 生成完了                           │
├─────────────────────────────────────────────────┤
│ ✅ 10問の問題が生成されました                   │
│                                                │
│ 生成された問題:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Q1. [選択式] 二次関数 y = x² - 4x + 3... │ │
│ │ [✓承認] [編集] [削除]                   │ │
│ ├─────────────────────────────────────────┤ │
│ │ Q2. [正誤] 放物線の頂点は...            │ │
│ │ [✓承認] [編集] [削除]                   │ │
│ └─────────────────────────────────────────┘ │
│                                                │
│ 一括操作: [全て承認] [全て編集モード]          │
├─────────────────────────────────────────────────┤
│ [やり直す]    [選択した問題をクイズに追加 →]    │
└─────────────────────────────────────────────────┘
```

### 3.3 レビュー・編集画面

#### 3.3.1 問題編集モード
```
┌─────────────────────────────────────────────────┐
│ 問題を編集                                [×]   │
├─────────────────────────────────────────────────┤
│ 問題文:                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 二次関数 y = x² - 4x + 3 の頂点の座標は？│ │
│ └─────────────────────────────────────────┘ │
│                                                │
│ 選択肢:                                        │
│ ○ (2, -1)  ← 正答                            │
│ ○ (2, 1)                                     │
│ ○ (-2, -1)                                   │
│ ○ (-2, 1)                                    │
│ [+ 選択肢を追加]                              │
│                                                │
│ 解説:                                          │
│ ┌─────────────────────────────────────────┐ │
│ │ 平方完成により y = (x-2)² - 1 となり... │ │
│ └─────────────────────────────────────────┘ │
│                                                │
│ 難易度: [初級 ▼]  配点: [2] 点               │
├─────────────────────────────────────────────────┤
│ [キャンセル]                      [保存]        │
└─────────────────────────────────────────────────┘
```

## 4. API設計

### 4.1 ナレッジベースAPI

#### ナレッジ管理エンドポイント
```typescript
// ナレッジ管理
POST   /api/knowledge/domains
GET    /api/knowledge/domains
PUT    /api/knowledge/domains/:id
DELETE /api/knowledge/domains/:id

// コンテンツ管理
POST   /api/knowledge/entries
GET    /api/knowledge/entries
PUT    /api/knowledge/entries/:id
DELETE /api/knowledge/entries/:id
POST   /api/knowledge/entries/:id/upload

// 検索と取得
POST   /api/knowledge/search
GET    /api/knowledge/entries/by-domain/:domainId
GET    /api/knowledge/entries/:id/related

// AI生成
POST   /api/ai/generate-questions
GET    /api/ai/templates
POST   /api/ai/templates
PUT    /api/ai/templates/:id

// レビューワークフロー
GET    /api/ai/generated-questions
PUT    /api/ai/generated-questions/:id/review
POST   /api/ai/generated-questions/:id/approve
POST   /api/ai/generated-questions/:id/reject
```

#### コンテンツアップロード
```
POST /api/knowledge/upload
Content-Type: multipart/form-data

Request:
{
  "file": <binary>,
  "domainId": "domain123",
  "metadata": {
    "gradeLevel": "high1",
    "tags": ["二次関数", "数学"]
  }
}

Response:
{
  "entryId": "entry456",
  "status": "processing",
  "estimatedTime": 30
}
```

#### コンテンツ検索
```
GET /api/knowledge/search?q=二次関数&domain=math

Response:
{
  "results": [
    {
      "id": "entry123",
      "title": "二次関数の基礎",
      "excerpt": "二次関数 y = ax² + bx + c について...",
      "relevance": 0.95
    }
  ],
  "total": 15,
  "page": 1
}
```

### 4.2 AI生成API

#### 問題生成リクエスト
```
POST /api/ai/generate

Request:
{
  "knowledgeEntryIds": ["entry123", "entry456"],
  "config": {
    "count": 10,
    "types": {
      "multipleChoice": 6,
      "trueFalse": 2,
      "fillInBlank": 2
    },
    "difficulty": {
      "beginner": 0.3,
      "intermediate": 0.5,
      "advanced": 0.2
    }
  }
}

Response:
{
  "jobId": "job789",
  "status": "queued",
  "estimatedTime": 60
}
```

#### 生成状況確認
```
GET /api/ai/jobs/job789

Response:
{
  "jobId": "job789",
  "status": "processing",
  "progress": {
    "total": 10,
    "completed": 6,
    "failed": 0
  },
  "estimatedTimeRemaining": 24
}
```

## 5. 実装詳細

### 5.1 コンテンツ登録機能

#### 5.1.1 ファイルアップロード処理
```
1. ファイル受信
   ├── ファイル形式チェック
   ├── ファイルサイズチェック（最大50MB）
   └── ウイルススキャン

2. コンテンツ抽出
   ├── PDF → テキスト変換（Apache PDFBox）
   ├── Word → テキスト変換（Apache POI）
   ├── 画像 → OCR処理（Google Cloud Vision）
   └── 動画 → 文字起こし（Whisper API）

3. 構造化処理
   ├── 見出し抽出
   ├── 段落分割
   ├── 重要語句抽出
   └── メタデータ生成

4. 保存処理
   ├── MinIOへファイル保存
   ├── PostgreSQLへメタデータ保存
   └── 検索インデックス更新
```

#### 5.1.2 Web取り込み処理
```
1. URL検証
   ├── アクセス可能性チェック
   └── robots.txt確認

2. コンテンツ取得
   ├── HTMLパース
   ├── 本文抽出
   └── 画像・リンク処理

3. 構造化・保存
   └── （ファイルアップロードと同様）
```

### 5.2 AI問題生成エンジン

#### 5.2.1 生成テンプレート
```
選択式問題テンプレート
├── プロンプトテンプレート
│   ├── システムプロンプト
│   └── ユーザープロンプト
├── 制約条件
│   ├── 選択肢数（4〜5）
│   ├── 文字数制限
│   └── 難易度指定
└── 後処理ルール
    ├── 選択肢シャッフル
    └── 正答位置調整
```

#### 5.2.2 生成フロー
```
1. コンテキスト準備
   ├── 関連ナレッジ取得
   ├── 重要概念抽出
   └── 参照情報整理

2. プロンプト構築
   ├── テンプレート選択
   ├── 変数置換
   └── 制約条件付与

3. AI生成実行
   ├── APIコール（OpenAI/Claude）
   ├── レスポンス受信
   └── 構造化データ変換

4. 品質検証
   ├── 形式チェック
   ├── 内容妥当性確認
   └── 重複チェック

5. 後処理
   ├── 形式整形
   ├── 難易度調整
   └── 解説生成
```

### 5.3 バッチ処理システム

#### 5.3.1 ジョブ管理
```
生成ジョブ
├── ジョブID
├── リクエスト内容
│   ├── 生成数
│   ├── 問題形式
│   └── パラメータ
├── ステータス
│   ├── 待機中
│   ├── 処理中
│   ├── 完了
│   └── エラー
├── 進捗情報
│   ├── 総数
│   ├── 完了数
│   └── 推定残り時間
└── 結果
    ├── 生成問題リスト
    └── エラーログ
```

#### 5.3.2 処理最適化
```
並列処理
├── 最大同時実行数: 5
├── タイムアウト: 5分/問題
└── リトライ: 最大3回

キャッシュ戦略
├── プロンプトキャッシュ（1時間）
├── 生成結果キャッシュ（24時間）
└── ナレッジキャッシュ（1週間）
```

## 6. データフロー

### 6.1 コンテンツ取り込みフロー

1. **アップロード/インポート**: ユーザーがドキュメントをアップロードまたはURLを提供
2. **処理**: システムがコンテンツを抽出し構造化
3. **エンリッチメント**: メタデータ、タグ、関係を追加
4. **保存**: 適切なインデックスでナレッジベースに保存
5. **検証**: 使用のためのコンテンツのレビューと承認

### 6.2 問題生成フロー

1. **コンテキスト選択**: ユーザーがナレッジドメインとパラメータを選択
2. **コンテンツ取得**: システムが関連するナレッジエントリーを取得
3. **AI生成**: テンプレートとAIモデルを使用して問題を生成
4. **検証**: 問題の品質と解答の正確性をチェック
5. **レビュー**: 最終承認のための人間によるレビュー
6. **統合**: 承認された問題をクイズに追加

## 7. セキュリティ設計

### 7.1 アクセス制御
```
権限マトリックス:
              │ 閲覧 │ 作成 │ 編集 │ 削除 │ AI生成 │
─────────────┼──────┼──────┼──────┼──────┼────────┤
オーナー      │  ○   │  ○   │  ○   │  ○   │   ○    │
管理者        │  ○   │  ○   │  ○   │  ○   │   ○    │
メンバー      │  ○   │  ○   │  ○   │  ×   │   ○    │
閲覧者        │  ○   │  ×   │  ×   │  ×   │   ×    │
```

### 7.2 データ保護
- 保存時暗号化（AES-256）
- 通信時暗号化（TLS 1.3）
- 定期バックアップ（日次）
- 監査ログ（1年保存）

### 7.3 AI安全性
- 不適切な素材のコンテンツフィルタリング
- 生成された問題のバイアス検出
- 自動承認のための品質しきい値

## 8. 統合ポイント

### 8.1 外部サービス
- **OpenAI API**: GPTベースの問題生成用
- **Claude API**: 高度な推論問題用
- **Google Cloud Vision**: 画像ベースのコンテンツ分析用
- **AWS Textract**: PDFコンテンツ抽出用

### 8.2 内部システム
- **クイズ管理**: 問題追加のための直接統合
- **分析**: 問題のパフォーマンスと難易度の追跡
- **ユーザー管理**: 許可ベースのアクセス制御
- **課金**: サブスクリプション層に基づく機能ゲート

## 9. パフォーマンス要件

### 9.1 レスポンスタイム
- コンテンツアップロード: 3秒以内（UIレスポンス）
- 検索: 1秒以内
- AI生成（10問）: 30秒〜1分
- 画面遷移: 0.5秒以内

### 9.2 同時実行数
- 同時アップロード: 最大10ファイル/ユーザー
- AI生成同時実行: 最大5ジョブ/チーム
- 検索同時実行: 制限なし

### 9.3 データ容量
- ナレッジベース: 
  - 無料: 100MB/チーム
  - Pro: 10GB/チーム
  - Premium: 無制限
- 生成履歴保存: 6ヶ月

## 10. パフォーマンス最適化

### 10.1 キャッシング戦略
- 頻繁にアクセスされるナレッジエントリー用のRedis
- 静的コンテンツ用のエッジキャッシング
- セマンティック検索用の埋め込みキャッシュ

### 10.2 検索最適化
- PostgreSQLを使用したフルテキスト検索
- セマンティッククエリ用のベクトル類似性検索
- 複雑なクエリ用のElasticsearch（オプション）

## 11. エラー処理

### 11.1 エラーコード体系
```
E1xxx: 入力エラー
├ E1001: ファイル形式エラー
├ E1002: ファイルサイズ超過
└ E1003: 必須項目未入力

E2xxx: 処理エラー
├ E2001: コンテンツ抽出失敗
├ E2002: AI生成失敗
└ E2003: タイムアウト

E3xxx: システムエラー
├ E3001: データベースエラー
├ E3002: ストレージエラー
└ E3003: 外部APIエラー
```

### 11.2 エラーメッセージ
```
ユーザー向けメッセージ例:
- "申し訳ございません。ファイルの処理中にエラーが発生しました。"
- "AI生成が混雑しています。しばらく待ってから再度お試しください。"
- "このファイル形式はサポートされていません。PDF、Word、テキストファイルをご利用ください。"
```

## 12. 監視と分析

### 12.1 主要メトリクス
- ドメイン別コンテンツカバレッジ
- 問題生成成功率
- 平均レビュー時間
- クイズでの問題パフォーマンス
- ユーザー満足度スコア

### 12.2 ロギング
- すべてのAI生成リクエスト
- コンテンツの変更
- アクセスパターン
- エラー率とタイプ

## 13. データ保持とクリーンアップ

### 13.1 アーカイブ戦略
- 6ヶ月以上前の`GeneratedQuestion`レコードをアーカイブ
- テンプレートの集計統計を保持
- 問題の整合性を維持するための`KnowledgeEntry`のソフト削除

### 13.2 クリーンアップクエリ
```sql
-- 古い生成問題をアーカイブ
UPDATE "GeneratedQuestion" 
SET status = 'ARCHIVED' 
WHERE created_at < NOW() - INTERVAL '6 months' 
AND status IN ('REJECTED', 'PENDING_REVIEW');

-- 孤立したナレッジソースをクリーンアップ
DELETE FROM "KnowledgeSource" 
WHERE entry_id NOT IN (SELECT id FROM "KnowledgeEntry");
```

## 14. サンプルデータ構造

### 14.1 ナレッジドメイン階層の例
```
数学
├── 代数
│   ├── 一次方程式
│   ├── 二次方程式
│   └── 多項式
├── 幾何
│   ├── 三角形
│   ├── 円
│   └── 立体図形
└── 微積分
    ├── 微分
    ├── 積分
    └── 極限
```

### 14.2 ナレッジエントリーの例
```json
{
  "title": "ピタゴラスの定理",
  "content": "直角三角形において、斜辺の2乗は他の2辺の2乗の和に等しい: a² + b² = c²",
  "contentType": "TEXT",
  "metadata": {
    "grade_level": "8-10",
    "difficulty": "intermediate",
    "prerequisites": ["基本的な代数", "平方根"],
    "related_concepts": ["三角法", "距離の公式"]
  },
  "tags": ["幾何", "三角形", "定理"],
  "keywords": ["ピタゴラス", "斜辺", "直角三角形"]
}
```

### 14.3 問題テンプレートの例
```json
{
  "name": "定義からの選択問題",
  "questionType": "MULTIPLE_CHOICE",
  "prompt": "以下のコンテンツに基づいて: {{content}}\n\n重要な概念の理解をテストする選択問題を生成してください。4つの選択肢を含め、1つだけが正しいものとします。誤答選択肢はもっともらしいが明らかに間違っているものにしてください。",
  "systemPrompt": "あなたは評価問題を作成する専門教育者です。問題が明確で、曖昧さがなく、暗記ではなく概念的理解をテストすることを確認してください。",
  "difficulty": "INTERMEDIATE",
  "maxTokens": 500,
  "temperature": 0.7
}
```

## 15. 今後の拡張

1. **多言語サポート**
   - コンテンツ翻訳
   - ローカライズされた問題生成

2. **高度なAI機能**
   - 適応的難易度調整
   - パーソナライズされた問題生成
   - 学習パス最適化

3. **コラボレーション機能**
   - チーム間での共有ナレッジベース
   - コミュニティ提供コンテンツ
   - ピアレビューシステム

4. **分析ダッシュボード**
   - コンテンツ効果メトリクス
   - 問題難易度の校正
   - 学生パフォーマンスの相関