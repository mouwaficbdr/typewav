/**
 * Interface publique du moteur audio TypeWav.
 * Spec : docs/specs/01-audio-engine.md — Interface publique engine.ts
 *
 * L'implémentation concrète (utilisant Tone.js) est dans apps/web/hooks/useAudioEngine.ts
 * pour rester côté Client Component uniquement.
 */

import type { ChordProgressionTheme } from './chord-progressions';

export interface AudioEngine {
  /**
   * Initialise Tone.js.
   * DOIT être appelé uniquement après un événement keydown utilisateur.
   * Contrainte navigateur non contournable (Web Audio API).
   */
  initialize(): Promise<void>;

  /**
   * Joue la note correspondant au caractère frappé.
   * La note est choisie dans la gamme pentatonique selon l'accord courant.
   *
   * @param char - Le caractère tapé (lettre)
   * @param wordIndex - Index du mot courant (détermine l'accord)
   */
  playNote(char: string, wordIndex: number): void;

  /**
   * Silence total pour une frappe incorrecte.
   * Ne joue jamais une fausse note — spec stricte.
   */
  triggerSilence(): void;

  /**
   * Reprend la musique après une correction, avec micro-reverb.
   * Tone.Reverb({ decay: 0.3, wet: 0.4 })
   */
  triggerResume(): void;

  /**
   * Charge un pack sonore (lazy loading — uniquement le pack actif en mémoire).
   */
  loadSoundPack(packId: string): Promise<void>;

  /**
   * Change le thème musical (change la progression d'accords).
   */
  setTheme(themeId: ChordProgressionTheme): void;

  /**
   * Avance d'un cran dans la séquence MIDI (mode Classiques).
   */
  advanceMidiSequence(): void;

  /**
   * Charge un fichier MIDI (mode Classiques — domaine public uniquement).
   */
  loadMidiPiece(pieceId: string): Promise<void>;
}
