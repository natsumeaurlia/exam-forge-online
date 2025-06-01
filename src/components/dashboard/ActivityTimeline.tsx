'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  CheckCircle,
  UserPlus,
  Edit,
  Share,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ActivityItem {
  id: string;
  type:
    | 'quiz_created'
    | 'quiz_completed'
    | 'user_joined'
    | 'quiz_edited'
    | 'quiz_shared';
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    quizTitle?: string;
    score?: number;
    participants?: number;
  };
}

interface ActivityTimelineProps {
  lng: string;
}

export function ActivityTimeline({ lng }: ActivityTimelineProps) {
  const t = useTranslations('dashboard.activity');

  // モックデータ - 実際のプロジェクトではAPIから取得
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'quiz_completed',
      title: 'クイズが完了されました',
      description: '田中太郎さんが「マーケティング基礎」を完了しました',
      timestamp: '2025-06-01T05:30:00Z',
      user: {
        name: '田中太郎',
        avatar: '/placeholder.svg',
      },
      metadata: {
        quizTitle: 'マーケティング基礎',
        score: 85,
      },
    },
    {
      id: '2',
      type: 'quiz_created',
      title: 'クイズが作成されました',
      description: '新しいクイズ「JavaScript基礎」が作成されました',
      timestamp: '2025-06-01T04:15:00Z',
      user: {
        name: '山田花子',
        avatar: '/placeholder.svg',
      },
      metadata: {
        quizTitle: 'JavaScript基礎',
      },
    },
    {
      id: '3',
      type: 'user_joined',
      title: '新しいユーザーが参加しました',
      description: '佐藤次郎さんがチームに参加しました',
      timestamp: '2025-06-01T03:45:00Z',
      user: {
        name: '佐藤次郎',
        avatar: '/placeholder.svg',
      },
    },
    {
      id: '4',
      type: 'quiz_edited',
      title: 'クイズが編集されました',
      description: '「プロジェクト管理基礎」の問題が更新されました',
      timestamp: '2025-06-01T02:20:00Z',
      user: {
        name: '鈴木一郎',
        avatar: '/placeholder.svg',
      },
      metadata: {
        quizTitle: 'プロジェクト管理基礎',
      },
    },
    {
      id: '5',
      type: 'quiz_shared',
      title: 'クイズが共有されました',
      description: '「データ分析入門」が新しいメンバーと共有されました',
      timestamp: '2025-06-01T01:10:00Z',
      user: {
        name: '高橋美咲',
        avatar: '/placeholder.svg',
      },
      metadata: {
        quizTitle: 'データ分析入門',
        participants: 5,
      },
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quiz_created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'quiz_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'quiz_edited':
        return <Edit className="h-4 w-4 text-orange-600" />;
      case 'quiz_shared':
        return <Share className="h-4 w-4 text-indigo-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`;
    } else {
      return date.toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* アイコンとタイムライン */}
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  {getActivityIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="mt-2 h-8 w-px bg-gray-200" />
                )}
              </div>

              {/* コンテンツ */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={activity.user.avatar}
                        alt={activity.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {activity.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {activity.description}
                </p>

                {/* メタデータ */}
                {activity.metadata && (
                  <div className="mt-2 text-xs text-gray-500">
                    {activity.metadata.score && (
                      <span>スコア: {activity.metadata.score}%</span>
                    )}
                    {activity.metadata.participants && (
                      <span>参加者: {activity.metadata.participants}人</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
            すべてのアクティビティを表示
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
