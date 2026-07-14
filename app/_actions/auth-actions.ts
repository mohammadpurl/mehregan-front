'use server';
import { cookies, headers } from "next/headers";
import { JWT, SignInModel, UserResponse, UserSession } from "@/app/(auth)/_types/auth.types";
import { jwtDecode } from "jwt-decode";
import { decryptSession, encryptSession } from "@/app/utils/session";
import { createData } from "@/app/core/http-service/http-service";
import { extractActionErrorMessage } from "@/app/_actions/extract-action-error";

export async function signinAction(model: SignInModel) {
    const headersList = headers();
    await headersList;
    try {
        const payload = Array.isArray(model) ? model[0] : model;
        const response = await createData<{ username: string; password: string, userAgent:string }, UserResponse>(
            '/auth/login',
            { ...payload }
        );

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
    try {
        const decoded = jwtDecode<JWT>(user.accessToken);
        const decodedExt = decoded as JWT & { role?: string | string[] };
        const resolvedUserId =
            decoded.userId ??
            (decoded.sub ? String(decoded.sub) : undefined) ??
            (decoded.id != null && decoded.id !== '' ? String(decoded.id) : undefined);

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

        const cookieStore = await cookies();
        const encryptedSession = await encryptSession(session);
        cookieStore.set('erp-session', encryptedSession, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/'
        });
    } catch (err: unknown) {
        throw err;
    }
}
