import { cookies } from "next/headers";
import { UserSession } from "@/app/(auth)/_types/auth.types";
import { JWTPayload, jwtVerify, SignJWT } from "jose";

const JWT_SERVER_SECRET = process.env.JWT_SERVER_SECRET;
export async function encryptSession(session: UserSession): Promise<string> {
    if (!JWT_SERVER_SECRET) {
        throw new Error('JWT_SERVER_SECRET is not set');
    }
    const token = await new  SignJWT((session as unknown as JWTPayload) )
    .setProtectedHeader({ alg: 'HS256' })
    // .setExpirationTime('1h')
    .sign(new TextEncoder().encode(JWT_SERVER_SECRET as string));
    return token;
}
export async function decryptSession(session: string) {
    if (!JWT_SERVER_SECRET) {
        throw new Error('JWT_SERVER_SECRET is not set');
    }
    const { payload } = await jwtVerify(session, new TextEncoder().encode(JWT_SERVER_SECRET as string));
    return payload ;
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('erp-session')?.value;
    if (!sessionCookie) {
        return null;
    }
    const session = await decryptSession(sessionCookie)  as unknown as UserSession;
    return session;
}