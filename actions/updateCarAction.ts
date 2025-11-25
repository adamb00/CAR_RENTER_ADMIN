'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { triggerPublicRevalidate } from '@/lib/public-revalidate';
import { CreateCarSchema, type CreateCarInput } from '@/schemas/carSchema';

interface UpdateCarInput {
  id: string;
  values: CreateCarInput;
}

export const updateCarAction = async ({ id, values }: UpdateCarInput) => {
  const validated = await CreateCarSchema.safeParseAsync(values);

  if (!validated.success) {
    return { error: 'Hibás adatok, kérjük ellenőrizd az űrlapot.' };
  }

  const { colors, monthlyPrices, ...carData } = validated.data;
  const uniqueColors = Array.from(new Set(colors));

  try {
    await db.car.update({
      where: { id },
      data: {
        ...carData,
        monthlyPrices,
        colors: {
          set: [],
          connectOrCreate: uniqueColors.map((color) => ({
            where: { name: color },
            create: { name: color },
          })),
        },
      },
    });

    revalidatePath('/cars');
    void triggerPublicRevalidate({ carId: id });
    console.log('updateCarAction success');

    return { success: 'Az autó adatai frissültek.' };
  } catch (error) {
    console.error('updateCarAction', error);
    return {
      error: 'Nem sikerült módosítani az autót. Próbáld meg később.',
    };
  }
};

export const deleteCarAction = async (id: string) => {
  try {
    await db.car.delete({
      where: { id },
    });
    revalidatePath('/cars');
    return { success: 'Az autó törlésre került.' };
  } catch (error) {
    console.error('deleteCarAction', error);
    return {
      error: 'Nem sikerült törölni az autót. Próbáld meg később.',
    };
  }
};
