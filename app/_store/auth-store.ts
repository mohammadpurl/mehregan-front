import { create } from "zustand";
import type { ClientSession } from "@/app/(auth)/_types/auth.types";

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface SessionState {
    session: ClientSession | null;
    status: AuthStatus;
    clearSession: () => void;
    updateSession: () => Promise<void>;
    error: string | null;
}

function sanitizeClientSession(data: unknown): ClientSession | null {
    if (!data || typeof data !== 'object') return null;
    const raw = data as Record<string, unknown>;
    const {
        accesstoken: _a,
        accessToken: _b,
        access_token: _c,
        token: _d,
        ...safe
    } = raw;
    if (Object.keys(safe).length === 0) return null;
    return safe as ClientSession;
}

const fetchSessionFromAPI = async () => {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include',
        });

        if (!response.ok) {
            return { session: null, status: 'unauthenticated' as AuthStatus };
        }

        const data = await response.json();
        const session = sanitizeClientSession(data);
        if (session) {
            return { session, status: 'authenticated' as AuthStatus };
        }
        return { session: null, status: 'unauthenticated' as AuthStatus };
    } catch {
        return { session: null, status: 'unauthenticated' as AuthStatus };
    }
};

export const useSessionStore = create<SessionState>((set) => ({
    session: null,
    status: 'loading' as AuthStatus,
    error: null,
    clearSession: () => {
        set({
            session: null,
            status: 'unauthenticated',
        });
    },
    updateSession: async () => {
        const { session, status } = await fetchSessionFromAPI();
        set({ session, status });
    },
}));

if (typeof window != 'undefined') {
    useSessionStore.getState().updateSession();
}
