'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, Filter, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertificateTemplateCard } from './CertificateTemplateCard';
import { CertificateCard } from './CertificateCard';
import { CreateTemplateModal } from './CreateTemplateModal';
import { CertificateTemplateWithRelations } from '@/types/certificate';
import { Pagination } from '@/components/ui/pagination';
import { ProFeatureGate } from '@/components/quiz/ProFeatureGate';

interface CertificatesManagementClientProps {
  initialData: {
    templates: CertificateTemplateWithRelations[];
    certificates: any[];
    templateCount: number;
    certificateCount: number;
    currentPage: number;
    limit: number;
    activeTab: 'templates' | 'issued';
    search: string;
  };
  teamInfo: {
    id: string;
    name: string;
    role: string;
    hasCertificateAccess: boolean;
  };
  locale: string;
}

export function CertificatesManagementClient({
  initialData,
  teamInfo,
  locale,
}: CertificatesManagementClientProps) {
  const t = useTranslations('certificates');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialData.search);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    templates,
    certificates,
    templateCount,
    certificateCount,
    currentPage,
    limit,
    activeTab,
  } = initialData;

  const canCreateTemplates =
    teamInfo.role === 'OWNER' ||
    teamInfo.role === 'ADMIN' ||
    teamInfo.role === 'MEMBER';

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleTabChange = (tab: 'templates' | 'issued') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const templatePages = Math.ceil(templateCount / limit);
  const certificatePages = Math.ceil(certificateCount / limit);

  if (!teamInfo.hasCertificateAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ProFeatureGate
          feature="certificates"
          title={t('upgrade.title')}
          description={t('upgrade.description')}
          benefits={[
            t('upgrade.benefits.templates'),
            t('upgrade.benefits.generation'),
            t('upgrade.benefits.verification'),
            t('upgrade.benefits.branding'),
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('actions.export')}
          </Button>

          {canCreateTemplates && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.createTemplate')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="relative">
            {t('tabs.templates')}
            {templateCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {templateCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issued" className="relative">
            {t('tabs.issued')}
            {certificateCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {certificateCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {t('empty.templates.title')}
                  </h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    {t('empty.templates.description')}
                  </p>
                  {canCreateTemplates && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('actions.createFirstTemplate')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(template => (
                  <CertificateTemplateCard
                    key={template.id}
                    template={template}
                    canEdit={canCreateTemplates}
                    locale={locale}
                  />
                ))}
              </div>

              {templatePages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={templatePages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Issued Certificates Tab */}
        <TabsContent value="issued" className="space-y-6">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {t('empty.certificates.title')}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {t('empty.certificates.description')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {certificates.map(certificate => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    locale={locale}
                  />
                ))}
              </div>

              {certificatePages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={certificatePages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      <CreateTemplateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        teamId={teamInfo.id}
        locale={locale}
      />
    </div>
  );
}
