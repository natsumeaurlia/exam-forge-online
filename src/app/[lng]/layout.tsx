import React from 'react';
import '../../index.css';
import { Inter } from "next/font/google";
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { languages } from '../../i18n/settings';
import { dir } from 'i18next';
import { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lng: string;
  }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lng } = await params;

  return {
    title: 'exam-forge-online',
    description: 'Lovable Generated Project',
    openGraph: {
      title: 'exam-forge-online',
      description: 'Lovable Generated Project',
      type: 'website',
      images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@lovable_dev',
      images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
    },
  };
}

export default async function RootLayout({
  children,
  params
}: LayoutProps) {
  const { lng } = await params;
  
  return (
    <html lang={lng} dir={dir(lng)}>
      <head />
      <body className={inter.className}>
        <Navbar lng={lng} />
        <main>
          {children}
        </main>
        <Footer lng={lng} />
      </body>
    </html>
  );
}