import type {
  Notification,
  Prisma,
  TaskNotification,
} from '@prisma/client';

import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_WINDOW_DAYS = 10;
const UPCOMING_WINDOW_MS = 2 * DAY_MS;
const SIDEBAR_LIMIT = 12;
const DB_NOTIFICATION_PREFIX = 'db:';
const TASK_NOTIFICATION_PREFIX = 'task:';

export type NotificationTone = 'info' | 'warning' | 'danger';

export type SidebarNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
  tone: NotificationTone;
  read: boolean;
  eventKey?: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
};

const toNotificationTone = (value: string): NotificationTone =>
  value === 'warning' || value === 'danger' ? value : 'info';

const mapDbNotification = (notification: Notification): SidebarNotification => ({
  id: `${DB_NOTIFICATION_PREFIX}${notification.id}`,
  title: notification.title,
  description: notification.description,
  href: notification.href,
  timestamp: (notification.createdAt ?? notification.notifyAt).toISOString(),
  tone: toNotificationTone(notification.tone),
  read: notification.read,
  eventKey: notification.eventKey,
  metadata: notification.metadata ?? undefined,
});

const mapTaskNotification = (
  notification: TaskNotification,
): SidebarNotification => ({
  id: `${TASK_NOTIFICATION_PREFIX}${notification.id}`,
  title: notification.title,
  description: notification.description,
  href: notification.href,
  timestamp: notification.createdAt.toISOString(),
  tone: toNotificationTone(notification.tone),
  read: notification.read,
  metadata: notification.metadata ?? undefined,
});

const getPrefixedId = (id: string) => {
  if (id.startsWith(DB_NOTIFICATION_PREFIX)) {
    return {
      source: 'db' as const,
      id: id.slice(DB_NOTIFICATION_PREFIX.length),
    };
  }

  if (id.startsWith(TASK_NOTIFICATION_PREFIX)) {
    return {
      source: 'task' as const,
      id: id.slice(TASK_NOTIFICATION_PREFIX.length),
    };
  }

  // Backward-compatible fallback for legacy ids without prefix.
  return { source: 'db' as const, id };
};

export const getSidebarNotifications = async (
  userId?: string | null,
): Promise<SidebarNotification[]> => {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_WINDOW_DAYS * DAY_MS);

  const generalRows = await db.notification.findMany({
    where: {
      read: false,
      createdAt: {
        gte: staleThreshold,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: SIDEBAR_LIMIT,
  });

  let taskRows: TaskNotification[] = [];
  if (userId) {
    try {
      taskRows = await db.taskNotification.findMany({
        where: {
          recipientUserId: userId,
          read: false,
          createdAt: {
            gte: staleThreshold,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: SIDEBAR_LIMIT,
      });
    } catch (error) {
      console.error('getSidebarNotifications taskNotification fallback', error);
    }
  }

  const merged = [
    ...generalRows.map(mapDbNotification),
    ...taskRows.map(mapTaskNotification),
  ];

  return merged
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, SIDEBAR_LIMIT);
};

export const getDelayedNotifications = async (): Promise<
  SidebarNotification[]
> => {
  const now = new Date();
  const upcomingLimit = new Date(now.getTime() + UPCOMING_WINDOW_MS);

  const rows = await db.notification.findMany({
    where: {
      notifyAt: {
        not: null,
        gte: now,
        lte: upcomingLimit,
      },
      type: {
        equals: 'rent_request',
      },
      eventKey: {
        endsWith: ':0',
      },
      read: true,
    },
    orderBy: { notifyAt: 'asc' },
  });

  return rows
    .filter((row) => row.eventKey.endsWith(':0'))
    .map(mapDbNotification);
};

export const markNotificationRead = async (id: string, userId?: string | null) => {
  const parsed = getPrefixedId(id);

  if (parsed.source === 'task') {
    await db.taskNotification.updateMany({
      where: {
        id: parsed.id,
        ...(userId ? { recipientUserId: userId } : {}),
      },
      data: { read: true, readAt: new Date(), updatedAt: new Date() },
    });
    return;
  }

  await db.notification.update({
    where: { id: parsed.id },
    data: { read: true, readAt: new Date(), updatedAt: new Date() },
  });
};

export const markAllNotificationsRead = async (userId?: string | null) => {
  await db.notification.updateMany({
    where: { read: false },
    data: { read: true, readAt: new Date(), updatedAt: new Date() },
  });

  if (userId) {
    await db.taskNotification.updateMany({
      where: { recipientUserId: userId, read: false },
      data: { read: true, readAt: new Date(), updatedAt: new Date() },
    });
  }
};

export const getUnreadNotificationsCount = async (userId?: string | null) => {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_WINDOW_DAYS * DAY_MS);

  const generalUnread = await db.notification.count({
    where: {
      read: false,
      OR: [{ notifyAt: null }, { notifyAt: { lte: now } }],
      createdAt: {
        gte: staleThreshold,
      },
    },
  });

  let taskUnread = 0;
  if (userId) {
    try {
      taskUnread = await db.taskNotification.count({
        where: {
          recipientUserId: userId,
          read: false,
          createdAt: {
            gte: staleThreshold,
          },
        },
      });
    } catch (error) {
      console.error('getUnreadNotificationsCount taskNotification fallback', error);
    }
  }

  return generalUnread + taskUnread;
};

export const createNewNotification = async ({
  rentId,
  description,
  metadata,
}: {
  rentId: string;
  description: string;
  metadata: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
}) => {
  const generatedKey = `db-event:rent_update:${
    rentId ?? randomUUID()
  }:${Date.now()}:1`;

  try {
    await db.notification.create({
      data: {
        eventKey: generatedKey,
        type: 'rent_update',
        title: 'Bérlés aktuális 48 órán belül',
        description,
        href: `/${rentId}`,
        tone: 'info',
        metadata: metadata ?? undefined,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to store notification', error);
  }
};

export const createTaskNotification = async ({
  taskId,
  recipientUserId,
  title,
  description,
  href,
  tone = 'info',
  metadata,
}: {
  taskId: string;
  recipientUserId: string;
  title: string;
  description: string;
  href: string;
  tone?: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
}) => {
  try {
    await db.taskNotification.create({
      data: {
        taskId,
        recipientUserId,
        title,
        description,
        href,
        tone,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to store task notification', error);
  }
};

export const markNotificationAsProcessed = async (
  id: string,
  eventKey?: string | null,
) => {
  if (!eventKey) return;

  const parsed = getPrefixedId(id);
  if (parsed.source !== 'db') return;

  const nextKey = eventKey.endsWith(':0')
    ? `${eventKey.slice(0, -2)}:1`
    : eventKey;
  if (nextKey === eventKey) return;

  try {
    await db.notification.update({
      where: { id: parsed.id },
      data: { eventKey: nextKey, updatedAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to update notification status', error);
  }
};
