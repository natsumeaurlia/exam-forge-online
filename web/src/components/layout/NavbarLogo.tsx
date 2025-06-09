'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface NavbarLogoProps {
  lng: string;
}

export const NavbarLogo = ({ lng }: NavbarLogoProps) => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogoClick = () => {
    if (session) {
      router.push(`/${lng}/dashboard`);
    } else {
      router.push(`/${lng}`);
    }
  };

  return (
    <button
      onClick={handleLogoClick}
      className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
      data-testid="navbar-logo"
    >
      <div className="from-examforge-blue to-examforge-blue-dark flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl font-bold text-white">
        E
      </div>
      <span className="text-xl font-bold">ExamForge</span>
    </button>
  );
};
