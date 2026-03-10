/**
 * midi-player.ts — Séquenceur MIDI pour le mode Classiques.
 *
 * Chaque frappe correcte = advanceMidiSequence() → joue la note suivante.
 * Erreur = silence, séquence figée.
 * Correction = reprend à la note suivante + micro-reverb.
 *
 * Les pièces sont encodées comme tableaux de notes Tone.js (domaine public garanti).
 * Pas de fichiers MIDI requis — séquences statiques compilées directement.
 *
 * Spec : docs/specs/01-audio-engine.md — Mode Classiques — midi-player.ts
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MidiPiece {
  id: MidiPieceId;
  title: string;
  composer: string;
  year: number;
  notes: string[];
  /** Durée de cada note en notation Tone.js (ex: '16n') */
  noteDuration: string;
}

export type MidiPieceId =
  | 'fur-elise'
  | 'prelude-bwv846'
  | 'gymnopedie-1'
  | 'korobeiniki'
  | 'ode-to-joy'
  | 'nocturne-op9-n2'
  | 'rondo-alla-turca'
  | 'canon-pachelbel';

// ─── Catalogue ────────────────────────────────────────────────────────────────

/**
 * Für Elise — Beethoven (1810, pub. 1867)
 * Thème principal répété. Public domain.
 */
const FUR_ELISE: string[] = [
  // Thème A — ostinato
  'E5',
  'Eb5',
  'E5',
  'Eb5',
  'E5',
  'B4',
  'D5',
  'C5',
  'A4',
  'C4',
  'E4',
  'A4',
  'B4',
  'E4',
  'Ab4',
  'B4',
  'C5',
  'E4',
  'E5',
  'Eb5',
  'E5',
  'Eb5',
  'E5',
  'B4',
  'D5',
  'C5',
  'A4',
  'C4',
  'E4',
  'A4',
  'B4',
  'E4',
  'Ab4',
  'B4',
  'C5',
  // Thème B — section médiane
  'E5',
  'C5',
  'D5',
  'B4',
  'C5',
  'A4',
  'Ab4',
  'E4',
  'Ab4',
  'B4',
  'C5',
  'B4',
  'Ab4',
  'E5',
  'C5',
  'D5',
  'B4',
  // Retour thème A
  'E5',
  'Eb5',
  'E5',
  'Eb5',
  'E5',
  'B4',
  'D5',
  'C5',
  'A4',
  'C4',
  'E4',
  'A4',
  'B4',
  'E4',
  'Ab4',
  'B4',
  'C5',
];

/**
 * Prélude en Do Majeur BWV 846 — J.S. Bach (1722, WTC Livre I)
 * La célèbre progression d'arpèges. Public domain.
 */
const PRELUDE_BWV846: string[] = [
  // Mesure 1 — Do M
  'C4',
  'E4',
  'G4',
  'C5',
  'E5',
  'G4',
  'C5',
  'E5',
  // Mesure 2 — Ré m (D A D F)
  'D4',
  'A4',
  'D5',
  'F5',
  'A4',
  'D5',
  'F5',
  'A4',
  // Mesure 3 — Sol7 (G B D F)
  'G4',
  'D5',
  'G5',
  'B4',
  'D5',
  'G4',
  'B4',
  'D5',
  // Mesure 4 — Do M
  'C4',
  'E4',
  'G4',
  'C5',
  'E5',
  'G4',
  'C5',
  'E5',
  // Mesure 5 — La m (A C E)
  'A3',
  'E4',
  'A4',
  'C5',
  'E4',
  'A4',
  'C5',
  'E5',
  // Mesure 6 — Ré7 (D F# A C)
  'D4',
  'F4',
  'A4',
  'D5',
  'F4',
  'A4',
  'D5',
  'F5',
  // Mesure 7 — Sol (G B D)
  'G3',
  'D4',
  'G4',
  'B4',
  'D4',
  'G4',
  'B4',
  'D5',
  // Mesure 8 — Do M
  'C4',
  'E4',
  'G4',
  'C5',
  'E5',
  'G4',
  'C5',
  'E5',
];

/**
 * Gymnopédie N°1 — Erik Satie (1888)
 * Thème principal en 3/4. Public domain (Satie décédé en 1925).
 */
const GYMNOPEDIE_1: string[] = [
  // Mélodie principale (voix haute)
  'Db5',
  'Bb4',
  'Bb4',
  'Ab4',
  'Ab4',
  'Gb4',
  'Gb4',
  'Eb4',
  'Gb4',
  'Ab4',
  'Ab4',
  'Ab4',
  // Phrase 2
  'Db5',
  'Bb4',
  'Bb4',
  'Ab4',
  'Ab4',
  'Gb4',
  'Gb4',
  'Eb4',
  'Gb4',
  'Ab4',
  'Ab4',
  'Ab4',
  // Phrase 3
  'Eb5',
  'Db5',
  'Db5',
  'Bb4',
  'Ab4',
  'Gb4',
  'Gb4',
  'Ab4',
  'Bb4',
  'Ab4',
  'Gb4',
  'Eb4',
  // Phrase 4
  'Db5',
  'Bb4',
  'Bb4',
  'Ab4',
  'Ab4',
  'Gb4',
  'Gb4',
  'Eb4',
  'Gb4',
  'Ab4',
  'Ab4',
  'Ab4',
];

