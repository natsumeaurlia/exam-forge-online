'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Download,
  Eye,
  Mail,
  Shield,
  ShieldCheck,
  ShieldX,
  MoreHorizontal,
  Calendar,
  User,
  Award,
  ExternalLink,
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
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface CertificateCardProps {
  certificate: {
    id: string;
    recipientName: string;
    recipientEmail: string;
    issuedAt: Date;
    validUntil: Date | null;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    validationCode: string;
    pdfUrl: string | null;
    template: {
      name: string;
    };
    quizResponse: {
      score: number;
      quiz: {
        title: string;
      };
    } | null;
  };
  locale: string;
}

export function CertificateCard({ certificate, locale }: CertificateCardProps) {
  const t = useTranslations('certificates.certificate');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const isJapanese = locale === 'ja';

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: isJapanese ? ja : undefined,
    });
  };

  const getStatusIcon = () => {
    switch (certificate.status) {
      case 'ACTIVE':
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'REVOKED':
        return <ShieldX className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
        return <Shield className="h-4 w-4 text-gray-400" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusVariant = () => {
    switch (certificate.status) {
      case 'ACTIVE':
        return 'default';
      case 'REVOKED':
        return 'destructive';
      case 'EXPIRED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = () => {
    switch (certificate.status) {
      case 'ACTIVE':
        return t('status.active');
      case 'REVOKED':
        return t('status.revoked');
      case 'EXPIRED':
        return t('status.expired');
      default:
        return certificate.status;
    }
  };

  const handleDownload = async () => {
    if (!certificate.pdfUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = certificate.pdfUrl;
      link.download = `certificate-${certificate.validationCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('actions.download.success'));
    } catch (error) {
      toast.error(t('actions.download.error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewCertificate = () => {
    window.open(`/certificates/verify/${certificate.validationCode}`, '_blank');
  };

  const handleSendEmail = async () => {
    if (isSendingEmail) return;

    setIsSendingEmail(true);
    try {
      // TODO: Implement email sending API
      toast.success(t('actions.sendEmail.success'));
    } catch (error) {
      toast.error(t('actions.sendEmail.error'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isExpired =
    certificate.validUntil && new Date() > certificate.validUntil;

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <AvatarInitials>
                  {getInitials(certificate.recipientName)}
                </AvatarInitials>
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate font-semibold">
                  {certificate.recipientName}
                </h3>
                {getStatusIcon()}
                <Badge variant={getStatusVariant()} className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>

              <p className="text-muted-foreground truncate text-sm">
                {certificate.recipientEmail}
              </p>

              <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {t('info.issued')} {formatDate(certificate.issuedAt)}
                  </span>
                </div>

                {certificate.validUntil && (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className={isExpired ? 'text-red-600' : ''}>
                      {t('info.validUntil')}{' '}
                      {new Date(certificate.validUntil).toLocaleDateString(
                        locale
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewCertificate}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('actions.view')}
              </DropdownMenuItem>
              {certificate.pdfUrl && (
                <DropdownMenuItem
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('actions.download.label')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleSendEmail}
                disabled={isSendingEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t('actions.sendEmail.label')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Certificate Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground mb-1 text-sm">
              {t('info.template')}
            </div>
            <div className="truncate font-medium">
              {certificate.template.name}
            </div>
          </div>

          {certificate.quizResponse && (
            <>
              <div>
                <div className="text-muted-foreground mb-1 text-sm">
                  {t('info.quiz')}
                </div>
                <div className="truncate font-medium">
                  {certificate.quizResponse.quiz.title}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-sm">
                  {t('info.score')}
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">
                    {certificate.quizResponse.score}%
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <div className="text-muted-foreground mb-1 text-sm">
              {t('info.validationCode')}
            </div>
            <div className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
              {certificate.validationCode}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewCertificate}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            {t('actions.view')}
          </Button>

          {certificate.pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading
                ? t('actions.download.downloading')
                : t('actions.download.label')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="flex-1"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isSendingEmail
              ? t('actions.sendEmail.sending')
              : t('actions.sendEmail.label')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
