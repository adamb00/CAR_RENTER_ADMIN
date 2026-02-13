'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';

const updateFleetVehicleDamagesImagesSchema = z.object({
  id: z.string().min(1),
  carId: z.string().min(1),
  damagesImages: z.array(z.string()),
});

export async function updateFleetVehicleDamagesImagesAction(
  input: z.infer<typeof updateFleetVehicleDamagesImagesSchema>,
) {
  const parsed = updateFleetVehicleDamagesImagesSchema.safeParse(input);
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

  try {
    await db.fleetVehicle.update({
      where: { id: data.id },
      data: {
        damagesImages: data.damagesImages,
      },
    });

    revalidatePath(`/cars/${data.carId}/edit`);
    revalidatePath(`/cars/${data.carId}/edit/fleet/${data.id}`);

    return { success: 'Sérülés fotók frissítve.' };
  } catch (error) {
    console.error('Failed to update damages images', error);
    return { error: 'Nem sikerült frissíteni a sérülés fotókat.' };
  }
}