/**
 * Korobeiniki — Traditionnel russe (XIXe s.) — Thème de Tetris
 * Public domain (chanson folklorique russe).
 */
const KOROBEINIKI: string[] = [
  // Phrase A — thème principal
  'E5',
  'B4',
  'C5',
  'D5',
  'C5',
  'B4',
  'A4',
  'A4',
  'C5',
  'E5',
  'D5',
  'C5',
  'B4',
  'C5',
  'D5',
  'E5',
  'C5',
  'A4',
  'A4',
  // Phrase B
  'D5',
  'F5',
  'A5',
  'G5',
  'F5',
  'E5',
  'C5',
  'E5',
  'D5',
  'C5',
  'B4',
  'B4',
  'C5',
  'D5',
  'E5',
  'C5',
  'A4',
  'A4',
  // Phrase C — bridge
  'E4',
  'C5',
  'B4',
  'A4',
  'Ab4',
  'A4',
  'B4',
  'C5',
  'D5',
  'F5',
  'A5',
  'G5',
  'F5',
  'E5',
  'C5',
  'E5',
  'D5',
  'C5',
  'B4',
  // Retour thème A
  'E5',
  'B4',
  'C5',
  'D5',
  'C5',
  'B4',
  'A4',
  'A4',
  'C5',
  'E5',
  'D5',
  'C5',
  'B4',
  'C5',
  'D5',
  'E5',
  'C5',
  'A4',
  'A4',
];

// ─── Catalogue global ─────────────────────────────────────────────────────────

/**
 * Ode à la Joie (9e Symphonie) — Ludwig van Beethoven (1824)
 * Thème principal de l'hymne européen. Public domain.
 */
const ODE_TO_JOY: string[] = [
  // Phrase A (×2)
  'E4',
  'E4',
  'F4',
  'G4',
  'G4',
  'F4',
  'E4',
  'D4',
  'C4',
  'C4',
  'D4',
  'E4',
  'E4',
  'D4',
  'D4',
  // Phrase A' (variante finale)
  'E4',
  'E4',
  'F4',
  'G4',
  'G4',
  'F4',
  'E4',
  'D4',
  'C4',
  'C4',
  'D4',
  'E4',
  'D4',
  'C4',
  'C4',
  // Phrase B
  'D4',
  'D4',
  'E4',
  'C4',
  'D4',
  'E4',
  'F4',
  'E4',
  'C4',
  'D4',
  'E4',
  'F4',
  'E4',
  'D4',
  'C4',
  'D4',
  'G3',
  // Reprise phrase A
  'E4',
  'E4',
  'F4',
  'G4',
  'G4',
  'F4',
  'E4',
  'D4',
  'C4',
  'C4',
  'D4',
  'E4',
  'D4',
  'C4',
  'C4',
];

/**
 * Nocturne Op.9 N°2 en Mi bémol majeur — Frédéric Chopin (1830)
 * Mélodie principale, voix haute. Public domain (Chopin décédé en 1849).
 */
const NOCTURNE_OP9_N2: string[] = [
  // Phrase d'ouverture
  'Bb4',
  'C5',
  'Eb5',
  'Db5',
  'C5',
  'Bb4',
  'Ab4',
  'Bb4',
  'Ab4',
  'G4',
  'Bb4',
  // Phrase 2
  'Bb4',
  'C5',
  'Eb5',
  'Db5',
  'C5',
  'Bb4',
  'Ab4',
  'Gb4',
  'Eb4',
  'F4',
  'Eb4',
  // Phrase 3 — montée lyrique
  'Eb5',
  'F5',
  'Gb5',
  'F5',
  'Eb5',
  'Db5',
  'C5',
  'Bb4',
  'Ab4',
  'Bb4',
  'G4',
  // Phrase 4 — retour
  'Bb4',
  'C5',
  'Eb5',
  'Db5',
  'C5',
  'Bb4',
  'Ab4',
  'Gb4',
  'F4',
  'Eb4',
  'Bb3',
];

/**
 * Rondo alla Turca (Sonate K. 331) — W. A. Mozart (1783)
 * Thème principal du 3e mouvement. Public domain (Mozart décédé en 1791).
 */
const RONDO_ALLA_TURCA: string[] = [
  // Motif A — staccato
  'A4',
  'G4',
  'F4',
  'E4',
  'E4',
  'E4',
  'A4',
  'G4',
  'F4',
  'E4',
  'E4',
  'E4',
  // Motif B
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'C5',
  'B4',
  'A4',
  // Motif C — ornements
  'A4',
  'B4',
  'A4',
  'G4',
  'F4',
  'E4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  // Fin de section
  'A4',
  'G4',
  'F4',
  'G4',
  'A4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'B4',
  'A4',
  'G4',
  'A4',
  'E4',
];

