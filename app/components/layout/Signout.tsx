import { signOutAction } from '@/app/_actions/auth-actions'
import { useSessionStore } from '@/app/_store/auth-store';
import { useUiStore } from '@/app/_store/ui-store';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react'

const Signout = () => {
    const [isPending, startTransition] = useTransition()
    const clearSession = useSessionStore(state => state.clearSession);

    const router = useRouter();
    const { sidebarOpen } = useUiStore()


    const handleSignOut = () => {
        debugger
        startTransition(async () => {
            const response = await signOutAction();
            if (response.success) {
                clearSession();
                router.push('/login')
            }
        })
    }
  return (
    <button
            type="button"
            onClick={handleSignOut}
            aria-label="خروج از حساب کاربری"
            disabled={isPending}
            className={`
              flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200
              text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent/50
              ${!sidebarOpen ? "justify-center" : ""}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">خروج</span>}
    </button>
  )
}

export default Signout