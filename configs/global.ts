/**
 * Global configuration for the application.
 *
 * In Docker, the browser must call the published host URL (`NEXT_PUBLIC_API_URL`)
 * while server-side code inside the Next container should call the internal
 * backend service URL (`API_URL`).
 */
const browserApiUrl = process.env.NEXT_PUBLIC_API_URL;
const serverApiUrl = process.env.API_URL;

export const API_URL =
  typeof window === 'undefined'
    ? serverApiUrl || browserApiUrl || 'http://localhost:8000/api'
    : browserApiUrl || 'http://localhost:8000/api';
