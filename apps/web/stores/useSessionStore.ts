'use client';

/**
 * useSessionStore — état du test de typing en cours.
 * 'use client' : Zustand ne s'exécute que côté client.
 * Spec : docs/ARCHITECTURE.md — Zustand stores (responsabilités séparées)
 */

import type { KeystrokeEntry, NoteEvent, TypingMode } from '@typewav/types';
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
  /** Événements note enregistrés pendant la session */
  noteEvents: NoteEvent[];
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
  /** Recule d'une position et retire le dernier keystroke */
  moveBack: () => void;
  /** Enregistre un événement note (frappe correcte) */
  recordNoteEvent: (noteName: string, charIndex: number) => void;
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
  noteEvents: [],
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
        noteEvents: [],
        mode: options.mode ?? 'classic',
        collectionId: options.collectionId,
        soundPackId: options.soundPackId ?? 'piano',
        themeId: options.themeId ?? 'terminal',
      });
    },

    recordKeystroke: (entry) => {
      set((state) => ({
        keystrokes: [...state.keystrokes, entry],
        // Le curseur avance sur chaque frappe (correcte ou incorrecte),
        // ce qui permet d'avoir de vraies erreurs puis de corriger avec Backspace.
        position: Math.min(state.text.length, state.position + 1),
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

    moveBack: () =>
      set((state) => {
        if (state.endedAt !== null) return state; // session terminée
        if (state.keystrokes.length === 0) return state; // rien à effacer
        return {
          position: Math.max(0, state.position - 1),
          keystrokes: state.keystrokes.slice(0, -1),
        };
      }),

    recordNoteEvent: (noteName, charIndex) =>
      set((state) => ({
        noteEvents: [
          ...state.noteEvents,
          {
            noteName,
            timestamp: Date.now() - (state.startedAt ?? Date.now()),
            charIndex,
            isError: false as const,
          },
        ],
      })),

    reset: () => {
      set(initialState);
    },
  }),
);
