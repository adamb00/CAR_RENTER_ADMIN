'use server';

import type { BookingPayload } from '@/data-service/bookings';
import { db } from '@/lib/db';
import { resolveDeliveryIsland } from '@/lib/delivery-island';
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

type ExistingDeliveryRow = {
  arrivalFlight: string | null;
  departureFlight: string | null;
  arrivalHour: string | null;
  arrivalMinute: string | null;
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

const normalizePersistenceError = (error: unknown) => {
  if (error instanceof Error) {
    if (
      error.message.includes('BookingDeliveryDetails') ||
      error.message.includes('does not exist')
    ) {
      return 'Hiányzó adatbázis migráció: BookingDeliveryDetails tábla még nem érhető el.';
    }
  }

  return 'Nem sikerült elmenteni az átvétel adatait.';
};

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
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  let existingRow: ExistingDeliveryRow | undefined;
  try {
    const [row] = await db.$queryRaw<ExistingDeliveryRow[]>`
      SELECT
        "arrivalFlight",
        "departureFlight",
        "arrivalHour",
        "arrivalMinute"
      FROM "BookingDeliveryDetails"
      WHERE "bookingId" = ${booking.id}::uuid
      LIMIT 1
    `;
    existingRow = row;
  } catch {
    existingRow = undefined;
  }

  const arrivalFlight = sanitizeValue(existingRow?.arrivalFlight) ?? null;
  const departureFlight = sanitizeValue(existingRow?.departureFlight) ?? null;
  const arrivalHour = sanitizeValue(existingRow?.arrivalHour) ?? null;
  const arrivalMinute = sanitizeValue(existingRow?.arrivalMinute) ?? null;
  const island = resolveDeliveryIsland({
    locationName,
    addressLine: addressValue,
    arrivalFlight,
    departureFlight,
  });

  try {
    await db.$transaction(async (tx) => {
      await tx.rentRequests.update({
        where: { id: booking.id },
        data: { updatedAt: new Date() },
      });

      await tx.$executeRaw`
        INSERT INTO "BookingDeliveryDetails" (
          "bookingId",
          "placeType",
          "locationName",
          "addressLine",
          "island",
          "arrivalFlight",
          "departureFlight",
          "arrivalHour",
          "arrivalMinute",
          "updatedAt"
        )
        VALUES (
          ${booking.id}::uuid,
          ${placeType ?? null},
          ${locationName ?? null},
          ${addressValue ?? null},
          ${island},
          ${arrivalFlight},
          ${departureFlight},
          ${arrivalHour},
          ${arrivalMinute},
          timezone('utc'::text, now())
        )
        ON CONFLICT ("bookingId")
        DO UPDATE SET
          "placeType" = EXCLUDED."placeType",
          "locationName" = EXCLUDED."locationName",
          "addressLine" = EXCLUDED."addressLine",
          "island" = EXCLUDED."island",
          "arrivalFlight" = EXCLUDED."arrivalFlight",
          "departureFlight" = EXCLUDED."departureFlight",
          "arrivalHour" = EXCLUDED."arrivalHour",
          "arrivalMinute" = EXCLUDED."arrivalMinute",
          "updatedAt" = timezone('utc'::text, now())
      `;
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
    revalidatePath(`/bookings/${booking.id}/carout`);
    revalidatePath(`/bookings/${booking.id}/carin`);
    revalidatePath('/analitycs');
  } catch (error) {
    console.error('saveBookingDeliveryAction update', error);
    return { error: normalizePersistenceError(error) };
  }

  return {
    success: 'Átvételi adatok elmentve.',
    delivery: {
      placeType,
      locationName: locationName ?? undefined,
      address: addressValue ? { street: addressValue } : undefined,
      arrivalFlight: arrivalFlight ?? undefined,
      departureFlight: departureFlight ?? undefined,
      arrivalHour: arrivalHour ?? undefined,
      arrivalMinute: arrivalMinute ?? undefined,
    },
  };
};
