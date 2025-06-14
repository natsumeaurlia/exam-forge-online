# 監視・バックアップシステム設計・実装ドキュメント

## 概要

ExamForgeの本番運用に不可欠な監視・バックアップシステムを実装しました。このシステムは以下の主要機能を提供します：

- データベースバックアップ・復旧システム
- リアルタイム監視・ヘルスチェック
- システムメトリクス収集・分析
- エラートラッキング・集約

## 実装内容

### 1. データベースバックアップシステム

#### 主要ファイル
- `web/src/lib/backup.ts` - バックアップサービス
- `web/src/app/api/admin/backup/route.ts` - バックアップAPI
- `web/src/app/api/admin/backup/restore/route.ts` - 復旧API

#### 機能
- **フルバックアップ**: 完全なデータベースダンプ
- **増分バックアップ**: 最新変更のみ
- **S3ストレージ**: AWS S3への自動アップロード
- **メタデータ管理**: バックアップ履歴とステータス
- **自動クリーンアップ**: 古いバックアップの削除

#### 使用方法
```bash
# 管理者APIでバックアップ作成
POST /api/admin/backup
{
  "type": "full" | "incremental"
}

# バックアップ一覧取得
GET /api/admin/backup

# 復旧実行
POST /api/admin/backup/restore
{
  "backupId": "backup_123",
  "restoreType": "full" | "selective",
  "tables": ["User", "Quiz"] // selective時のみ
}
```

### 2. データベース復旧システム

#### 主要ファイル
- `web/src/lib/restore.ts` - 復旧サービス

#### 機能
- **完全復旧**: 全テーブルの復旧
- **選択的復旧**: 特定テーブルのみ復旧
- **事前バックアップ**: 復旧前の自動バックアップ
- **整合性検証**: 復旧後のデータ整合性チェック
- **復旧ポイント**: 任意時点への復旧機能

### 3. 本番監視システム

#### 主要ファイル
- `web/src/lib/monitoring.ts` - 監視サービス
- `web/src/app/api/health/route.ts` - ヘルスチェックAPI
- `web/src/app/api/admin/metrics/route.ts` - メトリクスAPI

#### 機能
- **ヘルスチェック**: データベース、Redis、S3、Stripe、アプリケーション
- **システムメトリクス**: CPU、メモリ、ディスク、ネットワーク
- **パフォーマンス監視**: レスポンス時間、スループット
- **アラート機能**: しきい値ベースのアラート
- **履歴管理**: 24時間〜1週間のメトリクス履歴

#### エンドポイント
```bash
# システム全体のヘルスチェック
GET /api/health

# 特定サービスのヘルスチェック
POST /api/health
{
  "service": "database"
}

# システムメトリクス取得
GET /api/admin/metrics?hours=24&type=system
```

### 4. エラートラッキングシステム

#### 主要ファイル
- `web/src/lib/error-tracking.ts` - エラートラッキングサービス
- `web/src/app/api/admin/errors/route.ts` - エラー管理API
- `web/src/middleware-error-tracking.ts` - エラー処理ミドルウェア

#### 機能
- **自動エラー捕捉**: 未処理例外の自動キャプチャ
- **コンテキスト収集**: リクエスト情報、ユーザー情報
- **エラー集約**: 類似エラーのグループ化
- **ブレッドクラム**: エラー発生前のアクション履歴
- **アラート連携**: 重要エラーの即座通知

#### 使用方法
```typescript
import { errorTracker } from '@/lib/error-tracking';

// 手動エラーキャプチャ
errorTracker.captureError(new Error('Something went wrong'), {
  userId: 'user123',
  teamId: 'team456'
}, 'error');

// ブレッドクラム追加
errorTracker.addBreadcrumb('User clicked submit', 'ui', 'info');
```

## 環境設定

### 必要な環境変数

```env
# S3バックアップ設定
BACKUP_S3_BUCKET=exam-forge-backups
AWS_REGION=ap-northeast-1
LOCAL_BACKUP_PATH=/tmp/backups
BACKUP_RETAIN_DAYS=30

# 管理者設定
ADMIN_EMAILS=admin@example.com,ops@example.com

# データベース設定（既存）
DATABASE_URL=postgresql://...
```

### データベースセットアップ

```bash
# 監視・バックアップテーブルの作成
cd web
psql -d exam_forge -f scripts/add-monitoring-tables.sql
```

### 必要なパッケージ

すべての依存関係は既存のpackage.jsonに含まれています：
- @aws-sdk/client-s3 (S3連携)
- @prisma/client (データベース)
- date-fns (日時処理)

## セキュリティ

### アクセス制御
- 管理者APIは環境変数`ADMIN_EMAILS`で制限
- 認証されたセッションが必要
- APIキーやトークンは適切に管理

### データ保護
- バックアップデータはS3で暗号化
- 機密情報はエラーログから除外
- データベース接続は暗号化通信

## 監視・アラート

### ヘルスチェック項目
- データベース接続・レスポンス時間
- 外部サービス可用性（Redis、S3、Stripe）
- アプリケーション状態（メモリ、アップタイム）

### メトリクス収集
- システムリソース使用率
- データベースパフォーマンス
- APIレスポンス時間
- エラー発生率

### アラート条件
- CPU使用率 > 80%（5分間継続）
- メモリ使用率 > 85%（3分間継続）
- データベース応答なし（1分間継続）
- エラー発生率スパイク（5分間で10件以上）

## 運用手順

### 日次運用
1. ヘルスチェック状況確認
2. システムメトリクス確認
3. エラーログレビュー
4. バックアップ実行状況確認

### 週次運用
1. バックアップ復旧テスト
2. アラート設定レビュー
3. パフォーマンス傾向分析
4. 古いログ・バックアップクリーンアップ

### 緊急時対応
1. アラート通知確認
2. ヘルスチェックでの問題特定
3. 必要に応じて復旧実行
4. インシデント記録・事後分析

## テスト

### 実装済みテスト
- `tests/monitoring/health-check.spec.ts`
- `tests/monitoring/backup-system.spec.ts`
- `tests/monitoring/error-tracking.spec.ts`
- `tests/monitoring/metrics-collection.spec.ts`

### テスト実行
```bash
cd web
pnpm test:chrome tests/monitoring/
```

## 今後の拡張

### 短期（1-2週間）
- Slack/Discord通知連携
- ダッシュボードUI実装
- より詳細なメトリクス収集

### 中期（1-2ヶ月）
- 予測分析・異常検知
- 自動スケーリング連携
- カスタムアラートルール

### 長期（3-6ヶ月）
- 機械学習ベースの異常検知
- 分散トレーシング
- マルチリージョン対応

## トラブルシューティング

### よくある問題

1. **バックアップ失敗**
   - S3アクセス権限確認
   - ディスク容量確認
   - PostgreSQLプロセス確認

2. **ヘルスチェックエラー**
   - データベース接続確認
   - 外部サービス状態確認
   - ネットワーク設定確認

3. **メトリクス収集停止**
   - プロセス再起動
   - データベース容量確認
   - ログファイル確認

### ログ確認方法
```bash
# アプリケーションログ
tail -f /var/log/examforge/app.log

# システムメトリクスログ
tail -f /var/log/examforge/metrics.log

# エラートラッキングログ
tail -f /var/log/examforge/errors.log
```

## 連絡先

技術的な問題や改善提案については、開発チームまでお問い合わせください。

- 緊急障害: on-call@examforge.com
- 一般的な問い合わせ: dev-team@examforge.com
- セキュリティ関連: security@examforge.com