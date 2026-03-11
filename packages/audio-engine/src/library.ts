/**
 * library.ts — Bibliothèque musicale unifiée (58 pièces).
 *
 * Spec : docs/specs/32-music-library.md
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
  durations as airGStringDurations,
  notes as airGStringNotes,
} from './pieces/air-g-string';
import {
  durations as amazingGraceDurations,
  notes as amazingGraceNotes,
} from './pieces/amazing-grace';
import {
  durations as arabesque1Durations,
  notes as arabesque1Notes,
} from './pieces/arabesque-1';
import {
  notes as aveMaraNotes,
  durations as aveMariaDurations,
} from './pieces/ave-maria';
import {
  durations as ballade1Durations,
  notes as ballade1Notes,
} from './pieces/ballade-1';
import {
  durations as bellaCiaoDurations,
  notes as bellaCiaoNotes,
} from './pieces/bella-ciao';
import {
  durations as bwv846Durations,
  notes as bwv846Notes,
} from './pieces/bwv846';
import {
  durations as canCanDurations,
  notes as canCanNotes,
} from './pieces/can-can';
import {
  durations as canonDurations,
  notes as canonNotes,
} from './pieces/canon-in-d';
import {
  durations as clairDurations,
  notes as clairNotes,
} from './pieces/clair-de-lune';
import {
  durations as sugarPlumDurations,
  notes as sugarPlumNotes,
} from './pieces/dance-sugar-plum';
import {
  durations as dannyBoyDurations,
  notes as dannyBoyNotes,
} from './pieces/danny-boy';
import {
  durations as denseMacabreDurations,
  notes as denseMacabreNotes,
} from './pieces/danse-macabre';
import {
  durations as drunkenSailorDurations,
  notes as drunkenSailorNotes,
} from './pieces/drunken-sailor';
import {
  durations as eineKleineDurations,
  notes as eineKleineNotes,
} from './pieces/eine-kleine-nachtmusik';
import {
  durations as flightBumblebeeDurations,
  notes as flightBumblebeeNotes,
} from './pieces/flight-of-bumblebee';
import {
  durations as furEliseDurations,
  notes as furEliseNotes,
} from './pieces/fur-elise';
import {
  notes as greensleevesNotes,
  durations as greensleevesdurations,
} from './pieces/greensleeves';
import {
  durations as gymnopedie1Durations,
  notes as gymnopedie1Notes,
} from './pieces/gymnopedie1';
import {
  durations as gymnopedie2Durations,
  notes as gymnopedie2Notes,
} from './pieces/gymnopedie2';
import {
  durations as habanerationDurations,
  notes as habanerationNotes,
} from './pieces/habanera';
import {
  durations as hungarianDance5Durations,
  notes as hungarianDance5Notes,
} from './pieces/hungarian-dance-5';
import {
  durations as hungarianRhap2Durations,
  notes as hungarianRhap2Notes,
} from './pieces/hungarian-rhapsody-2';
import {
  durations as kalinkaDurations,
  notes as kalinkaNotes,
} from './pieces/kalinka';
import {
  durations as korobeinikiDurations,
  notes as korobeinikiNotes,
} from './pieces/korobeiniki';
import {
  durations as campanellaDurations,
  notes as campanellaNotes,
} from './pieces/la-campanella';
import {
  durations as laFoliaDurations,
  notes as laFoliaNotes,
} from './pieces/la-folia';
import {
  durations as lacrimosaDurations,
  notes as lacrimosaNotes,
} from './pieces/lacrimosa';
import {
  durations as liebestraumDurations,
  notes as liebestraumNotes,
} from './pieces/liebestraum-3';
import {
  durations as mapleLeafRagDurations,
  notes as mapleLeafRagNotes,
} from './pieces/maple-leaf-rag';
import {
  durations as moonlightDurations,
  notes as moonlightNotes,
} from './pieces/moonlight-sonata';
import {
  durations as morningMoodDurations,
  notes as morningMoodNotes,
} from './pieces/morning-mood';
import {
  durations as mountainKingDurations,
  notes as mountainKingNotes,
} from './pieces/mountain-king';
import {
  durations as newWorldDurations,
  notes as newWorldNotes,
} from './pieces/new-world-largo';
import {
  durations as nightBaldMtDurations,
  notes as nightBaldMtNotes,
} from './pieces/night-on-bald-mountain';
import {
  durations as nimrodDurations,
  notes as nimrodNotes,
} from './pieces/nimrod';
import {
  durations as nocturneOp9Durations,
  notes as nocturneOp9Notes,
} from './pieces/nocturne-op9-2';
import {
  durations as odeToJoyDurations,
  notes as odeToJoyNotes,
} from './pieces/ode-to-joy';
import {
  durations as pavaneDurations,
  notes as pavaneNotes,
} from './pieces/pavane-infante-defunte';
import {
  durations as polovtsianDurations,
  notes as polovtsianNotes,
} from './pieces/polovtsian-dances';
import {
  durations as promenadeDurations,
  notes as promenadeNotes,
} from './pieces/promenade';
import {
  durations as raindropDurations,
  notes as raindropNotes,
} from './pieces/raindrop-prelude';
import {
  durations as rondoDurations,
  notes as rondoNotes,
} from './pieces/rondo-alla-turca';
import {
  durations as sakuraDurations,
  notes as sakuraNotes,
} from './pieces/sakura-sakura';
import {
  durations as sarabandeDurations,
  notes as sarabandeNotes,
} from './pieces/sarabande';
import {
  durations as scarboroughDurations,
  notes as scarboroughNotes,
} from './pieces/scarborough-fair';
import {
  durations as scheherazadeDurations,
  notes as scheherazadeNotes,
} from './pieces/scheherazade';
import {
  durations as shenandoahDurations,
  notes as shenandoahNotes,
} from './pieces/shenandoah';
import {
  durations as sicilienneDurations,
  notes as sicilienneNotes,
} from './pieces/sicilienne';
import {
  durations as simpleGiftsDurations,
  notes as simpleGiftsNotes,
} from './pieces/simple-gifts';
import {
  durations as swanLakeDurations,
  notes as swanLakeNotes,
} from './pieces/swan-lake';
import {
  durations as symphony40Durations,
  notes as symphony40Notes,
} from './pieces/symphony-40-theme';
import {
  durations as symphony5Durations,
  notes as symphony5Notes,
} from './pieces/symphony-5-theme';
import {
  durations as theEntertainerDurations,
  notes as theEntertainerNotes,
} from './pieces/the-entertainer';
import {
  durations as toccataFugueDurations,
  notes as toccataFugueNotes,
} from './pieces/toccata-fugue';
import {
  durations as traumDurations,
  notes as traumNotes,
} from './pieces/traumerei';
import {
  durations as waltzAMinorDurations,
  notes as waltzAMinorNotes,
} from './pieces/waltz-a-minor';
import {
  durations as whenSaintsDurations,
  notes as whenSaintsNotes,
} from './pieces/when-saints-go-marching';

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
    id: 'bwv846',
    title: 'Prélude BWV 846',
    shortTitle: 'Prélude BWV 846',
    composer: 'Bach',
    register: 'romantique',
    catalogNumber: 2,
    notes: bwv846Notes,
    durations: bwv846Durations,
  },
  {
    id: 'gymnopedie1',
    title: 'Gymnopédie No.1',
    shortTitle: 'Gymnopédie 1',
    composer: 'Satie',
    register: 'contemplatif',
    catalogNumber: 3,
    notes: gymnopedie1Notes,
    durations: gymnopedie1Durations,
  },
  {
    id: 'korobeiniki',
    title: 'Korobeiniki (Tetris)',
    shortTitle: 'Korobeiniki',
    composer: 'Traditionnel russe',
    register: 'folk',
    catalogNumber: 4,
    notes: korobeinikiNotes,
    durations: korobeinikiDurations,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode à la Joie',
    shortTitle: 'Ode à la Joie',
    composer: 'Beethoven',
    register: 'folk',
    catalogNumber: 5,
    notes: odeToJoyNotes,
    durations: odeToJoyDurations,
  },
  {
    id: 'nocturne-op9-2',
    title: 'Nocturne Op.9 No.2',
    shortTitle: 'Nocturne Op.9',
    composer: 'Chopin',
    register: 'romantique',
    catalogNumber: 6,
    notes: nocturneOp9Notes,
    durations: nocturneOp9Durations,
  },
  {
    id: 'rondo-alla-turca',
    title: 'Rondo alla Turca',
    shortTitle: 'Rondo alla Turca',
    composer: 'Mozart',
    register: 'folk',
    catalogNumber: 7,
    notes: rondoNotes,
    durations: rondoDurations,
  },
  {
    id: 'canon-in-d',
    title: 'Canon in D',
    shortTitle: 'Canon in D',
    composer: 'Pachelbel',
    register: 'romantique',
    catalogNumber: 8,
    notes: canonNotes,
    durations: canonDurations,
  },
  {
    id: 'eine-kleine-nachtmusik',
    title: 'Eine Kleine Nachtmusik (1er mvt)',
    shortTitle: 'Nachtmusik',
    composer: 'Mozart',
    register: 'energique',
    catalogNumber: 9,
    notes: eineKleineNotes,
    durations: eineKleineDurations,
  },
  {
    id: 'symphony-40-theme',
    title: 'Symphony No.40 (1er mvt, thème)',
    shortTitle: 'Symph. 40',
    composer: 'Mozart',
    register: 'energique',
    catalogNumber: 10,
    notes: symphony40Notes,
    durations: symphony40Durations,
  },
  {
    id: 'toccata-fugue',
    title: 'Toccata & Fugue en Ré mineur',
    shortTitle: 'Toccata & Fugue',
    composer: 'Bach',
    register: 'energique',
    catalogNumber: 11,
    notes: toccataFugueNotes,
    durations: toccataFugueDurations,
  },
  {
    id: 'hungarian-dance-5',
    title: 'Hungarian Dance No.5',
    shortTitle: 'Hungarian Dance 5',
    composer: 'Brahms',
    register: 'energique',
    catalogNumber: 12,
    notes: hungarianDance5Notes,
    durations: hungarianDance5Durations,
  },
  {
    id: 'mountain-king',
    title: 'In the Hall of the Mountain King',
    shortTitle: 'Mountain King',
    composer: 'Grieg',
    register: 'energique',
    catalogNumber: 13,
    notes: mountainKingNotes,
    durations: mountainKingDurations,
    evolutiveTempo: true,
  },
  {
    id: 'maple-leaf-rag',
    title: 'Maple Leaf Rag',
    shortTitle: 'Maple Leaf Rag',
    composer: 'Scott Joplin',
    register: 'energique',
    catalogNumber: 14,
    notes: mapleLeafRagNotes,
    durations: mapleLeafRagDurations,
  },
  {
    id: 'the-entertainer',
    title: 'The Entertainer',
    shortTitle: 'The Entertainer',
    composer: 'Scott Joplin',
    register: 'energique',
    catalogNumber: 15,
    notes: theEntertainerNotes,
    durations: theEntertainerDurations,
  },
  {
    id: 'flight-of-bumblebee',
    title: 'Flight of the Bumblebee',
    shortTitle: 'Bumblebee',
    composer: 'Rimsky-Korsakov',
    register: 'energique',
    catalogNumber: 16,
    notes: flightBumblebeeNotes,
    durations: flightBumblebeeDurations,
    extremeLevel: true,
  },
  {
    id: 'danse-macabre',
    title: 'Danse Macabre',
    shortTitle: 'Danse Macabre',
    composer: 'Saint-Saëns',
    register: 'energique',
    catalogNumber: 17,
    notes: denseMacabreNotes,
    durations: denseMacabreDurations,
  },
  {
    id: 'can-can',
    title: 'Can-Can (galop final)',
    shortTitle: 'Can-Can',
    composer: 'Offenbach',
    register: 'energique',
    catalogNumber: 18,
    notes: canCanNotes,
    durations: canCanDurations,
  },
  {
    id: 'night-on-bald-mountain',
    title: 'Night on Bald Mountain',
    shortTitle: 'Bald Mountain',
    composer: 'Moussorgski',
    register: 'energique',
    catalogNumber: 19,
    notes: nightBaldMtNotes,
    durations: nightBaldMtDurations,
  },
  {
    id: 'kalinka',
    title: 'Kalinka',
    shortTitle: 'Kalinka',
    composer: 'Ivan Larionov',
    register: 'energique',
    catalogNumber: 20,
    notes: kalinkaNotes,
    durations: kalinkaDurations,
    evolutiveTempo: true,
  },
  {
    id: 'when-saints-go-marching',
    title: 'When the Saints Go Marching In',
    shortTitle: 'When the Saints',
    composer: 'Traditionnel Gospel',
    register: 'energique',
    catalogNumber: 21,
    notes: whenSaintsNotes,
    durations: whenSaintsDurations,
  },
  {
    id: 'moonlight-sonata',
    title: 'Moonlight Sonata (1er mvt, Adagio)',
    shortTitle: 'Moonlight Sonata',
    composer: 'Beethoven',
    register: 'contemplatif',
    catalogNumber: 22,
    notes: moonlightNotes,
    durations: moonlightDurations,
  },
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune (thème A)',
    shortTitle: 'Clair de Lune',
    composer: 'Debussy',
    register: 'contemplatif',
    catalogNumber: 23,
    notes: clairNotes,
    durations: clairDurations,
  },
  {
    id: 'arabesque-1',
    title: 'Arabesque No.1',
    shortTitle: 'Arabesque 1',
    composer: 'Debussy',
    register: 'contemplatif',
    catalogNumber: 24,
    notes: arabesque1Notes,
    durations: arabesque1Durations,
  },
  {
    id: 'gymnopedie2',
    title: 'Gymnopédie No.2',
    shortTitle: 'Gymnopédie 2',
    composer: 'Satie',
    register: 'contemplatif',
    catalogNumber: 25,
    notes: gymnopedie2Notes,
    durations: gymnopedie2Durations,
  },
  {
    id: 'pavane-infante-defunte',
    title: 'Pavane pour une infante défunte',
    shortTitle: 'Pavane',
    composer: 'Ravel',
    register: 'contemplatif',
    catalogNumber: 26,
    notes: pavaneNotes,
    durations: pavaneDurations,
  },
  {
    id: 'traumerei',
    title: 'Träumerei',
    shortTitle: 'Träumerei',
    composer: 'Schumann',
    register: 'contemplatif',
    catalogNumber: 27,
    notes: traumNotes,
    durations: traumDurations,
  },
  {
    id: 'new-world-largo',
    title: 'New World Symphony — Largo',
    shortTitle: 'New World Largo',
    composer: 'Dvořák',
    register: 'contemplatif',
    catalogNumber: 28,
    notes: newWorldNotes,
    durations: newWorldDurations,
  },
  {
    id: 'nimrod',
    title: 'Nimrod (Enigma Variations, Var. IX)',
    shortTitle: 'Nimrod',
    composer: 'Elgar',
    register: 'contemplatif',
    catalogNumber: 29,
    notes: nimrodNotes,
    durations: nimrodDurations,
  },
  {
    id: 'air-g-string',
    title: 'Air on the G String (BWV 1068)',
    shortTitle: 'Air on G String',
    composer: 'Bach',
    register: 'contemplatif',
    catalogNumber: 30,
    notes: airGStringNotes,
    durations: airGStringDurations,
  },
  {
    id: 'raindrop-prelude',
    title: 'Raindrop Prelude (Op.28 No.15)',
    shortTitle: 'Raindrop',
    composer: 'Chopin',
    register: 'contemplatif',
    catalogNumber: 31,
    notes: raindropNotes,
    durations: raindropDurations,
  },
  {
    id: 'scarborough-fair',
    title: 'Scarborough Fair',
    shortTitle: 'Scarborough Fair',
    composer: 'Traditionnel anglais',
    register: 'contemplatif',
    catalogNumber: 32,
    notes: scarboroughNotes,
    durations: scarboroughDurations,
  },
  {
    id: 'sakura-sakura',
    title: 'Sakura Sakura',
    shortTitle: 'Sakura Sakura',
    composer: 'Traditionnel japonais',
    register: 'contemplatif',
    catalogNumber: 33,
    notes: sakuraNotes,
    durations: sakuraDurations,
  },
  {
    id: 'lacrimosa',
    title: 'Lacrimosa (Requiem K.626)',
    shortTitle: 'Lacrimosa',
    composer: 'Mozart',
    register: 'dramatique',
    catalogNumber: 34,
    notes: lacrimosaNotes,
    durations: lacrimosaDurations,
  },
  {
    id: 'symphony-5-theme',
    title: 'Symphony No.5 (1er mvt)',
    shortTitle: 'Symph. 5',
    composer: 'Beethoven',
    register: 'dramatique',
    catalogNumber: 35,
    notes: symphony5Notes,
    durations: symphony5Durations,
  },
  {
    id: 'ballade-1',
    title: 'Ballade No.1 en Sol mineur',
    shortTitle: 'Ballade No.1',
    composer: 'Chopin',
    register: 'dramatique',
    catalogNumber: 36,
    notes: ballade1Notes,
    durations: ballade1Durations,
  },
  {
    id: 'sarabande',
    title: 'Sarabande en Ré mineur',
    shortTitle: 'Sarabande',
    composer: 'Handel',
    register: 'dramatique',
    catalogNumber: 37,
    notes: sarabandeNotes,
    durations: sarabandeDurations,
  },
  {
    id: 'promenade',
    title: "Promenade (Tableaux d'une exposition)",
    shortTitle: 'Promenade',
    composer: 'Moussorgski',
    register: 'dramatique',
    catalogNumber: 38,
    notes: promenadeNotes,
    durations: promenadeDurations,
  },
  {
    id: 'scheherazade',
    title: 'Scheherazade Op.35 (1er mvt)',
    shortTitle: 'Scheherazade',
    composer: 'Rimsky-Korsakov',
    register: 'dramatique',
    catalogNumber: 39,
    notes: scheherazadeNotes,
    durations: scheherazadeDurations,
  },
  {
    id: 'polovtsian-dances',
    title: 'Danses Polovtsiennes (thème lyrique)',
    shortTitle: 'Polovtsian',
    composer: 'Borodin',
    register: 'dramatique',
    catalogNumber: 40,
    notes: polovtsianNotes,
    durations: polovtsianDurations,
  },
  {
    id: 'habanera',
    title: 'Habanera (Carmen, 1er acte)',
    shortTitle: 'Habanera',
    composer: 'Bizet',
    register: 'dramatique',
    catalogNumber: 41,
    notes: habanerationNotes,
    durations: habanerationDurations,
  },
  {
    id: 'liebestraum-3',
    title: 'Liebestraum No.3',
    shortTitle: 'Liebestraum 3',
    composer: 'Liszt',
    register: 'romantique',
    catalogNumber: 42,
    notes: liebestraumNotes,
    durations: liebestraumDurations,
  },
  {
    id: 'hungarian-rhapsody-2',
    title: 'Hungarian Rhapsody No.2 (Lassan)',
    shortTitle: 'Hung. Rhapsody 2',
    composer: 'Liszt',
    register: 'romantique',
    catalogNumber: 43,
    notes: hungarianRhap2Notes,
    durations: hungarianRhap2Durations,
    evolutiveTempo: true,
  },
  {
    id: 'la-campanella',
    title: 'La Campanella',
    shortTitle: 'La Campanella',
    composer: 'Liszt',
    register: 'romantique',
    catalogNumber: 44,
    notes: campanellaNotes,
    durations: campanellaDurations,
    extremeLevel: true,
  },
  {
    id: 'swan-lake',
    title: 'Lac des Cygnes — Thème du cygne',
    shortTitle: 'Swan Lake',
    composer: 'Tchaïkovski',
    register: 'romantique',
    catalogNumber: 45,
    notes: swanLakeNotes,
    durations: swanLakeDurations,
  },
  {
    id: 'dance-sugar-plum',
    title: 'Danse de la Fée Dragée',
    shortTitle: 'Sugar Plum Fairy',
    composer: 'Tchaïkovski',
    register: 'romantique',
    catalogNumber: 46,
    notes: sugarPlumNotes,
    durations: sugarPlumDurations,
  },
  {
    id: 'morning-mood',
    title: 'Morning Mood (Peer Gynt, Suite No.1)',
    shortTitle: 'Morning Mood',
    composer: 'Grieg',
    register: 'romantique',
    catalogNumber: 47,
    notes: morningMoodNotes,
    durations: morningMoodDurations,
  },
  {
    id: 'sicilienne',
    title: 'Sicilienne Op.78',
    shortTitle: 'Sicilienne',
    composer: 'Fauré',
    register: 'romantique',
    catalogNumber: 48,
    notes: sicilienneNotes,
    durations: sicilienneDurations,
  },
  {
    id: 'waltz-a-minor',
    title: 'Waltz in A minor (B.150)',
    shortTitle: 'Waltz A minor',
    composer: 'Chopin',
    register: 'romantique',
    catalogNumber: 49,
    notes: waltzAMinorNotes,
    durations: waltzAMinorDurations,
  },
  {
    id: 'ave-maria',
    title: 'Ave Maria',
    shortTitle: 'Ave Maria',
    composer: 'Schubert',
    register: 'romantique',
    catalogNumber: 50,
    notes: aveMaraNotes,
    durations: aveMariaDurations,
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    shortTitle: 'Greensleeves',
    composer: 'Traditionnel anglais',
    register: 'folk',
    catalogNumber: 51,
    notes: greensleevesNotes,
    durations: greensleevesdurations,
  },
  {
    id: 'danny-boy',
    title: 'Danny Boy (Londonderry Air)',
    shortTitle: 'Danny Boy',
    composer: 'Traditionnel irlandais',
    register: 'folk',
    catalogNumber: 52,
    notes: dannyBoyNotes,
    durations: dannyBoyDurations,
  },
  {
    id: 'bella-ciao',
    title: 'Bella Ciao',
    shortTitle: 'Bella Ciao',
    composer: 'Traditionnel italien',
    register: 'folk',
    catalogNumber: 53,
    notes: bellaCiaoNotes,
    durations: bellaCiaoDurations,
  },
  {
    id: 'drunken-sailor',
    title: 'Drunken Sailor',
    shortTitle: 'Drunken Sailor',
    composer: 'Traditionnel (shanty)',
    register: 'folk',
    catalogNumber: 54,
    notes: drunkenSailorNotes,
    durations: drunkenSailorDurations,
  },
  {
    id: 'la-folia',
    title: 'La Folia (Op.5 No.12)',
    shortTitle: 'La Folia',
    composer: 'Corelli',
    register: 'folk',
    catalogNumber: 55,
    notes: laFoliaNotes,
    durations: laFoliaDurations,
  },
  {
    id: 'simple-gifts',
    title: 'Simple Gifts',
    shortTitle: 'Simple Gifts',
    composer: 'Joseph Brackett',
    register: 'folk',
    catalogNumber: 56,
    notes: simpleGiftsNotes,
    durations: simpleGiftsDurations,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    shortTitle: 'Amazing Grace',
    composer: 'Traditionnel (hymne)',
    register: 'folk',
    catalogNumber: 57,
    notes: amazingGraceNotes,
    durations: amazingGraceDurations,
  },
  {
    id: 'shenandoah',
    title: 'Shenandoah',
    shortTitle: 'Shenandoah',
    composer: 'Traditionnel américain',
    register: 'folk',
    catalogNumber: 58,
    notes: shenandoahNotes,
    durations: shenandoahDurations,
  },
];

/** Accès par ID — O(1) */
export const MUSIC_LIBRARY_MAP = new Map(MUSIC_LIBRARY.map((p) => [p.id, p]));
