import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './lib/db';
import { getUserByEmail, getUserById } from './data-service/user';
import { LoginSchema } from './schemas/authSchema';
import { comparePasswords } from '@/utils/compare-passwords';

export const { auth, handlers, signIn, signOut } = NextAuth({
   ...authConfig,
   adapter: PrismaAdapter(db),
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
   callbacks: {
      async signIn({ user, account }) {
         if (!user.id) return false;

         if (account?.provider !== 'credentials') return true;

         const existingUser = await getUserById(user.id);

         if (!existingUser) return false;

         return true;
      },
      async session({ token, session }) {
         if (token.sub && session.user) session.user.id = token.sub;

         return session;
      },
      async jwt({ token }) {
         if (!token.sub) return token;

         const existingUser = await getUserById(token.sub);

         if (!existingUser) return token;

         return token;
      },
   },
});
