# 7. クイズ作成/編集ページ

## 概要
クイズの作成と編集を行うメインページ。動的フォームビルダー、問題タイプの選択、ドラッグ&ドロップによる順序変更、メディア埋め込み（プロプラン）などの機能を提供する。作成したクイズを独自サブドメインで公開できる。

## ページ構成
1. **ページヘッダー**
   - クイズタイトル（編集可能）
   - 保存状態インジケーター
   - 「プレビュー」ボタン
   - 「公開設定」ボタン（サブドメイン設定など）
   - 「保存」ボタン

2. **クイズメタデータセクション**
   - 説明入力（リッチテキストエディタ）
   - タグ入力
   - 表紙画像アップロード（プロプラン）
   - 合格点設定
   - 採点モード表示（自動/手動 - 作成時に選択済み）
   - 共有設定表示（URL/パスワード - 作成時に選択済み）

3. **問題タイプツールバー**
   - 問題タイプボタン
     - マルバツ問題
     - 指定択一問題
     - 複数選択問題
     - 自由記述問題
     - 高度な問題タイプ（プロプラン）
       - 並べ替え問題
       - 穴埋め問題
       - 図形指示問題
       - マッチング問題
       - 数値入力問題
   - 問題バンクから追加（プロプラン）

4. **問題リスト**
   - ドラッグ&ドロップで並べ替え可能な問題カード
   - 各問題カードに表示する情報：
     - 問題番号
     - 問題タイプアイコン
     - 問題文（切り詰め表示）
     - 配点
     - 展開/折りたたみボタン
     - 複製/削除ボタン

5. **問題編集フォーム**
   - 問題タイプに応じた動的フォーム
   - 問題文入力（リッチテキストエディタ）
   - メディア追加ボタン（画像、音声、動画）（プロプラン）
   - 回答選択肢管理
     - 選択肢テキスト入力（選択問題の場合）
     - 正解チェックボックス/ラジオボタン
   - 配点設定
   - ヒント入力（オプション）
     - 「ヒントを追加」ボタン
     - ヒントテキスト入力フィールド
   - 解説入力（オプション）
     - 「解説を追加」ボタン
     - 解説テキスト入力フィールド（リッチテキスト）

6. **セクション管理**（プロプラン）
   - セクション追加/削除
   - セクション間の問題移動
   - セクションタイトル・説明編集

7. **設定サイドパネル**
   - 時間制限設定（プロプラン）
   - 問題シャッフル設定（プロプラン）
   - 選択肢シャッフル設定（プロプラン）
   - 回答制限設定
   - 合格証設定（プロプラン）
   - 条件分岐設定（プロプラン）

8. **公開設定モーダル**
   - サブドメイン設定
     - カスタムサブドメイン入力フィールド
     - 利用可能性即時チェック
     - 例: `my-quiz.quizservice.com`
   - 公開期間設定
   - パスワード保護設定（共有モードで選択済みの場合）
   - 「公開」ボタン

## 技術仕様
- **コンポーネント構成**
  - `QuizEditorHeader.tsx`
  - `QuizMetadataForm.tsx`
  - `QuestionTypeToolbar.tsx`
  - `QuestionList.tsx`
  - `QuestionCard.tsx`
  - `DraggableQuestion.tsx`
  - `QuestionEditForm.tsx`
  - `QuestionTypeForm/` - 各問題タイプのフォームコンポーネント
    - `TrueFalseForm.tsx`
    - `MultipleChoiceForm.tsx`
    - `CheckboxForm.tsx`
    - `ShortAnswerForm.tsx`
    - `AdvancedQuestionForms/` - プロプラン問題タイプ
  - `HintEditor.tsx`
  - `ExplanationEditor.tsx`
  - `SectionManager.tsx`
  - `QuizSettingsPanel.tsx`
  - `MediaUploader.tsx`
  - `RichTextEditor.tsx`
  - `PublishSettingsModal.tsx`

