# メール通知機能実装設計書

## 概要
ExamForgeの基本的なメール通知機能（v1.0必須）の実装設計書です。Resendを使用して、新規登録時のウェルカムメールとパスワードリセットメールを実装します。

## アーキテクチャ

### 技術スタック
- **メール送信サービス**: Resend
- **メールテンプレート**: React Email
- **多言語対応**: next-intl統合

### ディレクトリ構造
```
src/
├── lib/
│   ├── email/
│   │   ├── client.ts          # Resendクライアント設定
│   │   ├── send.ts            # メール送信関数
│   │   └── templates/         # メールテンプレート
│   │       ├── welcome.tsx    # ウェルカムメール
│   │       └── password-reset.tsx # パスワードリセット
│   └── actions/
│       └── email.ts           # サーバーアクション
├── emails/                    # React Email開発用
│   ├── welcome.tsx
│   └── password-reset.tsx
└── types/
    └── email.ts              # 型定義
```

## 実装詳細

### 1. Resendクライアント設定

```typescript
// src/lib/email/client.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// デフォルト送信元設定
export const DEFAULT_FROM = {
  email: process.env.EMAIL_FROM || 'noreply@examforge.com',
  name: 'ExamForge'
};
```

### 2. メールテンプレート構造

#### ウェルカムメール
```typescript
// src/lib/email/templates/welcome.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  username: string;
  loginUrl: string;
  locale: 'ja' | 'en';
}

export function WelcomeEmail({ username, loginUrl, locale }: WelcomeEmailProps) {
  const messages = {
    ja: {
      preview: 'ExamForgeへようこそ！',
      heading: `${username}さん、ようこそ！`,
      body: 'ExamForgeへの登録ありがとうございます。',
      ctaText: 'ログインする',
      footer: 'このメールに心当たりがない場合は、無視してください。'
    },
    en: {
      preview: 'Welcome to ExamForge!',
      heading: `Welcome, ${username}!`,
      body: 'Thank you for signing up for ExamForge.',
      ctaText: 'Sign In',
      footer: 'If you did not sign up for this account, please ignore this email.'
    }
  };

  const t = messages[locale];

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>{t.body}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              {t.ctaText}
            </Button>
          </Section>
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

// スタイル定義
const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: '600', lineHeight: '40px', margin: '0 0 20px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '0 0 20px' };
const buttonContainer = { margin: '0 0 20px' };
const button = { backgroundColor: '#2563eb', borderRadius: '6px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', padding: '12px 20px' };
const footer = { color: '#666', fontSize: '14px', lineHeight: '24px', margin: '0' };
```

#### パスワードリセットメール
```typescript
// src/lib/email/templates/password-reset.tsx
interface PasswordResetEmailProps {
  username: string;
  resetUrl: string;
  locale: 'ja' | 'en';
  expiresIn: string; // "24時間" or "24 hours"
}

export function PasswordResetEmail({ username, resetUrl, locale, expiresIn }: PasswordResetEmailProps) {
  const messages = {
    ja: {
      preview: 'パスワードリセットのリクエスト',
      heading: 'パスワードリセット',
      greeting: `${username}さん、`,
      body: 'パスワードリセットのリクエストを受け付けました。',
      instruction: '以下のボタンをクリックして、新しいパスワードを設定してください：',
      ctaText: 'パスワードをリセット',
      expiry: `このリンクは${expiresIn}で有効期限が切れます。`,
      notYou: 'このリクエストに心当たりがない場合は、このメールを無視してください。'
    },
    en: {
      preview: 'Password Reset Request',
      heading: 'Password Reset',
      greeting: `Hi ${username},`,
      body: 'We received a request to reset your password.',
      instruction: 'Click the button below to set a new password:',
      ctaText: 'Reset Password',
      expiry: `This link will expire in ${expiresIn}.`,
      notYou: 'If you did not request this, please ignore this email.'
    }
  };

  const t = messages[locale];

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>{t.greeting}</Text>
          <Text style={text}>{t.body}</Text>
          <Text style={text}>{t.instruction}</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              {t.ctaText}
            </Button>
          </Section>
          <Text style={text}>{t.expiry}</Text>
          <Text style={footer}>{t.notYou}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### 3. メール送信関数

```typescript
// src/lib/email/send.ts
import { resend, DEFAULT_FROM } from './client';
import { WelcomeEmail } from './templates/welcome';
import { PasswordResetEmail } from './templates/password-reset';
import { renderAsync } from '@react-email/render';

interface SendEmailOptions {
  to: string;
  locale: 'ja' | 'en';
}

