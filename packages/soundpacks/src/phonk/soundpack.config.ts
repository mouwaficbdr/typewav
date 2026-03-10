import type { SoundPackConfig } from '@typewav/types';

/**
 * Pack Phonk — synthétiseur dark + distorsion (Premium).
 * Inspiré de l'esthétique phonk : basses lourdes, attaque sèche.
 */
export const phonkPack: SoundPackConfig = {
  id: 'phonk',
  name: 'Phonk',
  description: 'Basses dark et synthé agressif — pour typers sans pitié.',
  isPremium: true,
  instrument: 'synth',
  baseUrl: '/audio/phonk/',
  fileExtension: 'mp3',
  notes: {
    A2: 'A2',
    A3: 'A3',
    A4: 'A4',
    C2: 'C2',
    C3: 'C3',
    C4: 'C4',
    D3: 'D3',
    D4: 'D4',
    G2: 'G2',
    G3: 'G3',
    G4: 'G4',
  },
  reverbWet: 0.08,
  attackTime: 0.001,
  releaseTime: 0.15,
};
