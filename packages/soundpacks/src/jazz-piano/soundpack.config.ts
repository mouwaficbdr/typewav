import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Jazz Piano — piano chaud + légère reverb de salle (Premium).
 * Enveloppe douce, sustain court, feeling jazz acoustique.
 */
export const jazzPianoPack: SoundPackConfig = {
  id: 'jazz-piano',
  name: 'Jazz Piano',
  displayName: 'Jazz',
  description: 'Piano acoustique chaud — comme taper dans un club de jazz.',
  isPremium: true,
  instrument: 'piano',
  reverbWet: 0.28,
  attackTime: 0.01,
  releaseTime: 1.5,
};
