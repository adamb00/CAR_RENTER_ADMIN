'use server';

import { signIn } from '@/auth';
import { getUserByEmail } from '@/data-service/user';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/constants';
import { LoginSchema } from '@/schemas/authSchema';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const loginAction = async (values: z.infer<typeof LoginSchema>) => {
   try {
      const validatedFields = await LoginSchema.safeParseAsync(values);

      if (!validatedFields.success) {
         return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
      }
      const { email, password } = validatedFields.data;

      const existingUser = await getUserByEmail(email);

      if (!existingUser || !existingUser.email || !existingUser.password) {
         return {
            error: 'Ez az e-mail cím nem található az adatbázisunkban!',
         };
      }

      await signIn('credentials', {
         email,
         password,
         redirectTo: DEFAULT_LOGIN_REDIRECT,
      });
      revalidatePath(DEFAULT_LOGIN_REDIRECT);
   } catch (error) {
      if (error instanceof AuthError) {
         switch (error.type) {
            case 'CredentialsSignin':
               return { error: 'Sikertelen azonosítás. Kérjük próbáld meg újból!' };
            default:
               return { error: 'Valami hiba történt! Kérjük próbáld meg újból!' };
         }
      }
      throw error;
   }
};
