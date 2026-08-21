/**
 * library.ts — Bibliotheque musicale unifiee (24 pieces importees).
 *
 * Ce sous-ensemble correspond strictement aux assets MIDI embarques
 * dans apps/web/public/midi.
 */

export type EmotionalRegister =
  | 'energique'
  | 'contemplatif'
  | 'dramatique'
  | 'romantique'
  | 'folk';

export interface MusicPiece {
  /** Identifiant unique kebab-case */
  id: string;
  title: string;
  shortTitle: string;
  composer: string;
  register: EmotionalRegister;
  notes: Array<string | 'rest'>;
  durations?: Array<string>;
  evolutiveTempo?: boolean;
  extremeLevel?: boolean;
  catalogNumber: number;
}

import {
  durations as furEliseDurations,
  notes as furEliseNotes,
} from './pieces/fur-elise';
import {
  durations as gymnopedie1Durations,
  notes as gymnopedie1Notes,
} from './pieces/gymnopedie1';
import {
  durations as odeToJoyDurations,
  notes as odeToJoyNotes,
} from './pieces/ode-to-joy';
import {
  durations as rondoAllaTurcaDurations,
  notes as rondoAllaTurcaNotes,
} from './pieces/rondo-alla-turca';
import {
  durations as canonInDDurations,
  notes as canonInDNotes,
} from './pieces/canon-in-d';
import {
  durations as toccataFugueDurations,
  notes as toccataFugueNotes,
} from './pieces/toccata-fugue';
import {
  durations as mountainKingDurations,
  notes as mountainKingNotes,
} from './pieces/mountain-king';
import {
  durations as symphony5ThemeDurations,
  notes as symphony5ThemeNotes,
} from './pieces/symphony-5-theme';
import {
  durations as aveMariaDurations,
  notes as aveMariaNotes,
} from './pieces/ave-maria';
import {
  durations as avid86Durations,
  notes as avid86Notes,
} from './pieces/avid-86';
import {
  durations as eziosFamilyDurations,
  notes as eziosFamilyNotes,
} from './pieces/ezios-family';
import {
  durations as soundscapeToArdorDurations,
  notes as soundscapeToArdorNotes,
} from './pieces/soundscape-to-ardor';
import {
  durations as giornosThemeDurations,
  notes as giornosThemeNotes,
} from './pieces/giornos-theme';
import {
  durations as glassySkyDurations,
  notes as glassySkyNotes,
} from './pieces/glassy-sky';
import {
  durations as kaijuuOrbDurations,
  notes as kaijuuOrbNotes,
} from './pieces/kaijuu-orb';
import {
  durations as date2Durations,
  notes as date2Notes,
} from './pieces/date-2';
import {
  durations as kokutenDurations,
  notes as kokutenNotes,
} from './pieces/kokuten';
import {
  durations as litASilentVoiceDurations,
  notes as litASilentVoiceNotes,
} from './pieces/lit-a-silent-voice';
import {
  durations as nextToYouDurations,
  notes as nextToYouNotes,
} from './pieces/next-to-you';
import {
  durations as binksSakeDurations,
  notes as binksSakeNotes,
} from './pieces/binks-sake';
import {
  durations as saitamaThemeDurations,
  notes as saitamaThemeNotes,
} from './pieces/saitama-theme';
import {
  durations as sadnessAndSorrowDurations,
  notes as sadnessAndSorrowNotes,
} from './pieces/sadness-and-sorrow';
import {
  durations as inTimeOfWarDurations,
  notes as inTimeOfWarNotes,
} from './pieces/in-time-of-war';
import {
  durations as unravelTokyoGhoulDurations,
  notes as unravelTokyoGhoulNotes,
} from './pieces/unravel-tokyo-ghoul';

