'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { CreateCarSchema, type CreateCarInput } from '@/schemas/carSchema';

interface UpdateCarInput {
  originalLicensePlate: string;
  values: CreateCarInput;
}

export const updateCarAction = async ({
  originalLicensePlate,
  values,
}: UpdateCarInput) => {
  const validated = await CreateCarSchema.safeParseAsync(values);

  if (!validated.success) {
    return { error: 'Hibás adatok, kérjük ellenőrizd az űrlapot.' };
  }

  console.log('validated data', validated);

  try {
    await db.car.update({
      where: { licensePlate: originalLicensePlate },
      data: validated.data,
    });

    revalidatePath('/cars');
    return { success: 'Az autó adatai frissültek.' };
  } catch (error) {
    console.error('updateCarAction', error);
    return {
      error: 'Nem sikerült módosítani az autót. Próbáld meg később.',
    };
  }
};

export const deactivateCarAction = async (licensePlate: string) => {
  try {
    await db.car.update({
      where: { licensePlate },
      data: { status: 'inactive' },
    });
    revalidatePath('/cars');
    return { success: 'Az autó inaktiválva lett.' };
  } catch (error) {
    console.error('deactivateCarAction', error);
    return {
      error: 'Nem sikerült inaktiválni az autót. Próbáld meg később.',
    };
  }
};

export const activateCarAction = async (licensePlate: string) => {
  try {
    await db.car.update({
      where: { licensePlate },
      data: { status: 'available' },
    });
    revalidatePath('/cars');
    return { success: 'Az autó aktiválva lett.' };
  } catch (error) {
    console.error('activateCarAction', error);
    return {
      error: 'Nem sikerült aktiválni az autót. Próbáld meg később.',
    };
  }
};

export const deleteCarAction = async (licensePlate: string) => {
  try {
    await db.car.delete({
      where: { licensePlate },
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
