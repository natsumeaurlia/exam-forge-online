import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}

export default async function Layout({
  children,
  params,
}: DashboardLayoutProps) {
  const { lng } = await params;
  const session = await getServerSession(authOptions);

  // 認証チェック - 未認証の場合はサインインページにリダイレクト
  if (!session) {
    redirect(`/${lng}/auth/signin`);
  }

  return <DashboardLayout lng={lng}>{children}</DashboardLayout>;
}
