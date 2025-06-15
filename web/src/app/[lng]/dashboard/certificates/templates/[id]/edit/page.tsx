import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CertificateTemplateDesigner } from '@/components/certificates/CertificateTemplateDesigner';

export const metadata: Metadata = {
  title: '証明書テンプレートエディター',
  description: '証明書テンプレートをカスタマイズ',
};

interface TemplateEditPageProps {
  params: {
    lng: string;
    id: string;
  };
}

export default async function TemplateEditPage({
  params: { lng, id },
}: TemplateEditPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const t = await getTranslations('certificates.designer');

  // Get template with permission check
  const template = await prisma.certificateTemplate.findFirst({
    where: {
      id,
      OR: [
        // User's team templates
        {
          team: {
            members: {
              some: {
                userId: session.user.id,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
              },
            },
          },
        },
        // Public templates (read-only)
        { isPublic: true },
      ],
    },
    include: {
      team: {
        select: { name: true },
      },
      createdBy: {
        select: { name: true, email: true },
      },
      quizTemplates: {
        include: {
          quiz: {
            select: { id: true, title: true },
          },
        },
      },
      _count: {
        select: { certificates: true },
      },
    },
  });

  if (!template) {
    notFound();
  }

  // Check if user can edit this template
  const userTeam = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      teamId: template.teamId,
      status: 'ACTIVE',
    },
  });

  const canEdit =
    userTeam && ['OWNER', 'ADMIN', 'MEMBER'].includes(userTeam.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <CertificateTemplateDesigner
        template={template}
        canEdit={canEdit || false}
        locale={lng}
      />
    </div>
  );
}
