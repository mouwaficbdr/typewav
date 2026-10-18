/**
 * La rangée de repos : huit touches physiques, une gamme de do4 à do5.
 * Main gauche (auriculaire → index) : do ré mi fa. Main droite (index →
 * auriculaire) : sol la si do.
 */
export const HOME_ROW_CODES = [
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyJ',
  'KeyK',
  'KeyL',
  'Semicolon',
] as const;

export type HomeRowCode = (typeof HOME_ROW_CODES)[number];

export const HOME_ROW_NOTES: Record<HomeRowCode, string> = {
  KeyA: 'C4',
  KeyS: 'D4',
  KeyD: 'E4',
  KeyF: 'F4',
  KeyJ: 'G4',
  KeyK: 'A4',
  KeyL: 'B4',
  Semicolon: 'C5',
};

const AZERTY_LABELS: Record<HomeRowCode, string> = {
  KeyA: 'q',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: 'm',
};

const QWERTY_LABELS: Record<HomeRowCode, string> = {
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: ';',
};

export function homeRowLabel(
  code: HomeRowCode,
  layout: 'azerty' | 'qwerty',
): string {
  return layout === 'azerty' ? AZERTY_LABELS[code] : QWERTY_LABELS[code];
}
