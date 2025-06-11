/**
 * Environment variables validation and helper functions
 * 環境変数のバリデーションとヘルパー関数
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableProviders: string[];
}

export interface RequiredEnvVars {
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
}

export interface OptionalEnvVars {
  // OAuth providers
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_ID?: string;
  GITHUB_SECRET?: string;

  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;

  // Storage
  S3_ENDPOINT?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_BUCKET_NAME?: string;

  // Email
  RESEND_API_KEY?: string;
}

/**
 * Validate environment variables and return detailed report
 * 環境変数をバリデーションして詳細なレポートを返す
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const availableProviders: string[] = [];

  // Required variables validation
  const requiredVars: RequiredEnvVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    } else if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
      errors.push(
        `NEXTAUTH_SECRET must be at least 32 characters long (current: ${value.length})`
      );
    }
  });

  // Optional variables validation
  const optionalVars: OptionalEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  // Check OAuth providers
  const googleComplete =
    optionalVars.GOOGLE_CLIENT_ID && optionalVars.GOOGLE_CLIENT_SECRET;
  const githubComplete = optionalVars.GITHUB_ID && optionalVars.GITHUB_SECRET;

  if (googleComplete) {
    availableProviders.push('google');
  } else if (
    optionalVars.GOOGLE_CLIENT_ID ||
    optionalVars.GOOGLE_CLIENT_SECRET
  ) {
    warnings.push(
      'Incomplete Google OAuth configuration - both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required'
    );
  }

  if (githubComplete) {
    availableProviders.push('github');
  } else if (optionalVars.GITHUB_ID || optionalVars.GITHUB_SECRET) {
    warnings.push(
      'Incomplete GitHub OAuth configuration - both GITHUB_ID and GITHUB_SECRET are required'
    );
  }

  // Always include credentials provider
  availableProviders.push('credentials');

  // Check Stripe configuration
  const stripeVars = [
    optionalVars.STRIPE_SECRET_KEY,
    optionalVars.STRIPE_PUBLISHABLE_KEY,
    optionalVars.STRIPE_WEBHOOK_SECRET,
  ];
  const stripeConfigured = stripeVars.filter(Boolean).length;

  if (stripeConfigured > 0 && stripeConfigured < 3) {
    warnings.push(
      'Incomplete Stripe configuration - all three variables (SECRET_KEY, PUBLISHABLE_KEY, WEBHOOK_SECRET) are recommended'
    );
  }

  // Check S3 configuration
  const s3Vars = [
    optionalVars.S3_ENDPOINT,
    optionalVars.S3_ACCESS_KEY_ID,
    optionalVars.S3_SECRET_ACCESS_KEY,
    optionalVars.S3_BUCKET_NAME,
  ];
  const s3Configured = s3Vars.filter(Boolean).length;

  if (s3Configured > 0 && s3Configured < 4) {
    warnings.push(
      'Incomplete S3 configuration - all four variables (ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME) are required'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    availableProviders,
  };
}

/**
 * Check if OAuth provider is configured
 * OAuthプロバイダーが設定されているかチェック
 */
export function isOAuthProviderConfigured(
  provider: 'google' | 'github'
): boolean {
  switch (provider) {
    case 'google':
      return !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      );
    case 'github':
      return !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
    default:
      return false;
  }
}

/**
 * Check if Stripe is configured
 * Stripeが設定されているかチェック
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Check if S3 storage is configured
 * S3ストレージが設定されているかチェック
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}

/**
 * Log environment validation results to console (development only)
 * 環境バリデーション結果をコンソールに出力（開発環境のみ）
 */
export function logEnvironmentValidation(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const validation = validateEnvironmentVariables();

  console.log('\n🔧 Environment Variables Validation');
  console.log('=====================================');

  if (validation.isValid) {
    console.log('✅ All required environment variables are configured');
  } else {
    console.log('❌ Environment validation failed');
    validation.errors.forEach(error => {
      console.error(`  ❌ ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  ⚠️  ${warning}`);
    });
  }

  console.log(
    `\n🔐 Available authentication providers: ${validation.availableProviders.join(', ')}`
  );

  // Feature availability
  console.log('\n🚀 Feature availability:');
  console.log(
    `  💳 Stripe payments: ${isStripeConfigured() ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(
    `  📁 S3 storage: ${isS3Configured() ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(
    `  📧 Email service: ${process.env.RESEND_API_KEY ? '✅ Enabled' : '❌ Disabled'}`
  );

  console.log('=====================================\n');
}

/**
 * Generate a secure NEXTAUTH_SECRET
 * 安全なNEXTAUTH_SECRETを生成
 */
export function generateNextAuthSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'generateNextAuthSecret should only be called on the server side'
    );
  }

  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Validate NEXTAUTH_SECRET strength
 * NEXTAUTH_SECRETの強度をバリデーション
 */
export function validateNextAuthSecret(secret: string): {
  isValid: boolean;
  message: string;
} {
  if (!secret) {
    return { isValid: false, message: 'NEXTAUTH_SECRET is required' };
  }

  if (secret.length < 32) {
    return {
      isValid: false,
      message: `NEXTAUTH_SECRET must be at least 32 characters (current: ${secret.length})`,
    };
  }

  // Check for common weak patterns
  if (
    secret === 'test-secret' ||
    secret === 'your-secret-here' ||
    secret.includes('example')
  ) {
    return {
      isValid: false,
      message: 'NEXTAUTH_SECRET appears to be a placeholder value',
    };
  }

  return { isValid: true, message: 'NEXTAUTH_SECRET is valid' };
}
