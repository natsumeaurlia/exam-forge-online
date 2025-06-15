'use client';

import { useTranslations } from 'next-intl';
import { Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CertificateDesign } from '@/types/certificate';

interface BackgroundPanelProps {
  background: CertificateDesign['background'];
  onBackgroundUpdate: (background: CertificateDesign['background']) => void;
  canEdit: boolean;
  locale: string;
}

export function BackgroundPanel({
  background,
  onBackgroundUpdate,
  canEdit,
  locale,
}: BackgroundPanelProps) {
  const t = useTranslations('certificates.designer.background');

  if (!canEdit) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">{t('readOnly')}</p>
      </div>
    );
  }

  const presetColors = [
    '#ffffff',
    '#f8f9fa',
    '#e9ecef',
    '#dee2e6',
    '#ced4da',
    '#adb5bd',
    '#6c757d',
    '#495057',
    '#343a40',
    '#212529',
    '#ffc107',
    '#fd7e14',
    '#dc3545',
    '#e83e8c',
    '#6f42c1',
    '#6610f2',
    '#6f42c1',
    '#0d6efd',
    '#20c997',
    '#198754',
  ];

  const presetGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  const updateBackground = (
    updates: Partial<CertificateDesign['background']>
  ) => {
    onBackgroundUpdate({
      ...background,
      ...updates,
    });
  };

  return (
    <div className="h-full space-y-4 overflow-y-auto">
      {/* Background Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('type.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={background.type}
            onValueChange={value => updateBackground({ type: value as any })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="color" />
              <Label htmlFor="color" className="text-sm">
                {t('type.color')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gradient" id="gradient" />
              <Label htmlFor="gradient" className="text-sm">
                {t('type.gradient')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label htmlFor="image" className="text-sm">
                {t('type.image')}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Color Background */}
      {background.type === 'color' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('color.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="colorValue" className="text-xs">
                {t('color.value')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="colorValue"
                  type="color"
                  value={background.value}
                  onChange={e => updateBackground({ value: e.target.value })}
                  className="h-8 w-12 rounded border p-1"
                />
                <Input
                  value={background.value}
                  onChange={e => updateBackground({ value: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{t('color.presets')}</Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {presetColors.map(color => (
                  <button
                    key={color}
                    className="h-8 w-8 rounded border border-gray-300 transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => updateBackground({ value: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gradient Background */}
      {background.type === 'gradient' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('gradient.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="gradientValue" className="text-xs">
                {t('gradient.value')}
              </Label>
              <Input
                id="gradientValue"
                value={background.value}
                onChange={e => updateBackground({ value: e.target.value })}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">{t('gradient.presets')}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {presetGradients.map((gradient, index) => (
                  <button
                    key={index}
                    className="h-8 rounded border border-gray-300 transition-transform hover:scale-105"
                    style={{ background: gradient }}
                    onClick={() => updateBackground({ value: gradient })}
                    title={gradient}
                  />
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-600">
              <p>{t('gradient.help')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Background */}
      {background.type === 'image' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('image.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="imageValue" className="text-xs">
                {t('image.url')}
              </Label>
              <Input
                id="imageValue"
                value={background.value}
                onChange={e => updateBackground({ value: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
            </div>

            <Button variant="outline" className="w-full" disabled>
              <Upload className="mr-2 h-4 w-4" />
              {t('image.upload')}
            </Button>

            <div className="text-xs text-gray-600">
              <p>{t('image.help')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opacity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('opacity.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Slider
                value={[background.opacity * 100]}
                onValueChange={([value]) =>
                  updateBackground({ opacity: value / 100 })
                }
                max={100}
                min={0}
                step={5}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs">
                {Math.round(background.opacity * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-600">{t('opacity.description')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('preview.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="h-24 w-full rounded-md border border-gray-300"
            style={{
              backgroundColor:
                background.type === 'color' ? background.value : undefined,
              background:
                background.type === 'gradient' ? background.value : undefined,
              backgroundImage:
                background.type === 'image'
                  ? `url(${background.value})`
                  : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: background.opacity,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