export async function sendWelcomeEmail(
  options: SendEmailOptions & { username: string; loginUrl: string }
) {
  const { to, locale, username, loginUrl } = options;
  
  const subject = locale === 'ja' 
    ? 'ExamForgeへようこそ！' 
    : 'Welcome to ExamForge!';

  const html = await renderAsync(
    WelcomeEmail({ username, loginUrl, locale })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: `${DEFAULT_FROM.name} <${DEFAULT_FROM.email}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  options: SendEmailOptions & { 
    username: string; 
    resetToken: string;
    baseUrl: string;
  }
) {
  const { to, locale, username, resetToken, baseUrl } = options;
  
  const resetUrl = `${baseUrl}/${locale}/auth/reset-password?token=${resetToken}`;
  const expiresIn = locale === 'ja' ? '24時間' : '24 hours';
  
  const subject = locale === 'ja' 
    ? 'パスワードリセットのリクエスト' 
    : 'Password Reset Request';

  const html = await renderAsync(
    PasswordResetEmail({ username, resetUrl, locale, expiresIn })
  );

  try {
    const { data, error } = await resend.emails.send({
      from: `${DEFAULT_FROM.name} <${DEFAULT_FROM.email}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
```

### 4. サーバーアクション

```typescript
// src/lib/actions/email.ts
'use server';

import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

const passwordResetSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['ja', 'en']),
});

export async function requestPasswordReset(input: z.infer<typeof passwordResetSchema>) {
  const { email, locale } = passwordResetSchema.parse(input);

  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // セキュリティのため、ユーザーが存在しない場合も成功を返す
      return { success: true };
    }

    // リセットトークンを生成
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // トークンを保存
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // メールを送信
    await sendPasswordResetEmail({
      to: user.email,
      locale,
      username: user.name || user.email,
      resetToken,
      baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to process request' };
  }
}
```

### 5. 既存認証フローへの統合

#### 新規登録時
```typescript
// src/app/api/auth/signup/route.ts に追加
import { sendWelcomeEmail } from '@/lib/email/send';

// 既存のユーザー作成コードの後に追加
await sendWelcomeEmail({
  to: user.email,
  locale: lng as 'ja' | 'en',
  username: user.name || user.email,
  loginUrl: `${process.env.NEXTAUTH_URL}/${lng}/auth/signin`,
});
```

#### パスワードリセットページ
```typescript
// src/app/[lng]/auth/forgot-password/page.tsx (新規作成)
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { requestPasswordReset } from '@/lib/actions/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage({ params: { lng } }: { params: { lng: string } }) {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await requestPasswordReset({
        email,
        locale: lng as 'ja' | 'en',
      });

      if (result.success) {
        toast({
          title: t('success.title'),
          description: t('success.description'),
        });
        setEmail('');
      } else {
        toast({
          title: t('error.title'),
          description: t('error.description'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-16">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('sending') : t('submit')}
        </Button>
      </form>
    </div>
  );
}
```

## 環境変数

```bash
# .env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@examforge.com
```

## データベーススキーマ追加

```prisma
// schema.prisma に追加
model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

## テスト計画

### 単体テスト
1. メールテンプレートのレンダリング
2. 多言語対応の確認
3. エラーハンドリング

### E2Eテスト
```typescript
// tests/auth/password-reset.spec.ts
test('パスワードリセットフロー', async ({ page }) => {
  // 1. パスワードリセットページへ移動
  await page.goto('/ja/auth/forgot-password');
  
  // 2. メールアドレスを入力
  await page.fill('input[type="email"]', 'test@example.com');
  
  // 3. 送信ボタンをクリック
  await page.click('button[type="submit"]');
  
  // 4. 成功メッセージを確認
  await expect(page.locator('text=メールを送信しました')).toBeVisible();
});
```

## 実装順序

1. **環境設定** (30分)
   - Resend APIキー取得
   - 環境変数設定

2. **基本実装** (2時間)
   - Resendクライアント
   - メールテンプレート作成
   - 送信関数実装

3. **統合** (1時間)
   - 新規登録フローへの追加
   - パスワードリセットページ作成

4. **テスト** (1時間)
   - 動作確認
   - E2Eテスト追加

## セキュリティ考慮事項

1. **レート制限**
   - 同一IPからの連続リクエストを制限
   - 同一メールアドレスへの送信回数制限

2. **トークン管理**
   - 十分な長さのランダムトークン
   - 有効期限の設定（24時間）
   - 使用済みトークンの無効化

3. **情報漏洩防止**
   - ユーザーが存在しない場合も同じレスポンスを返す
   - エラーメッセージから情報を推測できないようにする

## 今後の拡張

- 通知設定機能
- 配信停止機能
- メールテンプレートのカスタマイズ
- SPF/DKIM設定
- バウンス処理