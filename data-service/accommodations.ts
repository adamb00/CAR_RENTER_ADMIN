import { db } from '@/lib/db';

export const getAllAccommodations = async () => {
  return await db.accommodation.findMany({
    include: {
      contactQuotes: true,
      rentRequests: {
        include: {
          bookingPricingSnapshot: true,
        },
      },
    },
  });
};

export const getOneAccommodation = async (id: string) => {
  return await db.accommodation.findFirst({
    where: { id },
    include: {
      contactQuotes: true,
      rentRequests: {
        include: {
          bookingPricingSnapshot: true,
        },
      },
    },
  });
};
