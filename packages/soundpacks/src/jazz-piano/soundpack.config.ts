import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Jazz Piano — piano chaud + légère reverb de salle (Premium).
 * Enveloppe douce, sustain court, feeling jazz acoustique.
 */
export const jazzPianoPack: SoundPackConfig = {
  id: 'jazz-piano',
  name: 'Jazz Piano',
  description: 'Piano acoustique chaud — comme taper dans un club de jazz.',
  isPremium: true,
  instrument: 'piano',
  baseUrl: '/audio/jazz-piano/',
  fileExtension: 'mp3',
  notes: {
    A3: 'A3',
    A4: 'A4',
    A5: 'A5',
    C3: 'C3',
    C4: 'C4',
    C5: 'C5',
    D3: 'D3',
    D4: 'D4',
    D5: 'D5',
    E3: 'E3',
    E4: 'E4',
    E5: 'E5',
    G3: 'G3',
    G4: 'G4',
    G5: 'G5',
  },
  reverbWet: 0.28,
  attackTime: 0.01,
  releaseTime: 1.5,
};
