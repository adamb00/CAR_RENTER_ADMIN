'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  findFleetVehicleBookingConflict,
  formatDateForConflictMessage,
  getAssignedFleetPlateFromPayload,
  getAssignedFleetVehicleIdFromPayload,
  hasAssignedFleetAssignment,
} from '@/lib/booking-conflicts';
import {
  RENT_STATUS_ACCEPTED,
  RENT_STATUS_REGISTERED,
} from '@/lib/constants';
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

const parseIsoDate = (value: string) => {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  return new Date(Date.UTC(year, month - 1, day));
};

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
    select: {
      payload: true,
      id: true,
      rentalstart: true,
      rentalend: true,
      status: true,
      assignedFleetVehicleId: true,
      assignedFleetPlate: true,
    },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const data: {
    rentalstart?: Date | null;
    rentalend?: Date | null;
    carid?: string | null;
    assignedFleetVehicleId?: string | null;
    assignedFleetPlate?: string | null;
    status?: string;
    updatedAt?: Date;
    payload?: Prisma.InputJsonValue;
  } = {};

  let payload = isRecord(booking.payload) ? { ...booking.payload } : undefined;
  let payloadChanged = false;
  let effectiveRentalStart = booking.rentalstart ?? null;
  let effectiveRentalEnd = booking.rentalend ?? null;
  let effectiveFleetVehicleId =
    booking.assignedFleetVehicleId ??
    getAssignedFleetVehicleIdFromPayload(booking.payload);
  let effectiveFleetPlate =
    booking.assignedFleetPlate ?? getAssignedFleetPlateFromPayload(booking.payload);
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
      data.assignedFleetVehicleId = null;
      data.assignedFleetPlate = null;
      if (booking.status === RENT_STATUS_REGISTERED) {
        data.status = RENT_STATUS_ACCEPTED;
        data.updatedAt = new Date();
      }
      effectiveFleetVehicleId = null;
      effectiveFleetPlate = null;
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
      };
      payloadChanged = true;
      data.carid = fleetVehicle.carId;
      data.assignedFleetVehicleId = fleetVehicle.id;
      data.assignedFleetPlate = fleetVehicle.plate;
      if (booking.status !== RENT_STATUS_REGISTERED) {
        data.status = RENT_STATUS_REGISTERED;
        data.updatedAt = new Date();
      }
      effectiveFleetVehicleId = fleetVehicle.id;
      effectiveFleetPlate = fleetVehicle.plate;
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

  const payloadForStatus = payloadChanged ? payload : booking.payload;
  const statusAssignedFleetVehicleId =
    data.assignedFleetVehicleId !== undefined
      ? data.assignedFleetVehicleId
      : effectiveFleetVehicleId;
  const statusAssignedFleetPlate =
    data.assignedFleetPlate !== undefined
      ? data.assignedFleetPlate
      : effectiveFleetPlate;
  if (
    hasAssignedFleetAssignment({
      assignedFleetVehicleId: statusAssignedFleetVehicleId,
      assignedFleetPlate: statusAssignedFleetPlate,
      payload: payloadForStatus,
    }) &&
    booking.status !== RENT_STATUS_REGISTERED &&
    data.status !== RENT_STATUS_REGISTERED
  ) {
    data.status = RENT_STATUS_REGISTERED;
    data.updatedAt = new Date();
  }

  await db.rentRequests.update({
    where: { id: trimmedBookingId },
    data,
  });

  revalidatePath('/calendar');
  return { success: 'Foglalás frissítve.' };
}
