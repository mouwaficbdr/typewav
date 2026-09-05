'use client';

/**
 * useConfigStore : état de configuration de la barre config (Zone 2).
 *
 * Persisté dans IndexedDB (store user_preferences, clé 'typewav-config').
 * Spec : docs/specs/29-home-layout.md
 */

import { deletePreference, getPreference, setPreference } from '@/lib/db';
import type { TypingMode } from '@typewav/types';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type TextLanguageFilter = 'fr' | 'en' | 'both';

interface ConfigState {
  // ── Mode principal ──────────────────────────────────────────────────────
  activeMode: TypingMode;
  // ── Modificateurs ligne 1 ───────────────────────────────────────────────
  punctuationEnabled: boolean;
  numbersEnabled: boolean;
  textLanguage: TextLanguageFilter;
  // ── Options ligne 2 (selon mode) ────────────────────────────────────────
  activeCollection:
    | 'litterature'
    | 'poesie'
    | 'philosophie'
    | 'gaming'
    | 'code';
  wordCount: 10 | 25 | 50 | 100;
  durationSeconds: 15 | 30 | 60 | 120;
}

interface ConfigActions {
  setMode: (mode: TypingMode) => void;
  setCollection: (id: ConfigState['activeCollection']) => void;
  setWordCount: (count: ConfigState['wordCount']) => void;
  setDuration: (seconds: ConfigState['durationSeconds']) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  setTextLanguage: (lang: TextLanguageFilter) => void;
}

// Un environnement sans IndexedDB (SSR, tests sans fake-indexeddb) ne doit
// jamais empêcher le store de fonctionner en mémoire : on dégrade
// silencieusement plutôt que de laisser une promesse rejetée remonter dans
// le middleware persist (comportement interne non garanti dans ce cas).
const indexedDBStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return (await getPreference<string>(name)) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await setPreference(name, value);
    } catch {
      // best-effort
    }
  },
  removeItem: async (name) => {
    try {
      await deletePreference(name);
    } catch {
      // best-effort
    }
  },
};

export const DEFAULT_CONFIG: ConfigState = {
  activeMode: 'classic',
  punctuationEnabled: false,
  numbersEnabled: false,
  textLanguage: 'both',
  activeCollection: 'litterature',
  wordCount: 25,
  durationSeconds: 60,
};

export const useConfigStore = create<ConfigState & ConfigActions>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      setMode: (mode) => set({ activeMode: mode }),
      setCollection: (id) => set({ activeCollection: id }),
      setWordCount: (count) => set({ wordCount: count }),
      setDuration: (seconds) => set({ durationSeconds: seconds }),
      togglePunctuation: () =>
        set((s) => ({ punctuationEnabled: !s.punctuationEnabled })),
      toggleNumbers: () => set((s) => ({ numbersEnabled: !s.numbersEnabled })),
      setTextLanguage: (lang) => set({ textLanguage: lang }),
    }),
    {
      name: 'typewav-config',
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
