/**
 * Create Integration Modal
 * Modal for creating new external system integrations
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createIntegration } from '@/lib/actions/integrations';
import { Loader2, ExternalLink, Info } from 'lucide-react';

const integrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['lms', 'webhook', 'sso', 'ai', 'notification']),
  provider: z.string().min(1, 'Provider is required'),
  teamId: z.string().cuid(),
  description: z.string().optional(),
  config: z.object({}).passthrough(),
});

interface CreateIntegrationModalProps {
  teams: Array<{ id: string; name: string; plan: string }>;
  selectedTeam: string;
  integrationLimits: any;
  locale: string;
  trigger: React.ReactNode;
}

export function CreateIntegrationModal({
  teams,
  selectedTeam,
  integrationLimits,
  locale,
  trigger,
}: CreateIntegrationModalProps) {
  const t = useTranslations('integrations.create');
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: '',
      type: 'webhook' as any,
      provider: '',
      teamId: selectedTeam,
      description: '',
      config: {},
    },
  });

  const integrationTypes = [
    {
      value: 'lms',
      label: t('types.lms.label'),
      description: t('types.lms.description'),
      providers: [
        { value: 'google-classroom', label: 'Google Classroom' },
        { value: 'canvas', label: 'Canvas LMS' },
        { value: 'moodle', label: 'Moodle' },
      ],
    },
    {
      value: 'webhook',
      label: t('types.webhook.label'),
      description: t('types.webhook.description'),
      providers: [
        { value: 'custom', label: 'Custom Webhook' },
        { value: 'zapier', label: 'Zapier' },
        { value: 'make', label: 'Make (Integromat)' },
      ],
    },
    {
      value: 'sso',
      label: t('types.sso.label'),
      description: t('types.sso.description'),
      providers: [
        { value: 'saml', label: 'SAML 2.0' },
        { value: 'ldap', label: 'LDAP' },
        { value: 'azure-ad', label: 'Azure AD' },
        { value: 'okta', label: 'Okta' },
      ],
    },
    {
      value: 'ai',
      label: t('types.ai.label'),
      description: t('types.ai.description'),
      providers: [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google-ai', label: 'Google AI' },
      ],
    },
  ];

  const availableTypes = integrationTypes.filter(
    type =>
      integrationLimits.allowedTypes?.includes(type.value) ||
      integrationLimits.allowedTypes?.length === 0
  );

  const selectedTypeData = integrationTypes.find(t => t.value === selectedType);
  const providers = selectedTypeData?.providers || [];

  const onSubmit = async (data: z.infer<typeof integrationSchema>) => {
    setIsLoading(true);

    try {
      // Prepare config based on type and provider
      let config = {};

      if (data.type === 'webhook') {
        config = {
          retryAttempts: 3,
          retryDelay: 5,
          timeout: 10,
          verifySSL: true,
        };
      } else if (data.type === 'lms') {
        config = {
          syncInterval: 60,
          autoSync: true,
          syncRosters: true,
          syncGrades: true,
          syncAssignments: true,
        };
      }

      const result = await createIntegration({
        ...data,
        config,
      });

      if (result.success) {
        setOpen(false);
        form.reset();
        // Refresh page to show new integration
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Create integration error:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const canCreateMore =
    integrationLimits.maxIntegrations === -1 ||
    (integrationLimits.currentCount || 0) < integrationLimits.maxIntegrations;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {!canCreateMore && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('limitReached', { limit: integrationLimits.maxIntegrations })}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Selection */}
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.team')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('fields.selectTeam')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            {team.name}
                            <Badge variant="outline" className="text-xs">
                              {team.plan}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Integration Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fields.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Integration Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.type')}</FormLabel>
                  <div className="grid grid-cols-1 gap-3">
                    {availableTypes.map(type => (
                      <div
                        key={type.value}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          field.value === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          field.onChange(type.value);
                          setSelectedType(type.value);
                          form.setValue('provider', '');
                          setSelectedProvider('');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{type.label}</h4>
                            <p className="text-muted-foreground text-sm">
                              {type.description}
                            </p>
                          </div>
                          <input
                            type="radio"
                            checked={field.value === type.value}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider Selection */}
            {selectedType && providers.length > 0 && (
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.provider')}</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        setSelectedProvider(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('fields.selectProvider')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map(provider => (
                          <SelectItem
                            key={provider.value}
                            value={provider.value}
                          >
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Provider-specific configuration hints */}
            {selectedProvider === 'google-classroom' && (
              <Alert>
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  {t('providers.googleClassroom.setupHint')}
                </AlertDescription>
              </Alert>
            )}

            {selectedProvider === 'custom' && selectedType === 'webhook' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('providers.webhook.setupHint')}
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('fields.descriptionPlaceholder')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !canCreateMore}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('actions.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
