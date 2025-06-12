'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Download,
  Mail,
  MoreVertical,
  Eye,
  RefreshCw,
  Ban,
  Award,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

interface IssuedCertificatesTabProps {
  lng: string;
}

interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  quizTitle: string;
  templateName: string;
  score: number;
  maxScore: number;
  issueDate: Date;
  expiryDate?: Date;
  status: 'active' | 'revoked' | 'expired';
  downloadCount: number;
  lastDownloadedAt?: Date;
  validationCode: string;
}

// Mock data for now
const mockCertificates: IssuedCertificate[] = [
  {
    id: '1',
    certificateNumber: 'CERT-2024-001',
    recipientName: '田中太郎',
    recipientEmail: 'tanaka@example.com',
    quizTitle: '基本的な数学問題',
    templateName: '基本修了証テンプレート',
    score: 85,
    maxScore: 100,
    issueDate: new Date('2024-02-15'),
    expiryDate: new Date('2024-08-15'),
    status: 'active',
    downloadCount: 3,
    lastDownloadedAt: new Date('2024-02-20'),
    validationCode: 'ABC123DEF',
  },
  {
    id: '2',
    certificateNumber: 'CERT-2024-002',
    recipientName: '佐藤花子',
    recipientEmail: 'sato@example.com',
    quizTitle: '英単語テスト - 初級',
    templateName: '資格認定証テンプレート',
    score: 92,
    maxScore: 100,
    issueDate: new Date('2024-02-18'),
    status: 'active',
    downloadCount: 1,
    lastDownloadedAt: new Date('2024-02-18'),
    validationCode: 'XYZ789GHI',
  },
];

export function IssuedCertificatesTab({ lng }: IssuedCertificatesTabProps) {
  const t = useTranslations('certificates');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(
    new Set()
  );
  const [certificates] = useState<IssuedCertificate[]>(mockCertificates);

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.quizTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedCertificates.size === filteredCertificates.length) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(
        new Set(filteredCertificates.map(cert => cert.id))
      );
    }
  };

  const handleSelectCertificate = (certificateId: string) => {
    const newSelected = new Set(selectedCertificates);
    if (newSelected.has(certificateId)) {
      newSelected.delete(certificateId);
    } else {
      newSelected.add(certificateId);
    }
    setSelectedCertificates(newSelected);
  };

  const getStatusBadge = (status: IssuedCertificate['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">{t('status.active')}</Badge>;
      case 'revoked':
        return <Badge variant="destructive">{t('status.revoked')}</Badge>;
      case 'expired':
        return <Badge variant="secondary">{t('status.expired')}</Badge>;
    }
  };

  const handleViewCertificate = (certificateId: string) => {
    console.log('View certificate:', certificateId);
    // TODO: Implement certificate viewing
  };

  const handleDownloadCertificate = (certificateId: string) => {
    console.log('Download certificate:', certificateId);
    // TODO: Implement certificate download
  };

  const handleSendEmail = (certificateId: string) => {
    console.log('Send email:', certificateId);
    // TODO: Implement email sending
  };

  const handleRevokeCertificate = (certificateId: string) => {
    console.log('Revoke certificate:', certificateId);
    // TODO: Implement certificate revocation
  };

  const handleReissueCertificate = (certificateId: string) => {
    console.log('Reissue certificate:', certificateId);
    // TODO: Implement certificate reissue
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('search.placeholderCertificates')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="revoked">{t('status.revoked')}</SelectItem>
              <SelectItem value="expired">{t('status.expired')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCertificates.size > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('actions.bulkDownload')} ({selectedCertificates.size})
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              {t('actions.bulkEmail')} ({selectedCertificates.size})
            </Button>
          </div>
        )}
      </div>

      {/* Certificates Table */}
      {filteredCertificates.length === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Award className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 font-medium">
              {t('certificates.empty.title')}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {searchQuery || statusFilter !== 'all'
                ? t('certificates.empty.noResults')
                : t('certificates.empty.description')}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="p-4">
                      <Checkbox
                        checked={
                          selectedCertificates.size ===
                          filteredCertificates.length
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label={t('actions.selectAll')}
                      />
                    </th>
                    <th className="p-4 font-medium">{t('table.recipient')}</th>
                    <th className="p-4 font-medium">{t('table.quiz')}</th>
                    <th className="p-4 font-medium">{t('table.score')}</th>
                    <th className="p-4 font-medium">{t('table.issueDate')}</th>
                    <th className="p-4 font-medium">{t('table.status')}</th>
                    <th className="p-4 font-medium">{t('table.downloads')}</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map(certificate => (
                    <tr
                      key={certificate.id}
                      className="hover:bg-muted/25 border-b"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedCertificates.has(certificate.id)}
                          onCheckedChange={() =>
                            handleSelectCertificate(certificate.id)
                          }
                          aria-label={t('actions.selectCertificate')}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {certificate.recipientName}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {certificate.recipientEmail}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {certificate.certificateNumber}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{certificate.quizTitle}</p>
                          <p className="text-muted-foreground text-sm">
                            {certificate.templateName}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-medium">
                            {certificate.score}/{certificate.maxScore}
                          </span>
                          <p className="text-muted-foreground text-sm">
                            {Math.round(
                              (certificate.score / certificate.maxScore) * 100
                            )}
                            %
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm">
                            {format(certificate.issueDate, 'yyyy/MM/dd')}
                          </span>
                        </div>
                        {certificate.expiryDate && (
                          <p className="text-muted-foreground text-xs">
                            {t('table.expiresOn')}{' '}
                            {format(certificate.expiryDate, 'yyyy/MM/dd')}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(certificate.status)}
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-medium">
                            {certificate.downloadCount}
                          </span>
                          {certificate.lastDownloadedAt && (
                            <p className="text-muted-foreground text-xs">
                              {t('table.lastDownload')}{' '}
                              {format(certificate.lastDownloadedAt, 'MM/dd')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewCertificate(certificate.id)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t('actions.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDownloadCertificate(certificate.id)
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {t('actions.download')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendEmail(certificate.id)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {t('actions.sendEmail')}
                            </DropdownMenuItem>
                            {certificate.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReissueCertificate(certificate.id)
                                  }
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  {t('actions.reissue')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRevokeCertificate(certificate.id)
                                  }
                                  className="text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {t('actions.revoke')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
