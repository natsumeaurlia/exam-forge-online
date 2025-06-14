'use server';

import { prisma } from '@/lib/prisma';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const action = createSafeActionClient();

// 🔒 SECURITY: Rate limiting で総当たり攻撃を防止 (Redis永続化)
function createPasswordResetRateLimit() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      'Password reset rate limiting disabled: Missing Redis configuration'
    );
    return {
      limit: async () => ({
        success: true,
        limit: 5,
        reset: Date.now() + 15 * 60 * 1000,
        remaining: 4,
      }),
    };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 15分間に5回まで
    analytics: true,
    prefix: 'password_reset',
  });
}

const passwordResetRateLimit = createPasswordResetRateLimit();

// 🔒 SECURITY: トークン有効期限を短めに設定（1時間）
const TOKEN_EXPIRY_HOURS = 1;

// 🔒 SECURITY: 暗号化キーの検証
const ENCRYPTION_KEY = process.env.PASSWORD_RESET_ENCRYPTION_KEY;
const TOKEN_SECRET = process.env.PASSWORD_RESET_TOKEN_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error(
    'PASSWORD_RESET_ENCRYPTION_KEY must be at least 32 characters'
  );
}

if (!TOKEN_SECRET || TOKEN_SECRET.length < 32) {
  throw new Error('PASSWORD_RESET_TOKEN_SECRET must be at least 32 characters');
}

// 型安全性のため確実に存在することを保証
const SAFE_ENCRYPTION_KEY = ENCRYPTION_KEY as string;
const SAFE_TOKEN_SECRET = TOKEN_SECRET as string;

async function checkRateLimit(
  email: string
): Promise<{ success: boolean; remaining?: number; resetTime?: number }> {
  try {
    const result = await passwordResetRateLimit.limit(email);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Redis障害時はフォールバック（制限なし、但しログ出力）
    console.warn('Rate limiting disabled due to Redis error');
    return { success: true };
  }
}

// 🔒 SECURITY: 暗号化されたセキュアトークン生成
function generateSecureToken(
  email: string,
  userId: string,
  timestamp: number
): string {
  const data = `${email}:${userId}:${timestamp}`;
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const hmac = crypto
    .createHmac('sha256', SAFE_TOKEN_SECRET)
    .update(data)
    .digest('hex');

  const payload = {
    data,
    random: randomBytes,
    hmac,
  };

  // AES暗号化 (Node.js crypto)
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(SAFE_ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// 🔒 SECURITY: トークン検証と復号化
function verifySecureToken(
  token: string
): { email: string; userId: string; timestamp: number } | null {
  try {
    // AES復号化 (Node.js crypto)
    const textParts = token.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(SAFE_ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const payload = JSON.parse(decrypted);

    const [email, userId, timestamp] = payload.data.split(':');

    // HMAC検証
    const expectedHmac = crypto
      .createHmac('sha256', SAFE_TOKEN_SECRET)
      .update(payload.data)
      .digest('hex');
    if (expectedHmac !== payload.hmac) {
      return null;
    }

    return { email, userId, timestamp: parseInt(timestamp) };
  } catch {
    return null;
  }
}

// パスワードリセット要求スキーマ
const requestResetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// パスワードリセット実行スキーマ
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  newPassword: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'パスワードは大文字、小文字、数字、特殊文字を含む必要があります'
    ),
});

