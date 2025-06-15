import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SkipLinks } from '@/components/accessibility/SkipLink';

export interface DefaultLayoutProps {
  children: React.ReactNode;
  lng: string;
}

export const DefaultLayout = async ({ children, lng }: DefaultLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLinks />
      <Navbar lng={lng} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer lng={lng} />
    </div>
  );
};
