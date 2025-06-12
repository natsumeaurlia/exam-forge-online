'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FileText, Award, Settings } from 'lucide-react';
import { CertificateTemplatesTab } from './CertificateTemplatesTab';
import { IssuedCertificatesTab } from './IssuedCertificatesTab';
import { CertificateSettingsTab } from './CertificateSettingsTab';

interface CertificatesContentProps {
  lng: string;
}

export function CertificatesContent({ lng }: CertificatesContentProps) {
  const t = useTranslations('certificates');
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('tabs.templates')}
            </TabsTrigger>
            <TabsTrigger value="issued" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t('tabs.issued')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('tabs.settings')}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'templates' && (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('actions.createTemplate')}
            </Button>
          )}
        </div>

        <TabsContent value="templates" className="space-y-6">
          <CertificateTemplatesTab lng={lng} />
        </TabsContent>

        <TabsContent value="issued" className="space-y-6">
          <IssuedCertificatesTab lng={lng} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <CertificateSettingsTab lng={lng} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