- **状態管理**
  - `useQuizEditorStore.ts` - Zustandストア
    - クイズメタデータ
    - 問題リスト
    - 現在編集中の問題
    - 保存状態
    - 編集履歴（Undo/Redo）
  
  ```typescript
  interface QuizEditorState {
    quiz: {
      id?: string;
      title: string;
      description: string;
      tags: string[];
      passingScore: number;
      scoringType: 'auto' | 'manual'; // 作成時に選択済み
      sharingMode: 'url' | 'password'; // 作成時に選択済み
      password?: string;
      coverImage?: string;
      subdomain?: string;
      // ... 他のメタデータ
    };
    questions: Question[];
    sections: Section[];
    currentQuestionIndex: number | null;
    isSaving: boolean;
    isDirty: boolean;
    history: {
      past: Array<{quiz: Quiz, questions: Question[]}>;
      future: Array<{quiz: Quiz, questions: Question[]}>;
    };
    // ... アクション
  }
  
  interface Question {
    id: string;
    type: 'true-false' | 'multiple-choice' | 'checkbox' | 'short-answer' | 'advanced-type';
    text: string;
    options?: QuestionOption[];
    correctAnswer: any; // 問題タイプによって異なる形式
    points: number;
    hint?: string; // オプショナルのヒント
    explanation?: string; // オプショナルの解説
    // ... 他のプロパティ
  }
  ```

- **採点モードによる表示分岐**
  - 自動採点モード: 
    - 問題入力フォームの下に「正解」設定セクションが表示される
    - 問題タイプに応じた正解設定UI（ラジオボタン、チェックボックスなど）
  - 手動採点モード:
    - 問題入力フォームの下に「採点基準」入力欄が表示される
    - 配点の詳細設定が可能

- **動的フォームビルダー**
  - 問題タイプに応じたフォーム要素の動的生成
  - ドラッグ&ドロップでの問題順序変更
  - 選択肢の追加/削除/並べ替え

- **ドラッグ&ドロップ実装**
  - React DnD または react-beautiful-dndを使用

- **リッチテキストエディタ**
  - TipTap または Slate.jsを使用
  - 問題文、解説文での書式設定

- **自動保存機能**
  - 変更検出による定期的な自動保存
  - 保存状態インジケーター

- **サブドメイン設定検証**
  ```typescript
  const subdomainSchema = z.object({
    subdomain: z.string()
      .min(3, 'サブドメインは3文字以上必要です')
      .max(30, 'サブドメインは30文字以下にしてください')
      .regex(/^[a-z0-9-]+$/, '小文字、数字、ハイフンのみ使用可能です')
  });
  ```

- **API連携**
  - クイズデータ取得: `/api/quizzes/:id`
  - クイズ保存: `/api/quizzes/:id` (PUT/PATCH)
  - 問題操作: `/api/quizzes/:id/questions`
  - メディアアップロード: `/api/upload`
  - サブドメイン利用可能チェック: `/api/check-subdomain`
  - クイズ公開: `/api/quizzes/:id/publish`

- **レスポンシブ設計**
  - モバイル: スタック表示、編集中の問題のみ表示
  - タブレット: 2カラムレイアウト（問題リスト + 編集フォーム）
  - デスクトップ: 3カラムレイアウト（問題リスト + 編集フォーム + 設定パネル）

## Next.js移行考慮事項
- フォームコンポーネントはすべてクライアントコンポーネント化
- クイズデータの初期読み込みはServer Componentで実装
- 保存処理はServer Actionとして実装
- メディアアップロードはAPI Routeとして維持
- サブドメイン設定・公開処理はServer Actionとして実装取得: `/api/quizzes/:id`
  - クイズ保存: `/api/quizzes/:id` (PUT/PATCH)
  - 問題操作: `/api/quizzes/:id/questions`
  - メディアアップロード: `/api/upload`

- **レスポンシブ設計**
  - モバイル: スタック表示、編集中の問題のみ表示
  - タブレット: 2カラムレイアウト（問題リスト + 編集フォーム）
  - デスクトップ: 3カラムレイアウト（問題リスト + 編集フォーム + 設定パネル）

## Next.js移行考慮事項
- フォームコンポーネントはすべてクライアントコンポーネント化
- クイズデータの初期読み込みはServer Componentで実装
- 保存処理はServer Actionとして実装
- メディアアップロードはAPI Routeとして維持