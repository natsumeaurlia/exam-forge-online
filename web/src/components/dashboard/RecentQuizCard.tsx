'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Eye, MoreHorizontal, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'published' | 'archived';
  participants: number;
  questions: number;
}

interface RecentQuizCardProps {
  lng: string;
}

export function RecentQuizCard({ lng }: RecentQuizCardProps) {
  const t = useTranslations('dashboard.recentQuizzes');

  // モックデータ - 実際のプロジェクトではAPIから取得
  const recentQuizzes: Quiz[] = [
    {
      id: '1',
      title: 'マーケティング基礎知識テスト',
      createdAt: '2025-05-28',
      status: 'published',
      participants: 45,
      questions: 20,
    },
    {
      id: '2',
      title: 'JavaScript基礎プログラミング',
      createdAt: '2025-05-25',
      status: 'published',
      participants: 32,
      questions: 15,
    },
    {
      id: '3',
      title: '新入社員研修テスト',
      createdAt: '2025-05-22',
      status: 'draft',
      participants: 0,
      questions: 25,
    },
    {
      id: '4',
      title: 'プロジェクト管理基礎',
      createdAt: '2025-05-20',
      status: 'published',
      participants: 18,
      questions: 12,
    },
    {
      id: '5',
      title: 'データ分析入門',
      createdAt: '2025-05-18',
      status: 'archived',
      participants: 67,
      questions: 30,
    },
  ];

  const getStatusBadge = (status: Quiz['status']) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800">
            {t('statusBadge.published')}
          </Badge>
        );
      case 'draft':
        return <Badge variant="secondary">{t('statusBadge.draft')}</Badge>;
      case 'archived':
        return <Badge variant="outline">{t('statusBadge.archived')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('title')}</span>
          <Button variant="outline" size="sm">
            {t('viewAll')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="max-w-[300px] truncate font-medium text-gray-900">
                    {quiz.title}
                  </h4>
                  {getStatusBadge(quiz.status)}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quiz.createdAt)}</span>
                  </div>
                  <span>{t('questionsCount', { count: quiz.questions })}</span>
                  <span>
                    {t('participantsCount', { count: quiz.participants })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="mr-1 h-4 w-4" />
                  {t('edit')}
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
                  {t('preview')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      {t('actions.duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem>{t('actions.share')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('actions.export')}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
