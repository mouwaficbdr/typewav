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

import { harmonicDrone } from '@/lib/harmonic-drone';
import {
  MidiAssetLoadError,
  loadMidiPieceWithAssets,
} from '@/lib/midi-asset-loader';
import { applyTypingExpression } from '@/lib/note-expression';
import { warpEngine } from '@/lib/warp-engine';
import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import {
  advanceAndGetNote,
  clearLoadedPiece,
  getCurrentPiece,
  type MidiPieceId,
  type ParsedNote,
  type ParsedPiece,
} from '@typewav/audio-engine';
import { useCallback, useEffect, useRef } from 'react';
// Import de type uniquement — pas d'impact runtime (Tone.js reste lazy)
import type {
  Reverb as ToneReverb,
  Sampler as ToneSampler,
  Synth as ToneSynth,
} from 'tone';

// ─── Configurations par pack sonore ──────────────────────────────────────────

type OscType = 'triangle' | 'sine' | 'sawtooth' | 'square';

interface PackSynthConfig {
  oscillatorType: OscType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  reverbWet: number;
}

const PACK_CONFIGS: Record<string, PackSynthConfig> = {
  piano: {
    oscillatorType: 'triangle',
    attack: 0.005,
    decay: 0.3,
    sustain: 0.4,
    release: 1.2,
    reverbWet: 0.25,
  },
  'synth-lofi': {
    oscillatorType: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.5,
    release: 0.8,
    reverbWet: 0.35,
  },
  // ─── Packs premium ─────────────────────────────────────────────────────────
  cinematic: {
    oscillatorType: 'sawtooth',
    attack: 0.08,
    decay: 0.5,
    sustain: 0.7,
    release: 2.0,
    reverbWet: 0.45,
  },
  'jazz-piano': {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.4,
    sustain: 0.3,
    release: 1.5,
    reverbWet: 0.28,
  },
};

const DEFAULT_PACK_CONFIG = PACK_CONFIGS['piano']!;

const SALAMANDER_BASE_URL = 'https://tonejs.github.io/audio/salamander/';

