import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export interface DefaultLayoutProps {
  children: React.ReactNode;
  lng: string;
}

export const DefaultLayout = ({ children, lng }: DefaultLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar lng={lng} />
      <main className="flex-1">{children}</main>
      <Footer lng={lng} />
    </div>
  );
};
