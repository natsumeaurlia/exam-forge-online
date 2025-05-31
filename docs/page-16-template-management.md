# 16. テンプレート管理ページ

## 概要

プロプラン以上で利用可能なクイズテンプレート管理ページ。よく使用するクイズ形式や設定をテンプレートとして保存・管理し、新規クイズ作成時に再利用できる。

## ページ構成

1. **ページヘッダー**

   - 「テンプレート管理」タイトル
   - 「新規テンプレート作成」主要CTAボタン
   - 表示切替（リスト/グリッド）
   - インポート/エクスポートボタン

2. **テンプレートギャラリー**

   - システム提供テンプレート
     - 標準テスト
     - アンケート
     - 資格試験
     - クイズゲーム
     - ナレッジチェック
   - カスタムテンプレート
     - ユーザーが作成したテンプレート

3. **テンプレート一覧**

   - 各テンプレートカードに表示する情報：
     - テンプレート名
     - 説明/用途
     - プレビュー画像
     - 問題タイプの構成
     - 作成日/更新日
     - 使用回数
   - アクションボタン：
     - 「このテンプレートを使用」
     - 編集
     - 複製
     - 削除
     - 共有（テナント内）

4. **テンプレート詳細/編集画面**

   - 基本情報
     - テンプレート名
     - 説明
     - カテゴリ/タグ
     - プレビュー画像設定
   - 構造設定
     - 問題タイプの構成
     - セクション構成
     - デフォルト設定（時間制限、合格点など）
   - デザイン設定（プロプラン）
     - カラーテーマ
     - フォント設定
     - ヘッダー/フッター設定
   - プレビュー

5. **テンプレート作成フロー**

   - 既存クイズからの作成
   - ゼロからの作成
   - テンプレート情報入力
   - 構造設定
   - デザイン設定
   - プレビューと保存

6. **テンプレート共有設定**
   - テナント内の共有設定
     - 全員に共有
     - 特定チームに共有
     - 特定メンバーに共有
   - 権限設定
     - 閲覧のみ
     - 使用可能
     - 編集可能

## 技術仕様

- **コンポーネント構成**

  - `TemplateHeader.tsx`
  - `TemplateGallery.tsx`
  - `TemplateCard.tsx`
  - `TemplateDetailView.tsx`
  - `TemplateEditForm.tsx`
  - `TemplateStructureEditor.tsx`
  - `TemplateDesignEditor.tsx`
  - `TemplatePreview.tsx`
  - `TemplateSharingSettings.tsx`

- **状態管理**

  - `useTemplateStore.ts` - Zustandストア
    - 選択されたテンプレート
    - 編集中のテンプレート状態
    - フィルター/表示設定
  - TanStack Query
    - テンプレート一覧取得
    - テンプレート詳細取得
    - クイズ一覧取得（テンプレート作成用）

- **テンプレートデータモデル**

  ```typescript
  interface QuizTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category?: string;
    tags: string[];
    structure: {
      sections: TemplateSection[];
      defaultSettings: {
        timeLimit?: number;
        passingScore?: number;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
        // その他の設定
      };
    };
    design?: {
      theme: {
        primaryColor: string;
        secondaryColor: string;
        textColor: string;
        backgroundColor: string;
      };
      font?: string;
      headerImage?: string;
      footerText?: string;
    };
    isSystemTemplate: boolean;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    sharing: {
      mode: 'private' | 'team' | 'tenant';
      teamIds?: string[];
      memberIds?: string[];
      permissions: 'view' | 'use' | 'edit';
    };
  }
  ```

- **プレビュー機能**

  - インタラクティブなプレビュー
  - モバイル/デスクトップビュー切替
  - テーマ変更のリアルタイム反映

- **テンプレート共有システム**

  - 権限管理
  - 通知機能

- **API連携**

  - テンプレート一覧取得: `/api/templates`
  - テンプレート詳細取得: `/api/templates/:id`
  - テンプレートCRUD操作: `/api/templates/:id`
  - クイズからテンプレート作成: `/api/templates/from-quiz/:quizId`
  - テンプレートからクイズ作成: `/api/quizzes/from-template/:templateId`
  - 共有設定管理: `/api/templates/:id/sharing`

- **レスポンシブ設計**
  - モバイル: 単一カラムカード表示、簡略化された編集フォーム
  - タブレット: 2カラムグリッド、基本編集機能
  - デスクトップ: マルチカラムレイアウト、フル編集機能

## Next.js移行考慮事項

- テンプレート一覧/ギャラリー表示はServer Componentで実装
- テンプレート編集UIはクライアントコンポーネント化
- プレビュー機能はクライアントコンポーネントとして実装
- テンプレートCRUD操作はServer Actionsで実装
- 共有設定管理もServer Actionsで実装
