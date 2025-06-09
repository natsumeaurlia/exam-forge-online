# ExamForge Infrastructure

このディレクトリには、ExamForgeのインフラストラクチャ設定が含まれています。

## ディレクトリ構造

```
infra/
├── terraform/
│   └── stripe/     # Stripe課金システムの設定
└── README.md
```

## Stripe設定

### 前提条件

1. Stripe CLIがインストール済み
2. Stripeアカウントにログイン済み
3. Terraformがインストール済み（v1.0以上）

### セットアップ手順

1. Stripe APIキーの設定

```bash
# Stripe CLIでログイン（既にログイン済みの場合はスキップ）
stripe login

# APIキーを環境変数に設定
export STRIPE_API_KEY=$(stripe config --list | grep 'test_key' | awk '{print $3}')
```

2. Terraform変数の設定

```bash
cd infra/terraform/stripe
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集して適切な値を設定
```

3. Terraformの初期化と適用

```bash
# 初期化
terraform init

# 計画の確認
terraform plan

# 適用
terraform apply
```

### 作成されるリソース

- **Products（商品）**
  - Free Plan: 個人利用向け無料プラン
  - Pro Plan: チーム向けプロプラン  
  - Enterprise Plan: 大規模組織向けプラン

- **Prices（価格）**
  - Pro月額: ¥2,980/ユーザー/月
  - Pro年額: ¥29,760/ユーザー/年

- **Webhook Endpoint**
  - 課金イベントを受信するためのエンドポイント

- **Customer Portal**
  - 顧客がサブスクリプションを管理するためのポータル

### 環境変数

アプリケーションで使用する環境変数：

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product IDs (Terraform出力から取得)
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

### Webhook設定

Terraformで作成されたWebhookシークレットを環境変数に設定：

```bash
# Webhookシークレットを取得
terraform output -raw webhook_endpoint_secret
```

## 注意事項

- 本番環境では必ず本番用のStripe APIキーを使用してください
- Webhookエンドポイントは実際のドメインに更新してください
- `terraform.tfvars`ファイルは機密情報を含むため、絶対にGitにコミットしないでください