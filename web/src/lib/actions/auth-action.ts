import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { createSafeActionClient } from 'next-safe-action';
import * as Sentry from '@sentry/nextjs';
import { setSentryUserContext } from '@/lib/utils/sentry-helpers';

// Safe Action クライアントを作成
const action = createSafeActionClient();

export const authAction = action.use(async ({ next }) => {
  return Sentry.withScope(async scope => {
    const session = await getServerSession(authOptions);

    if (!(session?.user as any)?.id && !session?.user?.email) {
      // Track authentication failures
      Sentry.addBreadcrumb({
        message: 'Authentication failed - no valid session',
        category: 'auth',
        level: 'warning',
      });

      // ユーザーが認証されていない場合、エラーをスロー
      throw new Error('UNAUTHENTICATED:ログインが必要です');
    }

    // Set user context for error tracking
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;

    setSentryUserContext(userId, userEmail || undefined);

    scope.setTag('authenticated', 'true');
    scope.setContext('session', {
      userId,
      email: userEmail,
      sessionId: session ? 'active' : 'none',
    });

    return next({ ctx: { userId } });
  });
});
