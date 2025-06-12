'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export type AuthError = {
  type: 'UNAUTHENTICATED' | 'SESSION_EXPIRED' | 'INVALID_USER';
  message: string;
  redirectUrl?: string;
};

// Safe Action クライアントを作成
const action = createSafeActionClient();

// ユーザー登録用のスキーマ
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function validateSession(): Promise<
  { success: true; userId: string } | { success: false; error: AuthError }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      error: {
        type: 'UNAUTHENTICATED',
        message: 'ログインが必要です',
        redirectUrl: '/auth/signin',
      },
    };
  }

  // Check if user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    return {
      success: false,
      error: {
        type: 'INVALID_USER',
        message: 'ユーザー情報が見つかりません。再度ログインしてください。',
        redirectUrl: '/auth/signin',
      },
    };
  }

  return { success: true, userId: user.id };
}

export async function requireAuth(locale: string = 'ja') {
  const validation = await validateSession();

  if (!validation.success) {
    const redirectUrl = `/${locale}${validation.error.redirectUrl}`;
    redirect(redirectUrl);
  }

  return validation.userId;
}

export async function handleAuthError(error: AuthError, locale: string = 'ja') {
  if (error.redirectUrl) {
    const redirectUrl = `/${locale}${error.redirectUrl}`;
    redirect(redirectUrl);
  }

  throw new Error(error.message);
}

// ユーザー登録ServerAction
export const signupAction = action
  .schema(signupSchema)
  .action(async ({ parsedInput: { name, email, password } }) => {
    try {
      // 🔒 SECURITY: トランザクションでRace Condition脆弱性を修正
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.$transaction(
        async tx => {
          // トランザクション内で重複チェックとユーザー作成を原子的に実行
          const existingUser = await tx.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            throw new Error('このメールアドレスは既に登録されています');
          }

          // Create user (same transaction)
          return await tx.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });
        },
        {
          isolationLevel: 'Serializable', // 最高レベルの分離でRace Condition防止
        }
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('Signup error:', error);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error('アカウントの作成中にエラーが発生しました');
    }
  });
