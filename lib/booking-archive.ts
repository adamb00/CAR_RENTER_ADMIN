import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

const isMissingArchivedAtColumnError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('archivedat') &&
    (message.includes('does not exist') || message.includes('unknown'))
  );
};

export const getArchivedBookingIdSet = async (
  bookingIds: string[],
): Promise<Set<string>> => {
  if (bookingIds.length === 0) return new Set();

  try {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT "id"
        FROM "RentRequests"
        WHERE "id" IN (${Prisma.join(
          bookingIds.map((id) => Prisma.sql`${id}::uuid`),
        )})
          AND "archivedAt" IS NOT NULL
      `,
    );
    return new Set(rows.map((row) => row.id));
  } catch (error) {
    if (isMissingArchivedAtColumnError(error)) {
      return new Set();
    }
    throw error;
  }
};
