/**
 * Type d'instrument Tone.js utilisé pour la synthèse audio.
 * Représente le caractère sonore du pack, pas l'ID du pack.
 * Piano uniquement (décision produit définitive, Phase 4) : plus d'autres
 * sound packs à venir, voir la mémoire projet.
 */
export type InstrumentType = 'piano'; // oscillateur triangle, son arrondi

/**
 * Configuration d'un sound pack.
 * Contient uniquement les paramètres consommés par useAudioEngine.
 * Les propriétés baseUrl/fileExtension/notes (futures samples .mp3) ont
 * été retirées — jamais branchées dans le moteur actuel (Tone.js synthèse pure).
 */
export interface SoundPackConfig {
  id: string;
  name: string;
  /** Nom affiché sous l'icône ♪ dans la config bar */
  displayName: string;
  description: string;
  isPremium: boolean;
  instrument: InstrumentType;
  /** Niveau de reverb dry/wet (0–1) */
  reverbWet: number;
  /** Temps d'attaque en secondes */
  attackTime: number;
  /** Temps de release en secondes */
  releaseTime: number;
}
