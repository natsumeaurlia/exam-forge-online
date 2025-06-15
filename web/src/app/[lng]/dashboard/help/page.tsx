import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HelpClient } from './client';

interface HelpPageProps {
  params: Promise<{ lng: string }>;
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function getHelpData() {
  // Get help articles and FAQs
  const [helpArticles, faqs, categories] = await Promise.all([
    prisma.helpArticle.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        category: true,
      },
    }),
    prisma.faq.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        category: true,
      },
    }),
    prisma.helpCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  return {
    helpArticles,
    faqs,
    categories,
  };
}

export default async function HelpPage({
  params,
  searchParams,
}: HelpPageProps) {
  const { lng } = await params;
  const { category, search } = await searchParams;
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard.help');

  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  const helpData = await getHelpData();

  return (
    <HelpClient
      lng={lng}
      helpData={helpData}
      initialCategory={category}
      initialSearch={search}
    />
  );
}
