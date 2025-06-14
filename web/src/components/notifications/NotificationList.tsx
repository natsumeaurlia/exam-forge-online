'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja, enUS, type Locale } from 'date-fns/locale';
import {
  Bell,
  Check,
  CheckCheck,
  Eye,
  MoreHorizontal,
  Trash2,
  Users,
  FileText,
  Settings,
  AlertTriangle,
  Gift,
  Zap,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { NotificationType } from '@prisma/client';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/actions/notification';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
  entityId?: string | null;
  entityType?: string | null;
  team?: { name: string } | null;
}

interface NotificationListProps {
  userId: string;
  isDropdown?: boolean;
  limit?: number;
  onMarkAllAsRead?: () => void;
  onClose?: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'QUIZ_COMPLETED':
      return <CheckCheck className="h-4 w-4" />;
    case 'QUIZ_SHARED':
      return <FileText className="h-4 w-4" />;
    case 'TEAM_INVITATION':
      return <Users className="h-4 w-4" />;
    case 'TEAM_MEMBER_JOINED':
      return <Users className="h-4 w-4" />;
    case 'SUBSCRIPTION_UPDATED':
      return <Settings className="h-4 w-4" />;
    case 'PAYMENT_FAILED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'SYSTEM_UPDATE':
      return <Zap className="h-4 w-4" />;
    case 'CERTIFICATE_ISSUED':
      return <Award className="h-4 w-4" />;
    case 'QUIZ_PUBLISHED':
      return <FileText className="h-4 w-4" />;
    case 'QUIZ_RESPONSE_RECEIVED':
      return <Bell className="h-4 w-4" />;
    case 'STORAGE_LIMIT_WARNING':
      return <AlertTriangle className="h-4 w-4" />;
    case 'PLAN_LIMIT_WARNING':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationVariant = (type: NotificationType) => {
  switch (type) {
    case 'PAYMENT_FAILED':
    case 'STORAGE_LIMIT_WARNING':
    case 'PLAN_LIMIT_WARNING':
      return 'destructive';
    case 'CERTIFICATE_ISSUED':
    case 'QUIZ_COMPLETED':
      return 'default';
    case 'SYSTEM_UPDATE':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function NotificationList({
  userId,
  isDropdown = false,
  limit = isDropdown ? 5 : 20,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const dateLocale = locale === 'ja' ? ja : enUS;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getNotifications(userId, 1, limit);
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        setUnreadCount(result.pagination?.unread || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead({ notificationId });
    if (result.data?.success) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead({ userId });
    if (result.data?.success) {
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date(),
        }))
      );
      setUnreadCount(0);
      onMarkAllAsRead?.();
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification({ notificationId });
    if (result.data?.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(
        n => n.id === notificationId
      );
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to relevant page based on notification type
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'quiz':
          router.push(`/${locale}/dashboard/quiz/${notification.entityId}`);
          break;
        case 'team':
          router.push(`/${locale}/dashboard/team/${notification.entityId}`);
          break;
        default:
          break;
      }
    }

    if (isDropdown) {
      onClose?.();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isDropdown) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                {t('markAllAsRead')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <NotificationContent
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onDelete={handleDelete}
            dateLocale={dateLocale}
            t={t}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">{t('title')}</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-7 text-xs"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>
      <ScrollArea className="h-[400px]">
        <NotificationContent
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onDelete={handleDelete}
          dateLocale={dateLocale}
          t={t}
          isDropdown={true}
        />
      </ScrollArea>
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                router.push(`/${locale}/dashboard/notifications`);
                onClose?.();
              }}
            >
              {t('viewAll')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface NotificationContentProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onDelete: (id: string) => void;
  dateLocale: Locale;
  t: (key: string) => string;
  isDropdown?: boolean;
}

function NotificationContent({
  notifications,
  onNotificationClick,
  onDelete,
  dateLocale,
  t,
  isDropdown = false,
}: NotificationContentProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
        <Bell className="mb-4 h-12 w-12 opacity-50" />
        <p className="text-sm">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', !isDropdown && 'space-y-2')}>
      {notifications.map((notification, index) => (
        <div key={notification.id}>
          <div
            className={cn(
              'group hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-lg p-3 transition-colors',
              !notification.isRead &&
                'border-l-4 border-l-blue-500 bg-blue-50/50'
            )}
            onClick={() => onNotificationClick(notification)}
          >
            <div
              className={cn(
                'mt-0.5 flex-shrink-0',
                !notification.isRead ? 'text-blue-600' : 'text-muted-foreground'
              )}
            >
              {getNotificationIcon(notification.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm',
                      !notification.isRead
                        ? 'text-foreground font-semibold'
                        : 'text-foreground'
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={getNotificationVariant(notification.type)}
                      className="px-2 py-0 text-xs"
                    >
                      {t(`types.${notification.type.toLowerCase()}`)}
                    </Badge>
                    {notification.team && (
                      <span className="text-muted-foreground text-xs">
                        {notification.team.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {format(notification.createdAt, 'MM/dd HH:mm', {
                      locale: dateLocale,
                    })}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!notification.isRead && (
                        <DropdownMenuItem
                          onClick={() => onNotificationClick(notification)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('markAsRead')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(notification.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
          {index < notifications.length - 1 && <Separator className="ml-9" />}
        </div>
      ))}
    </div>
  );
}
