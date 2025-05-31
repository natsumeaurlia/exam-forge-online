import React from 'react';
import '../index.css';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export interface LayoutProps {
  children: React.ReactNode;
  params?: {
    lng?: string;
  };
}

export default function RootLayout({
  children,
  params,
}: LayoutProps) {
  // Default language
  const lng = params?.lng || 'ja';
  
  return (
    <html lang={lng}>
      <head />
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
