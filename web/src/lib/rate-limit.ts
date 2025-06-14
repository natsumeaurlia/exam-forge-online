import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 🔒 SECURITY: レート制限設定 - DDoS攻撃対策
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 1分間に100リクエスト
  analytics: true,
});

// API別制限設定
export const strictRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 認証API等は1分間に10リクエスト
  analytics: true,
});

// ブルートフォース攻撃対策
export const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '5 m'), // 5分間に5回のログイン試行
  analytics: true,
});

// ファイルアップロード制限
export const uploadRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '5 m'), // 5分間に10回のアップロード
  analytics: true,
});

// IPベース制限チェック
export async function checkRateLimit(
  identifier: string,
  type: 'default' | 'strict' | 'auth' | 'upload' = 'default'
) {
  const rateLimiter = {
    default: ratelimit,
    strict: strictRatelimit,
    auth: authRatelimit,
    upload: uploadRatelimit,
  }[type];

  try {
    const { success, limit, reset, remaining } =
      await rateLimiter.limit(identifier);

    return {
      success,
      limit,
      reset,
      remaining,
      error: null,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      success: false,
      limit: 0,
      reset: 0,
      remaining: 0,
      error: 'Rate limit service unavailable',
    };
  }
}

// レート制限ヘッダー設定
export function getRateLimitHeaders(
  rateLimitResult: Awaited<ReturnType<typeof checkRateLimit>>
) {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
  };
}
