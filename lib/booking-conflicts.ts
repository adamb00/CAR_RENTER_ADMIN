import { db } from '@/lib/db';

type BookingConflictCandidate = {
  id: string;
  humanId: string | null;
  rentalstart: Date | null;
  rentalend: Date | null;
  payload: unknown;
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

export const formatDateForConflictMessage = (value?: Date | null) =>
  value ? value.toISOString().slice(0, 10) : 'ismeretlen dátum';

export const findFleetVehicleBookingConflict = async ({
  bookingIdToExclude,
  fleetVehicleId,
  rentalStart,
  rentalEnd,
}: {
  bookingIdToExclude: string;
  fleetVehicleId: string;
  rentalStart: Date;
  rentalEnd: Date;
}): Promise<BookingConflictCandidate | null> => {
  const candidates = await db.rentRequests.findMany({
    where: {
      id: { not: bookingIdToExclude },
      rentalstart: {
        not: null,
        lte: rentalEnd,
      },
      rentalend: {
        not: null,
        gte: rentalStart,
      },
    },
    select: {
      id: true,
      humanId: true,
      rentalstart: true,
      rentalend: true,
      payload: true,
    },
    orderBy: { rentalstart: 'asc' },
  });

  return (
    candidates.find(
      (candidate) =>
        getAssignedFleetVehicleIdFromPayload(candidate.payload) ===
        fleetVehicleId,
    ) ?? null
  );
};
