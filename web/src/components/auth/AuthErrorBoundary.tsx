'use client';

import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ClientAuthError } from './ClientAuthError';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export function AuthErrorBoundary({
  children,
  fallback: Fallback,
}: AuthErrorBoundaryProps) {
  return (
    <ErrorBoundaryImplementation fallback={Fallback}>
      {children}
    </ErrorBoundaryImplementation>
  );
}

class ErrorBoundaryImplementation extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by AuthErrorBoundary:', error, errorInfo);

    // Check if this is an authentication error
    if (this.isAuthError(error)) {
      // Sign out and redirect to signin
      signOut({ callbackUrl: '/auth/signin' });
      return;
    }
  }

  private isAuthError(error: Error): boolean {
    return (
      error.message === 'USER_NOT_FOUND' ||
      error.message.startsWith('INVALID_USER:') ||
      error.message === 'UNAUTHENTICATED' ||
      error.message.includes('認証が必要です') ||
      error.message.includes('認証')
    );
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return (
          <Fallback
            error={this.state.error}
            reset={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      // Use the ClientAuthError component for better UX
      return (
        <ClientAuthError
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Client-side hook for handling auth errors
export function useAuthErrorHandler() {
  const router = useRouter();

  return {
    handleAuthError: async (error: unknown) => {
      if (
        error instanceof Error &&
        (error.message === 'USER_NOT_FOUND' ||
          error.message.includes('INVALID_USER:') ||
          error.message === 'UNAUTHENTICATED')
      ) {
        console.warn('Authentication error detected, signing out...');
        await signOut({ callbackUrl: '/auth/signin' });
        return true;
      }
      return false;
    },
  };
}
