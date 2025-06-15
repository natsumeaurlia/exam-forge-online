import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CertificatesManagementClient } from '@/components/certificates/CertificatesManagementClient';

export const metadata: Metadata = {
  title: '証明書管理',
  description: '証明書テンプレートと発行済み証明書の管理',
};

interface CertificatesPageProps {
  params: {
    lng: string;
  };
  searchParams: {
    tab?: 'templates' | 'issued';
    search?: string;
    page?: string;
  };
}

export default async function CertificatesPage({
  params: { lng },
  searchParams,
}: CertificatesPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const t = await getTranslations('certificates');

  // Get user's active team
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMembers: {
        where: { status: 'ACTIVE' },
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
        take: 1,
      },
    },
  });

  if (!user?.teamMembers[0]) {
    notFound();
  }

  const teamMember = user.teamMembers[0];
  const team = teamMember.team;

  // Check if team has certificate feature access
  const hasCertificateAccess =
    team.subscription?.plan?.features?.includes('CERTIFICATES') || false;

  // Get initial data
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;
  const offset = (page - 1) * limit;
  const search = searchParams.search || '';
  const activeTab = searchParams.tab || 'templates';

  let templates = [];
  let certificates = [];
  let templateCount = 0;
  let certificateCount = 0;

  if (hasCertificateAccess) {
    if (activeTab === 'templates') {
      // Get certificate templates
      const templatesResult = await prisma.certificateTemplate.findMany({
        where: {
          OR: [
            {
              teamId: team.id,
            },
            {
              isPublic: true,
            },
          ],
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          team: {
            select: { name: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          _count: {
            select: { certificates: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      });

      templateCount = await prisma.certificateTemplate.count({
        where: {
          OR: [
            {
              teamId: team.id,
            },
            {
              isPublic: true,
            },
          ],
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
      });

      templates = templatesResult;
    } else {
      // Get issued certificates
      const certificatesResult = await prisma.certificate.findMany({
        where: {
          template: {
            teamId: team.id,
          },
          ...(search && {
            OR: [
              { recipientName: { contains: search, mode: 'insensitive' } },
              { recipientEmail: { contains: search, mode: 'insensitive' } },
              { template: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }),
        },
        include: {
          template: {
            select: { name: true },
          },
          quizResponse: {
            include: {
              quiz: {
                select: { title: true },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip: offset,
        take: limit,
      });

      certificateCount = await prisma.certificate.count({
        where: {
          template: {
            teamId: team.id,
          },
          ...(search && {
            OR: [
              { recipientName: { contains: search, mode: 'insensitive' } },
              { recipientEmail: { contains: search, mode: 'insensitive' } },
              { template: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }),
        },
      });

      certificates = certificatesResult;
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <CertificatesManagementClient
        initialData={{
          templates: activeTab === 'templates' ? templates : [],
          certificates: activeTab === 'issued' ? certificates : [],
          templateCount,
          certificateCount,
          currentPage: page,
          limit,
          activeTab,
          search,
        }}
        teamInfo={{
          id: team.id,
          name: team.name,
          role: teamMember.role,
          hasCertificateAccess,
        }}
        locale={lng}
      />
    </div>
  );
}
