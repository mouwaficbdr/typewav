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
 * Le graphe Tone.js (sampler/reverb/synth) vit dans un singleton de module
 * (`engine`), pas dans des useRef par instance de hook : TypingArea,
 * HomeClient, ReplayClient, ChallengeClient et useAudioPreview appellent
 * tous useAudioEngine() indépendamment, alors que le flag `initialized`
 * (Zustand) est déjà global. Avec des refs par instance, la première à
 * s'initialiser rendait les autres silencieuses (leurs propres refs
 * restaient vides, sans jamais lever d'erreur). Voir
 * TypeWav-Etat-des-lieux.docx §1.
 *
 * Spec : docs/specs/01-audio-engine.md
 */

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

// Un seul point d'import dynamique pour 'tone', mémoïsé. Ce fichier appelle
// initialize/build/play/resume depuis 4 endroits distincts ; avec un
// `await import('tone')` séparé à chacun, le bundler dev (Turbopack) peut
// résoudre certains sites d'appel vers un chunk physiquement distinct du
// module — chacun avec sa propre instance de Tone.js et donc son propre
// AudioContext interne. Tone.start() appelé sur l'instance A ne réveille
// jamais le contexte de l'instance B : le graphe audio construit ensuite sur
// B reste indéfiniment suspendu, et toute promesse Tone.js interne qui
// attend ce contexte reste bloquée pour toujours (symptôme observé en
// session live : plus aucune frappe n'a d'effet après un certain délai).
let tonePromise: Promise<typeof import('tone')> | null = null;
function loadTone(): Promise<typeof import('tone')> {
  if (!tonePromise) {
    tonePromise = import('tone').then((Tone) => {
      // Tone.js programme par défaut chaque évènement 100ms dans le futur
      // (context.lookAhead) — pensé pour la lecture fluide de longues
      // séquences, pas pour un instrument qui doit répondre à la frappe. Une
      // seule voix joue à la fois ici, donc pas de risque de glitch à
      // réduire cette marge : on gagne un délai perceptible entre la touche
      // et la note sur chaque frappe, pas seulement la première.
      Tone.getContext().lookAhead = 0.01;
      return Tone;
    });
  }
  return tonePromise;
}

/**
 * Résout Tone.start() (context.resume()) avec retries internes. Le tout
 * premier appel d'une session reste parfois bloqué durablement sans jamais
 * ni aboutir ni rejeter — mais un appel neuf (pas la même promesse relancée)
 * réussit de façon fiable en une centaine de ms. On retente donc nous-mêmes
 * ici, bornés par un court timeout par tentative, plutôt que de dépendre
 * d'une future frappe de l'utilisateur pour déclencher ce nouvel essai.
 *
 * Timeouts mesurés en session live : le premier essai n'a JAMAIS abouti (5
 * sessions réelles, jusqu'à 8s laissés, 0 succès) — 100ms lui laisse le
 * strict minimum. Les essais qui réussissent le font en 30-130ms ; 250ms
 * leur laisse une marge large (x2-x8) sans traîner si l'un d'eux échoue
 * aussi. 4 essais, pas 3 : deux sessions ont mesuré 2 échecs avant le succès.
 */
const TONE_START_ATTEMPT_TIMEOUTS_MS = [100, 250, 250, 250];

