import { markNotificationReadAction } from '@/actions/notificationActions';
import { SidebarNotification } from '@/data-service/notifications';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toneStyles } from './tone-style';
import { AlertTriangle, Bell, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/format/format-date';

export const NotificationsList = ({
  notifications,
  onNotificationRead,
}: {
  notifications: SidebarNotification[];
  onNotificationRead?: (id: string) => void;
  onAllNotificationsRead?: () => void;
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

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
    },
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
                    {formatDate(notification.timestamp, 'short')}
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
