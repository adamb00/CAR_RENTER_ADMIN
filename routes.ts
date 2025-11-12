/**
 * An array of routes that are not accessible to the public
 * This routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = ['/auth/login'];

/**
 * API routes that do not require authentication
 * @type {string[]}
 */
export const publicApiRoutes = ['/api/user'];

/**
 * An array of routes that are used for authentication
 * This routes will redirect logged in users to /
 * @type {string[]}
 */
export const authRoutes = [
   '/auth/login',
   '/auth/register',
   '/auth/new-verification',
   '/auth/reset',
   '/auth/new-password',
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = '/api/auth';
