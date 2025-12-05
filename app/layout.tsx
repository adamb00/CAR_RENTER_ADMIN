import type { ReactNode } from 'react';

import { auth } from '@/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  createNewNotification,
  getDelayedNotifications,
  getSidebarNotifications,
  getUnreadNotificationsCount,
  markNotificationAsProcessed,
} from '@/data-service/notifications';

import './_styles/globals.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();
  const [notifications, unreadCount, delayedNotifications] = await Promise.all([
    getSidebarNotifications(),
    getUnreadNotificationsCount(),
    getDelayedNotifications(),
  ]);

  await Promise.all(
    delayedNotifications.map(async (notification) => {
      const rentId = notification.href.split('/').at(1) ?? '';
      await createNewNotification({
        rentId,
        description: notification.description,
        metadata: notification.metadata ?? null,
      });
      await markNotificationAsProcessed(notification.id, notification.eventKey);
    })
  );

  if (!session) {
    return (
      <html lang='en'>
        <body className='antialiased'>{children}</body>
      </html>
    );
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <body className='antialiased'>
        <SidebarProvider>
          <AppSidebar
            user={session?.user ?? undefined}
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
