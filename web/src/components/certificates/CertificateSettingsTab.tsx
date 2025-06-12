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
import { Switch } from '@/components/ui/switch';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Shield,
  Globe,
  Settings,
  Mail,
  FileText,
  Save,
  Eye,
  Link,
} from 'lucide-react';

interface CertificateSettingsTabProps {
  lng: string;
}

interface CertificateSettings {
  verification: {
    enablePublicVerification: boolean;
    verificationMethods: {
      qrCode: boolean;
      validationCode: boolean;
      recipientInfo: boolean;
    };
    displayInfo: {
      recipientName: boolean;
      quizTitle: boolean;
      score: boolean;
      issueDate: boolean;
      expiryDate: boolean;
    };
  };
  issuance: {
    autoIssue: boolean;
    requireManualApproval: boolean;
    emailNotification: boolean;
    defaultValidityDays: number | null;
  };
  branding: {
    organizationName: string;
    defaultSignatory: string;
    contactEmail: string;
    website: string;
  };
  templates: {
    defaultLayoutStyle: 'modern' | 'classic' | 'minimal';
    allowCustomFonts: boolean;
    maxImageSize: number; // MB
  };
}

const defaultSettings: CertificateSettings = {
  verification: {
    enablePublicVerification: true,
    verificationMethods: {
      qrCode: true,
      validationCode: true,
      recipientInfo: false,
    },
    displayInfo: {
      recipientName: true,
      quizTitle: true,
      score: true,
      issueDate: true,
      expiryDate: true,
    },
  },
  issuance: {
    autoIssue: true,
    requireManualApproval: false,
    emailNotification: true,
    defaultValidityDays: 365,
  },
  branding: {
    organizationName: '',
    defaultSignatory: '',
    contactEmail: '',
    website: '',
  },
  templates: {
    defaultLayoutStyle: 'modern',
    allowCustomFonts: true,
    maxImageSize: 5,
  },
};

