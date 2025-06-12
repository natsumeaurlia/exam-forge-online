'use server';

import { redirect } from 'next/navigation';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; requiresAuth?: boolean };

export function handleActionError(
  error: unknown,
  locale: string = 'ja'
): never {
  console.error('Action error:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Check if this is an authentication error
  if (
    errorMessage.includes('INVALID_USER:') ||
    errorMessage.includes('認証が必要です')
  ) {
    // Extract the actual error message
    const message = errorMessage.replace('INVALID_USER:', '').trim();

    // Redirect to signin with error message
    const signinUrl = new URL(
      `/${locale}/auth/signin`,
      process.env.NEXTAUTH_URL || 'http://localhost:3000'
    );
    signinUrl.searchParams.set('error', 'SessionExpired');
    signinUrl.searchParams.set('message', message);

    redirect(signinUrl.toString());
  }

  // For other errors, throw them to be handled by the caller
  throw error;
}
