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
            return {session:null, status:'unauthenticated' as AuthStatus}
        }
        
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
            return {session: data, status: 'authenticated' as AuthStatus};
        } else {
            return {session:null, status:'unauthenticated' as AuthStatus}
        }
    } catch {
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