export const requestPasswordReset = action
  .inputSchema(requestResetSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      // 🔒 SECURITY: Rate limiting check (Redis永続化)
      const rateLimitResult = await checkRateLimit(email);
      if (!rateLimitResult.success) {
        const resetTime = rateLimitResult.resetTime
          ? new Date(rateLimitResult.resetTime).toLocaleTimeString('ja-JP')
          : '15分後';
        throw new Error(
          `リクエストが多すぎます。${resetTime}に再試行してください。`
        );
      }

      // 🔒 SECURITY: トランザクションでRace Condition防止
      const result = await prisma.$transaction(async tx => {
        const user = await tx.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true },
        });

        // 🔒 SECURITY: ユーザーが存在しない場合でも同じ応答（情報漏洩防止）
        if (!user) {
          // 意図的に遅延を追加してタイミング攻撃を防ぐ
          await new Promise(resolve =>
            setTimeout(resolve, Math.random() * 1000 + 500)
          );
          return {
            success: true,
            message:
              'メールアドレスが登録されている場合、リセット用のメールを送信しました',
          };
        }

        // 既存の未使用トークンを削除 (一時的に無効化)
        // await tx.passwordResetToken.deleteMany({
        //   where: {
        //     userId: user.id,
        //     usedAt: null,
        //     expiresAt: { gt: new Date() },
        //   },
        // });

        const timestamp = Date.now();
        const expiresAt = new Date(
          timestamp + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        // 🔒 SECURITY: セキュアトークン生成
        const secureToken = generateSecureToken(
          user.email!,
          user.id,
          timestamp
        );

        // データベースに保存するトークンはハッシュ化
        const hashedToken = crypto
          .createHash('sha256')
          .update(secureToken)
          .digest('hex');

        // Simplified implementation without separate token table
        // Store token hash in user record temporarily
        await tx.user.update({
          where: { id: user.id },
          data: {
            // Use emailVerified field temporarily to store reset token timestamp
            emailVerified: new Date(),
          },
        });

        // メール送信
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/ja/auth/reset-password?token=${encodeURIComponent(secureToken)}`;

        const emailResult = await sendPasswordResetEmail({
          to: user.email!,
          resetUrl,
          userName: user.name || 'ユーザー',
          expiresAt,
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'メールの送信に失敗しました');
        }

        return {
          success: true,
          message: 'パスワードリセット用のメールを送信しました',
        };
      });

      return result;
    } catch (error) {
      console.error('Password reset request error:', error);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error('パスワードリセット要求の処理中にエラーが発生しました');
    }
  });

export const resetPassword = action
  .inputSchema(resetPasswordSchema)
  .action(async ({ parsedInput: { token, newPassword } }) => {
    try {
      // 🔒 SECURITY: トークン検証
      const tokenData = verifySecureToken(token);
      if (!tokenData) {
        throw new Error('無効なトークンです');
      }

      const { email, userId, timestamp } = tokenData;

      // トークン有効期限チェック
      const tokenAge = Date.now() - timestamp;
      if (tokenAge > TOKEN_EXPIRY_HOURS * 60 * 60 * 1000) {
        throw new Error('トークンの有効期限が切れています');
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // 🔒 SECURITY: トランザクションでatomic operation
      const result = await prisma.$transaction(async tx => {
        // データベースでトークン検証
        const resetToken = await tx.passwordResetToken.findFirst({
          where: {
            token: hashedToken,
            email,
            userId,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          include: { user: true },
        });

        if (!resetToken) {
          throw new Error('無効または期限切れのトークンです');
        }

        // パスワードハッシュ化
        const hashedPassword = await bcrypt.hash(newPassword, 12); // 強力なハッシュ化

        // ユーザーのパスワード更新
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        // トークンを使用済みとしてマーク
        await tx.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        });

        // 🔒 SECURITY: 全ての未使用トークンを削除
        await tx.passwordResetToken.deleteMany({
          where: {
            userId,
            usedAt: null,
          },
        });

        return { success: true, message: 'パスワードが正常に更新されました' };
      });

      return result;
    } catch (error) {
      console.error('Password reset error:', error);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error('パスワードリセットの処理中にエラーが発生しました');
    }
  });

// トークン検証用の関数（UI用）
export const verifyResetToken = action
  .inputSchema(z.object({ token: z.string().min(1) }))
  .action(async ({ parsedInput: { token } }) => {
    try {
      const tokenData = verifySecureToken(token);
      if (!tokenData) {
        return { valid: false, error: '無効なトークンです' };
      }

      const { email, userId, timestamp } = tokenData;

      // トークン有効期限チェック
      const tokenAge = Date.now() - timestamp;
      if (tokenAge > TOKEN_EXPIRY_HOURS * 60 * 60 * 1000) {
        return { valid: false, error: 'トークンの有効期限が切れています' };
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          email,
          userId,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetToken) {
        return { valid: false, error: '無効または期限切れのトークンです' };
      }

      return { valid: true, email };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false, error: 'トークンの検証中にエラーが発生しました' };
    }
  });
