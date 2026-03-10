export { pianoPack } from './piano/soundpack.config'
export { marimbaPack } from './marimba/soundpack.config'
export { synthLofiPack } from './synth-lofi/soundpack.config'
export { chiptunePack } from './chiptune/soundpack.config'

export const ALL_SOUND_PACKS = ['piano', 'marimba', 'synth-lofi', 'chiptune'] as const
export type SoundPackId = (typeof ALL_SOUND_PACKS)[number]
