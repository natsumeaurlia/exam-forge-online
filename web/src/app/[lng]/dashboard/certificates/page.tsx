import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserPlan } from '@/lib/actions/user';
import { CertificatesContent } from '@/components/certificates/CertificatesContent';

interface CertificatesPageProps {
  params: {
    lng: string;
  };
}

export async function generateMetadata({
  params: { lng },
}: CertificatesPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: lng, namespace: 'certificates' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function CertificatesPage({
  params: { lng },
}: CertificatesPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lng}/auth/signin`);
  }

  // Check if user has Pro plan or higher for certificate features
  const userPlanResult = await getUserPlan();
  if (!userPlanResult.success || !userPlanResult.data) {
    redirect(`/${lng}/dashboard`);
  }

  const hasPaidPlan =
    userPlanResult.data.planType === 'PRO' ||
    userPlanResult.data.planType === 'PREMIUM';

  if (!hasPaidPlan) {
    redirect(`/${lng}/plans?feature=certificates`);
  }

  const t = await getTranslations({ locale: lng, namespace: 'certificates' });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <CertificatesContent lng={lng} />
    </div>
  );
}
