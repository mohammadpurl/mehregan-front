'use server';
import { cookies, headers } from "next/headers";
import { JWT, SignInModel, UserResponse, UserSession } from "@/app/(auth)/_types/auth.types";
import { jwtDecode } from "jwt-decode";
import { decryptSession, encryptSession } from "@/app/utils/session";
import { createData } from "@/app/core/http-service/http-service";
import { extractActionErrorMessage } from "@/app/_actions/extract-action-error";

// Helper function for structured logging
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[AUTH-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};


export async function signinAction(model: SignInModel) {
    const headersList = headers();
    await headersList;
    try {
        
        const payload = Array.isArray(model) ? model[0] : model;
        console.log("TYPE:", model.constructor.name);

        log('info', 'signinAction started', { 
            isArray: Array.isArray(model),
            payloadKeys: Object.keys(payload || {})
        });
        console.log("signin model ", model);
        console.log("IS ARRAY:", Array.isArray(model));
        console.log("MODEL:", model);
        const response = await createData<{ username: string; password: string, userAgent:string }, UserResponse>(
            '/auth/login',
            { ...payload }
        );
        
        
        console.log("signin response ", response);
        if (response.accessToken) {
            const user = await response;
            await SetAuthCookieAction(user);
            return { success: true }
        }
        
        return {
          success: false,
          error: 'نام کاربری یا رمز عبور اشتباه است',
        };
    } catch (err) {
        console.log("signinAction error is", err)
        const e = err as { message?: unknown; detail?: unknown; title?: unknown };
        const fromFields = [e?.message, e?.detail, e?.title]
          .find((v): v is string => typeof v === 'string' && v.trim().length > 0)
          ?.trim();
        return {
            success: false,
            error: fromFields || extractActionErrorMessage(err, 'نام کاربری یا رمز عبور اشتباه است'),
        };
    }
}

export async function signOutAction() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('erp-session')?.value;
        console.log("")
        if (!sessionCookie) {
            return { success: true };
        }

        const session = await decryptSession(sessionCookie);
        try {
            const response = await createData<{ sessionId: string }, { success: boolean }>(
                '/auth/signout',
                { sessionId: (session as unknown as UserSession).sessionId }
            );

            if (response.success) {
                cookieStore.delete('erp-session');
                return { success: true };
            }
        } catch {
            // Even if API call fails, delete the cookie
            cookieStore.delete('erp-session');
            return { success: true };
        }
        
        cookieStore.delete('erp-session');
        return { success: true };
    } catch {
        // If anything fails, try to delete cookie anyway
        try {
            const cookieStore = await cookies();
            cookieStore.delete('erp-session');
        } catch {}
        return { success: true };
    }
}

export async function SetAuthCookieAction(user: UserResponse) {
    const startTime = Date.now();
    log('info', 'SetAuthCookieAction started', {
        hasAccessToken: !!user?.accessToken,
        hasSessionId: !!user?.sessionId,
    });
    
    try {
        log('info', 'Decoding JWT token...');
        const decoded = jwtDecode<JWT>(user.accessToken);
        const decodedExt = decoded as JWT & { role?: string | string[] };
        const resolvedUserId =
            decoded.userId ??
            (decoded.sub ? String(decoded.sub) : undefined) ??
            (decoded.id != null && decoded.id !== '' ? String(decoded.id) : undefined);
        log('info', 'JWT decoded successfully', {
            userName: decoded.userName,
            exp: decoded.exp,
            resolvedUserId: resolvedUserId ?? '(none)',
        });

        const rolesFromBody = Array.isArray(user.roles) ? user.roles : [];
        const permissionsFromBody = Array.isArray(user.permissions) ? user.permissions : [];
        const rolesFromJwt = Array.isArray((decodedExt).roles)
            ? (decoded as JWT & { roles?: string[] }).roles!
            : Array.isArray((decoded as JWT & { role?: string | string[] }).role)
                ? (decoded as JWT & { role?: string[] }).role!
                : typeof (decoded as JWT & { role?: string | string[] }).role === 'string'
                    ? [(decoded as JWT & { role?: string }).role as string]
                    : [];
        const permissionsFromJwt = Array.isArray(
            (decoded as JWT & { permissions?: string[] }).permissions
        )
            ? (decoded as JWT & { permissions?: string[] }).permissions!
            : [];

        const session: UserSession = {
            userName: decoded.userName,
            fullName: decoded.fullName,
            pic: decoded.pic,
            exp: decoded.exp * 1000,
            accesstoken: user.accessToken,
            sessionId: user.sessionId,
            sessionExpiry: user.sessionExpiry * 1000,
            userId:
                user.userId != null
                    ? String(user.userId)
                    : resolvedUserId,
            roles: rolesFromBody.length > 0 ? rolesFromBody : rolesFromJwt,
            permissions:
                permissionsFromBody.length > 0
                    ? permissionsFromBody
                    : permissionsFromJwt,
        };

        log('info', 'Session object created', {
            userName: session.userName,
            sessionId: session.sessionId,
            exp: new Date(session.exp).toISOString(),
        });

        const cookieStore = await cookies();
        
        log('info', 'Encrypting session...');
        const encryptStartTime = Date.now();
        const encryptedSession = await encryptSession(session);
        const encryptDuration = Date.now() - encryptStartTime;
        log('info', 'Session encrypted successfully', {
            duration: `${encryptDuration}ms`,
            encryptedLength: encryptedSession.length,
        });
        
        // Verify encryption (optional, for debugging)
        log('info', 'Verifying encryption...');
        const decryptedSession = await decryptSession(encryptedSession);
        const decryptedSessionTyped = decryptedSession as unknown as UserSession;
        log('info', 'Encryption verified', {
            decryptedUserName: decryptedSessionTyped?.userName,
        });
        
        log('info', 'Setting cookie...');
        cookieStore.set('erp-session', encryptedSession, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/'
        });
        
        const totalDuration = Date.now() - startTime;
        log('info', 'SetAuthCookieAction completed successfully', {
            totalDuration: `${totalDuration}ms`,
        });
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const error = err as { message?: string; stack?: string };
        log('error', 'SetAuthCookieAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: error?.message,
                stack: error?.stack,
            },
        });
        throw err;
    }
}