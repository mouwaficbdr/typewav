import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Synth Lo-Fi — oscillateurs synthétiques, ambiance lo-fi.
 */
export const synthLofiPack: SoundPackConfig = {
  id: 'synth-lofi',
  name: 'Synth Lo-Fi',
  displayName: 'Synth',
  description: 'Synthétiseur lo-fi — ambiance lo-fi hip-hop détendue.',
  isPremium: false,
  instrument: 'synth',
  reverbWet: 0.35,
  attackTime: 0.05,
  releaseTime: 0.8,
};