export function CertificateSettingsTab({ lng }: CertificateSettingsTabProps) {
  const t = useTranslations('certificates');
  const [settings, setSettings] =
    useState<CertificateSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement settings save
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const previewVerificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lng}/verify/sample-code`;

  return (
    <div className="space-y-6">
      {/* Verification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.verification.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.verification.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {t('settings.verification.enablePublic')}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t('settings.verification.enablePublicDescription')}
              </p>
            </div>
            <Switch
              checked={settings.verification.enablePublicVerification}
              onCheckedChange={checked =>
                updateSettings(
                  ['verification', 'enablePublicVerification'],
                  checked
                )
              }
            />
          </div>

          {settings.verification.enablePublicVerification && (
            <>
              <Separator />

              <div>
                <Label className="mb-3 block text-base font-medium">
                  {t('settings.verification.methods')}
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <Label>{t('settings.verification.qrCode')}</Label>
                    </div>
                    <Switch
                      checked={settings.verification.verificationMethods.qrCode}
                      onCheckedChange={checked =>
                        updateSettings(
                          ['verification', 'verificationMethods', 'qrCode'],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <Label>{t('settings.verification.validationCode')}</Label>
                    </div>
                    <Switch
                      checked={
                        settings.verification.verificationMethods.validationCode
                      }
                      onCheckedChange={checked =>
                        updateSettings(
                          [
                            'verification',
                            'verificationMethods',
                            'validationCode',
                          ],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Label>{t('settings.verification.recipientInfo')}</Label>
                    </div>
                    <Switch
                      checked={
                        settings.verification.verificationMethods.recipientInfo
                      }
                      onCheckedChange={checked =>
                        updateSettings(
                          [
                            'verification',
                            'verificationMethods',
                            'recipientInfo',
                          ],
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block text-base font-medium">
                  {t('settings.verification.displayInfo')}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.verification.displayInfo).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <Label className="text-sm">
                          {t(`settings.verification.info.${key}`)}
                        </Label>
                        <Switch
                          checked={value}
                          onCheckedChange={checked =>
                            updateSettings(
                              ['verification', 'displayInfo', key],
                              checked
                            )
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t('settings.verification.preview')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="text-muted-foreground h-3 w-3" />
                  <code className="bg-background rounded px-2 py-1 text-xs">
                    {previewVerificationUrl}
                  </code>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Issuance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.issuance.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.issuance.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {t('settings.issuance.autoIssue')}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t('settings.issuance.autoIssueDescription')}
              </p>
            </div>
            <Switch
              checked={settings.issuance.autoIssue}
              onCheckedChange={checked =>
                updateSettings(['issuance', 'autoIssue'], checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {t('settings.issuance.requireManualApproval')}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t('settings.issuance.requireManualApprovalDescription')}
              </p>
            </div>
            <Switch
              checked={settings.issuance.requireManualApproval}
              onCheckedChange={checked =>
                updateSettings(['issuance', 'requireManualApproval'], checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {t('settings.issuance.emailNotification')}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t('settings.issuance.emailNotificationDescription')}
              </p>
            </div>
            <Switch
              checked={settings.issuance.emailNotification}
              onCheckedChange={checked =>
                updateSettings(['issuance', 'emailNotification'], checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              {t('settings.issuance.defaultValidityDays')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.issuance.defaultValidityDays || ''}
                onChange={e =>
                  updateSettings(
                    ['issuance', 'defaultValidityDays'],
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder={t('settings.issuance.neverExpires')}
                className="w-32"
              />
              <span className="text-muted-foreground text-sm">
                {settings.issuance.defaultValidityDays
                  ? t('settings.issuance.days')
                  : t('settings.issuance.neverExpires')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.branding.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.branding.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.branding.organizationName')}</Label>
              <Input
                value={settings.branding.organizationName}
                onChange={e =>
                  updateSettings(
                    ['branding', 'organizationName'],
                    e.target.value
                  )
                }
                placeholder={t('settings.branding.organizationNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('settings.branding.defaultSignatory')}</Label>
              <Input
                value={settings.branding.defaultSignatory}
                onChange={e =>
                  updateSettings(
                    ['branding', 'defaultSignatory'],
                    e.target.value
                  )
                }
                placeholder={t('settings.branding.defaultSignatoryPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('settings.branding.contactEmail')}</Label>
              <Input
                type="email"
                value={settings.branding.contactEmail}
                onChange={e =>
                  updateSettings(['branding', 'contactEmail'], e.target.value)
                }
                placeholder={t('settings.branding.contactEmailPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('settings.branding.website')}</Label>
              <Input
                type="url"
                value={settings.branding.website}
                onChange={e =>
                  updateSettings(['branding', 'website'], e.target.value)
                }
                placeholder={t('settings.branding.websitePlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.templates.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.templates.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.templates.defaultLayoutStyle')}</Label>
            <Select
              value={settings.templates.defaultLayoutStyle}
              onValueChange={(value: 'modern' | 'classic' | 'minimal') =>
                updateSettings(['templates', 'defaultLayoutStyle'], value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">
                  {t('settings.templates.styles.modern')}
                </SelectItem>
                <SelectItem value="classic">
                  {t('settings.templates.styles.classic')}
                </SelectItem>
                <SelectItem value="minimal">
                  {t('settings.templates.styles.minimal')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                {t('settings.templates.allowCustomFonts')}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t('settings.templates.allowCustomFontsDescription')}
              </p>
            </div>
            <Switch
              checked={settings.templates.allowCustomFonts}
              onCheckedChange={checked =>
                updateSettings(['templates', 'allowCustomFonts'], checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.templates.maxImageSize')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.templates.maxImageSize}
                onChange={e =>
                  updateSettings(
                    ['templates', 'maxImageSize'],
                    parseInt(e.target.value) || 5
                  )
                }
                className="w-24"
                min="1"
                max="50"
              />
              <span className="text-muted-foreground text-sm">MB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('actions.saving') : t('actions.saveSettings')}
        </Button>
      </div>
    </div>
  );
}
