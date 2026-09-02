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
  /** Pièce musicale active pour la lecture séquencée. */
  activePieceId: MidiPieceId | null;
  /** Erreur de chargement MIDI affichable dans l'UI. */
  midiLoadError: string | null;
  /** true si le sampler piano est chargé (ou fallback prêt). */
  isSamplerLoaded: boolean;
  /** Message d'erreur du chargement sampler (fallback éventuel). */
  samplerLoadError: string | null;
  /**
   * Tempo réel courant (BPM), recalculé par warpEngine à chaque frappe.
   * Existait déjà en lecture seule dans warp-engine.ts sans aucun
   * consommateur UI ; exposé ici pour piloter la respiration de l'aura
   * ambiante (AmbientAura) sans forcer un re-render de tout HomeClient à
   * chaque frappe (seuls les composants qui sélectionnent ce champ
   * re-rendent). Défaut aligné sur le défaut interne de warpEngine (80).
   */
  liveBpm: number;
}

interface AudioActions {
  setInitialized: (value: boolean) => void;
  setSoundPack: (packId: string) => void;
  setVolume: (volume: number) => void;
  setTheme: (themeId: ChordProgressionTheme) => void;
  setLoading: (loading: boolean) => void;
  setActivePiece: (pieceId: MidiPieceId | null) => void;
  setMidiLoadError: (error: string | null) => void;
  setSamplerLoaded: (loaded: boolean) => void;
  setSamplerLoadError: (error: string | null) => void;
  setLiveBpm: (bpm: number) => void;
}

export const useAudioStore = create<AudioState & AudioActions>((set) => ({
  initialized: false,
  soundPackId: 'piano',
  volume: 0.8,
  themeId: 'terminal',
  loading: false,
  activePieceId: null,
  midiLoadError: null,
  isSamplerLoaded: false,
  samplerLoadError: null,
  liveBpm: 80,

  setInitialized: (value) => set({ initialized: value }),
  setSoundPack: (packId) => set({ soundPackId: packId }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setTheme: (themeId) => set({ themeId }),
  setLoading: (loading) => set({ loading }),
  setActivePiece: (pieceId) => set({ activePieceId: pieceId }),
  setMidiLoadError: (error) => set({ midiLoadError: error }),
  setSamplerLoaded: (loaded) => set({ isSamplerLoaded: loaded }),
  setSamplerLoadError: (error) => set({ samplerLoadError: error }),
  setLiveBpm: (bpm) => set({ liveBpm: bpm }),
}));
