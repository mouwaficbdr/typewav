/**
 * note-expression : variation d'octave par mot pour colorer la mélodie.
 *
 * Attention au discours produit : ce module NE réagit PAS à la vitesse ni au
 * rythme de frappe. Il applique un motif d'octave FIXE indexé par le numéro
 * du mot (WORD_OCTAVE_PATTERN), identique quelle que soit la façon de taper.
 * Seul le TEMPO réagit vraiment à la frappe, et c'est le warp-engine qui s'en
 * charge, pas ici.
 */

const NOTE_REGEX = /^([A-G][b#]?)(-?\d+)$/;
const WORD_OCTAVE_PATTERN = [-1, 0, 1, 0] as const;

interface TransposeOptions {
  minOctave?: number;
  maxOctave?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isAlphabetic(char: string): boolean {
  return /^[a-z]$/i.test(char);
}

function isVowel(char: string): boolean {
  return /^[aeiouy]$/i.test(char);
}

export function getTypingOctaveShift(char: string, wordIndex: number): number {
  if (!isAlphabetic(char)) return 0;
  if (isVowel(char)) return 0;

  const normalizedWordIndex = Number.isFinite(wordIndex)
    ? Math.max(0, Math.floor(wordIndex))
    : 0;

  return WORD_OCTAVE_PATTERN[
    normalizedWordIndex % WORD_OCTAVE_PATTERN.length
  ] as number;
}

export function transposeNoteOctaves(
  note: string,
  octaveShift: number,
  options: TransposeOptions = {},
): string {
  const match = NOTE_REGEX.exec(note.trim());
  if (!match) return note;

  const minOctave = options.minOctave ?? 2;
  const maxOctave = options.maxOctave ?? 6;
  const pitchClass = match[1] ?? '';
  const octave = Number(match[2]);

  if (!Number.isFinite(octave)) return note;

  const shiftedOctave = clamp(octave + octaveShift, minOctave, maxOctave);
  return `${pitchClass}${shiftedOctave}`;
}

export function applyTypingExpression(
  note: string,
  char: string,
  wordIndex: number,
): string {
  const shift = getTypingOctaveShift(char, wordIndex);
  if (shift === 0) return note;

  return transposeNoteOctaves(note, shift);
}
