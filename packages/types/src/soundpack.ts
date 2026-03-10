export type InstrumentType =
  | 'piano'
  | 'marimba'
  | 'synth'
  | 'chiptune'
  | 'cinematic'
  | 'phonk'
  | 'jazz-piano';

export interface SoundPackConfig {
  id: string;
  name: string;
  instrument: InstrumentType;
  description: string;
  isPremium: boolean;
  /** URL de base pour les fichiers audio (dans /public/audio/<id>/) */
  baseUrl: string;
  fileExtension: 'mp3' | 'ogg' | 'wav';
  /** Mapping note → nom de fichier (sans extension) */
  notes: Record<string, string>;
  /** Niveau de reverb dry/wet (0–1) */
  reverbWet: number;
  /** Temps d'attaque en secondes */
  attackTime: number;
  /** Temps de release en secondes */
  releaseTime: number;
}
