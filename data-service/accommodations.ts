import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const accommodationInclude = {
  contactQuotes: true,
  rentRequests: {
    include: {
      bookingPricingSnapshot: true,
    },
  },
} satisfies Prisma.AccommodationInclude;

export type AccommodationDetails = Prisma.AccommodationGetPayload<{
  include: typeof accommodationInclude;
}>;

export const getAllAccommodations = async () => {
  return await db.accommodation.findMany({
    include: accommodationInclude,
  });
};

export const getOneAccommodation = async (
  id: string,
): Promise<AccommodationDetails | null> => {
  return await db.accommodation.findFirst({
    where: { id },
    include: accommodationInclude,
  });
};
