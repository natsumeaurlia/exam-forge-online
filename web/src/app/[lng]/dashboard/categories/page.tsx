import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CategoryManagementClient } from './client';

interface CategoriesPageProps {
  params: Promise<{ lng: string }>;
}

async function getTeamData(userId: string) {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId,
    },
    include: {
      team: {
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
  });

  return teamMember;
}

async function getCategories(teamId: string) {
  const categories = await prisma.category.findMany({
    where: { teamId },
    include: {
      children: {
        include: {
          _count: {
            select: {
              bankQuestionCategories: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          bankQuestionCategories: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Transform to include question counts
  return categories.map(category => ({
    ...category,
    questionCount: category._count.bankQuestionCategories,
    children: category.children.map(child => ({
      ...child,
      questionCount: child._count.bankQuestionCategories,
      children: [], // Add empty children array for consistency
    })),
  }));
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { lng } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard.categories');

  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Get user's team data
  const teamMember = await getTeamData(session.user.id);

  if (!teamMember) {
    redirect(`/${lng}/dashboard`);
  }

  // Check if user has admin permissions
  const hasAdminAccess = ['OWNER', 'ADMIN'].includes(teamMember.role);

  // Get categories for the team
  const categories = await getCategories(teamMember.team.id);

  const teamData = {
    id: teamMember.team.id,
    name: teamMember.team.name,
    userRole: teamMember.role,
    subscription: teamMember.team.subscription
      ? {
          plan: {
            name: teamMember.team.subscription.plan.name,
            type: teamMember.team.subscription.plan.type,
          },
        }
      : null,
  };

  return (
    <CategoryManagementClient
      lng={lng}
      team={teamData}
      categories={categories}
      hasAdminAccess={hasAdminAccess}
    />
  );
}
