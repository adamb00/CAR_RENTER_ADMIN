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

const accommodationBookingCommissionInclude = {
  booking: {
    select: {
      id: true,
      humanId: true,
      status: true,
      rentalstart: true,
      rentalend: true,
    },
  },
} satisfies Prisma.AccommodationBookingCommissionInclude;

export type AccommodationBookingCommissionDetails =
  Prisma.AccommodationBookingCommissionGetPayload<{
    include: typeof accommodationBookingCommissionInclude;
  }>;
export const getAccommodationBookingCommission = async (
  accommodationId: string,
): Promise<AccommodationBookingCommissionDetails[]> => {
  return await db.accommodationBookingCommission.findMany({
    where: { accommodationId },
    include: accommodationBookingCommissionInclude,
  });
};

export const getAccommodationBookingCommissionByIds = async (
  ids: string[],
): Promise<AccommodationBookingCommissionDetails[]> => {
  return await db.accommodationBookingCommission.findMany({
    where: { id: { in: ids } },
    include: accommodationBookingCommissionInclude,
  });
};
