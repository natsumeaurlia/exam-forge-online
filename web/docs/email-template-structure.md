# React Emailテンプレート構造ガイド

## 概要
React Emailを使用したメールテンプレートの構造とベストプラクティスについて説明します。

## ディレクトリ構造

```
web/
├── src/
│   ├── emails/                    # メールテンプレート（開発用プレビュー）
│   │   ├── auth/                 # 認証関連
│   │   │   ├── welcome.tsx       # ウェルカムメール
│   │   │   ├── password-reset.tsx # パスワードリセット
│   │   │   └── verify-email.tsx  # メールアドレス確認
│   │   ├── notification/         # 通知関連
│   │   │   ├── quiz-completed.tsx # クイズ完了通知
│   │   │   └── quiz-shared.tsx   # クイズ共有通知
│   │   ├── marketing/            # マーケティング
│   │   │   └── newsletter.tsx    # ニュースレター
│   │   └── components/           # 共通コンポーネント
│   │       ├── layout.tsx        # 基本レイアウト
│   │       ├── header.tsx        # ヘッダー
│   │       ├── footer.tsx        # フッター
│   │       └── button.tsx        # ボタン
│   └── lib/
│       └── email/
│           └── templates/        # 本番用テンプレート
└── package.json
```

## セットアップ

### 1. 必要なパッケージのインストール
```bash
# React Email開発ツール
pnpm add -D react-email

# React Emailコンポーネント
pnpm add @react-email/components
```

### 2. package.jsonにスクリプト追加
```json
{
  "scripts": {
    "email": "email dev --dir src/emails --port 3001"
  }
}
```

### 3. 開発サーバー起動
```bash
pnpm run email
# http://localhost:3001 でプレビュー可能
```

## 基本的なテンプレート構造

### 1. 共通レイアウトコンポーネント
```typescript
// src/emails/components/layout.tsx
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components';
import { Header } from './header';
import { Footer } from './footer';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  locale?: 'ja' | 'en';
}

export function EmailLayout({ preview, children, locale = 'ja' }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @font-face {
            font-family: 'Noto Sans JP';
            font-style: normal;
            font-weight: 400;
            src: url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Header locale={locale} />
          <Section style={styles.content}>
            {children}
          </Section>
          <Footer locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: locale === 'ja' 
      ? '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
  },
  content: {
    padding: '0 48px',
  },
};
```

### 2. ヘッダーコンポーネント
```typescript
// src/emails/components/header.tsx
import { Img, Section } from '@react-email/components';

interface HeaderProps {
  locale?: 'ja' | 'en';
}

export function Header({ locale = 'ja' }: HeaderProps) {
  return (
    <Section style={styles.header}>
      <Img
        src="https://examforge.com/logo.png"
        width="150"
        height="50"
        alt="ExamForge"
        style={styles.logo}
      />
    </Section>
  );
}

const styles = {
  header: {
    padding: '32px 48px 0',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
  },
};
```

### 3. ボタンコンポーネント
```typescript
// src/emails/components/button.tsx
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={{
        ...styles.base,
        ...(variant === 'primary' ? styles.primary : styles.secondary),
      }}
    >
      {children}
    </EmailButton>
  );
}

const styles = {
  base: {
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
    margin: '0 auto',
  },
  primary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
  },
};
```

## 実際のメールテンプレート例

