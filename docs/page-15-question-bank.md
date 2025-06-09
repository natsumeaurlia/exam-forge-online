# 15. 問題バンクページ

## 概要

プロプラン以上で利用可能な問題バンク機能のページ。様々な問題を保存・管理し、複数のクイズで再利用できる。タグ付け、検索、フィルタリングなどの機能を提供する。

## ページ構成

1. **ページヘッダー**

   - 「問題バンク」タイトル
   - 「問題を追加」主要CTAボタン
   - 表示切替（リスト/グリッド）
   - インポート/エクスポートボタン

2. **検索・フィルターバー**

   - 検索入力フィールド
   - フィルタードロップダウン
     - 問題タイプ
     - 難易度
     - 作成日
     - タグ
     - カテゴリー
   - 並べ替えドロップダウン
     - 最新順
     - 利用頻度
     - 難易度
     - タイトル（アルファベット順）

3. **タグクラウド/カテゴリーナビゲーション**

   - よく使われるタグの表示
   - カテゴリーツリー表示
   - 「新規タグ/カテゴリー追加」リンク

4. **問題一覧**

   - 各問題カード/行に表示する情報：
     - 問題タイプアイコン
     - 問題テキスト（切り詰め表示）
     - タグ
     - 難易度
     - 使用されているクイズ数
     - 最終使用日
   - アクションボタン：
     - 編集
     - 複製
     - 削除
     - クイズに追加（ドロップダウンメニュー）

5. **問題追加/編集モーダル**

   - 問題タイプ選択
   - 問題文入力（リッチテキストエディタ）
   - 回答選択肢設定（問題タイプに応じて）
   - 解説入力
   - 難易度設定
   - タグ設定
   - カテゴリー設定
   - メディア追加（画像/音声/動画）（プロプラン）
     - 複数ファイル同時アップロード
     - ドラッグ&ドロップ対応
     - 対応フォーマット：
       - 画像：JPEG, PNG, GIF, WebP（最大10MB）
       - 動画：MP4, WebM, OGG, MOV（最大500MB）
     - アップロード済みメディアの管理
     - ストレージ使用量表示

6. **一括インポート/エクスポートセクション**

   - CSV/Excelテンプレートダウンロード
   - ファイルアップロード
   - マッピング設定
   - インポートプレビュー
   - エクスポート設定（フィルター適用可能）

7. **AIによる問題生成**（プロプラン機能）
   - トピック入力
   - 難易度選択
   - 問題数指定
   - 問題タイプ選択
   - 生成開始ボタン
   - 生成結果プレビューと編集

## 技術仕様

- **コンポーネント構成**

  - `QuestionBankHeader.tsx`
  - `SearchFilterBar.tsx`
  - `TagCategoryNavigation.tsx`
  - `QuestionList.tsx`
  - `QuestionCard.tsx`
  - `QuestionEditModal.tsx`
  - `ImportExportPanel.tsx`
  - `AiGenerationPanel.tsx`

- **状態管理**

  - `useQuestionBankStore.ts` - Zustandストア
    - 検索/フィルター条件
    - 選択された問題
    - 表示モード
    - モーダル状態
  - TanStack Query
    - 問題一覧取得
    - カテゴリー/タグ取得
    - クイズ一覧取得（問題追加用）

- **タグ/カテゴリーシステム**

  - 階層構造のカテゴリー
  - フラットなタグシステム
  - オートコンプリートタグ入力

- **問題データモデル**

  ```typescript
  interface BankQuestion {
    id: string;
    type: QuestionType;
    text: string;
    options?: QuestionOption[];
    correctAnswer: any; // 問題タイプによって異なる形式
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    categoryId?: string;
    mediaUrls: string[]; // MinIOに保存されたメディアのURL
    media?: MediaAttachment[]; // 詳細なメディア情報（プロプラン）
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    lastUsedAt?: Date;
  }

  interface MediaAttachment {
    id: string;
    type: 'image' | 'video';
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    order: number;
    uploadedAt: Date;
  }
  ```

- **メディア管理**

  - 画像/音声/動画のプレビュー
  - 最適化とリサイズ
  - ストレージ使用量の追跡
  - MinIOバックエンドでのオブジェクトストレージ
  - ユーザーごとの10GB制限管理（プロプラン）
  - CDN経由での高速配信

- **一括インポート/エクスポート**

  - CSV/Excel処理（SheetJSライブラリ）
  - バリデーションと問題報告
  - 進捗表示

- **AI問題生成**

  - AI API連携
  - 生成パラメータカスタマイズ
  - 生成後編集機能

- **API連携**

  - 問題一覧取得: `/api/question-bank`
  - 問題CRUD操作: `/api/question-bank/:id`
  - タグ/カテゴリー管理: `/api/question-bank/categories`
  - インポート/エクスポート: `/api/question-bank/import`, `/api/question-bank/export`
  - AI生成: `/api/question-bank/generate`

- **レスポンシブ設計**
  - モバイル: 単一カラム、簡略化されたカード表示
  - タブレット: 2カラムグリッドまたは詳細リスト
  - デスクトップ: マルチカラムレイアウト、サイドバーナビゲーション

## Next.js移行考慮事項

- 問題一覧取得はServer Componentで実装
- フィルタリング/検索ロジックはServer Actionsで実装
- インタラクティブUIはクライアントコンポーネント化
- AI生成機能はAPI Routes（またはServer Action）として実装
- 一括インポート/エクスポートはAPI Routesとして実装
