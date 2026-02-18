'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  findFleetVehicleBookingConflict,
  formatDateForConflictMessage,
  getAssignedFleetVehicleIdFromPayload,
} from '@/lib/booking-conflicts';
import { db } from '@/lib/db';
import {
  getFleetServiceWindowRangeFromNotes,
  isFleetBlockedByServiceWindow,
} from '@/lib/fleet-service-window';

type UpdateBookingScheduleInput = {
  bookingId: string;
  fleetVehicleId?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00`);

export async function updateBookingScheduleAction({
  bookingId,
  fleetVehicleId,
  rentalStart,
  rentalEnd,
}: UpdateBookingScheduleInput) {
  const trimmedBookingId = bookingId?.trim();
  if (!trimmedBookingId) {
    return { error: 'Foglalás azonosító kötelező.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedBookingId },
    select: { payload: true, id: true, rentalstart: true, rentalend: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const data: {
    rentalstart?: Date | null;
    rentalend?: Date | null;
    carid?: string | null;
    payload?: Prisma.InputJsonValue;
  } = {};

  let payload = isRecord(booking.payload) ? { ...booking.payload } : undefined;
  let payloadChanged = false;
  let effectiveRentalStart = booking.rentalstart ?? null;
  let effectiveRentalEnd = booking.rentalend ?? null;
  let effectiveFleetVehicleId = getAssignedFleetVehicleIdFromPayload(
    booking.payload,
  );
  let effectiveFleetVehicleNotes: string | null = null;

  if (rentalStart !== undefined || rentalEnd !== undefined) {
    if (!rentalStart || !rentalEnd) {
      return { error: 'Kezdő és záró dátum kötelező.' };
    }
    if (!isIsoDate(rentalStart) || !isIsoDate(rentalEnd)) {
      return { error: 'Érvénytelen dátum formátum.' };
    }

    const parsedStart = parseIsoDate(rentalStart);
    const parsedEnd = parseIsoDate(rentalEnd);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return { error: 'Érvénytelen dátum.' };
    }
    if (parsedEnd < parsedStart) {
      return { error: 'A záró dátum nem lehet a kezdő előtt.' };
    }

    data.rentalstart = parsedStart;
    data.rentalend = parsedEnd;
    effectiveRentalStart = parsedStart;
    effectiveRentalEnd = parsedEnd;

    if (payload && isRecord(payload.rentalPeriod)) {
      payload = {
        ...payload,
        rentalPeriod: {
          ...(payload.rentalPeriod as Record<string, unknown>),
          startDate: rentalStart,
          endDate: rentalEnd,
        },
      };
      payloadChanged = true;
    }
  }

  if (fleetVehicleId !== undefined) {
    if (!fleetVehicleId) {
      if (payload && 'assignedFleetVehicleId' in payload) {
        delete payload.assignedFleetVehicleId;
        payloadChanged = true;
      }
      if (payload && 'assignedFleetPlate' in payload) {
        delete payload.assignedFleetPlate;
        payloadChanged = true;
      }
      data.carid = null;
      effectiveFleetVehicleId = null;
    } else {
      const fleetVehicle = await db.fleetVehicle.findUnique({
        where: { id: fleetVehicleId },
        select: { id: true, carId: true, plate: true, notes: true },
      });

      if (!fleetVehicle) {
        return { error: 'A választott flotta autó nem található.' };
      }

      payload = {
        ...(payload ?? {}),
        carId: fleetVehicle.carId,
        assignedFleetVehicleId: fleetVehicle.id,
        assignedFleetPlate: fleetVehicle.plate,
      };
      payloadChanged = true;
      data.carid = fleetVehicle.carId;
      effectiveFleetVehicleId = fleetVehicle.id;
      effectiveFleetVehicleNotes = fleetVehicle.notes ?? null;
    }
  }

  if (effectiveFleetVehicleId && effectiveRentalStart && effectiveRentalEnd) {
    if (effectiveFleetVehicleNotes == null) {
      const fleetVehicle = await db.fleetVehicle.findUnique({
        where: { id: effectiveFleetVehicleId },
        select: { notes: true },
      });
      effectiveFleetVehicleNotes = fleetVehicle?.notes ?? null;
    }

    if (
      isFleetBlockedByServiceWindow({
        notes: effectiveFleetVehicleNotes,
        rentalStart: effectiveRentalStart,
        rentalEnd: effectiveRentalEnd,
      })
    ) {
      const window = getFleetServiceWindowRangeFromNotes(
        effectiveFleetVehicleNotes,
      );
      return {
        error: `A kiválasztott autó szerviz alatt áll ebben az időszakban (${window?.fromLabel ?? '—'} - ${window?.toLabel ?? '—'}).`,
      };
    }

    const conflictingBooking = await findFleetVehicleBookingConflict({
      bookingIdToExclude: trimmedBookingId,
      fleetVehicleId: effectiveFleetVehicleId,
      rentalStart: effectiveRentalStart,
      rentalEnd: effectiveRentalEnd,
    });

    if (conflictingBooking) {
      const conflictLabel = conflictingBooking.humanId ?? conflictingBooking.id;
      const conflictStart = formatDateForConflictMessage(
        conflictingBooking.rentalstart,
      );
      const conflictEnd = formatDateForConflictMessage(
        conflictingBooking.rentalend,
      );
      return {
        error: `A kiválasztott autó már foglalt ebben az időszakban (${conflictLabel}: ${conflictStart} - ${conflictEnd}).`,
      };
    }
  }

  if (payloadChanged && payload) {
    data.payload = payload as Prisma.InputJsonValue;
  }

  await db.rentRequests.update({
    where: { id: trimmedBookingId },
    data,
  });

  revalidatePath('/calendar');
  return { success: 'Foglalás frissítve.' };
}
