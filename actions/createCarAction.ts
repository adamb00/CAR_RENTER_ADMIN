'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { CreateCarSchema, type CreateCarInput } from '@/schemas/carSchema';

export const createCarAction = async (values: CreateCarInput) => {
   const validated = await CreateCarSchema.safeParseAsync(values);

   if (!validated.success) {
      return { error: 'Hibás adatok, kérjük ellenőrizd az űrlapot.' };
   }

   try {
      await db.car.create({
         data: validated.data,
      });

      revalidatePath('/cars');
      return { success: 'Az autó sikeresen felvételre került.' };
   } catch (error) {
      console.error('createCarAction', error);
      return {
         error: 'Nem sikerült elmenteni az autót. Próbáld meg később.',
      };
   }
};
