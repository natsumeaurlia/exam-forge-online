'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  MoreVertical,
  ExternalLink,
  Settings,
  Trash2,
  Users,
  BookOpen,
  FileText,
  Globe,
} from 'lucide-react';
import type { LMSSite } from '@prisma/client';

interface LMSSiteCardProps {
  site: LMSSite & {
    _count: {
      courses: number;
      users: number;
      pages: number;
    };
  };
  lng: string;
}

export function LMSSiteCard({ site, lng }: LMSSiteCardProps) {
  const t = useTranslations('lms');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const siteUrl = site.customDomain 
    ? `https://${site.customDomain}` 
    : site.subdomain 
    ? `https://${site.subdomain}.examforge.com` 
    : `${window.location.origin}/lms/${site.slug}`;

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log('Delete site:', site.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {site.logoUrl && (
                  <img 
                    src={site.logoUrl} 
                    alt={`${site.name} logo`}
                    className="w-6 h-6 rounded object-cover"
                  />
                )}
                {site.name}
                <div className="flex items-center gap-1">
                  {site.isPublished ? (
                    <Badge variant="default" className="text-xs">
                      {t('site.status.published')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('site.status.draft')}
                    </Badge>
                  )}
                  {site.customDomain && (
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {t('site.customDomain')}
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="mt-1">
                {site.description || t('site.noDescription')}
              </CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('site.actions.menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/${lng}/lms/${site.slug}/admin`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('site.actions.manage')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('site.actions.visit')}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('site.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Site URL */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {site.customDomain || site.subdomain ? 
                (site.customDomain || `${site.subdomain}.examforge.com`) : 
                `examforge.com/lms/${site.slug}`
              }
            </code>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{site._count.courses}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('site.stats.courses')}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{site._count.users}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('site.stats.users')}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{site._count.pages}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('site.stats.pages')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="default" className="flex-1">
              <Link href={`/${lng}/lms/${site.slug}/admin`}>
                {t('site.actions.manage')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('site.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('site.delete.description', { siteName: site.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('site.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('site.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}