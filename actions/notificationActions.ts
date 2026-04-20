'use server';

import { auth } from '@/auth';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/data-service/notifications';
import { revalidatePath } from 'next/cache';

export const markNotificationReadAction = async (id: string) => {
  if (!id?.trim()) {
    return { error: 'Hiányzik az értesítés azonosítója.' };
  }

  try {
    const session = await auth();
    await markNotificationRead(id.trim(), session?.user?.id ?? null);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('markNotificationReadAction', error);
    return { error: 'Nem sikerült frissíteni az értesítést.' };
  }

  return { success: true };
};

export const markAllNotificationsReadAction = async () => {
  try {
    const session = await auth();
    await markAllNotificationsRead(session?.user?.id ?? null);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('markAllNotificationsReadAction', error);
    return { error: 'Nem sikerült frissíteni az értesítéseket.' };
  }

  return { success: true };
};
