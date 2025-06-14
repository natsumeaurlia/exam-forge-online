import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// 🔒 SECURITY: 入力検証・サニタイゼーション

/**
 * XSS攻撃対策 - HTMLエスケープ
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * SQLインジェクション対策 - 危険な文字列検出
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /('|(\\');?)/i,
    /(select|union|insert|update|delete|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(\<|\>|\"|\;|\%)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * CSRFトークン生成
 */
export function generateCsrfToken(): string {
  return createHash('sha256')
    .update(Math.random().toString(36) + Date.now().toString())
    .digest('hex');
}

/**
 * CSRFトークン検証
 */
export function validateCsrfToken(
  request: NextRequest,
  token: string
): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;

  return headerToken === token || cookieToken === token;
}

/**
 * 機密データマスキング
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T
): T;
export function maskSensitiveData(data: unknown): unknown;
export function maskSensitiveData(data: unknown): unknown {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const masked = { ...data } as Record<string, unknown>;
    for (const field of sensitiveFields) {
      if (field in masked) {
        masked[field] = '***MASKED***';
      }
    }
    return masked;
  }

  return data;
}

/**
 * ファイルアップロード検証
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size too large' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * IPアドレス検証
 */
export function isValidIP(ip: string): boolean {
  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * セキュアなランダム文字列生成
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * パスワード強度チェック
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
