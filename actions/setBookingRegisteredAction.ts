'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import {
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_NEW,
  RENT_STATUS_REGISTERED,
} from '@/lib/constants';

type SetBookingRegisteredInput = {
  bookingId: string;
  registered: boolean;
};

type SetBookingRegisteredResult = {
  error?: string;
  success?: string;
  status?: string;
};

export const setBookingRegisteredAction = async ({
  bookingId,
  registered,
}: SetBookingRegisteredInput): Promise<SetBookingRegisteredResult> => {
  const trimmedId = bookingId?.trim();

  if (!trimmedId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedId },
    select: { id: true, status: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const currentStatus = booking.status ?? RENT_STATUS_NEW;

  if (registered && currentStatus === RENT_STATUS_REGISTERED) {
    return { success: 'A foglalás már rögzítve van.', status: currentStatus };
  }

  if (!registered && currentStatus !== RENT_STATUS_REGISTERED) {
    return {
      success: 'A foglalás még nem rögzített státuszú.',
      status: currentStatus,
    };
  }

  const nextStatus = registered
    ? RENT_STATUS_REGISTERED
    : RENT_STATUS_ACCEPTED;

  try {
    await db.rentRequests.update({
      where: { id: booking.id },
      data: { status: nextStatus, updatedAt: new Date() },
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
  } catch (error) {
    console.error('setBookingRegisteredAction update', error);
    return { error: 'Nem sikerült módosítani a státuszt.' };
  }

  return {
    success: registered
      ? 'A foglalást rögzítettük.'
      : 'A rögzített státuszt visszaállítottuk.',
    status: nextStatus,
  };
};
