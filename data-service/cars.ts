'use server';
import { db } from '@/lib/db';

export const getCarById = async (carId: string) => {
  return db.car.findUnique({
    where: { id: carId },
    select: { manufacturer: true, model: true, images: true },
  });
};

export const getVehicleById = async (vehicleId: string) => {
  return db.fleetVehicle.findUnique({
    where: { id: vehicleId },
  });
};

export const hasVehicleHandoverOut = async (
  bookingId: string,
  fleetVehicleId: string,
) => {
  const handover = await db.vehicleHandover.findFirst({
    where: { bookingId, fleetVehicleId, direction: 'out' },
  });

  return !!handover;
};

export const getFleetCars = async () => {
  return db.fleetVehicle.findMany({});
};