### ウェルカムメール
```typescript
// src/emails/auth/welcome.tsx
import { Text, Heading, Hr } from '@react-email/components';
import { EmailLayout } from '../components/layout';
import { Button } from '../components/button';

interface WelcomeEmailProps {
  username: string;
  loginUrl: string;
  locale?: 'ja' | 'en';
}

export default function WelcomeEmail({ 
  username, 
  loginUrl, 
  locale = 'ja' 
}: WelcomeEmailProps) {
  const messages = {
    ja: {
      preview: 'ExamForgeへようこそ！',
      heading: `${username}さん、ようこそ！`,
      intro: 'ExamForgeへの登録ありがとうございます。',
      body: 'これから、簡単にクイズや試験を作成・共有できるようになります。',
      features: [
        '✨ 多様な問題形式に対応',
        '📊 詳細な分析機能',
        '🔒 パスワード保護機能',
        '🌐 多言語対応',
      ],
      cta: 'ログインして始める',
      help: 'ご不明な点がございましたら、',
      helpLink: 'ヘルプセンター',
      helpSuffix: 'をご覧ください。',
    },
    en: {
      preview: 'Welcome to ExamForge!',
      heading: `Welcome, ${username}!`,
      intro: 'Thank you for signing up for ExamForge.',
      body: 'You can now create and share quizzes and exams easily.',
      features: [
        '✨ Multiple question formats',
        '📊 Detailed analytics',
        '🔒 Password protection',
        '🌐 Multi-language support',
      ],
      cta: 'Sign in to get started',
      help: 'If you have any questions, visit our ',
      helpLink: 'Help Center',
      helpSuffix: '.',
    },
  };

  const t = messages[locale];

  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <Heading style={styles.heading}>{t.heading}</Heading>
      
      <Text style={styles.text}>{t.intro}</Text>
      <Text style={styles.text}>{t.body}</Text>
      
      <div style={styles.features}>
        {t.features.map((feature, index) => (
          <Text key={index} style={styles.feature}>
            {feature}
          </Text>
        ))}
      </div>

      <div style={styles.buttonWrapper}>
        <Button href={loginUrl}>
          {t.cta}
        </Button>
      </div>

      <Hr style={styles.hr} />

      <Text style={styles.help}>
        {t.help}
        <a href="https://examforge.com/help" style={styles.link}>
          {t.helpLink}
        </a>
        {t.helpSuffix}
      </Text>
    </EmailLayout>
  );
}

const styles = {
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '30px 0 16px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#404040',
    margin: '0 0 16px',
  },
  features: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  feature: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#404040',
    margin: '8px 0',
  },
  buttonWrapper: {
    margin: '32px 0',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '32px 0',
  },
  help: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
};
```

## TypeScript型定義

```typescript
// src/types/email.ts
export interface EmailLocale {
  locale: 'ja' | 'en';
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template: string;
  data: Record<string, any>;
  locale?: 'ja' | 'en';
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

## スタイリングベストプラクティス

### 1. インラインスタイルの使用
メールクライアントの互換性のため、すべてのスタイルはインラインで記述します。

### 2. レスポンシブデザイン
```typescript
const responsiveStyles = {
  container: {
    maxWidth: '600px',
    width: '100%',
  },
  padding: {
    mobile: '16px',
    desktop: '48px',
  },
};
```

### 3. フォント設定
```typescript
const fontStyles = {
  ja: {
    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
  },
  en: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};
```

### 4. カラーパレット
```typescript
const colors = {
  primary: '#2563eb',     // ExamForge Blue
  secondary: '#f97316',   // ExamForge Orange
  text: {
    primary: '#1a1a1a',
    secondary: '#404040',
    muted: '#6b7280',
  },
  background: {
    body: '#f6f9fc',
    card: '#ffffff',
    muted: '#f9fafb',
  },
  border: '#e5e7eb',
};
```

## テスト戦略

### 1. ビジュアルテスト
```bash
# 開発サーバーでプレビュー
pnpm run email
```

### 2. HTML出力テスト
```typescript
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/auth/welcome';

const html = await render(
  <WelcomeEmail 
    username="テストユーザー" 
    loginUrl="https://examforge.com/login"
    locale="ja"
  />
);
```

### 3. 実機テスト
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- モバイルクライアント

## パフォーマンス最適化

### 1. 画像の最適化
- CDN経由で配信
- 適切なサイズ（最大幅600px）
- WebP形式のフォールバック

### 2. HTMLサイズの削減
- 不要なスタイルを削除
- コメントを含めない
- 最小限のマークアップ

### 3. プリヘッダーテキスト
```typescript
<Preview>
  {/* 最初の100文字程度が表示される */}
  ExamForgeへようこそ！アカウントが作成されました。
</Preview>
```

## まとめ

React Emailを使用することで：
- ✅ TypeScriptによる型安全性
- ✅ コンポーネントの再利用性
- ✅ 開発時のプレビュー機能
- ✅ 多言語対応の容易さ
- ✅ 一貫性のあるデザイン

これらの利点により、メンテナンスしやすく拡張可能なメールシステムを構築できます。