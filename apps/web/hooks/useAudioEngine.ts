'use client';

/**
 * useAudioEngine — moteur audio Tone.js complet (Phase 1).
 *
 * Règles absolues (non négociables) :
 * - Tone.start() UNIQUEMENT après un événement keydown utilisateur
 * - Erreur = SILENCE (jamais une fausse note)
 * - Correction = reprise + micro-reverb (decay 0.3, wet 0.4)
 * - Lazy loading : uniquement le pack actif en mémoire
 *
 * Packs supportés : piano | synth-lofi | cinematic | jazz-piano
 * Lecture : une seule logique de pièce musicale (plus de mode pentatonique séparé)
 *
 * Spec : docs/specs/01-audio-engine.md
 */

import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import {
  advanceAndGet,
  getCurrentDuration,
  loadPiece,
  type MidiPieceId,
} from '@typewav/audio-engine';
import { useCallback, useRef } from 'react';
// Import de type uniquement — pas d'impact runtime (Tone.js reste lazy)
import type { Reverb as ToneReverb, Synth as ToneSynth } from 'tone';

// ─── Configurations par pack sonore ──────────────────────────────────────────

type OscType = 'triangle' | 'sine' | 'sawtooth' | 'square';

interface PackSynthConfig {
  oscillatorType: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  reverbWet: number;
  noteDuration: string;
}

const PACK_CONFIGS: Record<string, PackSynthConfig> = {
  piano: {
    oscillatorType: 'triangle',
    attack: 0.005,
    decay: 0.3,
    sustain: 0.4,
    release: 1.2,
    reverbWet: 0.25,
    noteDuration: '16n',
  },
  'synth-lofi': {
    oscillatorType: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.5,
    release: 0.8,
    reverbWet: 0.35,
    noteDuration: '16n',
  },
  // ─── Packs premium ─────────────────────────────────────────────────────────
  cinematic: {
    oscillatorType: 'sawtooth',
    attack: 0.08,
    decay: 0.5,
    sustain: 0.7,
    release: 2.0,
    reverbWet: 0.45,
    noteDuration: '8n',
  },
  'jazz-piano': {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.4,
    sustain: 0.3,
    release: 1.5,
    reverbWet: 0.28,
    noteDuration: '16n',
  },
};

const DEFAULT_PACK_CONFIG = PACK_CONFIGS['piano']!;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine() {
  const { initialized, soundPackId, setInitialized } = useAudioStore();
  const recordNoteEvent = useSessionStore((s) => s.recordNoteEvent);
  const sessionPosition = useSessionStore((s) => s.position);

  // Refs Tone.js — initialisées paresseusement après le premier keydown
  const synthRef = useRef<ToneSynth | null>(null);
  const reverbRef = useRef<ToneReverb | null>(null);
  const loadedPackRef = useRef<string>('');

  /**
   * Crée un nouveau synthétiseur Tone.js selon la config du pack actif.
   * L'ancien synth est disposé avant création du nouveau.
   */
  const buildSynth = useCallback(async (packId: string) => {
    const Tone = await import('tone');
    const config = PACK_CONFIGS[packId] ?? DEFAULT_PACK_CONFIG;

    // Disposer l'ancien synth proprement
    if (synthRef.current) {
      synthRef.current.dispose();
    }
    if (reverbRef.current) {
      reverbRef.current.dispose();
    }

    const reverb = new Tone.Reverb({
      decay: 0.3,
      wet: config.reverbWet,
    }).toDestination() as ToneReverb;

    const synth = new Tone.Synth({
      oscillator: { type: config.oscillatorType },
      envelope: {
        attack: config.attack,
        decay: config.decay,
        sustain: config.sustain,
        release: config.release,
      },
    }).connect(reverb) as ToneSynth;

    synthRef.current = synth;
    reverbRef.current = reverb;
    loadedPackRef.current = packId;
  }, []);

  /**
   * Initialise Tone.js.
   * DOIT être appelé uniquement après un événement keydown (contrainte navigateur).
   */
  const initialize = useCallback(async () => {
    if (initialized) return;

    const Tone = await import('tone');
    await Tone.start();

    await buildSynth(soundPackId);
    setInitialized(true);
  }, [initialized, soundPackId, buildSynth, setInitialized]);

  /**
   * Charge un pack sonore (lazy loading — recrée le synth si changement de pack).
   */
  const loadSoundPack = useCallback(
    async (packId: string) => {
      if (!initialized) return;
      if (loadedPackRef.current === packId) return;
      await buildSynth(packId);
    },
    [initialized, buildSynth],
  );

  /**
   * Joue la prochaine note de la pièce musicale active.
   */
  const playNote = useCallback(
    async (_char: string, _wordIndex: number) => {
      if (!initialized) {
        await initialize();
      }

      // Re-créer le synth si le pack a changé depuis la dernière frappe
      if (loadedPackRef.current !== soundPackId) {
        await buildSynth(soundPackId);
      }

      const Tone = await import('tone');
      const synth = synthRef.current;
      if (!synth) return;

      const nextNote = advanceAndGet();
      if (!nextNote || nextNote === 'rest') return;
      const noteToPlay = nextNote;
      const duration = getCurrentDuration();
      synth.triggerAttackRelease(noteToPlay, duration, Tone.now());

      // Enregistrer l'événement note pour le visualiseur waveform
      recordNoteEvent(noteToPlay, sessionPosition);
    },
    [
      initialized,
      initialize,
      soundPackId,
      buildSynth,
      recordNoteEvent,
      sessionPosition,
    ],
  );

  /**
   * Silence pour une frappe incorrecte — ne joue rien.
   * En mode MIDI : la séquence se fige (position non avancée, géré dans playNote).
   */
  const triggerSilence = useCallback(() => {
    // Intentionnellement vide — le silence est le comportement correct sur erreur
  }, []);

  /**
   * Reprend après correction avec micro-reverb.
   */
  const triggerResume = useCallback(async () => {
    if (!initialized) return;

    const Tone = await import('tone');
    const reverb = reverbRef.current;
    if (!reverb) return;

    // Active brièvement le reverb pour signaler la correction
    reverb.wet.rampTo(0.4, 0.05, Tone.now());
    reverb.wet.rampTo(0, 0.3, Tone.now() + 0.3);
  }, [initialized]);

  /**
   * Charge la pièce musicale sélectionnée.
   */
  const loadMidiPiece = useCallback(async (pieceId: MidiPieceId) => {
    loadPiece(pieceId);
    useAudioStore.getState().setActivePiece(pieceId);
  }, []);

  return {
    initialize,
    playNote,
    triggerSilence,
    triggerResume,
    loadSoundPack,
    loadMidiPiece,
  };
}