/**
 * Canon en Ré Majeur — Johann Pachelbel (1680)
 * Progression de basse + voix canoniques. Public domain.
 */
const CANON_PACHELBEL: string[] = [
  // Voix 1 — basse ostinato
  'D4',
  'A4',
  'B3',
  'F4',
  'G3',
  'D4',
  'G3',
  'A3',
  // Voix 2 — contrepoint
  'F4',
  'E4',
  'D4',
  'C4',
  'B3',
  'A3',
  'B3',
  'C4',
  // Voix 3 — mélodie supérieure
  'D4',
  'F4',
  'A4',
  'D5',
  'C5',
  'B4',
  'A4',
  'G4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
  // Phrase ornementée
  'E5',
  'D5',
  'C5',
  'B4',
  'A4',
  'B4',
  'C5',
  'D5',
  'A4',
  'B4',
  'C5',
  'A4',
  // Reprise de la basse
  'D4',
  'A4',
  'B3',
  'F4',
  'G3',
  'D4',
  'G3',
  'A3',
];

export const MIDI_PIECES: Record<MidiPieceId, MidiPiece> = {
  'fur-elise': {
    id: 'fur-elise',
    title: 'Für Elise',
    composer: 'L. v. Beethoven',
    year: 1810,
    notes: FUR_ELISE,
    noteDuration: '16n',
  },
  'prelude-bwv846': {
    id: 'prelude-bwv846',
    title: 'Prélude en Do Majeur',
    composer: 'J.-S. Bach',
    year: 1722,
    notes: PRELUDE_BWV846,
    noteDuration: '16n',
  },
  'gymnopedie-1': {
    id: 'gymnopedie-1',
    title: 'Gymnopédie N°1',
    composer: 'E. Satie',
    year: 1888,
    notes: GYMNOPEDIE_1,
    noteDuration: '8n',
  },
  korobeiniki: {
    id: 'korobeiniki',
    title: 'Korobeiniki',
    composer: 'Traditionnel russe',
    year: 1861,
    notes: KOROBEINIKI,
    noteDuration: '16n',
  },
  'ode-to-joy': {
    id: 'ode-to-joy',
    title: 'Ode à la Joie',
    composer: 'L. v. Beethoven',
    year: 1824,
    notes: ODE_TO_JOY,
    noteDuration: '8n',
  },
  'nocturne-op9-n2': {
    id: 'nocturne-op9-n2',
    title: 'Nocturne Op.9 N°2',
    composer: 'F. Chopin',
    year: 1830,
    notes: NOCTURNE_OP9_N2,
    noteDuration: '8n',
  },
  'rondo-alla-turca': {
    id: 'rondo-alla-turca',
    title: 'Rondo alla Turca',
    composer: 'W. A. Mozart',
    year: 1783,
    notes: RONDO_ALLA_TURCA,
    noteDuration: '16n',
  },
  'canon-pachelbel': {
    id: 'canon-pachelbel',
    title: 'Canon en Ré Majeur',
    composer: 'J. Pachelbel',
    year: 1680,
    notes: CANON_PACHELBEL,
    noteDuration: '8n',
  },
};

// ─── Séquenceur ───────────────────────────────────────────────────────────────

/**
 * État interne du séquenceur MIDI.
 * La position est mutable pour un accès O(1) depuis useAudioEngine.
 */
interface MidiSequencerState {
  piece: MidiPiece | null;
  position: number;
}

const _state: MidiSequencerState = {
  piece: null,
  position: 0,
};

/**
 * Charge une pièce MIDI et réinitialise la position.
 */
export function loadPiece(pieceId: MidiPieceId): MidiPiece {
  const piece = MIDI_PIECES[pieceId];
  _state.piece = piece;
  _state.position = 0;
  return piece;
}

/**
 * Retourne la note courante et avance d'un cran,
 * en bouclant automatiquement à la fin.
 *
 * @returns La note à jouer (ex: "E5") ou null si aucune pièce chargée.
 */
export function advanceAndGet(): string | null {
  if (!_state.piece) return null;
  const note = _state.piece.notes[_state.position] ?? null;
  _state.position = (_state.position + 1) % _state.piece.notes.length;
  return note;
}

/**
 * Retourne la pièce actuellement chargée.
 */
export function getCurrentPiece(): MidiPiece | null {
  return _state.piece;
}

/**
 * Retourne la position courante dans la séquence.
 */
export function getCurrentPosition(): number {
  return _state.position;
}

/**
 * Retourne la durée de la note courante (en notation Tone.js).
 */
export function getCurrentDuration(): string {
  return _state.piece?.noteDuration ?? '16n';
}

/**
 * Réinitialise la position à 0 (sans changer la pièce).
 */
export function resetSequence(): void {
  _state.position = 0;
}
