'use client';
import { useUiStore } from '@/app/_store/ui-store';
import { ChevronLeft, X } from 'lucide-react'
import React from 'react'

const SidebarToggle = () => {
    const setMobileOpen = useUiStore(state => state.setMobileOpen);
    const setSidebarOpen = useUiStore(state => state.setSidebarOpen);
    const { sidebarOpen } = useUiStore()
  return (
    <div className="flex items-center justify-between border-b border-[oklch(0.3783_0.0647_256.94)] p-4 sm:p-5">
          {sidebarOpen && (
            <h1 className="erp-sidebar-title text-lg font-bold animate-fade-in">
              سامانه اتوماسیون
            </h1>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'جمع کردن نوار کناری' : 'باز کردن نوار کناری'}
            className="erp-nav-item-idle hidden min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md transition-colors lg:flex"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="بستن منو"
            className="erp-nav-item-idle flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
  )
}

export default SidebarToggle