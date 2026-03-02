'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

type ArchiveBookingActionInput = {
  bookingId: string;
};

const isMissingArchivedAtColumnError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('archivedat') && message.includes('does not exist');
};

export const archiveBookingAction = async ({
  bookingId,
}: ArchiveBookingActionInput) => {
  const trimmedBookingId = bookingId?.trim();
  if (!trimmedBookingId) {
    return { error: 'Hiányzó foglalás azonosító.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedBookingId },
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  let archivedAt: Date | null = null;
  try {
    const archivedRows = await db.$queryRaw<Array<{ archivedAt: Date | null }>>(
      Prisma.sql`
        SELECT "archivedAt"
        FROM "RentRequests"
        WHERE "id" = ${booking.id}::uuid
        LIMIT 1
      `,
    );
    archivedAt = archivedRows[0]?.archivedAt ?? null;
  } catch (error) {
    if (isMissingArchivedAtColumnError(error)) {
      return { error: 'Az archiválás még nincs aktiválva. Futtasd le a migrációt.' };
    }
    throw error;
  }

  if (archivedAt) {
    return { success: 'A foglalás már archiválva van.' };
  }

  try {
    await db.$executeRaw(
      Prisma.sql`
        UPDATE "RentRequests"
        SET
          "archivedAt" = timezone('utc'::text, now()),
          "updatedAt" = timezone('utc'::text, now())
        WHERE "id" = ${booking.id}::uuid
      `,
    );
  } catch (error) {
    if (isMissingArchivedAtColumnError(error)) {
      return { error: 'Az archiválás még nincs aktiválva. Futtasd le a migrációt.' };
    }
    throw error;
  }

  revalidatePath('/');
  revalidatePath('/bookings');
  revalidatePath('/calendar');
  revalidatePath('/analitycs');
  revalidatePath(`/${booking.id}`);

  return { success: 'Foglalás archiválva.' };
};
