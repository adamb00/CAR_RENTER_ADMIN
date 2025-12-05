'use client';

import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarClock,
  Car,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { markNotificationReadAction } from '@/actions/notificationActions';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import type { SidebarNotification } from '@/data-service/notifications';

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

const toneStyles: Record<
  SidebarNotification['tone'],
  { dot: string; emphasis: string }
> = {
  info: {
    dot: 'bg-sky-500',
    emphasis: 'text-sky-600',
  },
  warning: {
    dot: 'bg-amber-500',
    emphasis: 'text-amber-600',
  },
  danger: {
    dot: 'bg-rose-500',
    emphasis: 'text-rose-600',
  },
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('hu-HU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationsList = ({
  notifications,
  onNotificationRead,
}: {
  notifications: SidebarNotification[];
  onNotificationRead?: (id: string) => void;
  onAllNotificationsRead?: () => void;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!notifications?.length) {
    return (
      <div className='rounded-lg border border-dashed border-sidebar-border/70 px-3 py-4 text-xs text-sidebar-foreground/70'>
        Nincsenek új értesítések
      </div>
    );
  }

  const handleMarkRead = (
    id: string,
    options?: {
      refresh?: boolean;
    }
  ) => {
    const { refresh = true } = options ?? {};
    startTransition(async () => {
      const response = await markNotificationReadAction(id);
      if (response?.error) {
        console.error(response.error);
        return;
      }
      onNotificationRead?.(id);
      if (refresh) {
        router.refresh();
      }
    });
  };

  return (
    <div className='space-y-3'>
      {notifications.map((notification) => {
        const tone = toneStyles[notification.tone];
        const Icon =
          notification.tone === 'danger'
            ? AlertTriangle
            : notification.tone === 'warning'
            ? CalendarClock
            : Bell;
        return (
          <Link
            key={notification.id}
            href={notification.href}
            onClick={() => {
              if (!notification.read) {
                handleMarkRead(notification.id, { refresh: false });
              }
            }}
            className={`group block rounded-lg border px-3 py-2 text-sm transition hover:border-sidebar-accent hover:bg-sidebar-accent/20 ${
              notification.read
                ? 'border-sidebar-border/60'
                : 'border-sidebar-border/80'
            }`}
          >
            <div className='flex flex-col items-start gap-2'>
              {!notification.read && (
                <div className='flex gap-x-2'>
                  <span
                    className={`mt-1 inline-flex h-2 w-2 rounded-full ${tone.dot}`}
                  />
                  <span>Olvasatlan</span>
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70'>
                    {notification.title}
                  </p>
                  <span
                    className={`text-[11px] font-semibold ${
                      notification.read
                        ? 'text-sidebar-foreground/40'
                        : 'text-emerald-600'
                    }`}
                  ></span>
                </div>

                <div className='mt-1 flex items-center gap-1 text-[11px] text-sidebar-foreground/60'>
                  <Icon className='h-3 w-3' />
                  <span className={tone.emphasis}>
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
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
  }, [notifications]);

  useEffect(() => {
    setUnreadBadgeCount(unreadCount);
  }, [unreadCount]);

  const handleNotificationRead = useCallback((id: string) => {
    setNotificationItems((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
    setUnreadBadgeCount((count) => Math.max(0, count - 1));
  }, []);

  const handleAllNotificationsRead = useCallback(() => {
    setNotificationItems([]);
    setUnreadBadgeCount(0);
  }, []);

  const navItems = useMemo(
    () => [
      {
        title: 'Értesítések',
        url: '#notifications',
        icon: Bell,
        isNotifications: true,
        badgeContent:
          unreadBadgeCount > 0 ? (
            <span className='bg-sidebar-accent text-sidebar-accent-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold'>
              {unreadBadgeCount}
            </span>
          ) : null,
      },
      {
        title: 'Foglalások',
        url: '/',
        icon: BookOpen,
      },
      {
        title: 'Ajánlatkérések',
        url: '/quotes',
        icon: Inbox,
      },
      {
        title: 'Autók',
        url: '#',
        icon: Car,
        isActive: true,
        items: [
          {
            title: 'Összes autó',
            url: '/cars',
          },
          {
            title: 'Új autó hozzáadása',
            url: '/cars/new',
          },
        ],
      },
    ],
    [unreadBadgeCount]
  );

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarContent>
        <NavMain
          items={navItems}
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
