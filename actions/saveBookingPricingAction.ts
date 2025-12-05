'use server';

import type { Prisma } from '@prisma/client';

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
  const normalized = {
    rentalFee: sanitizeValue(input.rentalFee),
    insurance: sanitizeValue(input.insurance),
    deposit: sanitizeValue(input.deposit),
    deliveryFee: sanitizeValue(input.deliveryFee),
    extrasFee: sanitizeValue(input.extrasFee),
  };

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
    select: { id: true, payload: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const normalizedPricing = normalizePricing(pricing);
  let basePayload: Prisma.JsonObject = {};

  if (isRecord(booking.payload)) {
    basePayload = { ...booking.payload } as Prisma.JsonObject;
  }

  if (normalizedPricing) {
    basePayload.pricing = normalizedPricing as Prisma.JsonValue;
  } else {
    delete basePayload.pricing;
  }

  try {
    await db.rentRequests.update({
      where: { id: booking.id },
      data: { payload: basePayload, updatedAt: new Date() },
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
  } catch (error) {
    console.error('saveBookingPricingAction update', error);
    return { error: 'Nem sikerült elmenteni a díjakat.' };
  }

  return {
    success: 'Díjak elmentve.',
    pricing: normalizedPricing,
  };
};
