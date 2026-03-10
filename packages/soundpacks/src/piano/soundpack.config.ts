import type { SoundPackConfig } from '@typewav/types'

/**
 * Pack Piano — samples publics Salamander Grand Piano (CC BY 3.0 — Alexis Baskind).
 * URL base : https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/
 */
export const pianoPack: SoundPackConfig = {
  id: 'piano',
  name: 'Grand Piano',
  description: 'Piano à queue acoustique — chaleureux et précis.',
  isPremium: false,
  instrument: 'piano',
  baseUrl: '/audio/piano/',
  fileExtension: 'mp3',
  notes: {
    A2: 'A2', A3: 'A3', A4: 'A4', A5: 'A5',
    C3: 'C3', C4: 'C4', C5: 'C5',
    D3: 'D3', D4: 'D4', D5: 'D5',
    E3: 'E3', E4: 'E4', E5: 'E5',
    G3: 'G3', G4: 'G4', G5: 'G5',
  },
  reverbWet: 0.25,
  attackTime: 0.005,
  releaseTime: 1.2,
}
