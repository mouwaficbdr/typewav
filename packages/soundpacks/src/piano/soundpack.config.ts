import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Piano : son par défaut, chaud et équilibré.
 */
export const pianoPack: SoundPackConfig = {
  id: 'piano',
  name: 'Grand Piano',
  displayName: 'Piano',
  description: 'Piano acoustique, le son par défaut, chaud et équilibré.',
  isPremium: false,
  instrument: 'piano',
  reverbWet: 0.25,
  attackTime: 0.005,
  releaseTime: 1.2,
};
