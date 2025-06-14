# Resend APIキー取得・設定ガイド

## 概要
ResendはNext.jsアプリケーションでメール送信を簡単に実装できるサービスです。このガイドでは、APIキーの取得から設定までの手順を説明します。

## Resend APIキーの取得手順

### 1. アカウント作成
1. [Resend](https://resend.com)にアクセス
2. サインアップ（GitHub、Google、またはメールアドレス）
3. メールアドレスの確認

### 2. APIキーの作成
1. ダッシュボードにログイン
2. 左側メニューから「API Keys」を選択
3. 「Create API Key」ボタンをクリック
4. APIキーの設定：
   - **Name**: 用途がわかる名前（例: `examforge-production`, `examforge-development`）
   - **Permission**: 
     - `Full access`: 全機能が使用可能
     - `Sending access`: メール送信のみ（推奨）
5. 「Create」をクリック
6. **重要**: 表示されたAPIキーをコピー（この画面を離れると二度と表示されません）

### 3. ドメイン設定（本番環境用）
1. ダッシュボードの「Domains」セクションへ
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `examforge.com`）
4. DNS設定の指示に従ってレコードを追加：
   - SPFレコード
   - DKIMレコード
   - MXレコード（オプション）

## ExamForgeでの設定

### 1. 環境変数の設定

#### 開発環境（`.env.local`）
```bash
# Resend
RESEND_API_KEY=re_development_xxxxxxxxxxxxx
EMAIL_FROM=dev@examforge.com
```

#### 本番環境（`.env.production`）
```bash
# Resend
RESEND_API_KEY=re_production_xxxxxxxxxxxxx
EMAIL_FROM=noreply@examforge.com
```

### 2. 環境変数の確認
```bash
# 設定確認コマンド
echo $RESEND_API_KEY
```

### 3. Vercelでの設定（本番環境）
1. Vercelダッシュボードでプロジェクトを選択
2. Settings → Environment Variables
3. 以下を追加：
   - `RESEND_API_KEY`: 本番用APIキー
   - `EMAIL_FROM`: 送信元メールアドレス

## セキュリティベストプラクティス

### 1. APIキーの管理
- ✅ 環境ごとに異なるAPIキーを使用
- ✅ `.env`ファイルを`.gitignore`に追加
- ✅ 定期的にAPIキーをローテーション
- ❌ APIキーをソースコードにハードコーディングしない
- ❌ クライアントサイドでAPIキーを使用しない

### 2. 権限の制限
```javascript
// 推奨: 最小限の権限
permission: 'sending_access'

// 開発時のみ
permission: 'full_access'
```

### 3. APIキーの監視
- ダッシュボードで使用状況を定期的に確認
- 30日以上未使用のキーは削除
- 異常なアクセスパターンがないか監視

## トラブルシューティング

### よくある問題

#### 1. APIキーが無効
```
Error: Invalid API Key
```
**解決方法**:
- APIキーが正しくコピーされているか確認
- 環境変数が正しく読み込まれているか確認
- APIキーの権限を確認

#### 2. ドメイン未認証
```
Error: Domain not verified
```
**解決方法**:
- DNS設定が正しく反映されているか確認（最大48時間かかる場合あり）
- Resendダッシュボードでドメインステータスを確認

#### 3. レート制限
```
Error: Rate limit exceeded
```
**解決方法**:
- 無料プランの制限: 100通/日、3通/秒
- 有料プランへのアップグレードを検討

## 料金プラン

### 無料プラン
- 100通/日
- 3通/秒
- 1ドメイン
- 基本的なアナリティクス

### Proプラン（$20/月）
- 50,000通/月
- 10通/秒
- 無制限ドメイン
- 詳細なアナリティクス
- Webhooks

## 実装チェックリスト

- [ ] Resendアカウント作成
- [ ] APIキー生成（開発用）
- [ ] APIキー生成（本番用）
- [ ] 環境変数設定（ローカル）
- [ ] 環境変数設定（Vercel）
- [ ] ドメイン設定（本番のみ）
- [ ] DNS設定完了
- [ ] テストメール送信確認

## 参考リンク

- [Resend公式ドキュメント](https://resend.com/docs)
- [Next.js統合ガイド](https://resend.com/docs/send-with-nextjs)
- [React Emailテンプレート](https://react.email)
- [APIリファレンス](https://resend.com/docs/api-reference)

## サポート

問題が解決しない場合：
1. [Resend Status](https://status.resend.com)でサービス状態を確認
2. [Resend Support](https://resend.com/support)に問い合わせ
3. [Community Discord](https://discord.gg/resend)で質問