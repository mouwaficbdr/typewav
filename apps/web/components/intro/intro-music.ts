/**
 * Musique de l'Ouverture : une suite écrite, jouée au piano par `playNoteName`,
 * jamais par le séquenceur (voir spec partie B, écran 2 : le séquenceur trie
 * les notes simultanées par hauteur croissante et `playNote` applique
 * l'expression de frappe, ce qui déforme cette phrase précise).
 */

/** « les notes » / « the notes », notes du fichier fur_Elise_WoO59.mid, vérifiées. */
export const INTRO_MELODY: readonly (readonly string[])[] = [
  ['E5'],
  ['D#5'],
  ['E5'],
  ['D#5'],
  ['E5'],
  ['B4'],
  ['D5'],
  ['C5'],
  ['A4', 'A2'],
];

/** La phrase des six notes de la portée, une par écran : do4 mi4 sol4 la4 sol4 do5. */
export const STAFF_PHRASE: readonly string[] = [
  'C4',
  'E4',
  'G4',
  'A4',
  'G4',
  'C5',
];

/** L'accord de conclusion sur l'écran 6. */
export const FINAL_CHORD: readonly string[] = ['C4', 'E4', 'G4', 'C5'];

/** Au-delà de ce délai sans piano prêt, l'écran 1 continue sans son. */
export const SAMPLER_WAIT_MS = 8000;

/**
 * Joue les notes d'un accord ensemble. Ne joue jamais rien (jamais de
 * synthé de repli) si le piano n'est pas prêt : règle absolue de l'Ouverture.
 */
export async function playChord(
  notes: readonly string[],
  play: (note: string) => Promise<void>,
  isReady: () => boolean,
): Promise<boolean> {
  if (!isReady()) return false;
  await Promise.all(notes.map((note) => play(note)));
  return true;
}
