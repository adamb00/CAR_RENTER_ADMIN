'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';

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
    select: { payload: true, id: true },
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
    } else {
      const fleetVehicle = await db.fleetVehicle.findUnique({
        where: { id: fleetVehicleId },
        select: { id: true, carId: true, plate: true },
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
