'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

type DeleteBookingActionInput = {
  bookingId: string;
};

type DeleteBookingActionResult = {
  success?: string;
  error?: string;
};

export const deleteBookingAction = async ({
  bookingId,
}: DeleteBookingActionInput): Promise<DeleteBookingActionResult> => {
  const trimmedBookingId = bookingId?.trim();
  if (!trimmedBookingId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedBookingId },
    select: { id: true, humanId: true, quoteid: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  try {
    await db.$transaction(async (tx) => {
      // A bookinghoz kapcsolódó értesítések törlése (ha vannak).
      await tx.notification.deleteMany({
        where: {
          OR: [
            { href: `/${booking.id}` },
            { eventKey: { contains: `:${booking.id}:` } },
          ],
        },
      });

      // A kapcsolt táblákban (pricing, delivery, handover, contract, stb.)
      // onDelete: Cascade van beállítva, így a RentRequests rekord törlése
      // véglegesen viszi magával ezeket is.
      await tx.rentRequests.delete({
        where: { id: booking.id },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return { error: 'A foglalás nem található.' };
    }

    console.error('deleteBookingAction', error);
    return { error: 'Nem sikerült véglegesen törölni a foglalást.' };
  }

  revalidatePath('/');
  revalidatePath('/bookings');
  revalidatePath('/calendar');
  revalidatePath('/analitycs');
  revalidatePath('/quotes');
  revalidatePath(`/${booking.id}`);
  revalidatePath(`/bookings/${booking.id}/edit`);
  revalidatePath(`/bookings/${booking.id}/carout`);
  revalidatePath(`/bookings/${booking.id}/carin`);
  revalidatePath(`/bookings/${booking.id}/contract`);
  if (booking.quoteid) {
    revalidatePath(`/quotes/${booking.quoteid}`);
  }

  return {
    success: `A foglalás véglegesen törölve (${booking.humanId ?? booking.id}).`,
  };
};
