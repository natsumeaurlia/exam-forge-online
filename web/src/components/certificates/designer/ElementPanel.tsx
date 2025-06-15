'use client';

import { useTranslations } from 'next-intl';
import {
  Type,
  Image as ImageIcon,
  QrCode,
  PenTool,
  Building,
  Plus,
  FileText,
  Calendar,
  Award,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CertificateElement } from '@/types/certificate';

interface ElementPanelProps {
  onElementAdd: (element: Omit<CertificateElement, 'id'>) => void;
  canEdit: boolean;
  locale: string;
}

export function ElementPanel({
  onElementAdd,
  canEdit,
  locale,
}: ElementPanelProps) {
  const t = useTranslations('certificates.designer.elements');

  const elementTypes = [
    {
      type: 'text' as const,
      icon: Type,
      label: t('text.label'),
      description: t('text.description'),
      defaultSize: { width: 200, height: 40 },
      defaultContent: t('text.defaultContent'),
      category: 'basic',
    },
    {
      type: 'image' as const,
      icon: ImageIcon,
      label: t('image.label'),
      description: t('image.description'),
      defaultSize: { width: 150, height: 150 },
      category: 'media',
    },
    {
      type: 'qr' as const,
      icon: QrCode,
      label: t('qr.label'),
      description: t('qr.description'),
      defaultSize: { width: 80, height: 80 },
      category: 'dynamic',
    },
    {
      type: 'signature' as const,
      icon: PenTool,
      label: t('signature.label'),
      description: t('signature.description'),
      defaultSize: { width: 180, height: 60 },
      category: 'dynamic',
    },
    {
      type: 'logo' as const,
      icon: Building,
      label: t('logo.label'),
      description: t('logo.description'),
      defaultSize: { width: 120, height: 120 },
      category: 'media',
    },
  ];

  const variableElements = [
    {
      variable: 'recipient_name',
      icon: User,
      label: t('variables.recipientName.label'),
      description: t('variables.recipientName.description'),
      content: '{{recipient_name}}',
    },
    {
      variable: 'quiz_title',
      icon: FileText,
      label: t('variables.quizTitle.label'),
      description: t('variables.quizTitle.description'),
      content: '{{quiz_title}}',
    },
    {
      variable: 'completion_date',
      icon: Calendar,
      label: t('variables.completionDate.label'),
      description: t('variables.completionDate.description'),
      content: '{{completion_date}}',
    },
    {
      variable: 'score',
      icon: Award,
      label: t('variables.score.label'),
      description: t('variables.score.description'),
      content: '{{score}}%',
    },
  ];

  const createElement = (
    type: CertificateElement['type'],
    content?: string,
    customSize?: { width: number; height: number }
  ) => {
    const elementType = elementTypes.find(et => et.type === type);
    const defaultSize = customSize ||
      elementType?.defaultSize || { width: 100, height: 100 };

    const element: Omit<CertificateElement, 'id'> = {
      type,
      position: {
        x: 50, // Will be positioned at a default location
        y: 50,
        width: defaultSize.width,
        height: defaultSize.height,
      },
      content: content || elementType?.defaultContent || '',
      style: getDefaultStyle(type),
    };

    return element;
  };

  const getDefaultStyle = (type: CertificateElement['type']) => {
    switch (type) {
      case 'text':
        return {
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left' as const,
        };
      case 'image':
      case 'logo':
        return {
          borderRadius: 0,
        };
      default:
        return {};
    }
  };

  const handleAddElement = (
    type: CertificateElement['type'],
    content?: string
  ) => {
    if (!canEdit) return;

    const element = createElement(type, content);
    onElementAdd(element);
  };

  const handleAddVariable = (variable: string, content: string) => {
    if (!canEdit) return;

    const element = createElement('text', content, { width: 250, height: 40 });
    element.style = {
      ...element.style,
      fontSize: 18,
      fontWeight: 'bold',
    };

    onElementAdd(element);
  };

  if (!canEdit) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">{t('readOnly')}</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6 overflow-y-auto">
      {/* Basic Elements */}
      <div>
        <h3 className="mb-3 text-sm font-medium">{t('categories.basic')}</h3>
        <div className="grid grid-cols-1 gap-2">
          {elementTypes
            .filter(et => et.category === 'basic')
            .map(elementType => {
              const Icon = elementType.icon;
              return (
                <Card
                  key={elementType.type}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleAddElement(elementType.type)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-100">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">
                          {elementType.label}
                        </h4>
                        <p className="text-muted-foreground truncate text-xs">
                          {elementType.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <Separator />

      {/* Media Elements */}
      <div>
        <h3 className="mb-3 text-sm font-medium">{t('categories.media')}</h3>
        <div className="grid grid-cols-1 gap-2">
          {elementTypes
            .filter(et => et.category === 'media')
            .map(elementType => {
              const Icon = elementType.icon;
              return (
                <Card
                  key={elementType.type}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleAddElement(elementType.type)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-green-100">
                        <Icon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">
                          {elementType.label}
                        </h4>
                        <p className="text-muted-foreground truncate text-xs">
                          {elementType.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <Separator />

      {/* Dynamic Elements */}
      <div>
        <h3 className="mb-3 text-sm font-medium">{t('categories.dynamic')}</h3>
        <div className="grid grid-cols-1 gap-2">
          {elementTypes
            .filter(et => et.category === 'dynamic')
            .map(elementType => {
              const Icon = elementType.icon;
              return (
                <Card
                  key={elementType.type}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleAddElement(elementType.type)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-purple-100">
                        <Icon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">
                          {elementType.label}
                        </h4>
                        <p className="text-muted-foreground truncate text-xs">
                          {elementType.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <Separator />

      {/* Variable Elements */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-medium">{t('categories.variables')}</h3>
          <Badge variant="secondary" className="text-xs">
            {t('categories.variablesTag')}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {variableElements.map(variable => {
            const Icon = variable.icon;
            return (
              <Card
                key={variable.variable}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  handleAddVariable(variable.variable, variable.content)
                }
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-100">
                      <Icon className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">
                        {variable.label}
                      </h4>
                      <p className="text-muted-foreground truncate text-xs">
                        {variable.description}
                      </p>
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                        {variable.content}
                      </code>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          <h4 className="mb-1 text-sm font-medium text-blue-900">
            {t('tips.title')}
          </h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>• {t('tips.clickToAdd')}</li>
            <li>• {t('tips.dragToPosition')}</li>
            <li>• {t('tips.useVariables')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
