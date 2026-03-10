import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Cinematic — cordes orchestrales + piano (Premium).
 * Sonorités épiques pour une expérience de typing immersive.
 * Utilise un synthétiseur Tone.js configuré comme des cordes + piano.
 */
export const cinematicPack: SoundPackConfig = {
  id: 'cinematic',
  name: 'Cinematic',
  description: 'Cordes orchestrales et piano — épique et immersif.',
  isPremium: true,
  instrument: 'strings',
  baseUrl: '/audio/cinematic/',
  fileExtension: 'mp3',
  notes: {
    A2: 'A2',
    A3: 'A3',
    A4: 'A4',
    A5: 'A5',
    C3: 'C3',
    C4: 'C4',
    C5: 'C5',
    E3: 'E3',
    E4: 'E4',
    E5: 'E5',
    G3: 'G3',
    G4: 'G4',
    G5: 'G5',
  },
  reverbWet: 0.45,
  attackTime: 0.08,
  releaseTime: 2.0,
};
