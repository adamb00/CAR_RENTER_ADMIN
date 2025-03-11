import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './lib/db';
import { getUserById } from './data-service/user';

export const { auth, handlers, signIn, signOut } = NextAuth({
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
   adapter: PrismaAdapter(db),
   session: { strategy: 'jwt' },
   pages: {
      signIn: '/auth/login',
      error: '/error',
   },
   ...authConfig,
});
