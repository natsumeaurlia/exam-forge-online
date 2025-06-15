'use client';

import { useState } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Globe, 
  Hash, 
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { createLMSSite } from '@/lib/actions/lms';
import { toast } from 'sonner';

interface CreateSiteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  teamId: string;
  trigger?: React.ReactNode;
}

const createSiteSchema = z.object({
  name: z.string().min(1, 'サイト名は必須です').max(50, 'サイト名は50文字以内で入力してください'),
  slug: z.string()
    .min(1, 'スラッグは必須です')
    .max(30, 'スラッグは30文字以内で入力してください')
    .regex(/^[a-z0-9-]+$/, 'スラッグは小文字、数字、ハイフンのみ使用可能です')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'スラッグの最初と最後にハイフンは使用できません'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  subdomain: z.string()
    .regex(/^[a-z0-9-]+$/, 'サブドメインは小文字、数字、ハイフンのみ使用可能です')
    .min(3, 'サブドメインは3文字以上で入力してください')
    .max(30, 'サブドメインは30文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  useSubdomain: z.boolean().default(false),
});

type CreateSiteFormData = z.infer<typeof createSiteSchema>;

export function CreateSiteModal({ isOpen: controlledOpen, onClose: controlledOnClose, teamId, trigger }: CreateSiteModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const onClose = controlledOnClose ?? (() => setInternalOpen(false));
  const t = useTranslations('lms.createSite');
  const [slugSuggestion, setSlugSuggestion] = useState('');

  const form = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      subdomain: '',
      useSubdomain: false,
    },
  });

  const {
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  const watchName = watch('name');
  const watchSlug = watch('slug');
  const watchSubdomain = watch('subdomain');
  const watchUseSubdomain = watch('useSubdomain');

  // Auto-generate slug from site name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Generate slug suggestion when name changes
  React.useEffect(() => {
    if (watchName && !watchSlug) {
      const suggestion = generateSlug(watchName);
      setSlugSuggestion(suggestion);
    }
  }, [watchName, watchSlug]);

  const { action, isPending } = useHookFormAction(
    createLMSSite,
    form,
    {
      onSuccess: () => {
        toast.success(t('success'));
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error.serverError || t('error'));
      },
    }
  );

  const handleSubmit = () => {
    const values = form.getValues();
    action({
      teamId,
      name: values.name,
      slug: values.slug,
      description: values.description || undefined,
      subdomain: values.useSubdomain ? values.subdomain || undefined : undefined,
    });
  };

  const handleSlugSuggestion = () => {
    setValue('slug', slugSuggestion);
    setSlugSuggestion('');
  };

  const handleClose = () => {
    reset();
    setSlugSuggestion('');
    onClose();
  };

  // Auto-generate subdomain from slug
  React.useEffect(() => {
    if (watchUseSubdomain && watchSlug && !watchSubdomain) {
      setValue('subdomain', watchSlug);
    }
  }, [watchUseSubdomain, watchSlug, watchSubdomain, setValue]);

  const modalContent = (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t('tabs.basic')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('tabs.advanced')}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Site Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('fields.name.label')} *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder={t('fields.name.placeholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Site Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">{t('fields.slug.label')} *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="slug"
                      {...form.register('slug')}
                      placeholder={t('fields.slug.placeholder')}
                      className={`pl-10 ${errors.slug ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {slugSuggestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSlugSuggestion}
                      className="shrink-0"
                    >
                      {slugSuggestion}
                    </Button>
                  )}
                </div>
                {watchSlug && (
                  <div className="text-xs text-muted-foreground">
                    URL: <code>examforge.com/lms/{watchSlug}</code>
                  </div>
                )}
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('fields.description.label')}</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder={t('fields.description.placeholder')}
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Subdomain Configuration */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      {t('fields.subdomain.label')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('fields.subdomain.description')}
                    </p>
                  </div>
                  <Switch
                    checked={watchUseSubdomain}
                    onCheckedChange={(checked) => setValue('useSubdomain', checked)}
                  />
                </div>

                {watchUseSubdomain && (
                  <div className="space-y-2">
                    <Input
                      {...form.register('subdomain')}
                      placeholder={t('fields.subdomain.placeholder')}
                      className={errors.subdomain ? 'border-red-500' : ''}
                    />
                    {watchSubdomain && (
                      <div className="flex items-center gap-2 text-xs">
                        <Globe className="h-3 w-3" />
                        <code className="bg-muted px-2 py-1 rounded">
                          https://{watchSubdomain}.examforge.com
                        </code>
                      </div>
                    )}
                    {errors.subdomain && (
                      <p className="text-sm text-red-500">{errors.subdomain.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Premium Features Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{t('premiumNotice.description')}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{t('premiumNotice.features.customDomain')}</Badge>
                      <Badge variant="outline">{t('premiumNotice.features.pageBuilder')}</Badge>
                      <Badge variant="outline">{t('premiumNotice.features.whiteLabel')}</Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('actions.creating')}
                </>
              ) : (
                t('actions.create')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (trigger) {
    return (
      <>
        <div onClick={() => setInternalOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
        {modalContent}
      </>
    );
  }

  return modalContent;
}