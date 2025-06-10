# LMSモード設計書

## 概要

ExamForgeにLMS（Learning Management System）モードを追加し、ユーザーが独自の学習プラットフォームを構築できる機能を提供します。Craft.jsを使用したページビルダー、ユーザー認証、課金機能を統合した包括的なソリューションです。

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    ExamForge LMS Mode                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js + Craft.js)                             │
│  ├─ Page Builder (Craft.js)                               │
│  ├─ Theme System                                          │
│  ├─ Component Library                                     │
│  └─ User Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Next.js API Routes)                          │
│  ├─ Site Management                                       │
│  ├─ User Authentication                                   │
│  ├─ Payment Processing                                    │
│  └─ Content Management                                    │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                     │
│  ├─ Sites & Pages                                         │
│  ├─ User Management                                       │
│  ├─ Subscriptions                                         │
│  └─ Content & Courses                                     │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ├─ Stripe (Payment)                                      │
│  ├─ Cloudflare (DNS)                                      │
│  └─ AWS S3 (File Storage)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 主要機能

### 1. ページビルダー (Craft.js)

#### 利用可能コンポーネント
```typescript
interface LMSComponents {
  layout: {
    Container: React.FC;
    Grid: React.FC;
    Section: React.FC;
    Column: React.FC;
  };
  content: {
    Text: React.FC;
    Heading: React.FC;
    Image: React.FC;
    Video: React.FC;
    Button: React.FC;
    Card: React.FC;
  };
  forms: {
    ContactForm: React.FC;
    LoginForm: React.FC;
    RegistrationForm: React.FC;
    PaymentForm: React.FC;
  };
  learning: {
    CourseCard: React.FC;
    LessonList: React.FC;
    ProgressBar: React.FC;
    Quiz: React.FC;
    Certificate: React.FC;
  };
  navigation: {
    Header: React.FC;
    Footer: React.FC;
    Sidebar: React.FC;
    Breadcrumb: React.FC;
  };
}
```

#### ページテンプレート
- **ランディングページ**: マーケティング向け
- **コース一覧ページ**: 学習コンテンツ表示
- **コース詳細ページ**: コース説明と購入
- **ダッシュボード**: 学習者向け管理画面
- **ログイン/登録ページ**: 認証フロー
- **決済ページ**: サブスクリプション管理
- **お問い合わせページ**: サポート窓口

### 2. 独自ドメイン対応

#### DNS管理システム
```typescript
interface DomainConfig {
  id: string;
  siteId: string;
  domain: string;
  subdomain?: string;
  status: 'pending' | 'active' | 'error';
  sslEnabled: boolean;
  createdAt: Date;
  verifiedAt?: Date;
}

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  ttl: number;
}
```

#### 対応ドメイン形式
- サブドメイン: `{tenant}.examforge.com`
- 独自ドメイン: `learning.company.com`
- サブパス: `company.com/learning`

### 3. ユーザー認証システム

#### マルチテナント認証
```typescript
interface LMSUser {
  id: string;
  siteId: string; // どのLMSサイトに属するか
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  subscription?: UserSubscription;
  progress: CourseProgress[];
  createdAt: Date;
}

interface UserSubscription {
  id: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string;
}
```

#### 認証フロー
1. **登録**: サイト固有の登録フォーム
2. **ログイン**: サイト内認証
3. **パスワードリセット**: サイト固有
4. **ソーシャルログイン**: Google, GitHub対応

### 4. 課金機能統合

#### サブスクリプションモデル
```typescript
interface SubscriptionPlan {
  id: string;
  siteId: string;
  name: string;
  description: string;
  price: number;
  currency: 'JPY' | 'USD';
  interval: 'monthly' | 'yearly';
  features: string[];
  stripePriceId: string;
  active: boolean;
}

interface Payment {
  id: string;
  userId: string;
  siteId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  stripePaymentIntentId: string;
  createdAt: Date;
}
```

#### 課金パターン
- **月額サブスクリプション**: 継続課金
- **年額サブスクリプション**: 割引適用
- **単発購入**: コース個別購入
- **ティア制課金**: 複数プラン対応

### 5. コース管理機能

#### コース構造
```typescript
interface Course {
  id: string;
  siteId: string;
  title: string;
  description: string;
  thumbnail?: string;
  price?: number;
  lessons: Lesson[];
  quizzes: Quiz[];
  certificates: Certificate[];
  published: boolean;
  createdAt: Date;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string; // HTML content from page builder
  videoUrl?: string;
  duration?: number; // minutes
  order: number;
  published: boolean;
}

interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  completedQuizzes: string[];
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
}
```

## データベース設計

### 新規テーブル

#### sites テーブル
```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  custom_domain VARCHAR(255),
  theme_config JSONB,
  settings JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### pages テーブル
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  content JSONB NOT NULL, -- Craft.js content
  meta_title VARCHAR(255),
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, slug)
);
```

#### lms_users テーブル
```sql
CREATE TABLE lms_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'student',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, email)
);
```

