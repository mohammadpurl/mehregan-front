
'use client';
import { useUiStore } from '../_store/ui-store';
import { Menu } from 'lucide-react';

export default function MobileSidebarToggle() {
  const setMobileOpen = useUiStore(state => state.setMobileOpen);

  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-sidebar-foreground touch-manipulation hover:bg-muted/20 active:bg-muted/30 lg:hidden"
      aria-label="باز کردن منو"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}