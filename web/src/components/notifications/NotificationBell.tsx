'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { useTranslations } from 'next-intl';

interface NotificationBellProps {
  userId: string;
  unreadCount?: number;
}

export function NotificationBell({
  userId,
  unreadCount = 0,
}: NotificationBellProps) {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const [currentUnreadCount, setCurrentUnreadCount] = useState(unreadCount);

  // Update unread count when props change
  useEffect(() => {
    setCurrentUnreadCount(unreadCount);
  }, [unreadCount]);

  const handleMarkAllAsRead = () => {
    setCurrentUnreadCount(0);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label={t('openNotifications')}
        >
          {currentUnreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {currentUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {currentUnreadCount > 99 ? '99+' : currentUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={5}>
        <NotificationList
          userId={userId}
          isDropdown={true}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