async function startToneWithRetry(
  Tone: typeof import('tone'),
): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < TONE_START_ATTEMPT_TIMEOUTS_MS.length; i++) {
    const timeoutMs = TONE_START_ATTEMPT_TIMEOUTS_MS[i]!;
    try {
      await Promise.race([
        Tone.start(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Tone.start() timed out after ${timeoutMs}ms (attempt ${i + 1}/${TONE_START_ATTEMPT_TIMEOUTS_MS.length})`,
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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

// ─── Moteur partagé (singleton de module) ────────────────────────────────────

class VoiceEngine {
  fallbackSynth: ToneSynth | null = null;
  sampler: ToneSampler | null = null;
  reverb: ToneReverb | null = null;
  loadedPack = '';
  /** Dernière note réellement jouée — rejouée en écho doux sur erreur, jamais une nouvelle note. */
  lastPlayedNote: string | null = null;
  midiLoadRequestId = 0;
  midiLoadAbortController: AbortController | null = null;

  private mountedCount = 0;
  private initializingPromise: Promise<void> | null = null;
  private buildingPromise: Promise<void> | null = null;

  mount(): void {
    this.mountedCount += 1;
  }

  /** Ne dispose le moteur que quand la dernière instance montée se démonte. */
  unmount(): void {
    this.mountedCount = Math.max(0, this.mountedCount - 1);
    if (this.mountedCount === 0) {
      this.midiLoadAbortController?.abort();
      warpEngine.reset();
      this.disposeVoices();
      this.loadedPack = '';
      this.lastPlayedNote = null;
      // Sans ce reset, une instance qui remonte ensuite verrait
      // `initialized` toujours vrai côté Zustand et ne reconstruirait
      // jamais un graphe pourtant disposé — silence total.
      useAudioStore.getState().setInitialized(false);
    }
  }

  disposeVoices(): void {
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.dispose();
      this.fallbackSynth = null;
    }
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
  }

  applyVolume(nextVolume: number): void {
    const targetDb = toDecibels(nextVolume);
    this.fallbackSynth?.volume.rampTo(targetDb, 0.03);
    this.sampler?.volume.rampTo(targetDb, 0.03);
  }

  /**
   * Construit le graphe audio du pack actif. Sérialisé : un appel pendant
   * qu'une construction est déjà en cours attend celle-ci au lieu de créer
   * un second graphe qui dispose le premier en plein vol.
   */
  async buildVoices(packId: string): Promise<void> {
    // Le pack demandé est déjà actif et aucune construction n'est en cours
    // (buildVoicesInner résout dès le synth de repli prêt, avant même que le
    // sampler ait fini de charger en tâche de fond) : rien à refaire. Sans ce
    // court-circuit, deux appels espacés dans le temps (préchargement au
    // montage de plusieurs composants, puis un initialize() explicite)
    // reconstruisent inutilement tout le graphe pour le même pack.
    if (!this.buildingPromise && this.loadedPack === packId) return;

    if (this.buildingPromise) {
      await this.buildingPromise.catch(() => {
        // L'échec de la construction en cours ne doit pas faire échouer
        // celle-ci — on retente juste normalement ci-dessous.
      });
      if (this.loadedPack === packId) return;
    }

    const promise = this.buildVoicesInner(packId);
    this.buildingPromise = promise;
    try {
      await promise;
    } finally {
      if (this.buildingPromise === promise) this.buildingPromise = null;
    }
  }

  private async buildVoicesInner(packId: string): Promise<void> {
    const Tone = await loadTone();
    const config = PACK_CONFIGS[packId] ?? DEFAULT_PACK_CONFIG;
    const audioStore = useAudioStore.getState();

    this.disposeVoices();

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

    this.fallbackSynth = fallbackSynth;
    this.sampler = null;
    this.reverb = reverb;
    this.loadedPack = packId;

    if (packId !== 'piano') return;

    // Chargement du sampler piano (30 échantillons à décoder, plusieurs
    // secondes) en tâche de fond, sans bloquer buildVoices()/initialize() :
    // le fallbackSynth ci-dessus est déjà prêt à jouer immédiatement.
    // playParsedNote() bascule sur le sampler dès qu'il s'installe sur
    // this.sampler — sinon chaque première frappe d'une session attend le
    // décodage complet avant de jouer le moindre son.
    void createPianoSampler(Tone, reverb)
      .then((sampler) => {
        if (this.loadedPack !== packId) {
          sampler.dispose();
          return;
        }

        sampler.volume.value = currentVolumeDb;
        this.sampler = sampler;
        audioStore.setSamplerLoaded(true);
      })
      .catch((error: unknown) => {
        if (this.loadedPack !== packId) return;
        audioStore.setSamplerLoadError(
          getErrorMessage(error, 'Piano sampler unavailable.'),
        );
        // Fallback synth déjà prêt.
        audioStore.setSamplerLoaded(true);
      });
  }

  /**
   * Initialise Tone.js. Sérialisé comme buildVoices : deux instances (ou
   * deux frappes rapides sur la même instance) qui appellent initialize()
   * avant la résolution du premier appel n'exécutent la séquence qu'une fois.
   */
  async initialize(soundPackId: string): Promise<void> {
    if (useAudioStore.getState().initialized) return;
    if (this.initializingPromise) {
      await this.initializingPromise;
      return;
    }

    // .catch() attaché ICI, avant d'assigner à this.initializingPromise :
    // ce champ est lu par DEUX chemins distincts (le try/finally juste en
    // dessous, et le "if (this.initializingPromise)" ci-dessus pour un
    // appelant concurrent arrivé pendant que celui-ci tourne — TypingArea
    // ET playNote() appellent tous deux initialize()/engine.initialize()).
    // Un rejet (ex. timeout Tone.start()) rejette la même promesse pour
    // TOUS ses awaiters ; ne l'attraper que dans le try/catch local
    // laissait le second chemin planter en rejection non gérée.
    const promise = this.initializeInner(soundPackId).catch(() => {
      // Échec : `initialized` reste false, ce qui reflète l'état réel. Ne
      // jamais propager — les appelants (playNote, le hook) dégradent déjà
      // proprement vers le silence quand l'audio n'est pas prêt.
    });
    this.initializingPromise = promise;
    try {
      await promise;
    } finally {
      // Toujours exécuté : une frappe suivante doit pouvoir retenter une
      // initialisation propre plutôt que d'attendre indéfiniment une
      // tentative qui ne se terminera jamais.
      this.initializingPromise = null;
    }
  }

  private async initializeInner(soundPackId: string): Promise<void> {
    const Tone = await loadTone();

    // Le tout premier Tone.start()/context.resume() d'une session reste
    // bloqué durablement (observé plusieurs fois en session live) mais
    // n'aboutit JAMAIS de lui-même — seul un appel neuf (pas la même
    // promesse qui finirait par se résoudre) réussit, en 32-130ms de façon
    // fiable. Laisser ce sursaut dépendre de la frappe suivante de
    // l'utilisateur fonctionne mais dépend du rythme de frappe (~1s observé
    // dans le pire cas) : on retente nous-mêmes, dans le même appel, pour ne
    // plus dépendre de ça.
    await startToneWithRetry(Tone);

    await this.buildVoices(soundPackId);

    const currentPiece = getCurrentPiece();
    if (currentPiece) {
      warpEngine.reset(currentPiece.bpmReference);
    }

    useAudioStore.getState().setInitialized(true);
  }
}

const engine = new VoiceEngine();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine() {
  // `soundPackId` seul, volontairement : s'abonner aussi à `initialized`
  // ici forcerait un re-render de CHAQUE composant utilisant ce hook
  // (TypingArea, HomeClient, ReplayClient, ChallengeClient, useAudioPreview,
  // simultanément montés) au moment précis où l'utilisateur tape sa première
  // touche — juste avant que la première note ne joue. loadSoundPack lit
  // `initialized` via getState() ci-dessous, une lecture tout aussi fraîche
  // sans l'abonnement réactif.
  const { soundPackId } = useAudioStore();
  const recordNoteEvent = useSessionStore((s) => s.recordNoteEvent);
  const sessionPosition = useSessionStore((s) => s.position);

  useEffect(() => {
    engine.mount();
    // Précharge le sampler piano dès le montage, sans attendre un geste
    // utilisateur : décoder des échantillons (fetch + décodage audio) ne
    // nécessite pas un AudioContext démarré, seule la lecture en a besoin
    // (Tone.start(), gesture-gated dans initialize() ci-dessous). Le temps
    // que l'utilisateur tape sa première touche, le vrai piano est déjà prêt
    // dans l'immense majorité des cas — plus besoin d'un synth de repli
    // audible en attendant.
    engine.buildVoices(useAudioStore.getState().soundPackId).catch(() => {
      // Échec silencieux : initialize() (gesture-gated) retentera au besoin
      // au premier vrai keydown, avec sa propre gestion d'erreur.
    });
    return () => {
      engine.unmount();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe((state, previousState) => {
      if (state.volume === previousState.volume) return;
      engine.applyVolume(state.volume);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Initialise Tone.js.
   * DOIT être appelé uniquement après un événement keydown (contrainte navigateur).
   */
  const initialize = useCallback(async () => {
    await engine.initialize(soundPackId);
  }, [soundPackId]);

  /**
   * Charge un pack sonore (lazy loading — recrée le synth si changement de pack).
   */
  const loadSoundPack = useCallback(async (packId: string) => {
    if (!useAudioStore.getState().initialized) return;
    if (engine.loadedPack === packId) return;
    await engine.buildVoices(packId);
  }, []);

  const playParsedNote = useCallback(
    async (
      parsedNote: ParsedNote,
      char: string,
      wordIndex: number,
    ): Promise<string | null> => {
      const Tone = await loadTone();

      const referenceBpm = getCurrentPiece()?.bpmReference ?? 120;
      const duration = warpEngine.getNoteDuration(parsedNote, referenceBpm);
      const sourceNote = Tone.Frequency(parsedNote.pitch, 'midi').toNote();
      const noteToPlay = applyTypingExpression(sourceNote, char, wordIndex);
      const velocity = normalizeVelocity(parsedNote.velocity);
      const playTime = Tone.now();

      if (engine.sampler) {
        engine.sampler.triggerAttackRelease(
          noteToPlay,
          duration,
          playTime,
          velocity,
        );
      } else if (engine.fallbackSynth && engine.loadedPack !== 'piano') {
        // Le synth de repli EST le son voulu pour les packs non échantillonnés
        // (synth-lofi, cinematic, jazz-piano) — mais jamais un remplacement
        // audible du piano réel : comme la règle "jamais une fausse note",
        // on préfère le silence à un autre instrument le temps que le
        // sampler (préchargé au montage) finisse de charger.
        engine.fallbackSynth.triggerAttackRelease(
          noteToPlay,
          duration,
          playTime,
          velocity,
        );
      } else {
        return null;
      }

      engine.lastPlayedNote = noteToPlay;
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
      // Pas de ré-initialisation ici : les deux seuls appelants (TypingArea,
      // useAudioPreview) appellent déjà initialize() avant playNote(). La
      // retenter ici en double était le vrai bug derrière la latence sur les
      // premières frappes d'une session — observé en session live : quand
      // Tone.start() est lent (ou expire, cf. le timeout ci-dessus),
      // handleKeyDown() attend déjà jusqu'à 3s pour rien, puis CE bloc
      // relançait un second essai identique (donc un second échec probable)
      // avant que playParsedNote() ne dégrade proprement vers le silence —
      // jusqu'à 6-8s d'attente pour une seule touche. Si `initialized` est
      // encore faux ici, playParsedNote() gère déjà le cas gracieusement
      // (silence, jamais un synth de repli à la place du piano réel).

      // Re-créer le synth si le pack a changé depuis la dernière frappe
      if (engine.loadedPack !== soundPackId) {
        await engine.buildVoices(soundPackId);
      }

      const nextNote = advanceAndGetNote();
      if (!nextNote) return null;

      warpEngine.onKeystroke();

      return await playParsedNote(nextNote, char, wordIndex);
    },
    [soundPackId, playParsedNote],
  );

  /**
   * Silence pour une frappe incorrecte — n'avance jamais la séquence et ne
   * joue jamais de note nouvelle (règle absolue : jamais une fausse note).
   *
   * Une coupure sèche et répétée se vit comme une sanction plutôt qu'une
   * pause. Un simple remix de reverb ne suffit pas à l'adoucir : `wet` ne
   * fait que rééquilibrer un signal déjà en train de sonner, et ce signal
   * est presque toujours déjà quasi éteint au moment de l'erreur — rien à
   * remixer, donc rien d'audible. On relance à la place, à très faible
   * vélocité, un écho de la DERNIÈRE note déjà jouée (même hauteur, jamais
   * une nouvelle) : ça produit un vrai son qui s'éteint en fondu, sans
   * introduire le moindre contenu mélodique nouveau ni avancer la pièce.
   */
  const triggerSilence = useCallback(async () => {
    if (!useAudioStore.getState().initialized) return;

    const lastNote = engine.lastPlayedNote;
    if (!lastNote) return;

    const Tone = await loadTone();
    const playTime = Tone.now();
    const echoVelocity = 0.18;
    const echoHoldSec = 1.6;

    if (engine.sampler) {
      engine.sampler.triggerAttackRelease(
        lastNote,
        echoHoldSec,
        playTime,
        echoVelocity,
      );
    } else if (engine.fallbackSynth && engine.loadedPack !== 'piano') {
      engine.fallbackSynth.triggerAttackRelease(
        lastNote,
        echoHoldSec,
        playTime,
        echoVelocity,
      );
    }
  }, []);

  /**
   * Reprend après correction avec micro-reverb.
   * Le wet revient au niveau normal du pack, jamais à 0 — sinon la
   * réverbération reste coupée pour le reste de la séance.
   */
  const triggerResume = useCallback(async () => {
    if (!useAudioStore.getState().initialized) return;

    const Tone = await loadTone();
    const reverb = engine.reverb;
    if (!reverb) return;

    const baselineWet = (PACK_CONFIGS[soundPackId] ?? DEFAULT_PACK_CONFIG)
      .reverbWet;

    // Active brièvement le reverb pour signaler la correction, puis
    // revient au niveau normal du pack.
    reverb.wet.rampTo(0.4, 0.05, Tone.now());
    reverb.wet.rampTo(baselineWet, 0.3, Tone.now() + 0.3);
  }, [soundPackId]);

  /**
   * Charge la pièce musicale sélectionnée.
   */
  const loadMidiPiece = useCallback(
    async (pieceId: MidiPieceId) => {
      const requestId = engine.midiLoadRequestId + 1;
      engine.midiLoadRequestId = requestId;

      engine.midiLoadAbortController?.abort();
      const controller = new AbortController();
      engine.midiLoadAbortController = controller;

      const audioStore = useAudioStore.getState();
      audioStore.setLoading(true);
      audioStore.setMidiLoadError(null);

      try {
        const parsedPiece = await loadMidiPieceWithAssets(pieceId, {
          signal: controller.signal,
        });

        // Last-write-wins : ignorer les réponses obsolètes.
        if (
          requestId !== engine.midiLoadRequestId ||
          controller.signal.aborted
        ) {
          return;
        }

        audioStore.setActivePiece(pieceId);
        audioStore.setMidiLoadError(null);
        warpEngine.reset(parsedPiece.bpmReference);
      } catch (error) {
        if (requestId !== engine.midiLoadRequestId) {
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
        warpEngine.reset();
        audioStore.setActivePiece(null);
        audioStore.setMidiLoadError(message);
      } finally {
        if (requestId === engine.midiLoadRequestId) {
          audioStore.setLoading(false);
        }
      }
    },
    [],
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
