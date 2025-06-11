/**
 * Auth configuration validator
 * Validates required environment variables for authentication providers
 */

export function validateAuthConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Google OAuth config - only validate if both are provided or neither
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;

  if (hasGoogleId && !hasGoogleSecret) {
    errors.push(
      'GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set'
    );
  } else if (!hasGoogleId && hasGoogleSecret) {
    errors.push(
      'GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set'
    );
  } else if (!hasGoogleId && !hasGoogleSecret) {
    warnings.push(
      'Google OAuth is disabled (no GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)'
    );
  }

  // Check GitHub OAuth config - only validate if both are provided or neither
  const hasGithubId = !!process.env.GITHUB_ID;
  const hasGithubSecret = !!process.env.GITHUB_SECRET;

  if (hasGithubId && !hasGithubSecret) {
    errors.push('GITHUB_SECRET is required when GITHUB_ID is set');
  } else if (!hasGithubId && hasGithubSecret) {
    errors.push('GITHUB_ID is required when GITHUB_SECRET is set');
  } else if (!hasGithubId && !hasGithubSecret) {
    warnings.push('GitHub OAuth is disabled (no GITHUB_ID/GITHUB_SECRET)');
  }

  // Check NextAuth config
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('NEXTAUTH_SECRET is required for production');
    } else {
      warnings.push('NEXTAUTH_SECRET is not set (development mode)');
    }
  }

  if (!process.env.NEXTAUTH_URL) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('NEXTAUTH_URL is required for production');
    } else {
      warnings.push('NEXTAUTH_URL is not set (development mode)');
    }
  }

  // Check database URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Log warnings if any
  if (warnings.length > 0) {
    console.warn('Authentication configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Log errors if any
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