const SALAMANDER_URLS: Record<string, string> = {
  A0: 'A0.mp3',
  C1: 'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  A1: 'A1.mp3',
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
  C6: 'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  A6: 'A6.mp3',
  C7: 'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  A7: 'A7.mp3',
  C8: 'C8.mp3',
};

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toDecibels(volume: number): number {
  const safeGain = Math.max(0.0001, clampVolume(volume));
  return 20 * Math.log10(safeGain);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function normalizeVelocity(rawVelocity: number): number {
  if (!Number.isFinite(rawVelocity)) return 0.75;
  return Math.max(0.2, Math.min(1, rawVelocity / 127));
}

function getPieceTonicPitch(piece: ParsedPiece | null): number | null {
  if (!piece || piece.notes.length === 0) return null;
  return piece.notes[0]?.pitch ?? null;
}

async function createPianoSampler(
  Tone: typeof import('tone'),
  reverb: ToneReverb,
): Promise<ToneSampler> {
  return await new Promise<ToneSampler>((resolve, reject) => {
    const sampler = new Tone.Sampler({
      baseUrl: SALAMANDER_BASE_URL,
      urls: SALAMANDER_URLS,
      release: 1.8,
      onload: () => resolve(sampler as ToneSampler),
      onerror: (error) => reject(error),
    }).connect(reverb) as ToneSampler;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine() {
  const { initialized, soundPackId, setInitialized } = useAudioStore();
  const recordNoteEvent = useSessionStore((s) => s.recordNoteEvent);
  const sessionPosition = useSessionStore((s) => s.position);

  // Refs Tone.js — initialisées paresseusement après le premier keydown.
  const fallbackSynthRef = useRef<ToneSynth | null>(null);
  const samplerRef = useRef<ToneSampler | null>(null);
  const reverbRef = useRef<ToneReverb | null>(null);
  const loadedPackRef = useRef<string>('');
  const pendingDronePitchRef = useRef<number | null>(null);
  const midiLoadRequestIdRef = useRef(0);
  const midiLoadAbortControllerRef = useRef<AbortController | null>(null);

  const disposeVoices = useCallback(() => {
    if (samplerRef.current) {
      samplerRef.current.dispose();
      samplerRef.current = null;
    }

    if (fallbackSynthRef.current) {
      fallbackSynthRef.current.dispose();
      fallbackSynthRef.current = null;
    }

    if (reverbRef.current) {
      reverbRef.current.dispose();
      reverbRef.current = null;
    }
  }, []);

  const applyVolumeToVoices = useCallback((nextVolume: number) => {
    const targetDb = toDecibels(nextVolume);

    if (fallbackSynthRef.current) {
      fallbackSynthRef.current.volume.rampTo(targetDb, 0.03);
    }

    if (samplerRef.current) {
      samplerRef.current.volume.rampTo(targetDb, 0.03);
    }
  }, []);

  useEffect(() => {
    return () => {
      midiLoadAbortControllerRef.current?.abort();
      warpEngine.reset();
      pendingDronePitchRef.current = null;
      void harmonicDrone.stop();
      disposeVoices();
    };
  }, [disposeVoices]);

  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe((state, previousState) => {
      if (state.volume === previousState.volume) return;
      applyVolumeToVoices(state.volume);
    });

    return () => {
      unsubscribe();
    };
  }, [applyVolumeToVoices]);

  /**
   * Construit le graphe audio du pack actif:
   * - fallback synth (immédiatement disponible)
   * - sampler piano asynchrone (si pack piano)
   */
  const buildVoices = useCallback(
    async (packId: string) => {
      const Tone = await import('tone');
      const config = PACK_CONFIGS[packId] ?? DEFAULT_PACK_CONFIG;
      const audioStore = useAudioStore.getState();

      disposeVoices();

      audioStore.setSamplerLoadError(null);
      audioStore.setSamplerLoaded(packId !== 'piano');

      const reverb = new Tone.Reverb({
        decay: 0.3,
        wet: config.reverbWet,
      }).toDestination() as ToneReverb;

      const fallbackSynth = new Tone.Synth({
        oscillator: { type: config.oscillatorType },
        envelope: {
          attack: config.attack,
          decay: config.decay,
          sustain: config.sustain,
          release: config.release,
        },
      }).connect(reverb) as ToneSynth;

      const currentVolumeDb = toDecibels(audioStore.volume);
      fallbackSynth.volume.value = currentVolumeDb;

      fallbackSynthRef.current = fallbackSynth;
      samplerRef.current = null;
      reverbRef.current = reverb;
      loadedPackRef.current = packId;

      if (packId !== 'piano') return;

      try {
        const sampler = await createPianoSampler(Tone, reverb);

        if (loadedPackRef.current !== packId) {
          sampler.dispose();
          return;
        }

        sampler.volume.value = currentVolumeDb;
        samplerRef.current = sampler;
        audioStore.setSamplerLoaded(true);
      } catch (error) {
        if (loadedPackRef.current !== packId) return;
        audioStore.setSamplerLoadError(
          getErrorMessage(error, 'Piano sampler unavailable.'),
        );
        // Fallback synth déjà prêt.
        audioStore.setSamplerLoaded(true);
      }
    },
    [disposeVoices],
  );

  /**
   * Initialise Tone.js.
   * DOIT être appelé uniquement après un événement keydown (contrainte navigateur).
   */
  const initialize = useCallback(async () => {
    if (initialized) return;

    const Tone = await import('tone');
    await Tone.start();

    await buildVoices(soundPackId);

    const currentPiece = getCurrentPiece();
    if (currentPiece) {
      warpEngine.reset(currentPiece.bpmReference);
    }

    const pendingPitch = pendingDronePitchRef.current;
    if (pendingPitch !== null) {
      await harmonicDrone.start(pendingPitch);
    }

    setInitialized(true);
  }, [initialized, soundPackId, buildVoices, setInitialized]);

  /**
   * Charge un pack sonore (lazy loading — recrée le synth si changement de pack).
   */
  const loadSoundPack = useCallback(
    async (packId: string) => {
      if (!initialized) return;
      if (loadedPackRef.current === packId) return;
      await buildVoices(packId);
    },
    [initialized, buildVoices],
  );

  const playParsedNote = useCallback(
    async (
      parsedNote: ParsedNote,
      char: string,
      wordIndex: number,
    ): Promise<string | null> => {
      const Tone = await import('tone');

      const referenceBpm = getCurrentPiece()?.bpmReference ?? 120;
      const duration = warpEngine.getNoteDuration(parsedNote, referenceBpm);
      const sourceNote = Tone.Frequency(parsedNote.pitch, 'midi').toNote();
      const noteToPlay = applyTypingExpression(sourceNote, char, wordIndex);
      const velocity = normalizeVelocity(parsedNote.velocity);
      const playTime = Tone.now();

      if (samplerRef.current) {
        samplerRef.current.triggerAttackRelease(
          noteToPlay,
          duration,
          playTime,
          velocity,
        );
      } else if (fallbackSynthRef.current) {
        fallbackSynthRef.current.triggerAttackRelease(
          noteToPlay,
          duration,
          playTime,
          velocity,
        );
      } else {
        return null;
      }

      recordNoteEvent(noteToPlay, sessionPosition);
      return noteToPlay;
    },
    [recordNoteEvent, sessionPosition],
  );

  /**
   * Joue la prochaine note de la pièce musicale active.
   */
  const playNote = useCallback(
    async (char: string, wordIndex: number): Promise<string | null> => {
      if (!initialized) {
        await initialize();
      }

      // Re-créer le synth si le pack a changé depuis la dernière frappe
      if (loadedPackRef.current !== soundPackId) {
        await buildVoices(soundPackId);
      }

      const nextNote = advanceAndGetNote();
      if (!nextNote) return null;

      warpEngine.onKeystroke();

      return await playParsedNote(nextNote, char, wordIndex);
    },
    [initialized, initialize, soundPackId, buildVoices, playParsedNote],
  );

  const refreshDroneForCurrentPiece = useCallback(async () => {
    const tonicPitch = getPieceTonicPitch(getCurrentPiece());
    pendingDronePitchRef.current = tonicPitch;

    if (tonicPitch === null) {
      await harmonicDrone.stop();
      return;
    }

    if (!useAudioStore.getState().initialized) {
      return;
    }

    await harmonicDrone.start(tonicPitch);
  }, []);

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
  const loadMidiPiece = useCallback(
    async (pieceId: MidiPieceId) => {
      const requestId = midiLoadRequestIdRef.current + 1;
      midiLoadRequestIdRef.current = requestId;

      midiLoadAbortControllerRef.current?.abort();
      const controller = new AbortController();
      midiLoadAbortControllerRef.current = controller;

      const audioStore = useAudioStore.getState();
      audioStore.setLoading(true);
      audioStore.setMidiLoadError(null);

      try {
        const parsedPiece = await loadMidiPieceWithAssets(pieceId, {
          signal: controller.signal,
        });

        // Last-write-wins : ignorer les réponses obsolètes.
        if (
          requestId !== midiLoadRequestIdRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        audioStore.setActivePiece(pieceId);
        audioStore.setMidiLoadError(null);
        warpEngine.reset(parsedPiece.bpmReference);
        await refreshDroneForCurrentPiece();
      } catch (error) {
        if (requestId !== midiLoadRequestIdRef.current) {
          return;
        }

        const isAborted =
          controller.signal.aborted ||
          (error instanceof MidiAssetLoadError &&
            error.code === 'MIDI_ASSET_ABORTED');

        if (isAborted) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown MIDI loading error.';
        clearLoadedPiece();
        pendingDronePitchRef.current = null;
        warpEngine.reset();
        await harmonicDrone.stop();
        audioStore.setActivePiece(null);
        audioStore.setMidiLoadError(message);
      } finally {
        if (requestId === midiLoadRequestIdRef.current) {
          audioStore.setLoading(false);
        }
      }
    },
    [refreshDroneForCurrentPiece],
  );

  return {
    initialize,
    playNote,
    triggerSilence,
    triggerResume,
    loadSoundPack,
    loadMidiPiece,
  };
}
