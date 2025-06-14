import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis configuration is available
function createRedisClient() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      'Redis rate limiting disabled: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN'
    );
    return null;
  }
  return Redis.fromEnv();
}

// Create a mock rate limiter for when Redis is not available
function createMockRatelimit() {
  return {
    limit: async () => ({
      success: true,
      limit: 1000,
      reset: Date.now() + 60000,
      remaining: 999,
    }),
  };
}

const redis = createRedisClient();

// 🔒 SECURITY: レート制限設定 - DDoS攻撃対策
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 1分間に100リクエスト
      analytics: true,
    })
  : createMockRatelimit();

// API別制限設定
export const strictRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 認証API等は1分間に10リクエスト
      analytics: true,
    })
  : createMockRatelimit();

// ブルートフォース攻撃対策
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'), // 5分間に5回のログイン試行
      analytics: true,
    })
  : createMockRatelimit();

// ファイルアップロード制限
export const uploadRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '5 m'), // 5分間に10回のアップロード
      analytics: true,
    })
  : createMockRatelimit();

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
