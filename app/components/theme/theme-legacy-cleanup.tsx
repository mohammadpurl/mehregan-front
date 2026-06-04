'use client';

import { useEffect } from 'react';

/** Removes next-themes class/localStorage left after ThemeProvider was removed. */
export function ThemeLegacyCleanup() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    try {
      localStorage.removeItem('theme');
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
