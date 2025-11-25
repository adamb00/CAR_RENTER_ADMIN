'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { triggerPublicRevalidate } from '@/lib/public-revalidate';
import { CreateCarSchema, type CreateCarInput } from '@/schemas/carSchema';

export const createCarAction = async (values: CreateCarInput) => {
   const validated = await CreateCarSchema.safeParseAsync(values);

   if (!validated.success) {
      return { error: 'Hibás adatok, kérjük ellenőrizd az űrlapot.' };
   }

   const { colors, monthlyPrices, ...carData } = validated.data;
   const uniqueColors = Array.from(new Set(colors));

   try {
      const created = await db.car.create({
         data: {
            ...carData,
            monthlyPrices,
            colors: {
               connectOrCreate: uniqueColors.map((color) => ({
                  where: { name: color },
                  create: { name: color },
               })),
            },
         },
      });

      revalidatePath('/cars');
      void triggerPublicRevalidate({ carId: created.id });
      return { success: 'Az autó sikeresen felvételre került.' };
   } catch (error) {
      console.error('createCarAction', error);
      return {
         error: 'Nem sikerült elmenteni az autót. Próbáld meg később.',
      };
   }
};
