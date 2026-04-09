'use server';

import type { BookingPayload } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type PricingInput = {
  rentalFee?: string | null;
  insurance?: string | null;
  deposit?: string | null;
  deliveryFee?: string | null;
  extrasFee?: string | null;
};

type SaveBookingPricingInput = {
  bookingId: string;
  pricing: PricingInput;
};

type SaveBookingPricingResult = {
  success?: string;
  error?: string;
  pricing?: BookingPayload['pricing'];
};

const sanitizeValue = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizePricing = (
  input?: PricingInput
): BookingPayload['pricing'] | undefined => {
  if (!input) return undefined;
  const insurance = sanitizeValue(input.insurance);
  const normalized = {
    rentalFee: sanitizeValue(input.rentalFee),
    insurance,
    deposit: insurance ? '0' : sanitizeValue(input.deposit),
    deliveryFee: sanitizeValue(input.deliveryFee),
    extrasFee: sanitizeValue(input.extrasFee),
  };

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : undefined;
};

const normalizePersistenceError = (error: unknown) => {
  if (error instanceof Error) {
    if (
      error.message.includes('BookingPricingSnapshots') ||
      error.message.includes('does not exist')
    ) {
      return 'Hiányzó adatbázis migráció: BookingPricingSnapshots tábla még nem érhető el.';
    }
  }

  return 'Nem sikerült elmenteni a díjakat.';
};

export const saveBookingPricingAction = async ({
  bookingId,
  pricing,
}: SaveBookingPricingInput): Promise<SaveBookingPricingResult> => {
  const trimmedId = bookingId?.trim();

  if (!trimmedId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedId },
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const normalizedPricing = normalizePricing(pricing);
  try {
    await db.$transaction(async (tx) => {
      await tx.rentRequests.update({
        where: { id: booking.id },
        data: { updatedAt: new Date() },
      });

      if (normalizedPricing) {
        await tx.$executeRaw`
          INSERT INTO "BookingPricingSnapshots" (
            "bookingId",
            "rentalFee",
            "insurance",
            "deposit",
            "deliveryFee",
            "extrasFee",
            "updatedAt"
          )
          VALUES (
            ${booking.id}::uuid,
            ${normalizedPricing.rentalFee ?? null},
            ${normalizedPricing.insurance ?? null},
            ${normalizedPricing.deposit ?? null},
            ${normalizedPricing.deliveryFee ?? null},
            ${normalizedPricing.extrasFee ?? null},
            timezone('utc'::text, now())
          )
          ON CONFLICT ("bookingId")
          DO UPDATE SET
            "rentalFee" = EXCLUDED."rentalFee",
            "insurance" = EXCLUDED."insurance",
            "deposit" = EXCLUDED."deposit",
            "deliveryFee" = EXCLUDED."deliveryFee",
            "extrasFee" = EXCLUDED."extrasFee",
            "updatedAt" = timezone('utc'::text, now())
        `;
      } else {
        await tx.$executeRaw`
          DELETE FROM "BookingPricingSnapshots"
          WHERE "bookingId" = ${booking.id}::uuid
        `;
      }
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
    revalidatePath(`/bookings/${booking.id}/carout`);
    revalidatePath(`/bookings/${booking.id}/carin`);
    revalidatePath('/analitycs');
  } catch (error) {
    console.error('saveBookingPricingAction update', error);
    return { error: normalizePersistenceError(error) };
  }

  return {
    success: 'Díjak elmentve.',
    pricing: normalizedPricing,
  };
};
