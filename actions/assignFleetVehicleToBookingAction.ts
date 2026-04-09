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
  slotIndex?: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toRequiredCars = (payload: unknown) => {
  if (!isRecord(payload)) return 1;
  const rawValue = payload.cars;
  const parsed =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number(rawValue)
        : NaN;

  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
};

export async function assignFleetVehicleToBookingAction({
  bookingId,
  fleetVehicleId,
  slotIndex,
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
      bookingDeliveryDetails: {
        select: {
          arrivalHour: true,
          arrivalMinute: true,
        },
      },
      vehicleHandovers: {
        where: { direction: { in: ['out', 'in'] } },
        select: {
          direction: true,
          handoverAt: true,
        },
        orderBy: { handoverAt: 'asc' },
      },
      bookingFleetAssignments: {
        select: {
          id: true,
          slotIndex: true,
          fleetVehicleId: true,
          fleetVehicle: {
            select: {
              id: true,
              carId: true,
              plate: true,
              notes: true,
            },
          },
        },
        orderBy: {
          slotIndex: 'asc',
        },
      },
    },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  let payload: Record<string, unknown> = {};
  if (isRecord(booking.payload)) {
    payload = { ...booking.payload };
  }
  const requiredCars = toRequiredCars(booking.payload);
  const normalizedSlotIndex =
    slotIndex == null ? 0 : Math.max(0, Math.floor(slotIndex));

  if (normalizedSlotIndex >= requiredCars) {
    return { error: 'A kiválasztott autóigény slot érvénytelen.' };
  }

  if (!fleetVehicleId) {
    await db.$transaction(async (tx) => {
      await tx.bookingFleetAssignment.deleteMany({
        where: {
          bookingId: trimmedBookingId,
          slotIndex: normalizedSlotIndex,
        },
      });

      const remainingAssignments = await tx.bookingFleetAssignment.findMany({
        where: {
          bookingId: trimmedBookingId,
        },
        include: {
          fleetVehicle: {
            select: {
              carId: true,
              plate: true,
            },
          },
        },
        orderBy: {
          slotIndex: 'asc',
        },
      });

      const primaryAssignment = remainingAssignments[0] ?? null;
      if (primaryAssignment) {
        payload.assignedFleetVehicleId = primaryAssignment.fleetVehicleId;
        payload.assignedFleetPlate = primaryAssignment.fleetVehicle.plate;
        payload.carId = primaryAssignment.fleetVehicle.carId;
      } else {
        delete payload.assignedFleetVehicleId;
        delete payload.assignedFleetPlate;
        delete payload.carId;
      }

      const data: Prisma.RentRequestsUpdateInput = {
        carid: primaryAssignment?.fleetVehicle.carId ?? null,
        assignedFleetVehicleId: primaryAssignment?.fleetVehicleId ?? null,
        assignedFleetPlate: primaryAssignment?.fleetVehicle.plate ?? null,
        payload: payload as Prisma.InputJsonValue,
      };

      if (!primaryAssignment && booking.status === RENT_STATUS_REGISTERED) {
        data.status = RENT_STATUS_ACCEPTED;
        data.updatedAt = new Date();
      }

      await tx.rentRequests.update({
        where: { id: trimmedBookingId },
        data,
      });
    });
    revalidatePath('/calendar');
    return { success: 'Flotta autó törölve a foglalás slotból.' };
  }

  const fleetVehicle = await db.fleetVehicle.findUnique({
    where: { id: fleetVehicleId },
    select: { id: true, carId: true, plate: true, notes: true },
  });

  if (!fleetVehicle) {
    return { error: 'A választott flotta autó nem található.' };
  }

  if (
    booking.bookingFleetAssignments.some(
      (assignment) =>
        assignment.slotIndex !== normalizedSlotIndex &&
        assignment.fleetVehicleId === fleetVehicleId,
    )
  ) {
    return {
      error: 'Ez a flotta autó már hozzá van rendelve a foglalás egy másik slotjához.',
    };
  }

  if (booking.rentalstart && booking.rentalend) {
    const handoverOutAt =
      booking.vehicleHandovers.find((handover) => handover.direction === 'out')
        ?.handoverAt ?? null;
    const handoverInAt =
      [...booking.vehicleHandovers]
        .reverse()
        .find((handover) => handover.direction === 'in')?.handoverAt ?? null;

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
      arrivalHour: booking.bookingDeliveryDetails?.arrivalHour ?? null,
      arrivalMinute: booking.bookingDeliveryDetails?.arrivalMinute ?? null,
      handoverOutAt,
      handoverInAt,
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

  await db.$transaction(async (tx) => {
    await tx.bookingFleetAssignment.upsert({
      where: {
        bookingId_slotIndex: {
          bookingId: trimmedBookingId,
          slotIndex: normalizedSlotIndex,
        },
      },
      update: {
        fleetVehicleId: fleetVehicle.id,
        updatedAt: new Date(),
      },
      create: {
        bookingId: trimmedBookingId,
        slotIndex: normalizedSlotIndex,
        fleetVehicleId: fleetVehicle.id,
      },
    });

    const allAssignments = await tx.bookingFleetAssignment.findMany({
      where: {
        bookingId: trimmedBookingId,
      },
      include: {
        fleetVehicle: {
          select: {
            carId: true,
            plate: true,
          },
        },
      },
      orderBy: {
        slotIndex: 'asc',
      },
    });

    const primaryAssignment = allAssignments[0];
    payload = {
      ...payload,
      carId: primaryAssignment?.fleetVehicle.carId,
      assignedFleetVehicleId: primaryAssignment?.fleetVehicleId,
      assignedFleetPlate: primaryAssignment?.fleetVehicle.plate,
    };

    const data: Prisma.RentRequestsUpdateInput = {
      carid: primaryAssignment?.fleetVehicle.carId ?? null,
      assignedFleetVehicleId: primaryAssignment?.fleetVehicleId ?? null,
      assignedFleetPlate: primaryAssignment?.fleetVehicle.plate ?? null,
      payload: payload as Prisma.InputJsonValue,
    };

    if (booking.status !== RENT_STATUS_REGISTERED) {
      data.status = RENT_STATUS_REGISTERED;
      data.updatedAt = new Date();
    }

    await tx.rentRequests.update({
      where: { id: trimmedBookingId },
      data,
    });
  });

  revalidatePath('/calendar');
  return { success: 'Flotta autó hozzárendelve a foglalás slotjához.' };
}
