import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/** گزینه‌های مشترک کوکی‌های احراز هویت */
export function authCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export const ERP_SESSION_COOKIE = 'erp-session';
/** JWT خام فقط در این کوکی httpOnly — هرگز به کلاینت JSON برنگردان */
export const ERP_ACCESS_TOKEN_COOKIE = 'erp-access-token';
