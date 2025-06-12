'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  FileText,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Search,
  Grid3X3,
  List,
} from 'lucide-react';

interface CertificateTemplatesTabProps {
  lng: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  design: {
    layout: 'landscape' | 'portrait';
    primaryColor: string;
    secondaryColor: string;
  };
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for now
const mockTemplates: CertificateTemplate[] = [
  {
    id: '1',
    name: '基本修了証テンプレート',
    description: 'シンプルで汎用的な修了証テンプレート',
    design: {
      layout: 'landscape',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
    },
    usageCount: 15,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '2',
    name: '資格認定証テンプレート',
    description: 'フォーマルな資格認定証向けテンプレート',
    design: {
      layout: 'portrait',
      primaryColor: '#059669',
      secondaryColor: '#047857',
    },
    usageCount: 8,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
  },
];

export function CertificateTemplatesTab({ lng }: CertificateTemplatesTabProps) {
  const t = useTranslations('certificates');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [templates] = useState<CertificateTemplate[]>(mockTemplates);

  const filteredTemplates = templates.filter(
    template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditTemplate = (templateId: string) => {
    console.log('Edit template:', templateId);
    // TODO: Implement template editing
  };

  const handleDuplicateTemplate = (templateId: string) => {
    console.log('Duplicate template:', templateId);
    // TODO: Implement template duplication
  };

  const handleDeleteTemplate = (templateId: string) => {
    console.log('Delete template:', templateId);
    // TODO: Implement template deletion
  };

  const handlePreviewTemplate = (templateId: string) => {
    console.log('Preview template:', templateId);
    // TODO: Implement template preview
  };

  return (
    <div className="space-y-6">
      {/* Search and View Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-l-md"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-r-md"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <FileText className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 font-medium">{t('templates.empty.title')}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('templates.empty.description')}
            </p>
            <Button className="mt-4">{t('actions.createTemplate')}</Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="group transition-shadow hover:shadow-md"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-16 w-full items-center justify-center rounded border-2 border-dashed"
                    style={{
                      borderColor: template.design.primaryColor,
                      backgroundColor: `${template.design.primaryColor}10`,
                    }}
                  >
                    <FileText
                      className="h-8 w-8"
                      style={{ color: template.design.primaryColor }}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handlePreviewTemplate(template.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t('actions.preview')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateTemplate(template.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t('actions.duplicate')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('templates.usageCount', { count: template.usageCount })}
                  </span>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive
                      ? t('status.active')
                      : t('status.inactive')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.design.layout === 'landscape'
                      ? t('layout.landscape')
                      : t('layout.portrait')}
                  </Badge>
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: template.design.primaryColor }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map(template => (
            <Card key={template.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded border-2 border-dashed"
                    style={{
                      borderColor: template.design.primaryColor,
                      backgroundColor: `${template.design.primaryColor}10`,
                    }}
                  >
                    <FileText
                      className="h-6 w-6"
                      style={{ color: template.design.primaryColor }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    {template.description && (
                      <p className="text-muted-foreground text-sm">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-muted-foreground text-sm">
                        {t('templates.usageCount', {
                          count: template.usageCount,
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {template.design.layout === 'landscape'
                          ? t('layout.landscape')
                          : t('layout.portrait')}
                      </Badge>
                      <Badge
                        variant={template.isActive ? 'default' : 'secondary'}
                      >
                        {template.isActive
                          ? t('status.active')
                          : t('status.inactive')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handlePreviewTemplate(template.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('actions.preview')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateTemplate(template.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {t('actions.duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
