'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Receipt,
  Calendar,
  CreditCard,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

export interface PaymentHistoryProps {
  lng: string;
}

interface Invoice {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  created: string;
  periodStart: string;
  periodEnd: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  description?: string;
  planName?: string;
}

export const PaymentHistory = ({ lng }: PaymentHistoryProps) => {
  const t = useTranslations();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null
  );

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError(t('settings.paymentHistory.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      setDownloadingInvoice(invoice.id);

      if (invoice.invoicePdf) {
        // If we have a direct PDF URL, download it
        const link = document.createElement('a');
        link.href = invoice.invoicePdf;
        link.download = `invoice-${invoice.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Otherwise, request the PDF from our API
        const response = await fetch(
          `/api/subscription/invoices/${invoice.id}/pdf`,
          {
            method: 'GET',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to download invoice');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: t('settings.paymentHistory.downloadSuccess'),
        description: t('settings.paymentHistory.downloadSuccessDescription'),
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: t('settings.paymentHistory.downloadError'),
        description: t('settings.paymentHistory.downloadErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const openInvoice = (invoice: Invoice) => {
    if (invoice.hostedInvoiceUrl) {
      window.open(invoice.hostedInvoiceUrl, '_blank');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'open':
        return 'secondary';
      case 'void':
        return 'outline';
      case 'uncollectible':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'open':
        return 'text-blue-600';
      case 'void':
        return 'text-gray-600';
      case 'uncollectible':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            {t('settings.paymentHistory.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            {t('settings.paymentHistory.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchPaymentHistory} className="mt-4">
            {t('settings.paymentHistory.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2 h-5 w-5" />
          {t('settings.paymentHistory.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.paymentHistory.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('settings.paymentHistory.noInvoices')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice, index) => (
              <div key={invoice.id}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center space-x-2">
                        <h4 className="font-medium">
                          {t('settings.paymentHistory.invoice')} #
                          {invoice.number}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {t(
                            `settings.paymentHistory.status.${invoice.status}`
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(invoice.created).toLocaleDateString(
                            lng
                          )} -{' '}
                          {new Date(invoice.periodStart).toLocaleDateString(
                            lng
                          )}{' '}
                          to{' '}
                          {new Date(invoice.periodEnd).toLocaleDateString(lng)}
                        </div>
                        {invoice.description && (
                          <div>{invoice.description}</div>
                        )}
                        {invoice.planName && <div>{invoice.planName}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice(invoice.amount)}
                      </div>
                      <div className="text-sm text-gray-500 uppercase">
                        {invoice.currency}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInvoice(invoice)}
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          {t('settings.paymentHistory.view')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                        disabled={downloadingInvoice === invoice.id}
                      >
                        {downloadingInvoice === invoice.id ? (
                          <div className="mr-1 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
                        ) : (
                          <Download className="mr-1 h-4 w-4" />
                        )}
                        {t('settings.paymentHistory.download')}
                      </Button>
                    </div>
                  </div>
                </div>
                {index < invoices.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
