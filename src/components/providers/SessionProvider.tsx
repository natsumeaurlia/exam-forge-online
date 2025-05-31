'use client';

import { Session } from 'next-auth';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const SessionProvider = ({ children }: Props) => {
  const mockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  const mockSession: Session | null = mockAuth
    ? {
        user: {
          name: 'Mock User',
          email: 'mock@example.com',
          image: '',
          id: 'mock-user-id',
        },
        expires: '2099-01-01T00:00:00.000Z',
      }
    : null;

  if (mockAuth && mockSession) {
    return (
      <NextAuthSessionProvider session={mockSession}>
        {children}
      </NextAuthSessionProvider>
    );
  }

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
};
