'use client';

/**
 * useThemeStore : thème actif (persisté en localStorage).
 * 'use client' : Zustand ne s'exécute que côté client.
 *
 * La liste des thèmes débloqués vit dans `UserProfile.unlockedThemes`
 * (IndexedDB, alimentée par les jalons via `useProgressionCheck`). C'est la
 * seule vérité ; l'ancien `unlockedThemes` / `unlockTheme` de ce store était
 * du code mort (aucun lecteur, aucun appelant) et a été retiré (WS-5 #6).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  themeId: string;
}

interface ThemeActions {
  setTheme: (themeId: string) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      themeId: 'terminal',
      setTheme: (themeId) => set({ themeId }),
    }),
    {
      name: 'typewav-theme-storage',
    },
  ),
);
