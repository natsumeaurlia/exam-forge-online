'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Edit3,
  Copy,
  Trash2,
  Eye,
  Settings,
  MoreHorizontal,
  Award,
  Users,
  Globe,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CertificateTemplateWithRelations } from '@/types/certificate';
import {
  deleteCertificateTemplate,
  duplicateCertificateTemplate,
} from '@/lib/actions/certificate-template';

interface CertificateTemplateCardProps {
  template: CertificateTemplateWithRelations;
  canEdit: boolean;
  locale: string;
}

export function CertificateTemplateCard({
  template,
  canEdit,
  locale,
}: CertificateTemplateCardProps) {
  const t = useTranslations('certificates.template');
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const isJapanese = locale === 'ja';

  const handleEdit = () => {
    router.push(`/dashboard/certificates/templates/${template.id}/edit`);
  };

  const handlePreview = () => {
    router.push(`/dashboard/certificates/templates/${template.id}`);
  };

  const handleSettings = () => {
    router.push(`/dashboard/certificates/templates/${template.id}/settings`);
  };

  const handleDuplicate = async () => {
    if (isDuplicating) return;

    setIsDuplicating(true);
    try {
      const result = await duplicateCertificateTemplate({
        id: template.id,
        name: `${template.name} のコピー`,
      });

      if (result.success) {
        toast.success(t('actions.duplicate.success'));
        router.refresh();
      } else {
        toast.error(result.error || t('actions.duplicate.error'));
      }
    } catch (error) {
      toast.error(t('actions.duplicate.error'));
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const result = await deleteCertificateTemplate({ id: template.id });

      if (result.success) {
        toast.success(t('actions.delete.success'));
        router.refresh();
      } else {
        toast.error(result.error || t('actions.delete.error'));
      }
    } catch (error) {
      toast.error(t('actions.delete.error'));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: isJapanese ? ja : undefined,
    });
  };

  const getThumbnailUrl = () => {
    // Generate a placeholder thumbnail based on template design
    const { design } = template;
    const bgColor =
      design.background.type === 'color' ? design.background.value : '#ffffff';
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="${bgColor}"/>
        <text x="50%" y="30%" text-anchor="middle" font-family="serif" font-size="12" fill="#333">
          ${template.name}
        </text>
        <text x="50%" y="50%" text-anchor="middle" font-family="serif" font-size="10" fill="#666">
          Certificate
        </text>
        <text x="50%" y="70%" text-anchor="middle" font-family="serif" font-size="8" fill="#999">
          ${design.layout} • ${design.elements.length} elements
        </text>
      </svg>
    `)}`;
  };

  return (
    <>
      <Card className="group transition-shadow duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {template.description}
                </p>
              )}
            </div>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {t('actions.duplicate.label')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('actions.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive"
                    disabled={template._count.certificates > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('actions.delete.label')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Template Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <img
              src={getThumbnailUrl()}
              alt={template.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
              <Button
                variant="secondary"
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handlePreview}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('actions.preview')}
              </Button>
            </div>
          </div>

          {/* Template Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>
                  {template._count.certificates} {t('info.issued')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {template.isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {t('info.updatedAt')} {formatDate(template.updatedAt)}
              </span>
              <span>{template.team.name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handlePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('actions.preview')}
            </Button>
            {canEdit && (
              <Button size="sm" className="flex-1" onClick={handleEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                {t('actions.edit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('actions.delete.confirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.delete.confirm.description', { name: template.name })}
              {template._count.certificates > 0 && (
                <div className="bg-destructive/10 border-destructive/20 mt-2 rounded-md border p-3">
                  <p className="text-destructive text-sm">
                    {t('actions.delete.confirm.hasIssuedCertificates', {
                      count: template._count.certificates,
                    })}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('actions.delete.confirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || template._count.certificates > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? t('actions.delete.confirm.deleting')
                : t('actions.delete.confirm.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
