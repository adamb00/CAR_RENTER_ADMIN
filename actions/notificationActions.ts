'use server';

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
    await markNotificationRead(id.trim());
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('markNotificationReadAction', error);
    return { error: 'Nem sikerült frissíteni az értesítést.' };
  }

  return { success: true };
};

export const markAllNotificationsReadAction = async () => {
  try {
    await markAllNotificationsRead();
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('markAllNotificationsReadAction', error);
    return { error: 'Nem sikerült frissíteni az értesítéseket.' };
  }

  return { success: true };
};
