import type { NextAuthConfig } from 'next-auth';

import Credentials from 'next-auth/providers/credentials';

import { getUserByEmail } from './data-service/user';
import { LoginSchema } from './schemas/authSchema';
import { comparePasswords } from '@/utils/compare-passwords';

export default {
   providers: [
      Credentials({
         async authorize(credentials) {
            const validatedFields = await LoginSchema.safeParseAsync(credentials);

            if (validatedFields.success) {
               const { email, password } = validatedFields.data;

               const user = await getUserByEmail(email);
               if (!user || !user.password) return null;

               const passwordsMatch = await comparePasswords(password, user.password);
               if (passwordsMatch) return user;
            }
            return null;
         },
      }),
   ],
} satisfies NextAuthConfig;
