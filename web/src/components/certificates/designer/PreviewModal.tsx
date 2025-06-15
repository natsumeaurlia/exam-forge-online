'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Download,
  Share2,
  Eye,
  FileText,
  Calendar,
  User,
  Award,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CertificateTemplate, CertificateData } from '@/types/certificate';

interface PreviewModalProps {
  template: CertificateTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function PreviewModal({
  template,
  isOpen,
  onClose,
  locale,
}: PreviewModalProps) {
  const t = useTranslations('certificates.designer.preview');
  const [previewData, setPreviewData] = useState<CertificateData>({
    recipientName: 'John Doe',
    recipientEmail: 'john.doe@example.com',
    quizTitle: 'JavaScript Fundamentals',
    score: 85,
    completionDate: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    issuerName: 'ExamForge Academy',
    issuerTitle: 'Director of Education',
    customFields: {},
  });

  if (!template) return null;

  const replaceVariables = (content: string): string => {
    return content
      .replace(/\{\{recipient_name\}\}/g, previewData.recipientName)
      .replace(/\{\{quiz_title\}\}/g, previewData.quizTitle)
      .replace(/\{\{score\}\}/g, previewData.score.toString())
      .replace(
        /\{\{completion_date\}\}/g,
        previewData.completionDate.toLocaleDateString(
          locale === 'ja' ? 'ja-JP' : 'en-US'
        )
      )
      .replace(/\{\{issuer_name\}\}/g, previewData.issuerName)
      .replace(/\{\{issuer_title\}\}/g, previewData.issuerTitle || '');
  };

  const renderElement = (element: any) => {
    const { position, style = {}, content = '', type } = element;

    const elementStyle = {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      position: 'absolute' as const,
    };

    switch (type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              fontSize: `${style.fontSize || 16}px`,
              fontFamily: style.fontFamily || 'inherit',
              fontWeight: style.fontWeight || 'normal',
              color: style.color || '#000000',
              textAlign: style.textAlign || 'left',
              backgroundColor: style.backgroundColor || 'transparent',
              border: style.borderWidth
                ? `${style.borderWidth}px solid ${style.borderColor || '#000'}`
                : 'none',
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                style.textAlign === 'center'
                  ? 'center'
                  : style.textAlign === 'right'
                    ? 'flex-end'
                    : 'flex-start',
              padding: '4px',
              overflow: 'hidden',
            }}
          >
            {replaceVariables(content)}
          </div>
        );

      case 'image':
      case 'logo':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
              overflow: 'hidden',
            }}
          >
            {content ? (
              <img
                src={content}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: type === 'logo' ? 'contain' : 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                {type === 'logo' ? '🏢 Logo' : '📷 Image'}
              </div>
            )}
          </div>
        );

      case 'qr':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>⬜</div>
              <div>QR Code</div>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              backgroundColor: '#f9fafb',
              border: '2px dashed #d1d5db',
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>✍️</div>
              <div>Signature</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const backgroundStyle = {
    width: `${template.design.dimensions.width}px`,
    height: `${template.design.dimensions.height}px`,
    backgroundColor:
      template.design.background.type === 'color'
        ? template.design.background.value
        : undefined,
    background:
      template.design.background.type === 'gradient'
        ? template.design.background.value
        : undefined,
    backgroundImage:
      template.design.background.type === 'image'
        ? `url(${template.design.background.value})`
        : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: template.design.background.opacity,
    position: 'relative' as const,
    margin: '0 auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('title')} - {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t('certificate')}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      {t('actions.download')}
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Share2 className="mr-2 h-4 w-4" />
                      {t('actions.share')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center overflow-auto rounded-lg bg-gray-50 p-4">
                  <div style={backgroundStyle}>
                    {template.design.elements.map(renderElement)}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {template.design.dimensions.width} ×{' '}
                    {template.design.dimensions.height}px
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Data Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  {t('data.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="recipientName"
                    className="flex items-center gap-1 text-xs"
                  >
                    <User className="h-3 w-3" />
                    {t('data.recipientName')}
                  </Label>
                  <Input
                    id="recipientName"
                    value={previewData.recipientName}
                    onChange={e =>
                      setPreviewData(prev => ({
                        ...prev,
                        recipientName: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="quizTitle"
                    className="flex items-center gap-1 text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    {t('data.quizTitle')}
                  </Label>
                  <Input
                    id="quizTitle"
                    value={previewData.quizTitle}
                    onChange={e =>
                      setPreviewData(prev => ({
                        ...prev,
                        quizTitle: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="score"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Award className="h-3 w-3" />
                    {t('data.score')}
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={previewData.score}
                    onChange={e =>
                      setPreviewData(prev => ({
                        ...prev,
                        score: Number(e.target.value),
                      }))
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="issuerName" className="text-xs">
                    {t('data.issuerName')}
                  </Label>
                  <Input
                    id="issuerName"
                    value={previewData.issuerName}
                    onChange={e =>
                      setPreviewData(prev => ({
                        ...prev,
                        issuerName: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="issuerTitle" className="text-xs">
                    {t('data.issuerTitle')}
                  </Label>
                  <Input
                    id="issuerTitle"
                    value={previewData.issuerTitle || ''}
                    onChange={e =>
                      setPreviewData(prev => ({
                        ...prev,
                        issuerTitle: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('template.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">{t('template.name')}</Label>
                  <p className="text-sm font-medium">{template.name}</p>
                </div>

                {template.description && (
                  <div>
                    <Label className="text-xs">
                      {t('template.description')}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {template.description}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label>{t('template.elements')}</Label>
                    <p className="font-medium">
                      {template.design.elements.length}
                    </p>
                  </div>
                  <div>
                    <Label>{t('template.background')}</Label>
                    <p className="font-medium capitalize">
                      {template.design.background.type}
                    </p>
                  </div>
                </div>

                <div className="text-muted-foreground text-xs">
                  <p>
                    {t('template.lastModified')}:{' '}
                    {new Date(template.updatedAt).toLocaleDateString(
                      locale === 'ja' ? 'ja-JP' : 'en-US'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-muted-foreground rounded-lg bg-blue-50 p-3 text-xs">
              <p>{t('help.description')}</p>
              <ul className="mt-2 space-y-1">
                <li>• {t('help.variables')}</li>
                <li>• {t('help.realTime')}</li>
                <li>• {t('help.download')}</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
