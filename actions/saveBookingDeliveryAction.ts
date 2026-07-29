'use server';

import type { BookingPayload } from '@/data-service/bookings';
import { refreshBookingContractSnapshots } from '@/lib/booking-contract';
import { db } from '@/lib/db';
import { resolveDeliveryIsland } from '@/lib/delivery-island';
import { revalidatePath } from 'next/cache';

type DeliveryInput = {
  placeType?: string | null;
  island?: string | null;
  locationName?: string | null;
  address?: string | null;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  arrivalHour?: string | null;
  arrivalMinute?: string | null;
  same?: boolean | null;
  returnPlaceType?: string | null;
  returnLocationName?: string | null;
  returnAddress?: string | null;
  returnIsland?: string | null;
  returnHour?: string | null;
  returnMinute?: string | null;
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
  placeType: string | null;
  island: string | null;
  locationName: string | null;
  addressLine: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  arrivalHour: string | null;
  arrivalMinute: string | null;
  same: boolean | null;
  returnPlaceType: string | null;
  returnLocationName: string | null;
  returnAddressLine: string | null;
  returnIsland: string | null;
  returnHour: string | null;
  returnMinute: string | null;
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

const normalizeIsland = (value?: string | null) => {
  const trimmed = sanitizeValue(value);
  if (!trimmed) return undefined;
  if (trimmed.toLowerCase() === 'lanzarote') return 'Lanzarote';
  if (trimmed.toLowerCase() === 'fuerteventura') return 'Fuerteventura';
  return trimmed;
};

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
        "placeType",
        "locationName",
        "addressLine",
        "island",
        "arrivalFlight",
        "departureFlight",
        "arrivalHour",
        "arrivalMinute",
        "same",
        "returnPlaceType",
        "returnLocationName",
        "returnAddressLine",
        "returnIsland",
        "returnHour",
        "returnMinute"
      FROM "BookingDeliveryDetails"
      WHERE "bookingId" = ${booking.id}::uuid
      LIMIT 1
    `;
    existingRow = row;
  } catch {
    existingRow = undefined;
  }

  const arrivalFlight =
    sanitizeValue(delivery?.arrivalFlight) ??
    sanitizeValue(existingRow?.arrivalFlight) ??
    null;
  const departureFlight =
    sanitizeValue(delivery?.departureFlight) ??
    sanitizeValue(existingRow?.departureFlight) ??
    null;
  const arrivalHour =
    sanitizeValue(delivery?.arrivalHour) ??
    sanitizeValue(existingRow?.arrivalHour) ??
    null;
  const arrivalMinute =
    sanitizeValue(delivery?.arrivalMinute) ??
    sanitizeValue(existingRow?.arrivalMinute) ??
    null;
  const same = delivery?.same ?? existingRow?.same ?? false;
  const returnPlaceType =
    normalizePlaceType(delivery?.returnPlaceType ?? undefined) ??
    normalizePlaceType(existingRow?.returnPlaceType ?? undefined) ??
    null;
  const returnLocationName =
    sanitizeValue(delivery?.returnLocationName) ??
    sanitizeValue(existingRow?.returnLocationName) ??
    null;
  const returnAddressValue =
    sanitizeValue(delivery?.returnAddress) ??
    sanitizeValue(existingRow?.returnAddressLine) ??
    null;
  const returnHour =
    sanitizeValue(delivery?.returnHour) ??
    sanitizeValue(existingRow?.returnHour) ??
    null;
  const returnMinute =
    sanitizeValue(delivery?.returnMinute) ??
    sanitizeValue(existingRow?.returnMinute) ??
    null;
  const island = normalizeIsland(delivery?.island) ?? resolveDeliveryIsland({
    locationName,
    addressLine: addressValue,
    arrivalFlight,
    departureFlight,
  });
  const returnIsland =
    normalizeIsland(delivery?.returnIsland) ??
    normalizeIsland(existingRow?.returnIsland) ??
    (same
      ? island
      : resolveDeliveryIsland({
          locationName: returnLocationName ?? undefined,
          addressLine: returnAddressValue ?? undefined,
        }));

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
          "same",
          "returnPlaceType",
          "returnLocationName",
          "returnAddressLine",
          "returnIsland",
          "returnHour",
          "returnMinute",
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
          ${same},
          ${returnPlaceType},
          ${returnLocationName},
          ${returnAddressValue},
          ${returnIsland},
          ${returnHour},
          ${returnMinute},
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
          "same" = EXCLUDED."same",
          "returnPlaceType" = EXCLUDED."returnPlaceType",
          "returnLocationName" = EXCLUDED."returnLocationName",
          "returnAddressLine" = EXCLUDED."returnAddressLine",
          "returnIsland" = EXCLUDED."returnIsland",
          "returnHour" = EXCLUDED."returnHour",
          "returnMinute" = EXCLUDED."returnMinute",
          "updatedAt" = timezone('utc'::text, now())
      `;
    });
    revalidatePath('/');
    revalidatePath(`/${booking.id}`);
    revalidatePath(`/bookings/${booking.id}/contract`);
    revalidatePath(`/bookings/${booking.id}/edit`);
    revalidatePath(`/bookings/${booking.id}/carout`);
    revalidatePath(`/bookings/${booking.id}/carin`);
    revalidatePath('/analitycs');
  } catch (error) {
    console.error('saveBookingDeliveryAction update', error);
    return { error: normalizePersistenceError(error) };
  }

  await refreshBookingContractSnapshots(booking.id);

  return {
    success: 'Átvételi adatok elmentve.',
    delivery: {
      placeType,
      island: island ?? undefined,
      locationName: locationName ?? undefined,
      address: addressValue ? { street: addressValue } : undefined,
      arrivalFlight: arrivalFlight ?? undefined,
      departureFlight: departureFlight ?? undefined,
      arrivalHour: arrivalHour ?? undefined,
      arrivalMinute: arrivalMinute ?? undefined,
      same,
      returnPlaceType: returnPlaceType ?? undefined,
      returnLocationName: returnLocationName ?? undefined,
      returnAddress: returnAddressValue
        ? { street: returnAddressValue }
        : undefined,
      returnIsland: returnIsland ?? undefined,
      returnHour: returnHour ?? undefined,
      returnMinute: returnMinute ?? undefined,
    },
  };
};
