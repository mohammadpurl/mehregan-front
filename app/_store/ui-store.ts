import { create } from "zustand";

interface UiState {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
}));