export const MUSIC_LIBRARY: MusicPiece[] = [
  {
    id: 'fur-elise',
    title: 'Für Elise',
    shortTitle: 'Für Elise',
    composer: 'Beethoven',
    register: 'romantique',
    catalogNumber: 1,
    notes: furEliseNotes,
    durations: furEliseDurations,
  },
  {
    id: 'gymnopedie1',
    title: 'Gymnopedie No.1',
    shortTitle: 'Gymnopedie 1',
    composer: 'Satie',
    register: 'contemplatif',
    catalogNumber: 2,
    notes: gymnopedie1Notes,
    durations: gymnopedie1Durations,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode a la Joie',
    shortTitle: 'Ode a la Joie',
    composer: 'Beethoven',
    register: 'folk',
    catalogNumber: 3,
    notes: odeToJoyNotes,
    durations: odeToJoyDurations,
  },
  {
    id: 'rondo-alla-turca',
    title: 'Rondo alla Turca',
    shortTitle: 'Rondo alla Turca',
    composer: 'Mozart',
    register: 'folk',
    catalogNumber: 4,
    notes: rondoAllaTurcaNotes,
    durations: rondoAllaTurcaDurations,
  },
  {
    id: 'canon-in-d',
    title: 'Canon in D',
    shortTitle: 'Canon in D',
    composer: 'Pachelbel',
    register: 'romantique',
    catalogNumber: 5,
    notes: canonInDNotes,
    durations: canonInDDurations,
  },
  {
    id: 'toccata-fugue',
    title: 'Toccata & Fugue en Re mineur',
    shortTitle: 'Toccata & Fugue',
    composer: 'Bach',
    register: 'energique',
    catalogNumber: 6,
    notes: toccataFugueNotes,
    durations: toccataFugueDurations,
  },
  {
    id: 'mountain-king',
    title: 'In the Hall of the Mountain King',
    shortTitle: 'Mountain King',
    composer: 'Grieg',
    register: 'energique',
    catalogNumber: 7,
    notes: mountainKingNotes,
    durations: mountainKingDurations,
    evolutiveTempo: true,
  },
  {
    id: 'symphony-5-theme',
    title: 'Symphony No.5 (1er mvt)',
    shortTitle: 'Symph. 5',
    composer: 'Beethoven',
    register: 'dramatique',
    catalogNumber: 8,
    notes: symphony5ThemeNotes,
    durations: symphony5ThemeDurations,
  },
  {
    id: 'ave-maria',
    title: 'Ave Maria',
    shortTitle: 'Ave Maria',
    composer: 'Schubert',
    register: 'romantique',
    catalogNumber: 9,
    notes: aveMariaNotes,
    durations: aveMariaDurations,
  },
  {
    id: 'avid-86',
    title: 'Avid (86 ED)',
    shortTitle: 'Avid',
    composer: 'Hiroyuki Sawano',
    register: 'dramatique',
    catalogNumber: 10,
    notes: avid86Notes,
    durations: avid86Durations,
  },
  {
    id: 'ezios-family',
    title: 'Ezio\'s Family',
    shortTitle: 'Ezio\'s Family',
    composer: 'Jesper Kyd',
    register: 'dramatique',
    catalogNumber: 11,
    notes: eziosFamilyNotes,
    durations: eziosFamilyDurations,
  },
  {
    id: 'soundscape-to-ardor',
    title: 'Soundscape to Ardor',
    shortTitle: 'Soundscape',
    composer: 'Shiro Sagisu',
    register: 'contemplatif',
    catalogNumber: 12,
    notes: soundscapeToArdorNotes,
    durations: soundscapeToArdorDurations,
  },
  {
    id: 'giornos-theme',
    title: 'Giorno\'s Theme',
    shortTitle: 'Giorno\'s Theme',
    composer: 'Yugo Kanno',
    register: 'energique',
    catalogNumber: 13,
    notes: giornosThemeNotes,
    durations: giornosThemeDurations,
  },
  {
    id: 'glassy-sky',
    title: 'Glassy Sky',
    shortTitle: 'Glassy Sky',
    composer: 'Yutaka Yamada',
    register: 'contemplatif',
    catalogNumber: 14,
    notes: glassySkyNotes,
    durations: glassySkyDurations,
  },
  {
    id: 'kaijuu-orb',
    title: 'Kaijuu (Orb)',
    shortTitle: 'Kaijuu',
    composer: 'Unknown',
    register: 'dramatique',
    catalogNumber: 15,
    notes: kaijuuOrbNotes,
    durations: kaijuuOrbDurations,
  },
  {
    id: 'date-2',
    title: 'Date 2',
    shortTitle: 'Date 2',
    composer: 'RADWIMPS',
    register: 'romantique',
    catalogNumber: 16,
    notes: date2Notes,
    durations: date2Durations,
  },
  {
    id: 'kokuten',
    title: 'Kokuten',
    shortTitle: 'Kokuten',
    composer: 'Yasuharu Takanashi',
    register: 'dramatique',
    catalogNumber: 17,
    notes: kokutenNotes,
    durations: kokutenDurations,
  },
  {
    id: 'lit-a-silent-voice',
    title: 'Lit (A Silent Voice)',
    shortTitle: 'Lit',
    composer: 'Kensuke Ushio',
    register: 'contemplatif',
    catalogNumber: 18,
    notes: litASilentVoiceNotes,
    durations: litASilentVoiceDurations,
  },
  {
    id: 'next-to-you',
    title: 'Next To You',
    shortTitle: 'Next To You',
    composer: 'Ken Arai',
    register: 'contemplatif',
    catalogNumber: 19,
    notes: nextToYouNotes,
    durations: nextToYouDurations,
  },
  {
    id: 'binks-sake',
    title: 'Bink\'s Sake',
    shortTitle: 'Bink\'s Sake',
    composer: 'Kohei Tanaka',
    register: 'folk',
    catalogNumber: 20,
    notes: binksSakeNotes,
    durations: binksSakeDurations,
  },
  {
    id: 'saitama-theme',
    title: 'Saitama\'s Theme',
    shortTitle: 'Saitama Theme',
    composer: 'Makoto Miyazaki',
    register: 'energique',
    catalogNumber: 21,
    notes: saitamaThemeNotes,
    durations: saitamaThemeDurations,
  },
  {
    id: 'sadness-and-sorrow',
    title: 'Sadness and Sorrow',
    shortTitle: 'Sadness & Sorrow',
    composer: 'Toshiro Masuda',
    register: 'dramatique',
    catalogNumber: 22,
    notes: sadnessAndSorrowNotes,
    durations: sadnessAndSorrowDurations,
  },
  {
    id: 'in-time-of-war',
    title: 'In Time of War',
    shortTitle: 'In Time of War',
    composer: 'Kenichiro Suehiro',
    register: 'dramatique',
    catalogNumber: 23,
    notes: inTimeOfWarNotes,
    durations: inTimeOfWarDurations,
  },
  {
    id: 'unravel-tokyo-ghoul',
    title: 'Unravel',
    shortTitle: 'Unravel',
    composer: 'TK',
    register: 'dramatique',
    catalogNumber: 24,
    notes: unravelTokyoGhoulNotes,
    durations: unravelTokyoGhoulDurations,
  },
];

/** Acces par ID — O(1) */
export const MUSIC_LIBRARY_MAP = new Map(MUSIC_LIBRARY.map((p) => [p.id, p]));
