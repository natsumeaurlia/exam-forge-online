'use client';

import { useSession } from 'next-auth/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AuthButtons } from '../auth/AuthButtons';
import { UserMenu } from './UserMenu';

interface LandingNavbarActionsProps {
  lng: string;
  translations: {
    login: string;
    signup: string;
  };
}

export function LandingNavbarActions({ lng, translations }: LandingNavbarActionsProps) {
  const { data: session } = useSession();

  return (
    <div
      className="hidden items-center gap-4 md:flex"
      data-testid="navbar-desktop-actions"
    >
      <LanguageSwitcher lng={lng} />
      {session ? (
        <UserMenu lng={lng} showDashboardLink={true} />
      ) : (
        <AuthButtons
          loginText={translations.login}
          signupText={translations.signup}
          lng={lng}
        />
      )}
    </div>
  );
}
