import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSafeActionClient } from 'next-safe-action';

// Safe Action クライアントを作成
const action = createSafeActionClient();

export const authAction = action.use(async ({ next }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email) {
    // ユーザーが認証されていない場合、エラーをスロー
    throw new Error('UNAUTHENTICATED:ログインが必要です');
  }
  return next({ ctx: { userId: session?.user?.id } });
});
