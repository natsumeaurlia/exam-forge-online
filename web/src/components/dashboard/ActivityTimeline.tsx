import React from 'react';
import { getTranslations } from 'next-intl/server';
import {
  FileText,
  Users,
  Edit,
  Share2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecentActivities } from '@/lib/actions/analytics';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface ActivityTimelineProps {
  lng: string;
}

export async function ActivityTimeline({ lng }: ActivityTimelineProps) {
  const t = await getTranslations('dashboard.activity');

  // Fetch real data from database
  const result = await getRecentActivities(8);

  if (!result.success || !result.data || result.data.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-gray-500">{t('noActivity')}</p>
        </CardContent>
      </Card>
    );
  }

  const activities = result.data;
  const locale = lng === 'ja' ? ja : enUS;

  const getActivityIcon = (type: string) => {
    const icons = {
      quiz_completed: CheckCircle,
      quiz_created: FileText,
      user_joined: Users,
      quiz_edited: Edit,
      quiz_shared: Share2,
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      quiz_completed: 'text-green-600 bg-green-50',
      quiz_created: 'text-blue-600 bg-blue-50',
      user_joined: 'text-purple-600 bg-purple-50',
      quiz_edited: 'text-orange-600 bg-orange-50',
      quiz_shared: 'text-pink-600 bg-pink-50',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className="col-span-full lg:col-span-5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`rounded-lg p-2 ${colorClass.split(' ')[1]}`}>
                  <Icon className={`h-4 w-4 ${colorClass.split(' ')[0]}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
