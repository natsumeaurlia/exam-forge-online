import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FileText, Users, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRecentQuizzes } from '@/lib/actions/analytics';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface RecentQuizCardProps {
  lng: string;
}

export async function RecentQuizCard({ lng }: RecentQuizCardProps) {
  const t = await getTranslations('dashboard.recentQuizzes');

  // Fetch real data from database
  const result = await getRecentQuizzes(5);

  if (!result.success || !result.data || result.data.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-7">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${lng}/dashboard/quizzes`}>
              {t('viewAll')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-gray-500">{t('noQuizzes')}</p>
        </CardContent>
      </Card>
    );
  }

  const quizzes = result.data;
  const locale = lng === 'ja' ? ja : enUS;

  const getStatusBadge = (status: 'draft' | 'published' | 'closed') => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      closed: 'outline',
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {t(`status.${status}` as any)}
      </Badge>
    );
  };

  return (
    <Card className="col-span-full lg:col-span-7">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/${lng}/dashboard/quizzes`}>
            {t('viewAll')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <Link
              key={quiz.id}
              href={`/${lng}/dashboard/quizzes/${quiz.id}/edit`}
              className="block transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {quiz.participants}
                      </span>
                      <span className="flex items-center">
                        <FileText className="mr-1 h-3 w-3" />
                        {quiz.questions} {t('questions')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(quiz.createdAt, {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(quiz.status)}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
