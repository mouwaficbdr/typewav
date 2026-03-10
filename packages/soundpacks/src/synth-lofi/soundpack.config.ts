import type { SoundPackConfig } from '@typewav/types'

/**
 * Pack Synth Lo-Fi — oscillateurs synthétiques originaux.
 */
export const synthLofiPack: SoundPackConfig = {
  id: 'synth-lofi',
  name: 'Synth Lo-Fi',
  description: 'Synthétiseur lo-fi — ambiance lo-fi hip-hop détendue.',
  isPremium: false,
  instrument: 'synth',
  baseUrl: '/audio/synth-lofi/',
  fileExtension: 'mp3',
  notes: {
    A2: 'A2', A3: 'A3', A4: 'A4', A5: 'A5',
    C3: 'C3', C4: 'C4', C5: 'C5',
    D3: 'D3', D4: 'D4', D5: 'D5',
    E3: 'E3', E4: 'E4', E5: 'E5',
    G3: 'G3', G4: 'G4', G5: 'G5',
  },
  reverbWet: 0.4,
  attackTime: 0.02,
  releaseTime: 0.8,
}
