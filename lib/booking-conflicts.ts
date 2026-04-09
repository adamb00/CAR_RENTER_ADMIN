import type { Prisma } from '@prisma/client';

import { getArchivedBookingIdSet } from '@/lib/booking-archive';
import { buildBookingInterval, intervalsOverlap } from '@/lib/booking-interval';
import { db } from '@/lib/db';

type BookingConflictCandidate = {
  id: string;
  humanId: string | null;
  rentalstart: Date | null;
  rentalend: Date | null;
  status?: string | null;
  assignedFleetVehicleId?: string | null;
  payload: unknown;
  bookingFleetAssignments?: {
    fleetVehicleId: string;
  }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getAssignedFleetVehicleIdFromPayload = (
  payload: unknown,
): string | null => {
  if (!isRecord(payload)) return null;
  const vehicleId = payload.assignedFleetVehicleId;
  return typeof vehicleId === 'string' && vehicleId.trim()
    ? vehicleId.trim()
    : null;
};

export const getAssignedFleetPlateFromPayload = (
  payload: unknown,
): string | null => {
  if (!isRecord(payload)) return null;
  const plate = payload.assignedFleetPlate;
  return typeof plate === 'string' && plate.trim() ? plate.trim() : null;
};

export const hasAssignedFleetInPayload = (payload: unknown): boolean =>
  Boolean(
    getAssignedFleetVehicleIdFromPayload(payload) &&
      getAssignedFleetPlateFromPayload(payload),
  );

const toTrimmedString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const getAssignedFleetVehicleIds = (candidate: {
  assignedFleetVehicleId?: unknown;
  payload?: unknown;
  bookingFleetAssignments?: { fleetVehicleId: string }[];
}) => {
  const ids = new Set<string>();
  const directAssigned = toTrimmedString(candidate.assignedFleetVehicleId);
  const payloadAssigned = getAssignedFleetVehicleIdFromPayload(candidate.payload);

  if (directAssigned) {
    ids.add(directAssigned);
  }
  if (payloadAssigned) {
    ids.add(payloadAssigned);
  }

  candidate.bookingFleetAssignments?.forEach((assignment) => {
    const fleetVehicleId = toTrimmedString(assignment.fleetVehicleId);
    if (fleetVehicleId) {
      ids.add(fleetVehicleId);
    }
  });

  return ids;
};

export const isCancelledBookingStatus = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'cancelled' || normalized === 'canceled';
};

export const hasAssignedFleetAssignment = ({
  assignedFleetVehicleId,
  assignedFleetPlate,
  payload,
}: {
  assignedFleetVehicleId?: unknown;
  assignedFleetPlate?: unknown;
  payload?: unknown;
}): boolean => {
  const vehicleId =
    toTrimmedString(assignedFleetVehicleId) ??
    getAssignedFleetVehicleIdFromPayload(payload);
  const plate =
    toTrimmedString(assignedFleetPlate) ?? getAssignedFleetPlateFromPayload(payload);
  return Boolean(vehicleId && plate);
};

export const formatDateForConflictMessage = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : 'ismeretlen dátum';

const pickHandoverBounds = (
  handovers: { direction: 'out' | 'in'; handoverAt: Date }[],
) => {
  let handoverOutAt: Date | null = null;
  let handoverInAt: Date | null = null;

  for (const handover of handovers) {
    if (handover.direction === 'out' && !handoverOutAt) {
      handoverOutAt = handover.handoverAt;
      continue;
    }
    if (handover.direction === 'in') {
      handoverInAt = handover.handoverAt;
    }
  }

  return { handoverOutAt, handoverInAt };
};

export const findFleetVehicleBookingConflict = async ({
  bookingIdToExclude,
  fleetVehicleId,
  rentalStart,
  rentalEnd,
  arrivalHour,
  arrivalMinute,
  handoverOutAt,
  handoverInAt,
}: {
  bookingIdToExclude?: string | null;
  fleetVehicleId: string;
  rentalStart: Date;
  rentalEnd: Date;
  arrivalHour?: string | null;
  arrivalMinute?: string | null;
  handoverOutAt?: Date | null;
  handoverInAt?: Date | null;
}): Promise<BookingConflictCandidate | null> => {
  const requestedInterval = buildBookingInterval({
    rentalStart,
    rentalEnd,
    arrivalHour,
    arrivalMinute,
    handoverOutAt,
    handoverInAt,
  });
  if (!requestedInterval) return null;

  const trimmedExcludedId = bookingIdToExclude?.trim();
  const where = {
    rentalstart: {
      not: null,
      lte: rentalEnd,
    },
    rentalend: {
      not: null,
      gte: rentalStart,
    },
    ...(trimmedExcludedId ? { id: { not: trimmedExcludedId } } : {}),
  } as Prisma.RentRequestsWhereInput;

  const candidates = await db.rentRequests.findMany({
    where,
    select: {
      id: true,
      humanId: true,
      rentalstart: true,
      rentalend: true,
      status: true,
      assignedFleetVehicleId: true,
      payload: true,
      bookingFleetAssignments: {
        select: {
          fleetVehicleId: true,
        },
      },
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
    },
    orderBy: { rentalstart: 'asc' },
  });
  const archivedIdSet = await getArchivedBookingIdSet(
    candidates.map((candidate) => candidate.id),
  );

  return (
    candidates.find(
      (candidate) =>
        !archivedIdSet.has(candidate.id) &&
        !isCancelledBookingStatus(candidate.status) &&
        (() => {
          if (!getAssignedFleetVehicleIds(candidate).has(fleetVehicleId)) {
            return false;
          }

          const { handoverOutAt: candidateHandoverOutAt, handoverInAt } =
            pickHandoverBounds(candidate.vehicleHandovers);
          const candidateInterval = buildBookingInterval({
            rentalStart: candidate.rentalstart,
            rentalEnd: candidate.rentalend,
            arrivalHour: candidate.bookingDeliveryDetails?.arrivalHour ?? null,
            arrivalMinute:
              candidate.bookingDeliveryDetails?.arrivalMinute ?? null,
            handoverOutAt: candidateHandoverOutAt,
            handoverInAt,
          });
          if (!candidateInterval) return false;

          return intervalsOverlap(requestedInterval, candidateInterval);
        })(),
    ) ?? null
  );
};

export const findCarBookingConflict = async ({
  bookingIdToExclude,
  carId,
  rentalStart,
  rentalEnd,
}: {
  bookingIdToExclude?: string | null;
  carId: string;
  rentalStart: Date;
  rentalEnd: Date;
}): Promise<BookingConflictCandidate | null> => {
  const trimmedExcludedId = bookingIdToExclude?.trim();
  const where = {
    carid: carId,
    rentalstart: {
      not: null,
      lte: rentalEnd,
    },
    rentalend: {
      not: null,
      gte: rentalStart,
    },
    ...(trimmedExcludedId ? { id: { not: trimmedExcludedId } } : {}),
  } as Prisma.RentRequestsWhereInput;

  const candidates = await db.rentRequests.findMany({
    where,
    select: {
      id: true,
      humanId: true,
      rentalstart: true,
      rentalend: true,
      status: true,
      payload: true,
    },
    orderBy: { rentalstart: 'asc' },
  });
  const archivedIdSet = await getArchivedBookingIdSet(
    candidates.map((candidate) => candidate.id),
  );

  return (
    candidates.find(
      (candidate) =>
        !archivedIdSet.has(candidate.id) &&
        !isCancelledBookingStatus(candidate.status),
    ) ?? null
  );
};
