'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AuthError = {
  type: 'UNAUTHENTICATED' | 'SESSION_EXPIRED' | 'INVALID_USER';
  message: string;
  redirectUrl?: string;
};

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
