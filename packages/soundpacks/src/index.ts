export { cinematicPack } from './cinematic/soundpack.config';
export { jazzPianoPack } from './jazz-piano/soundpack.config';
export { pianoPack } from './piano/soundpack.config';
export { synthLofiPack } from './synth-lofi/soundpack.config';

export const ALL_SOUND_PACKS = ['piano', 'synth-lofi'] as const;
export const PREMIUM_SOUND_PACKS = ['cinematic', 'jazz-piano'] as const;
export type SoundPackId = (typeof ALL_SOUND_PACKS)[number];
export type PremiumSoundPackId = (typeof PREMIUM_SOUND_PACKS)[number];
export type AnyPackId = SoundPackId | PremiumSoundPackId;
