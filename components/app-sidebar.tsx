'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

import { NavMain } from '@/components/nav/nav-main';
import { NavUser } from '@/components/nav/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import type { SidebarNotification } from '@/data-service/notifications';
import { navItems } from './nav/nav-items';
import { NotificationsList } from './notifications/notification-list';

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: SidebarUser | null;
  notifications?: SidebarNotification[];
  unreadCount?: number;
};

export function AppSidebar({
  user,
  notifications = [],
  unreadCount = 0,
  ...props
}: AppSidebarProps) {
  const [notificationItems, setNotificationItems] = useState(notifications);
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(unreadCount);

  useEffect(() => {
    setNotificationItems(notifications);
    const derivedUnread =
      notifications?.filter((notification) => !notification.read).length || 0;
    setUnreadBadgeCount(derivedUnread);
  }, [notifications]);

  const handleNotificationRead = useCallback((id: string) => {
    setNotificationItems((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
    setUnreadBadgeCount((count) => Math.max(0, count - 1));
  }, []);

  const handleAllNotificationsRead = useCallback(() => {
    setNotificationItems([]);
    setUnreadBadgeCount(0);
  }, []);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='flex items-center justify-between gap-2 px-3 py-2'>
        <SidebarTrigger className='ml-auto' />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navItems(unreadBadgeCount)}
          renderNotifications={() => (
            <NotificationsList
              notifications={notificationItems}
              onNotificationRead={handleNotificationRead}
              onAllNotificationsRead={handleAllNotificationsRead}
            />
          )}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
