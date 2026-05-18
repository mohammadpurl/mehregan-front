'use client';
import { useUiStore } from '@/app/_store/ui-store';
import { ChevronLeft, X } from 'lucide-react'
import React from 'react'

const SidebarToggle = () => {
    const setMobileOpen = useUiStore(state => state.setMobileOpen);
    const setSidebarOpen = useUiStore(state => state.setSidebarOpen);
    const { sidebarOpen } = useUiStore()
  return (
    <div className="flex items-center justify-between border-b border-sidebar-border p-4 sm:p-5">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-sidebar-primary animate-fade-in">
              سامانه اتوماسیون
            </h1>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'جمع کردن نوار کناری' : 'باز کردن نوار کناری'}
            className="hidden min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent lg:flex"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="بستن منو"
            className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md hover:bg-sidebar-accent/30 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
  )
}

export default SidebarToggle