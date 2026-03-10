'use client';

/**
 * useAudioStore — état du moteur audio Tone.js.
 * 'use client' : Zustand ne s'exécute que côté client.
 * Spec : docs/ARCHITECTURE.md — Zustand stores (responsabilités séparées)
 */

import type { ChordProgressionTheme, MidiPieceId } from '@typewav/audio-engine';
import { create } from 'zustand';

interface AudioState {
  /** true si Tone.js a été initialisé (après premier keydown) */
  initialized: boolean;
  /** Pack sonore actif */
  soundPackId: string;
  /** Volume global (0–1) */
  volume: number;
  /** Thème musical actif (détermine la progression d'accords) */
  themeId: ChordProgressionTheme;
  /** true si le chargement d'un pack est en cours */
  loading: boolean;
  /**
   * Pièce MIDI active (mode Classiques).
   * null = mode génératif (gamme pentatonique).
   */
  activePieceId: MidiPieceId | null;
}

interface AudioActions {
  setInitialized: (value: boolean) => void;
  setSoundPack: (packId: string) => void;
  setVolume: (volume: number) => void;
  setTheme: (themeId: ChordProgressionTheme) => void;
  setLoading: (loading: boolean) => void;
  setActivePiece: (pieceId: MidiPieceId | null) => void;
}

export const useAudioStore = create<AudioState & AudioActions>((set) => ({
  initialized: false,
  soundPackId: 'piano',
  volume: 0.8,
  themeId: 'terminal',
  loading: false,
  activePieceId: null,

  setInitialized: (value) => set({ initialized: value }),
  setSoundPack: (packId) => set({ soundPackId: packId }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setTheme: (themeId) => set({ themeId }),
  setLoading: (loading) => set({ loading }),
  setActivePiece: (pieceId) => set({ activePieceId: pieceId }),
}));
