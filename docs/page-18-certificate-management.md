# 18. 証明書管理ページ

## 概要
プロプラン以上で利用可能な合格証/修了証の管理ページ。証明書テンプレートのカスタマイズ、発行、検証、追跡などの機能を提供する。

## ページ構成
1. **ページヘッダー**
   - 「証明書管理」タイトル
   - 「新規テンプレート作成」CTAボタン
   - クイズ選択ドロップダウン（発行済み証明書表示用）

2. **テンプレート管理タブ**
   - テンプレート一覧
     - テンプレート名
     - プレビュー画像
     - 使用クイズ数
     - 作成日/更新日
   - テンプレート編集機能
     - デザインエディター
       - レイアウト選択
       - 色/フォント設定
       - ロゴ/背景設定
       - 署名画像アップロード
     - テキスト編集
       - タイトル
       - 本文テンプレート
       - 変数挿入（受験者名、スコア、日付など）
     - 設定
       - 有効期限設定
       - QRコード/検証コード表示設定
       - 自動発行条件

3. **発行済み証明書タブ**
   - 発行済み証明書一覧
     - 受験者名
     - クイズ名
     - 発行日
     - 有効期限
     - ダウンロード回数
     - ステータス（有効/無効/期限切れ）
   - フィルター/検索機能
   - 一括操作
     - 再発行
     - 無効化
     - リマインダー送信

4. **証明書詳細ビュー**
   - 証明書プレビュー
   - 基本情報
     - 発行ID
     - 受験者情報
     - クイズ情報
     - スコア/合格基準
     - 発行日/有効期限
   - アクション
     - ダウンロード（PDF）
     - メール送信
     - 無効化/再発効
     - 検証URL表示

5. **検証設定**
   - 公開検証ページの設定
   - 検証方法選択
     - QRコード
     - 検証コード入力
     - 受験者情報照合
   - プライバシー設定
     - 表示情報選択
     - アクセス制限

6. **一括操作パネル**
   - 合格者への一括発行
   - テンプレート切り替え
   - 一括メール送信
   - インポート/エクスポート

## 技術仕様
- **コンポーネント構成**
  - `CertificateHeader.tsx`
  - `TemplateTabs.tsx`
  - `TemplateCard.tsx`
  - `CertificateDesignEditor.tsx`
  - `CertificateTextEditor.tsx`
  - `IssuedCertificatesTable.tsx`
  - `CertificateDetailView.tsx`
  - `VerificationSettings.tsx`
  - `BulkOperationsPanel.tsx`

- **状態管理**
  - `useCertificatesStore.ts` - Zustandストア
    - 選択されたタブ
    - 選択されたテンプレート
    - デザイン編集状態
    - 発行証明書フィルター
  - TanStack Query
    - テンプレート一覧取得
    - 発行済み証明書取得
    - 証明書詳細取得

- **証明書テンプレートデータ**
  ```typescript
  interface CertificateTemplate {
    id: string;
    name: string;
    design: {
      layout: 'landscape' | 'portrait';
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      logoUrl?: string;
      backgroundUrl?: string;
      signatureUrl?: string;
    };
    content: {
      title: string;
      bodyTemplate: string;
      footerText?: string;
    };
    settings: {
      validityPeriod?: number; // 日数、nullは無期限
      showVerificationQR: boolean;
      showVerificationCode: boolean;
      autoIssueThreshold?: number; // 合格点以上で自動発行
    };
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
  }
  ```

- **発行済み証明書データ**
  ```typescript
  interface IssuedCertificate {
    id: string;
    certificateNumber: string;
    templateId: string;
    quizId: string;
    respondentId: string;
    respondentName: string;
    respondentEmail: string;
    score: number;
    issueDate: Date;
    expiryDate?: Date;
    status: 'active' | 'revoked' | 'expired';
    downloadCount: number;
    lastDownloadedAt?: Date;
    verificationCode: string;
    verificationUrl: string;
    pdfUrl: string;
  }
  ```

- **デザインエディタ**
  - PDFプレビュー生成
  - リアルタイム編集反映
  - ドラッグ&ドロップ要素配置

- **PDF生成システム**
  - サーバーサイドPDF生成
  - QRコード埋め込み
  - 固有ID/検証コード付与

- **検証システム**
  - 公開検証ページ
  - QRコードスキャン機能
  - 証明書データベース照合

- **API連携**
  - テンプレート管理: `/api/certificate-templates`
  - テンプレート編集: `/api/certificate-templates/:id`
  - 証明書発行: `/api/certificates/issue`
  - 証明書管理: `/api/certificates/:id`
  - 一括操作: `/api/certificates/bulk`
  - 証明書検証: `/api/certificates/verify/:code`

- **レスポンシブ設計**
  - モバイル: 証明書の閲覧と基本管理機能
  - タブレット: 簡易編集機能と管理機能
  - デスクトップ: フル機能デザインエディタと詳細管理機能

## Next.js移行考慮事項
- テンプレート一覧表示はServer Componentで実装
- デザインエディタはクライアントコンポーネント化
- PDF生成はAPI Routesとして実装
- 証明書発行・管理機能はServer Actionsとして実装
- テンプレート保存・更新はServer Actionとして実装