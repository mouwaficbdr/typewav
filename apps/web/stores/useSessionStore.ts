'use client';

/**
 * useSessionStore — état du test de typing en cours.
 * 'use client' : Zustand ne s'exécute que côté client.
 * Spec : docs/ARCHITECTURE.md — Zustand stores (responsabilités séparées)
 */

import type { KeystrokeEntry, TypingMode } from '@typewav/types';
import { create } from 'zustand';

interface SessionState {
  /** Texte courant à taper */
  text: string;
  /** Index du caractère courant */
  position: number;
  /** Frappes enregistrées */
  keystrokes: KeystrokeEntry[];
  /** Timestamp du premier keydown (démarre le timer) */
  startedAt: number | null;
  /** Timestamp de fin */
  endedAt: number | null;
  /** Nombre d'erreurs accumulées */
  errorCount: number;
  mode: TypingMode;
  collectionId: string | undefined;
  soundPackId: string;
  themeId: string;
}

interface SessionActions {
  /** Initialise une nouvelle session avec un texte */
  startSession: (
    text: string,
    options?: {
      mode?: TypingMode;
      collectionId?: string;
      soundPackId?: string;
      themeId?: string;
    },
  ) => void;
  /** Enregistre une frappe */
  recordKeystroke: (entry: KeystrokeEntry) => void;
  /** Termine la session */
  endSession: () => void;
  /** Remet à zéro pour un nouveau test */
  reset: () => void;
}

const initialState: SessionState = {
  text: '',
  position: 0,
  keystrokes: [],
  startedAt: null,
  endedAt: null,
  errorCount: 0,
  mode: 'classic',
  collectionId: undefined,
  soundPackId: 'piano',
  themeId: 'terminal',
};

export const useSessionStore = create<SessionState & SessionActions>(
  (set, get) => ({
    ...initialState,

    startSession: (text, options = {}) => {
      set({
        text,
        position: 0,
        keystrokes: [],
        startedAt: Date.now(),
        endedAt: null,
        errorCount: 0,
        mode: options.mode ?? 'classic',
        collectionId: options.collectionId,
        soundPackId: options.soundPackId ?? 'piano',
        themeId: options.themeId ?? 'terminal',
      });
    },

    recordKeystroke: (entry) => {
      set((state) => ({
        keystrokes: [...state.keystrokes, entry],
        position: entry.correct ? state.position + 1 : state.position,
        errorCount: entry.correct ? state.errorCount : state.errorCount + 1,
      }));

      // Session terminée quand tout le texte est tapé
      const { position, text } = get();
      if (position >= text.length) {
        set({ endedAt: Date.now() });
      }
    },

    endSession: () => {
      set({ endedAt: Date.now() });
    },

    reset: () => {
      set(initialState);
    },
  }),
);
