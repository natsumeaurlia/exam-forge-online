'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Copy, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CertificateElement } from '@/types/certificate';

interface PropertiesPanelProps {
  element: CertificateElement | undefined;
  onElementUpdate: (
    elementId: string,
    updates: Partial<CertificateElement>
  ) => void;
  onElementDelete: (elementId: string) => void;
  canEdit: boolean;
  locale: string;
}

export function PropertiesPanel({
  element,
  onElementUpdate,
  onElementDelete,
  canEdit,
  locale,
}: PropertiesPanelProps) {
  const t = useTranslations('certificates.designer.properties');

  if (!element) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">{t('noSelection')}</p>
        <p className="mt-1 text-xs">{t('selectElement')}</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">{t('readOnly')}</p>
      </div>
    );
  }

  const updateElement = (updates: Partial<CertificateElement>) => {
    onElementUpdate(element.id, updates);
  };

  const updateStyle = (
    styleUpdates: Partial<NonNullable<CertificateElement['style']>>
  ) => {
    updateElement({
      style: {
        ...element.style,
        ...styleUpdates,
      },
    });
  };

  const updatePosition = (
    positionUpdates: Partial<CertificateElement['position']>
  ) => {
    updateElement({
      position: {
        ...element.position,
        ...positionUpdates,
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm(t('deleteConfirm'))) {
      onElementDelete(element.id);
    }
  };

  const fontFamilies = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Times, serif', label: 'Times' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Courier, monospace', label: 'Courier' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Impact, sans-serif', label: 'Impact' },
  ];

  const fontWeights = [
    { value: 'normal', label: t('fontWeight.normal') },
    { value: 'bold', label: t('fontWeight.bold') },
    { value: '100', label: t('fontWeight.thin') },
    { value: '300', label: t('fontWeight.light') },
    { value: '500', label: t('fontWeight.medium') },
    { value: '700', label: t('fontWeight.bold') },
    { value: '900', label: t('fontWeight.black') },
  ];

  const textAlignments = [
    { value: 'left', label: t('textAlign.left') },
    { value: 'center', label: t('textAlign.center') },
    { value: 'right', label: t('textAlign.right') },
  ];

  return (
    <div className="h-full space-y-4 overflow-y-auto">
      {/* Element Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('elementInfo')}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {element.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // TODO: Implement copy functionality
              }}
            >
              <Copy className="mr-2 h-3 w-3" />
              {t('actions.copy')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              {t('actions.delete')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {(element.type === 'text' ||
        element.type === 'image' ||
        element.type === 'logo') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('content.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {element.type === 'text' ? (
              <div>
                <Label htmlFor="content" className="text-xs">
                  {t('content.text')}
                </Label>
                <Textarea
                  id="content"
                  value={element.content || ''}
                  onChange={e => updateElement({ content: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="content" className="text-xs">
                  {t('content.imageUrl')}
                </Label>
                <Input
                  id="content"
                  value={element.content || ''}
                  onChange={e => updateElement({ content: e.target.value })}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Position & Size */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('position.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x" className="text-xs">
                {t('position.x')}
              </Label>
              <Input
                id="x"
                type="number"
                value={element.position.x}
                onChange={e => updatePosition({ x: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="y" className="text-xs">
                {t('position.y')}
              </Label>
              <Input
                id="y"
                type="number"
                value={element.position.y}
                onChange={e => updatePosition({ y: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width" className="text-xs">
                {t('position.width')}
              </Label>
              <Input
                id="width"
                type="number"
                value={element.position.width}
                onChange={e =>
                  updatePosition({ width: Number(e.target.value) })
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">
                {t('position.height')}
              </Label>
              <Input
                id="height"
                type="number"
                value={element.position.height}
                onChange={e =>
                  updatePosition({ height: Number(e.target.value) })
                }
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Styling */}
      {element.type === 'text' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('textStyle.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="fontSize" className="text-xs">
                {t('textStyle.fontSize')}
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[element.style?.fontSize || 16]}
                  onValueChange={([value]) => updateStyle({ fontSize: value })}
                  max={72}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-right text-xs">
                  {element.style?.fontSize || 16}px
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="fontFamily" className="text-xs">
                {t('textStyle.fontFamily')}
              </Label>
              <Select
                value={element.style?.fontFamily}
                onValueChange={value => updateStyle({ fontFamily: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('textStyle.selectFont')} />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fontWeight" className="text-xs">
                {t('textStyle.fontWeight')}
              </Label>
              <Select
                value={element.style?.fontWeight}
                onValueChange={value => updateStyle({ fontWeight: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('textStyle.selectWeight')} />
                </SelectTrigger>
                <SelectContent>
                  {fontWeights.map(weight => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="textAlign" className="text-xs">
                {t('textStyle.textAlign')}
              </Label>
              <Select
                value={element.style?.textAlign}
                onValueChange={value =>
                  updateStyle({ textAlign: value as any })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('textStyle.selectAlign')} />
                </SelectTrigger>
                <SelectContent>
                  {textAlignments.map(align => (
                    <SelectItem key={align.value} value={align.value}>
                      {align.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color" className="text-xs">
                {t('textStyle.color')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={element.style?.color || '#000000'}
                  onChange={e => updateStyle({ color: e.target.value })}
                  className="h-8 w-12 rounded border p-1"
                />
                <Input
                  value={element.style?.color || '#000000'}
                  onChange={e => updateStyle({ color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background & Border */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('appearance.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="backgroundColor" className="text-xs">
              {t('appearance.backgroundColor')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColor"
                type="color"
                value={element.style?.backgroundColor || '#ffffff'}
                onChange={e => updateStyle({ backgroundColor: e.target.value })}
                className="h-8 w-12 rounded border p-1"
              />
              <Input
                value={element.style?.backgroundColor || '#ffffff'}
                onChange={e => updateStyle({ backgroundColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="borderColor" className="text-xs">
              {t('appearance.borderColor')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="borderColor"
                type="color"
                value={element.style?.borderColor || '#000000'}
                onChange={e => updateStyle({ borderColor: e.target.value })}
                className="h-8 w-12 rounded border p-1"
              />
              <Input
                value={element.style?.borderColor || '#000000'}
                onChange={e => updateStyle({ borderColor: e.target.value })}
                placeholder="#000000"
                className="flex-1 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="borderWidth" className="text-xs">
              {t('appearance.borderWidth')}
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[element.style?.borderWidth || 0]}
                onValueChange={([value]) => updateStyle({ borderWidth: value })}
                max={20}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs">
                {element.style?.borderWidth || 0}px
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="borderRadius" className="text-xs">
              {t('appearance.borderRadius')}
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[element.style?.borderRadius || 0]}
                onValueChange={([value]) =>
                  updateStyle({ borderRadius: value })
                }
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs">
                {element.style?.borderRadius || 0}px
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
