import type { NextAuthConfig } from 'next-auth';

const authConfig = {
   session: { strategy: 'jwt' },
   pages: {
      signIn: '/auth/login',
      error: '/error',
   },
   providers: [],
} satisfies NextAuthConfig;

export default authConfig;
