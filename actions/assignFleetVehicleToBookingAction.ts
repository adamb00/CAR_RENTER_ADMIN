'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import {
  findFleetVehicleBookingConflict,
  formatDateForConflictMessage,
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

type AssignFleetVehicleInput = {
  bookingId: string;
  fleetVehicleId: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export async function assignFleetVehicleToBookingAction({
  bookingId,
  fleetVehicleId,
}: AssignFleetVehicleInput) {
  const trimmedBookingId = bookingId?.trim();
  if (!trimmedBookingId) {
    return { error: 'Foglalás azonosító kötelező.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: trimmedBookingId },
    select: {
      payload: true,
      carid: true,
      id: true,
      rentalstart: true,
      rentalend: true,
      status: true,
    },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  let payload: Record<string, unknown> = {};
  if (isRecord(booking.payload)) {
    payload = { ...booking.payload };
  }

  if (!fleetVehicleId) {
    delete payload.assignedFleetVehicleId;
    delete payload.assignedFleetPlate;

    const data: Prisma.RentRequestsUpdateInput = {
      carid: null,
      assignedFleetVehicleId: null,
      assignedFleetPlate: null,
      payload: payload as Prisma.InputJsonValue,
    };

    if (booking.status === RENT_STATUS_REGISTERED) {
      data.status = RENT_STATUS_ACCEPTED;
      data.updatedAt = new Date();
    }

    await db.rentRequests.update({
      where: { id: trimmedBookingId },
      data,
    });
    revalidatePath('/calendar');
    return { success: 'Flotta autó törölve a foglalásból.' };
  }

  const fleetVehicle = await db.fleetVehicle.findUnique({
    where: { id: fleetVehicleId },
    select: { id: true, carId: true, plate: true, notes: true },
  });

  if (!fleetVehicle) {
    return { error: 'A választott flotta autó nem található.' };
  }

  if (booking.rentalstart && booking.rentalend) {
    if (
      isFleetBlockedByServiceWindow({
        notes: fleetVehicle.notes,
        rentalStart: booking.rentalstart,
        rentalEnd: booking.rentalend,
      })
    ) {
      const window = getFleetServiceWindowRangeFromNotes(fleetVehicle.notes);
      return {
        error: `A kiválasztott autó szerviz alatt áll ebben az időszakban (${window?.fromLabel ?? '—'} - ${window?.toLabel ?? '—'}).`,
      };
    }

    const conflictingBooking = await findFleetVehicleBookingConflict({
      bookingIdToExclude: trimmedBookingId,
      fleetVehicleId: fleetVehicle.id,
      rentalStart: booking.rentalstart,
      rentalEnd: booking.rentalend,
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

  payload = {
    ...payload,
    carId: fleetVehicle.carId,
  };

  const data: Prisma.RentRequestsUpdateInput = {
    carid: fleetVehicle.carId,
    assignedFleetVehicleId: fleetVehicle.id,
    assignedFleetPlate: fleetVehicle.plate,
    payload: payload as Prisma.InputJsonValue,
  };

  if (booking.status !== RENT_STATUS_REGISTERED) {
    data.status = RENT_STATUS_REGISTERED;
    data.updatedAt = new Date();
  }

  await db.rentRequests.update({
    where: { id: trimmedBookingId },
    data,
  });

  revalidatePath('/calendar');
  return { success: 'Flotta autó hozzárendelve a foglaláshoz.' };
}
