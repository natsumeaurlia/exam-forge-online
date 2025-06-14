'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Safe Action クライアントを作成
const action = createSafeActionClient();

// ユーザー登録用のスキーマ
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function validateSession(): Promise<
  { success: true; userId: string } | { success: false; error: string }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      error: 'ログインが必要です',
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
      error: 'ユーザー情報が見つかりません。再度ログインしてください。',
    };
  }

  return { success: true, userId: user.id };
}

export async function requireAuth(locale: string = 'ja') {
  const validation = await validateSession();

  if (!validation.success) {
    const redirectUrl = `/${locale}/auth/signin`;
    redirect(redirectUrl);
  }

  return validation.userId;
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
          const newUser = await tx.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });

          // Create default team for the new user
          await tx.team.create({
            data: {
              name: `${newUser.name}'s Team`,
              slug: `user-${newUser.id}`,
              description: 'Personal team',
              creatorId: newUser.id,
              members: {
                create: {
                  userId: newUser.id,
                  role: 'OWNER',
                },
              },
              teamSettings: {
                create: {
                  maxMembers: 1,
                  allowMemberInvite: false,
                  requireApproval: false,
                },
              },
            },
          });

          return newUser;
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
