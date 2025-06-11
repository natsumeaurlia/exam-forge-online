/**
 * Auth configuration validator
 * Validates required environment variables for authentication providers
 */

export function validateAuthConfig() {
  const errors: string[] = [];

  // Check Google OAuth config
  if (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      errors.push('GOOGLE_CLIENT_ID is required when using Google OAuth');
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      errors.push('GOOGLE_CLIENT_SECRET is required when using Google OAuth');
    }
  }

  // Check GitHub OAuth config
  if (process.env.GITHUB_ID || process.env.GITHUB_SECRET) {
    if (!process.env.GITHUB_ID) {
      errors.push('GITHUB_ID is required when using GitHub OAuth');
    }
    if (!process.env.GITHUB_SECRET) {
      errors.push('GITHUB_SECRET is required when using GitHub OAuth');
    }
  }

  // Check NextAuth config
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required for production');
  }

  if (!process.env.NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required');
  }

  // Check database URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    console.error('Authentication configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));

    // In production, throw an error to prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid authentication configuration');
    }
  }

  return errors.length === 0;
}

// Validate on module load
if (process.env.NODE_ENV !== 'test') {
  validateAuthConfig();
}