#### courses テーブル
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail VARCHAR(500),
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'JPY',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### lessons テーブル
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  video_url VARCHAR(500),
  duration INTEGER, -- minutes
  order_index INTEGER NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### course_enrollments テーブル
```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  user_id UUID NOT NULL REFERENCES lms_users(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  progress DECIMAL(5,2) DEFAULT 0,
  UNIQUE(course_id, user_id)
);
```

#### subscriptions テーブル
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  user_id UUID NOT NULL REFERENCES lms_users(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API設計

### LMS API エンドポイント

#### サイト管理
```typescript
// GET /api/lms/sites - サイト一覧取得
// POST /api/lms/sites - サイト作成
// GET /api/lms/sites/[id] - サイト詳細取得
// PUT /api/lms/sites/[id] - サイト更新
// DELETE /api/lms/sites/[id] - サイト削除

interface CreateSiteRequest {
  name: string;
  slug: string;
  domain?: string;
  theme: string;
}
```

#### ページ管理
```typescript
// GET /api/lms/sites/[siteId]/pages - ページ一覧
// POST /api/lms/sites/[siteId]/pages - ページ作成
// GET /api/lms/sites/[siteId]/pages/[pageId] - ページ詳細
// PUT /api/lms/sites/[siteId]/pages/[pageId] - ページ更新

interface CreatePageRequest {
  title: string;
  slug: string;
  content: object; // Craft.js content
  template?: string;
}
```

#### ユーザー管理
```typescript
// POST /api/lms/sites/[siteId]/auth/register - ユーザー登録
// POST /api/lms/sites/[siteId]/auth/login - ログイン
// POST /api/lms/sites/[siteId]/auth/logout - ログアウト
// GET /api/lms/sites/[siteId]/users - ユーザー一覧

interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}
```

#### コース管理
```typescript
// GET /api/lms/sites/[siteId]/courses - コース一覧
// POST /api/lms/sites/[siteId]/courses - コース作成
// GET /api/lms/sites/[siteId]/courses/[courseId] - コース詳細
// POST /api/lms/sites/[siteId]/courses/[courseId]/enroll - コース登録

interface CreateCourseRequest {
  title: string;
  description: string;
  price?: number;
  lessons: CreateLessonRequest[];
}
```

## 実装フェーズ

### Phase 1: 基盤構築 (2ヶ月)
1. **データベース設計**: 新規テーブル作成
2. **認証システム**: マルチテナント対応
3. **ドメイン管理**: DNS連携機能
4. **基本API**: CRUD操作

### Phase 2: ページビルダー (2ヶ月)
1. **Craft.js統合**: エディター実装
2. **コンポーネント開発**: LMS専用コンポーネント
3. **テンプレート作成**: 基本レイアウト
4. **プレビュー機能**: リアルタイム確認

### Phase 3: 課金システム (1ヶ月)
1. **Stripe統合**: サブスクリプション
2. **決済フロー**: チェックアウト画面
3. **管理機能**: 課金状況確認
4. **Webhook処理**: 自動更新

### Phase 4: コース機能 (1ヶ月)
1. **コース管理**: 作成・編集機能
2. **レッスン機能**: 動画・テキスト対応
3. **進捗管理**: 学習追跡
4. **証明書**: 自動発行

### Phase 5: 最適化・拡張 (継続)
1. **パフォーマンス**: 高速化
2. **SEO対応**: メタデータ管理
3. **分析機能**: 利用状況追跡
4. **機能拡張**: ユーザー要望対応

## セキュリティ対策

### データ保護
- **テナント分離**: サイト間データ分離
- **暗号化**: 機密データ暗号化
- **アクセス制御**: ロールベース権限
- **監査ログ**: 操作履歴記録

### 決済セキュリティ
- **PCI DSS準拠**: Stripe利用
- **トークン化**: カード情報非保存
- **不正検知**: 異常取引監視
- **セキュアAPI**: HTTPS必須

## 運用・保守

### モニタリング
- **サイト稼働監視**: アップタイム確認
- **パフォーマンス**: レスポンス時間
- **エラー追跡**: 障害早期発見
- **使用量監視**: リソース管理

### バックアップ
- **データバックアップ**: 日次自動実行
- **ファイルバックアップ**: 画像・動画保存
- **復旧手順**: 災害対応準備
- **テスト復旧**: 定期確認

## 成功指標

### 技術指標
- **サイト作成時間**: 30分以内
- **ページロード速度**: 2秒以内
- **稼働率**: 99.9%以上
- **セキュリティ**: 脆弱性ゼロ

### ビジネス指標
- **LMSモード利用率**: 60%以上
- **平均サイト数**: 2.5サイト/ユーザー
- **月間課金額**: ¥50,000/サイト
- **継続率**: 85%以上

## 結論

LMSモードの実装により、ExamForgeは教育機関や企業が独自の学習プラットフォームを構築できる包括的なソリューションとなります。Craft.jsによる直感的なページビルダー、柔軟な課金システム、独自ドメイン対応により、競合他社との大きな差別化を実現します。