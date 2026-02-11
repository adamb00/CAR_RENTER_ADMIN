'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { db } from '@/lib/db';
import { fleetVehicleSchema } from '@/lib/fleet-vehicle-schema';

export async function createFleetVehicleAction(input: z.infer<typeof fleetVehicleSchema>) {
  const parsed = fleetVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Érvénytelen adatok, kérjük ellenőrizd a mezőket.' };
  }

  const data = parsed.data;

  const toDateOrNull = (value?: string) => (value ? new Date(value) : undefined);

  try {
    await db.fleetVehicle.create({
      data: {
        carId: data.carId,
        plate: data.plate.trim(),
        odometer: data.odometer ?? 0,
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
      },
    });

    revalidatePath(`/cars/${data.carId}/edit`);
    revalidatePath(`/cars/${data.carId}/edit/fleet`);

    return { success: 'Autó hozzáadva a flottához.' };
  } catch (error) {
    console.error('Failed to create fleet vehicle', error);
    return { error: 'Nem sikerült menteni az autót a flottába.' };
  }
}
