'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { db } from '@/lib/db';
import { vehicleHandoverSchema } from '@/lib/vehicle-handover-schema';

export async function createVehicleHandoverAction(
  input: z.infer<typeof vehicleHandoverSchema>,
) {
  const parsed = vehicleHandoverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;

  if (data.direction === 'in' && data.mileage == null) {
    return { error: 'A km óra állás kötelező visszavételnél.' };
  }

  const booking = await db.rentRequests.findUnique({
    where: { id: data.bookingId },
    select: { id: true },
  });

  if (!booking) {
    return { error: 'A foglalás nem található.' };
  }

  const fleetVehicle = await db.fleetVehicle.findUnique({
    where: { id: data.fleetVehicleId },
    select: { id: true },
  });

  if (!fleetVehicle) {
    return { error: 'A flottajármű nem található.' };
  }

  if (data.direction === 'in' && data.mileage != null) {
    const handoverOut = await db.vehicleHandover.findFirst({
      where: {
        bookingId: data.bookingId,
        fleetVehicleId: data.fleetVehicleId,
        direction: 'out',
      },
      orderBy: { handoverAt: 'desc' },
      select: { mileage: true },
    });
    const outMileage = handoverOut?.mileage;
    if (outMileage != null && data.mileage < outMileage) {
      return {
        error: `A km óra állás nem lehet kisebb, mint a kiadáskori érték (${outMileage} km).`,
      };
    }
  }

  const handoverAt = data.handoverAt ? new Date(data.handoverAt) : new Date();

  const shouldUpdateOdometer = data.direction === 'in' && data.mileage != null;
  const locationValue = data.location?.trim();
  const shouldUpdateLocation = Boolean(locationValue);

  try {
    const created = await (shouldUpdateOdometer || shouldUpdateLocation
      ? db.$transaction([
          db.vehicleHandover.create({
            data: {
              bookingId: data.bookingId,
              fleetVehicleId: data.fleetVehicleId,
              direction: data.direction ?? 'out',
              handoverAt,
              handoverBy: data.handoverBy?.trim() || null,
              mileage: data.mileage,
              notes: data.notes?.trim() || null,
              damages: data.damages?.trim() || null,
              damagesImages: data.damagesImages ?? [],
            },
            select: { id: true },
          }),
          db.fleetVehicle.update({
            where: { id: data.fleetVehicleId },
            data: {
              ...(shouldUpdateOdometer ? { odometer: data.mileage ?? 0 } : {}),
              ...(shouldUpdateLocation ? { location: locationValue } : {}),
            },
          }),
        ]).then(([createdRow]) => createdRow)
      : db.vehicleHandover.create({
          data: {
            bookingId: data.bookingId,
            fleetVehicleId: data.fleetVehicleId,
            direction: data.direction ?? 'out',
            handoverAt,
            handoverBy: data.handoverBy?.trim() || null,
            mileage: data.mileage,
            notes: data.notes?.trim() || null,
            damages: data.damages?.trim() || null,
            damagesImages: data.damagesImages ?? [],
          },
          select: { id: true },
        }));

    revalidatePath('/bookings');
    revalidatePath('/calendar');
    revalidatePath(`/bookings/${data.bookingId}/carout`);

    return { success: 'Kiadás rögzítve.', id: created.id };
  } catch (error) {
    console.error('Failed to create vehicle handover', error);
    return { error: 'Nem sikerült elmenteni a kiadást.' };
  }
}
