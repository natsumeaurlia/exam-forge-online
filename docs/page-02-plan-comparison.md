# 2. プラン比較ページ

## 概要

各料金プランの詳細な比較を提供し、ユーザーが自分のニーズに最適なプランを選択できるようにするページ。

## ページ構成

1. **ヘッダーセクション**

   - 「料金プラン」見出し
   - サブテキスト「あなたのニーズに合ったプランをお選びください」
   - 「月額/年額」切り替えトグル（年額で約17%割引）

2. **プラン比較テーブル/カード**

   - 3つのプランを並べて表示：
     - フリープラン
     - プロプラン（推奨マーク付き）
     - エンタープライズプラン
   - 各プランに含まれる情報：
     - プラン名
     - 価格（月額/年額）
     - 簡単な説明
     - 主要制限（メンバー数、クイズ数など）
     - 含まれる機能リスト
     - CTAボタン（「無料で始める」「アップグレード」「お問い合わせ」）

3. **機能詳細比較表**

   - 横：プラン、縦：機能のテーブル形式
   - 基本機能と高度な機能を分けて表示
   - チェックマークまたは制限値で各プランの対応を表示

4. **FAQ セクション**

   - プラン関連のよくある質問（課金サイクル、アップグレード方法など）
   - アコーディオン形式で5〜7問

5. **最終CTA**
   - 「まだ迷っていますか？」見出し
   - 「無料で試してみる」CTAボタン
   - 「クレジットカード不要」サブテキスト

## 技術仕様

- **コンポーネント構成**

  - `PlanToggle.tsx` - 月額/年額切り替え
  - `PlanCard.tsx` - 個別プランカード
  - `FeatureComparisonTable.tsx` - 機能比較表
  - `PlanFaq.tsx` - プラン関連FAQ

- **状態管理**

  - `usePlanComparisonStore.ts` - Zustandストア
    - 月額/年額表示切替の状態
    - プラン選択状態

- **データ構造**

  ```typescript
  interface Plan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    isPopular: boolean;
    features: {
      members: number | string;
      quizzes: number | string;
      questionsPerQuiz: number | string;
      responsesPerMonth: number | string;
      storage: string;
    };
    includedFeatures: string[];
  }
  ```

- **API連携**

  - プラン情報は`/api/plans`エンドポイントから取得
  - ユーザーのプラン選択はStripeチェックアウトセッション作成

- **レスポンシブ設計**
  - モバイル：カードをスタック表示、テーブルを横スクロール
  - タブレット：カードを2カラム表示
  - デスクトップ：カードを3カラム表示

## Next.js移行考慮事項

- プラン情報取得はServer Componentで実装
- 月額/年額トグルはクライアントコンポーネント化
- プラン選択処理はServer Action化
