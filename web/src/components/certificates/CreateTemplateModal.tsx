'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { X, Award, FileText, Image, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createCertificateTemplate } from '@/lib/actions/certificate-template';
import { CertificateDesign, CertificatePreset } from '@/types/certificate';

const formSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  preset: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  locale: string;
}

// Predefined certificate presets
const certificatePresets: CertificatePreset[] = [
  {
    id: 'academic-classic',
    name: 'Academic Classic',
    description: '伝統的なアカデミック証明書デザイン',
    thumbnail: '/presets/academic-classic.svg',
    category: 'academic',
    design: {
      layout: 'landscape',
      dimensions: { width: 800, height: 600 },
      background: {
        type: 'color',
        value: '#ffffff',
        opacity: 1,
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 400, y: 100, width: 600, height: 60 },
          content: 'Certificate of Completion',
          style: {
            fontSize: 32,
            fontFamily: 'serif',
            fontWeight: 'bold',
            color: '#1a365d',
            textAlign: 'center',
          },
        },
        {
          id: 'recipient',
          type: 'text',
          position: { x: 400, y: 250, width: 600, height: 40 },
          content: '{{recipient_name}}',
          style: {
            fontSize: 24,
            fontFamily: 'serif',
            color: '#2d3748',
            textAlign: 'center',
          },
        },
        {
          id: 'description',
          type: 'text',
          position: { x: 400, y: 320, width: 600, height: 60 },
          content: 'has successfully completed the quiz: {{quiz_title}}',
          style: {
            fontSize: 16,
            fontFamily: 'sans-serif',
            color: '#4a5568',
            textAlign: 'center',
          },
        },
      ],
      variables: [
        { name: 'recipient_name', label: '受講者名', type: 'user_name' },
        { name: 'quiz_title', label: 'クイズタイトル', type: 'quiz_title' },
        { name: 'completion_date', label: '完了日', type: 'date' },
        { name: 'score', label: 'スコア', type: 'score' },
      ],
    },
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'モダンなプロフェッショナル向けデザイン',
    thumbnail: '/presets/modern-professional.svg',
    category: 'professional',
    design: {
      layout: 'portrait',
      dimensions: { width: 600, height: 800 },
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 1,
      },
      elements: [
        {
          id: 'header',
          type: 'text',
          position: { x: 300, y: 150, width: 500, height: 50 },
          content: 'CERTIFICATE',
          style: {
            fontSize: 28,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          id: 'recipient',
          type: 'text',
          position: { x: 300, y: 350, width: 500, height: 40 },
          content: '{{recipient_name}}',
          style: {
            fontSize: 22,
            fontFamily: 'sans-serif',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
      variables: [
        { name: 'recipient_name', label: '受講者名', type: 'user_name' },
        { name: 'quiz_title', label: 'クイズタイトル', type: 'quiz_title' },
      ],
    },
  },
  {
    id: 'simple-achievement',
    name: 'Simple Achievement',
    description: 'シンプルな達成証明書',
    thumbnail: '/presets/simple-achievement.svg',
    category: 'achievement',
    design: {
      layout: 'landscape',
      dimensions: { width: 800, height: 600 },
      background: {
        type: 'color',
        value: '#f7fafc',
        opacity: 1,
      },
      elements: [
        {
          id: 'award-icon',
          type: 'text',
          position: { x: 400, y: 80, width: 60, height: 60 },
          content: '🏆',
          style: {
            fontSize: 48,
            textAlign: 'center',
          },
        },
        {
          id: 'title',
          type: 'text',
          position: { x: 400, y: 180, width: 600, height: 40 },
          content: 'Achievement Certificate',
          style: {
            fontSize: 24,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: '#2d3748',
            textAlign: 'center',
          },
        },
      ],
      variables: [
        { name: 'recipient_name', label: '受講者名', type: 'user_name' },
        { name: 'quiz_title', label: 'クイズタイトル', type: 'quiz_title' },
      ],
    },
  },
];

export function CreateTemplateModal({
  open,
  onOpenChange,
  teamId,
  locale,
}: CreateTemplateModalProps) {
  const t = useTranslations('certificates.create');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [step, setStep] = useState<'preset' | 'details'>('preset');
  const [tagInput, setTagInput] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      tags: [],
      preset: undefined,
    },
  });

  const { watch, setValue } = form;
  const tags = watch('tags');

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setStep('details');

    const preset = certificatePresets.find(p => p.id === presetId);
    if (preset) {
      setValue('preset', presetId);
      if (!watch('name')) {
        setValue('name', preset.name);
      }
      if (!watch('description')) {
        setValue('description', preset.description);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter(tag => tag !== tagToRemove)
    );
  };

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const preset = selectedPreset
        ? certificatePresets.find(p => p.id === selectedPreset)
        : null;
      const design = preset?.design || getDefaultDesign();

      const result = await createCertificateTemplate({
        name: data.name,
        description: data.description,
        design,
        isPublic: data.isPublic,
        tags: data.tags,
      });

      if (result.success) {
        toast.success(t('success'));
        onOpenChange(false);
        router.push(`/dashboard/certificates/templates/${result.data.id}/edit`);
      } else {
        toast.error(result.error || t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultDesign = (): CertificateDesign => ({
    layout: 'landscape',
    dimensions: { width: 800, height: 600 },
    background: {
      type: 'color',
      value: '#ffffff',
      opacity: 1,
    },
    elements: [],
    variables: [],
  });

  const handleClose = () => {
    form.reset();
    setSelectedPreset(null);
    setStep('preset');
    setTagInput('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {step === 'preset' && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                {t('preset.title')}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Blank Template */}
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => {
                    setSelectedPreset(null);
                    setStep('details');
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100">
                      <Sparkles className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-sm">
                      {t('preset.blank.title')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('preset.blank.description')}
                    </CardDescription>
                  </CardContent>
                </Card>

                {/* Preset Templates */}
                {certificatePresets.map(preset => (
                  <Card
                    key={preset.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="relative h-32 overflow-hidden rounded-lg bg-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Award className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-sm">{preset.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {preset.description}
                      </CardDescription>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {preset.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fields.name.label')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('fields.name.placeholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fields.description.label')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('fields.description.placeholder')}
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('fields.description.description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t('fields.isPublic.label')}</FormLabel>
                          <FormDescription>
                            {t('fields.isPublic.description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  {selectedPreset && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        {t('preset.selected')}
                      </h4>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <Award className="text-primary h-8 w-8" />
                            <div>
                              <p className="font-medium">
                                {
                                  certificatePresets.find(
                                    p => p.id === selectedPreset
                                  )?.name
                                }
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {
                                  certificatePresets.find(
                                    p => p.id === selectedPreset
                                  )?.description
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div>
                    <FormLabel>{t('fields.tags.label')}</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('fields.tags.placeholder')}
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyPress={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                        >
                          {t('fields.tags.add')}
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-sm"
                            >
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground ml-1 h-auto p-0"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription className="mt-1">
                      {t('fields.tags.description')}
                    </FormDescription>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('preset')}
                >
                  {t('actions.back')}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('actions.creating') : t('actions.create')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
