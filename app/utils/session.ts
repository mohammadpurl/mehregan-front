import { cookies } from 'next/headers';
import { UserSession } from '@/app/(auth)/_types/auth.types';
import { JWTPayload, jwtVerify, SignJWT } from 'jose';
import {
  ERP_ACCESS_TOKEN_COOKIE,
  ERP_SESSION_COOKIE,
} from '@/app/utils/auth-cookie';

const JWT_SERVER_SECRET = process.env.JWT_SERVER_SECRET;

/** فیلدهایی که هرگز نباید در پاسخ JSON به کلاینت بروند */
const CLIENT_FORBIDDEN_KEYS = new Set([
  'accesstoken',
  'accessToken',
  'access_token',
  'token',
]);

export async function encryptSession(session: UserSession): Promise<string> {
  if (!JWT_SERVER_SECRET) {
    throw new Error('JWT_SERVER_SECRET is not set');
  }
  const { accesstoken: _omit, ...safe } = session;
  const token = await new SignJWT(safe as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(JWT_SERVER_SECRET as string));
  return token;
}

export async function decryptSession(session: string) {
  if (!JWT_SERVER_SECRET) {
    throw new Error('JWT_SERVER_SECRET is not set');
  }
  const { payload } = await jwtVerify(
    session,
    new TextEncoder().encode(JWT_SERVER_SECRET as string),
  );
  return payload;
}

/** نشست سرور: فیلدهای UI + access token از کوکی جدا */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ERP_SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return null;
  }
  const session = (await decryptSession(sessionCookie)) as unknown as UserSession;
  const accessToken = cookieStore.get(ERP_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (accessToken) {
    session.accesstoken = accessToken;
  }
  return session;
}

/** نسخهٔ امن برای پاسخ API به مرورگر — بدون توکن */
export function toClientSession(session: unknown): Record<string, unknown> | null {
  if (!session || typeof session !== 'object') return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(session as Record<string, unknown>)) {
    if (CLIENT_FORBIDDEN_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}
