import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { apiAuthPrefix, authRoutes, publicRoutes, publicApiRoutes } from '@/routes';
import { DEFAULT_LOGIN_REDIRECT } from './lib/constants';

const { auth } = NextAuth(authConfig);

export default auth(req => {
   const { nextUrl, auth } = req;
   const isLoggedIn = !!auth;

   const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
   const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
   const isPublicApiRoute = publicApiRoutes.some(route => nextUrl.pathname.startsWith(route));
   const isAuthRoute = authRoutes.includes(nextUrl.pathname);

   if (isApiAuthRoute || isPublicApiRoute) {
      return;
   }

   if (isAuthRoute) {
      if (isLoggedIn) {
         return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
      return;
   }

   if (!isLoggedIn && !isPublicRoute && !isPublicApiRoute) {
      return Response.redirect(new URL('/auth/login', nextUrl));
   }

   return;
});

export const config = {
   matcher: [
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
   ],
};
