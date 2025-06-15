import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LMSSiteCard } from '@/components/lms/LMSSiteCard';
import { CreateSiteModal } from '@/components/lms/CreateSiteModal';
import { getLMSSites } from '@/lib/actions/lms';

interface LMSPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default async function LMSPage({ params }: LMSPageProps) {
  const resolvedParams = await params;
  const session = await auth();
  const t = await getTranslations('lms');

  if (!session?.user?.id) {
    redirect(`/${resolvedParams.lng}/auth/signin`);
  }

  // Get user's current team (simplified for demo)
  const teamId = 'current-team-id'; // This should come from user context
  const sites = await getLMSSites(teamId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        
        <CreateSiteModal
          teamId={teamId}
          trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('createSite')}
            </Button>
          }
        />
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('empty.description')}
            </p>
            <CreateSiteModal
              teamId={teamId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('empty.action')}
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <LMSSiteCard
              key={site.id}
              site={site}
              lng={resolvedParams.lng}
            />
          ))}
        </div>
      )}
    </div>
  );
}