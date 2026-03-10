import type { SoundPackConfig } from '@typewav/types'

/**
 * Pack Marimba — samples synthétiques originaux (domaine public).
 */
export const marimbaPack: SoundPackConfig = {
  id: 'marimba',
  name: 'Marimba',
  description: 'Marimba en bois — timbres clairs et percussifs.',
  isPremium: false,
  instrument: 'marimba',
  baseUrl: '/audio/marimba/',
  fileExtension: 'mp3',
  notes: {
    A2: 'A2', A3: 'A3', A4: 'A4', A5: 'A5',
    C3: 'C3', C4: 'C4', C5: 'C5',
    D3: 'D3', D4: 'D4', D5: 'D5',
    E3: 'E3', E4: 'E4', E5: 'E5',
    G3: 'G3', G4: 'G4', G5: 'G5',
  },
  reverbWet: 0.15,
  attackTime: 0.001,
  releaseTime: 0.6,
}
