'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { fleetVehicleSchema } from '@/schemas/fleet-vehicle-schema';

const updateFleetVehicleSchema = fleetVehicleSchema.extend({
  id: z.string().min(1),
});

export async function updateFleetVehicleAction(
  input: z.infer<typeof updateFleetVehicleSchema>,
) {
  const parsed = updateFleetVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;

  const existing = await db.fleetVehicle.findUnique({
    where: { id: data.id },
    select: { carId: true },
  });

  if (!existing || existing.carId !== data.carId) {
    return { error: 'A megadott autó nem található.' };
  }

  const toDateOrNull = (value?: string) =>
    value ? new Date(value) : undefined;

  try {
    await db.fleetVehicle.update({
      where: { id: data.id },
      data: {
        plate: data.plate.trim(),
        odometer: data.odometer ?? 0,
        serviceIntervalKm: data.serviceIntervalKm,
        lastServiceMileage: data.lastServiceMileage,
        lastServiceAt: toDateOrNull(data.lastServiceAt),
        status: data.status,
        year: data.year,
        firstRegistration: toDateOrNull(data.firstRegistration),
        location: data.location?.trim() || null,
        vin: data.vin?.trim() || null,
        engineNumber: data.engineNumber?.trim() || null,
        addedAt: toDateOrNull(data.addedAt),
        inspectionExpiry: toDateOrNull(data.inspectionExpiry),
        notes: data.notes?.trim() || null,
        damages: data.damages?.trim() || null,
        damagesImages: data.damagesImages ?? [],
      },
    });

    revalidatePath(`/cars/${data.carId}/edit`);
    revalidatePath(`/cars/${data.carId}/edit/fleet`);

    return { success: 'Az autó adatai frissítve.', id: data.id };
  } catch (error) {
    console.error('Failed to update fleet vehicle', error);
    return { error: 'Nem sikerült frissíteni az autót.' };
  }
}
