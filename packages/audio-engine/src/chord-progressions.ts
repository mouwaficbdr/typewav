/**
 * Progressions d'accords par thème.
 * Spec : docs/specs/01-audio-engine.md (progressions d'accords)
 *
 * À chaque nouveau mot, on avance d'un accord dans la progression.
 * Les notes du mot sont contraintes aux notes de l'accord courant
 * intersectées avec la gamme pentatonique.
 */

/** Identifiants de thèmes disposant d'une progression d'accords */
export type ChordProgressionTheme =
  | 'terminal'
  | 'noir'
  | 'midnight-sun'
  | 'arcade'

export interface Chord {
  /** Symbole de l'accord (ex: 'Am', 'Cmaj7') */
  symbol: string
  /** Notes constitutives (hauteurs sans octave, ex: ['A', 'C', 'E']) */
  notes: readonly string[]
}

export interface ChordProgression {
  themeId: ChordProgressionTheme
  chords: readonly [Chord, Chord, Chord, Chord]
}

/**
 * Catalogue des progressions par thème.
 * Source : docs/specs/01-audio-engine.md
 */
const CHORD_PROGRESSIONS: Record<ChordProgressionTheme, ChordProgression> = {
  terminal: {
    themeId: 'terminal',
    // Am - G - F - Em : progression mineure sombre
    chords: [
      { symbol: 'Am', notes: ['A', 'C', 'E'] },
      { symbol: 'G',  notes: ['G', 'B', 'D'] },
      { symbol: 'F',  notes: ['F', 'A', 'C'] },
      { symbol: 'Em', notes: ['E', 'G', 'B'] },
    ],
  },
  noir: {
    themeId: 'noir',
    // Dm7 - G7 - Cmaj7 - Am7 : progression jazz
    chords: [
      { symbol: 'Dm7',   notes: ['D', 'F', 'A', 'C'] },
      { symbol: 'G7',    notes: ['G', 'B', 'D', 'F'] },
      { symbol: 'Cmaj7', notes: ['C', 'E', 'G', 'B'] },
      { symbol: 'Am7',   notes: ['A', 'C', 'E', 'G'] },
    ],
  },
  'midnight-sun': {
    themeId: 'midnight-sun',
    // Fmaj7 - Am - Em - Cmaj7 : progression ambient
    chords: [
      { symbol: 'Fmaj7', notes: ['F', 'A', 'C', 'E'] },
      { symbol: 'Am',    notes: ['A', 'C', 'E'] },
      { symbol: 'Em',    notes: ['E', 'G', 'B'] },
      { symbol: 'Cmaj7', notes: ['C', 'E', 'G', 'B'] },
    ],
  },
  arcade: {
    themeId: 'arcade',
    // C - G - Am - F : progression majeure pop
    chords: [
      { symbol: 'C',  notes: ['C', 'E', 'G'] },
      { symbol: 'G',  notes: ['G', 'B', 'D'] },
      { symbol: 'Am', notes: ['A', 'C', 'E'] },
      { symbol: 'F',  notes: ['F', 'A', 'C'] },
    ],
  },
}

/**
 * Retourne la progression d'accords pour un thème donné.
 */
export function getChordProgression(
  themeId: ChordProgressionTheme,
): ChordProgression {
  return CHORD_PROGRESSIONS[themeId]
}

/**
 * Retourne l'accord à l'index donné dans la progression (cyclique).
 * L'index avance à chaque nouveau mot.
 */
export function getChordAtIndex(
  themeId: ChordProgressionTheme,
  wordIndex: number,
): Chord {
  const progression = CHORD_PROGRESSIONS[themeId]
  const index = wordIndex % progression.chords.length
  // non-null assertion justifiée : index est toujours dans [0, 3]
  // (modulo sur une longueur fixe de 4)
  return progression.chords[index]!
}

/**
 * Retourne tous les thèmes disponibles.
 */
export function getAvailableThemes(): ChordProgressionTheme[] {
  return Object.keys(CHORD_PROGRESSIONS) as ChordProgressionTheme[]
}
