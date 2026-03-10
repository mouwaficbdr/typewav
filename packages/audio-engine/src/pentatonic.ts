/**
 * Gamme pentatonique de Do majeur : C D E G A
 * Distribution sur 26 lettres via cycling sur 15 positions (5 notes × 3 octaves).
 *
 * Spec : docs/specs/01-audio-engine.md — Mode génératif, algorithme A+C
 */

/** Notes valides dans la gamme pentatonique de Do majeur */
export type PentatonicNote = 'C' | 'D' | 'E' | 'G' | 'A'

/** Représentation complète d'une note avec octave */
export type NoteWithOctave = `${PentatonicNote}${2 | 3 | 4 | 5}`

/**
 * Mapping des 26 lettres de l'alphabet vers une note pentatonique.
 * Défini explicitement selon la spec pour garantir la non-dissonance.
 */
const LETTER_NOTE_MAP: Record<string, NoteWithOctave> = {
  a: 'C4', b: 'D4', c: 'E4', d: 'G4', e: 'A4',
  f: 'C5', g: 'D5', h: 'E5', i: 'G5', j: 'A5',
  k: 'C3', l: 'D3', m: 'E3', n: 'G3', o: 'A3',
  p: 'C4', q: 'D4', r: 'E4', s: 'G4', t: 'A4',
  u: 'C5', v: 'D5', w: 'E5', x: 'G5', y: 'A5',
  z: 'C3',
}

/** Notes de la gamme pentatonique (sans octave) */
export const PENTATONIC_NOTES: readonly PentatonicNote[] = ['C', 'D', 'E', 'G', 'A']

/**
 * Retourne la note pentatonique correspondant à un caractère.
 * Les caractères non alphabétiques retournent la note par défaut C4.
 */
export function getPentatonicNote(char: string): NoteWithOctave {
  const key = char.toLowerCase()
  return LETTER_NOTE_MAP[key] ?? 'C4'
}

/**
 * Vérifie qu'une note appartient à la gamme pentatonique de Do majeur.
 */
export function isPentatonicNote(note: NoteWithOctave): boolean {
  const pitchClass = note.replace(/\d/, '') as PentatonicNote
  return (PENTATONIC_NOTES as readonly string[]).includes(pitchClass)
}

/**
 * Retourne toutes les notes disponibles pour un accord donné,
 * filtrées pour ne conserver que les intersections avec la gamme pentatonique.
 */
export function getChordPentatonicNotes(
  chordNotes: readonly string[],
): NoteWithOctave[] {
  return chordNotes.filter((n): n is NoteWithOctave =>
    PENTATONIC_NOTES.some((p) => n.startsWith(p)),
  )
}
