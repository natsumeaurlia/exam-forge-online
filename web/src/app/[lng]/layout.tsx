import React from 'react';
import '@/index.css';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { languages, type Language } from '@/i18n/settings';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return languages.map((lng: Language) => ({ lng }));
}

export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lng: string;
  }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { lng } = await params;

  return {
    title: 'ExamForge - Online Exam Platform',
    description: 'Create and take exams online with ExamForge',
    openGraph: {
      title: 'ExamForge - Online Exam Platform',
      description: 'Create and take exams online with ExamForge',
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

export default async function RootLayout({ children, params }: LayoutProps) {
  const { lng } = await params;
  const messages = await getMessages();

  return (
    <html lang={lng} dir="ltr">
      <head />
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
