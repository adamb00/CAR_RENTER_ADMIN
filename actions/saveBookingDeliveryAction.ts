'use server';

import type { Prisma } from '@prisma/client';

import type { BookingPayload } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type DeliveryInput = {
  placeType?: string | null;
  locationName?: string | null;
  address?: string | null;
};

type SaveBookingDeliveryInput = {
  bookingId: string;
  delivery: DeliveryInput;
};

type SaveBookingDeliveryResult = {
  success?: string;
  error?: string;
  delivery?: BookingPayload['delivery'];
};

const sanitizeValue = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizePlaceType = (value?: string | null) => {
  if (value === 'airport' || value === 'accommodation' || value === 'office') {
    return value;
  }
  return undefined;
};

const requiresAddress = (placeType?: string | null) =>
  placeType === 'airport' || placeType === 'accommodation';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const saveBookingDeliveryAction = async ({
  bookingId,
  delivery,
}: SaveBookingDeliveryInput): Promise<SaveBookingDeliveryResult> => {
  const trimmedId = bookingId?.trim();

  if (!trimmedId) {
    return { error: 'Hiányzik a foglalás azonosítója.' };
  }

  const placeType = normalizePlaceType(delivery?.placeType ?? undefined);
  const locationName = sanitizeValue(delivery?.locationName);
  const addressValue = sanitizeValue(delivery?.address);

  if (!placeType) {
    return { error: 'Az átvétel helyének megadása kötelező.' };
  }

  if (requiresAddress(placeType) && (!locationName || !addressValue)) {
    return {
      error:
        'Reptér vagy szálloda esetén a helyszín és a cím megadása kötelező.',
    };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedId },
    select: { id: true, payload: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  let basePayload: Prisma.JsonObject = {};

  if (isRecord(booking.payload)) {
    basePayload = { ...booking.payload } as Prisma.JsonObject;
  }

  const existingDelivery = isRecord(basePayload.delivery)
    ? { ...basePayload.delivery }
    : {};
  const existingAddress = isRecord(existingDelivery.address)
    ? { ...existingDelivery.address }
    : {};

  existingDelivery.placeType = placeType;

  if (locationName) {
    existingDelivery.locationName = locationName;
  } else {
    delete existingDelivery.locationName;
  }

  if (addressValue) {
    existingDelivery.address = {
      ...existingAddress,
      street: addressValue,
    };
  } else {
    delete existingDelivery.address;
  }

  basePayload.delivery = existingDelivery as Prisma.JsonValue;

  try {
    await db.rentRequests.update({
      where: { id: booking.id },
      data: { payload: basePayload, updatedAt: new Date() },
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
  } catch (error) {
    console.error('saveBookingDeliveryAction update', error);
    return { error: 'Nem sikerült elmenteni az átvétel adatait.' };
  }

  return {
    success: 'Átvételi adatok elmentve.',
    delivery: existingDelivery as BookingPayload['delivery'],
  };
};
