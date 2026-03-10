'use client'

/**
 * useThemeStore — thème actif et déverrouillage.
 * 'use client' : Zustand ne s'exécute que côté client.
 * Spec : docs/ARCHITECTURE.md — Zustand stores
 */

import { create } from 'zustand'

interface ThemeState {
  themeId: string
  unlockedThemes: string[]
}

interface ThemeActions {
  setTheme: (themeId: string) => void
  unlockTheme: (themeId: string) => void
}

export const useThemeStore = create<ThemeState & ThemeActions>((set) => ({
  themeId: 'terminal',
  unlockedThemes: ['terminal', 'noir', 'midnight-sun', 'arcade'],

  setTheme: (themeId) => set({ themeId }),
  unlockTheme: (themeId) =>
    set((state) => ({
      unlockedThemes: state.unlockedThemes.includes(themeId)
        ? state.unlockedThemes
        : [...state.unlockedThemes, themeId],
    })),
}))
