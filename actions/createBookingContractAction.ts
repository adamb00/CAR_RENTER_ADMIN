'use server';

import { z } from 'zod';

import { finalizeBookingContract } from '@/lib/booking-contract';

const createBookingContractSchema = z.object({
  bookingId: z.string().min(1),
  signerName: z.string().min(1),
  renterSignatureData: z.string().min(1),
  lessorSignatureData: z.string().min(1),
});

type CreateBookingContractResult = {
  success?: string;
  error?: string;
};

export const createBookingContractAction = async (
  input: z.infer<typeof createBookingContractSchema>,
): Promise<CreateBookingContractResult> => {
  const parsed = createBookingContractSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  return finalizeBookingContract(parsed.data);
};
