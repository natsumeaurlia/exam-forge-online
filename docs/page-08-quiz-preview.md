# 8. クイズプレビューページ

## 概要

クイズエディタから直接アクセスできるシンプルなプレビューページ。作成中のクイズが実際の受験者にどのように表示されるかを確認し、問題の流れやUIを検証できる。編集内容がリアルタイムに反映される。

## ページ構成

1. **プレビューヘッダー**

   - 「プレビューモード」バッジ
   - 「編集に戻る」ボタン（クイズエディタへ）
   - 「詳細プレビュー」リンク（page-20への誘導）
   - デバイス切替（デスクトップ/モバイル）

2. **クイズ開始画面**

   - クイズタイトル
   - クイズ説明文
   - 問題数・合格点・時間制限の表示
   - 「開始する」ボタン

3. **受験者情報入力**（設定に応じて表示）

   - 名前入力フィールド
   - メールアドレス入力フィールド
   - カスタムフィールド（設定されている場合）
   - 「クイズを開始」ボタン

4. **問題表示エリア**

   - 問題番号表示（例：1/10）
   - 進捗バー
   - タイマー表示（時間制限がある場合）
   - 問題文
   - メディア表示（画像・動画・音声）
   - 回答選択肢（問題タイプに応じた表示）
   - ヒント表示ボタン（設定されている場合）

5. **ナビゲーション**

   - 「前へ」「次へ」ボタン
   - 問題番号ジャンプ（プロプラン）
   - 「提出」ボタン

6. **結果表示**（自動採点モードの場合）

   - スコア表示
   - 合格/不合格判定
   - 問題ごとの正解/不正解
   - 解説表示（設定されている場合）

7. **プレビュー機能パネル**

   - 回答をリセット
   - 特定の問題にジャンプ
   - 言語切替（ja/en）

## 技術仕様

- **コンポーネント構成**

  - `QuizPreviewHeader.tsx`
  - `QuizStartScreen.tsx`
  - `ParticipantForm.tsx`
  - `QuestionDisplay.tsx`
  - `QuestionNavigation.tsx`
  - `ResultsSummary.tsx`
  - `PreviewControls.tsx`
  - `ResponsiveContainer.tsx`

- **状態管理**

  - `useQuizPreviewStore.ts` - Zustandストア
    - 現在の問題インデックス
    - 模擬回答データ
    - プレビュー設定
    - デバイスモード

  ```typescript
  interface QuizPreviewState {
    currentQuestionIndex: number;
    mockAnswers: Record<string, any>;
    deviceMode: 'desktop' | 'mobile';
    isStarted: boolean;
    isCompleted: boolean;
    startTime: Date | null;
    // アクション
    startQuiz: () => void;
    submitAnswer: (questionId: string, answer: any) => void;
    navigateToQuestion: (index: number) => void;
    resetPreview: () => void;
  }
  ```

- **データ連携**

  - クイズエディタの最新データを取得
  - 編集内容のリアルタイム反映
  - 保存されていない変更も含めて表示

- **レスポンシブ表示**

  - デスクトップ: 標準レイアウト
  - モバイル: タッチ最適化されたUI
  - タブレット: 中間レイアウト

- **プレビュー専用機能**

  - データは保存されない
  - いつでもリセット可能
  - 問題間の自由な移動
  - 模擬タイマー（実際には制限なし）

- **API連携**

  - クイズデータ取得: `/api/quizzes/:id/preview-data`
  - 編集中データの一時取得: エディタストアから直接

- **ルーティング**

  - `/[lng]/dashboard/quizzes/[id]/preview`

## Next.js移行考慮事項

- Server Component でクイズデータを初期取得
- Client Component でインタラクティブなプレビュー機能を実装
- エディタとの状態共有は Context または URL パラメータで実現
- モバイル/デスクトップ切替は CSS とメディアクエリで対応

## 他ページとの関係

- **page-07（クイズエディタ）**: 「プレビュー」ボタンから遷移、編集画面に戻る
- **page-20（詳細プレビュー）**: より高度なプレビュー機能が必要な場合に誘導
- **page-12（クイズ受験）**: 実際の受験ページと同じUIを使用

## 特記事項

- プレビューデータは一切保存されない
- 編集中の未保存データも含めてプレビュー可能
- シンプルで軽量な実装を優先
- 基本的な動作確認に特化