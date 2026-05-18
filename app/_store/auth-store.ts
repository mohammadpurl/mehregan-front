import { create } from "zustand";
import { UserSession } from "@/app/(auth)/_types/auth.types";

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface SessionState {
    session: UserSession | null;    
    status: AuthStatus;
    clearSession: () => void;
    updateSession: () => Promise<void>;
    error: string | null;
   
}
const fetchSessionFromAPI = async () => {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include', // Ensure cookies are sent
        });
        
        if (!response.ok) {
            console.log('[AUTH-STORE] Session API returned non-ok status:', response.status, response.statusText);
            return {session:null, status:'unauthenticated' as AuthStatus}
        }
        
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
            console.log('[AUTH-STORE] Session retrieved successfully');
            return {session: data, status: 'authenticated' as AuthStatus};
        } else {
            console.log('[AUTH-STORE] Session data is empty');
            return {session:null, status:'unauthenticated' as AuthStatus}
        }
    } catch (error) {
        console.error('[AUTH-STORE] Error fetching session:', error);
        return {session:null, status:'unauthenticated' as AuthStatus}
    }
}

export const useSessionStore = create<SessionState>((set) => ({
    session:null,
    status: 'loading' as AuthStatus,
    error: null,
    clearSession: () => {set({
        session: null,
        status:  'unauthenticated'
    })
    },
    updateSession: async () => {
        const {session, status} = await fetchSessionFromAPI();
        set({session, status})
    }

}))

if(typeof window != 'undefined'){
    useSessionStore.getState().updateSession()
}