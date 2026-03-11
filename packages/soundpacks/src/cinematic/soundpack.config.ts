import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Cinematic — cordes orchestrales + piano (Premium).
 * Sonorités épiques pour une expérience de typing immersive.
 */
export const cinematicPack: SoundPackConfig = {
  id: 'cinematic',
  name: 'Cinematic',
  displayName: 'Cinematic',
  description: 'Cordes orchestrales et piano — épique et immersif.',
  isPremium: true,
  instrument: 'strings',
  reverbWet: 0.45,
  attackTime: 0.08,
  releaseTime: 2.0,
};
