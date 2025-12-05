import type { Notification, Prisma, RentRequests } from '@prisma/client';

import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_WINDOW_DAYS = 10;
const UPCOMING_WINDOW_MS = 2 * DAY_MS;

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

const mapNotification = (notification: Notification): SidebarNotification => ({
  id: notification.id,
  title: notification.title,
  description: notification.description,
  href: notification.href,
  timestamp: (notification.notifyAt ?? notification.createdAt).toISOString(),
  tone:
    (notification.tone as NotificationTone) === 'warning' ||
    (notification.tone as NotificationTone) === 'danger'
      ? (notification.tone as NotificationTone)
      : 'info',
  read: notification.read,
  eventKey: notification.eventKey,
  metadata: notification.metadata ?? undefined,
});

export const getSidebarNotifications = async (): Promise<
  SidebarNotification[]
> => {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_WINDOW_DAYS * DAY_MS);

  const rows = await db.notification.findMany({
    where: {
      read: false,
      createdAt: {
        gte: staleThreshold,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  return rows.map(mapNotification);
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

  return rows.filter((row) => row.eventKey.endsWith(':0')).map(mapNotification);
};

export const markNotificationRead = async (id: string) => {
  await db.notification.update({
    where: { id },
    data: { read: true, readAt: new Date(), updatedAt: new Date() },
  });
};

export const markAllNotificationsRead = async () => {
  await db.notification.updateMany({
    where: { read: false },
    data: { read: true, readAt: new Date(), updatedAt: new Date() },
  });
};

export const getUnreadNotificationsCount = async () => {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_WINDOW_DAYS * DAY_MS);
  return db.notification.count({
    where: {
      read: false,
      OR: [{ notifyAt: null }, { notifyAt: { lte: now } }],
      createdAt: {
        gte: staleThreshold,
      },
    },
  });
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

export const markNotificationAsProcessed = async (
  id: string,
  eventKey?: string | null
) => {
  if (!eventKey) return;
  const nextKey = eventKey.endsWith(':0')
    ? `${eventKey.slice(0, -2)}:1`
    : eventKey;
  if (nextKey === eventKey) return;

  try {
    await db.notification.update({
      where: { id },
      data: { eventKey: nextKey, updatedAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to update notification status', error);
  }
};
