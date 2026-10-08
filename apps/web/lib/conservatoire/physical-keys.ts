/**
 * Le clavier physique du Conservatoire, décrit par `KeyboardEvent.code` :
 * position, taille, doigt et rangée ne dépendent que de la position ; seuls
 * les libellés dépendent de la disposition. Géométrie en unités de viewBox,
 * reprise de `KeyboardDiagramAzerty` (pas de 32, touche de 28).
 * Spec : 2026-10-08-conservatoire-v1-design.md, partie 2.
 */

import type { FingerId } from '@typewav/types';
import type { KeyboardLayout } from '../keyboardLayouts';

export type PhysicalRow = 'digits' | 'top' | 'home' | 'bottom' | 'mods';

export interface PhysicalKey {
  code: string;
  row: PhysicalRow;
  finger: FingerId;
  x: number;
  y: number;
  w: number;
  h: number;
  labels: Record<KeyboardLayout, string>;
  /** Les repères tactiles de F et J. */
  bump?: true;
}

const KEY = 28;
const PITCH = 32;
const ROW_Y: Record<PhysicalRow, number> = {
  digits: 4,
  top: 36,
  home: 68,
  bottom: 100,
  mods: 132,
};

export const KEYBOARD_VIEW = { width: 416, height: 164 } as const;

type Entry = [code: string, azerty: string, qwerty: string, finger: FingerId];

function row(name: PhysicalRow, x0: number, entries: Entry[]): PhysicalKey[] {
  return entries.map(([code, azerty, qwerty, finger], i) => ({
    code,
    row: name,
    finger,
    x: x0 + i * PITCH,
    y: ROW_Y[name],
    w: KEY,
    h: KEY,
    labels: { azerty, qwerty },
    ...(code === 'KeyF' || code === 'KeyJ' ? { bump: true as const } : {}),
  }));
}

export const PHYSICAL_KEYS: readonly PhysicalKey[] = [
  ...row('digits', 0, [
    ['Backquote', '²', '`', 'LP'],
    ['Digit1', '&', '1', 'LP'],
    ['Digit2', 'é', '2', 'LR'],
    ['Digit3', '"', '3', 'LM'],
    ['Digit4', "'", '4', 'LI'],
    ['Digit5', '(', '5', 'LI'],
    ['Digit6', '-', '6', 'RI'],
    ['Digit7', 'è', '7', 'RI'],
    ['Digit8', '_', '8', 'RM'],
    ['Digit9', 'ç', '9', 'RR'],
    ['Digit0', 'à', '0', 'RP'],
    ['Minus', ')', '-', 'RP'],
    ['Equal', '=', '=', 'RP'],
  ]),
  ...row('top', 8, [
    ['KeyQ', 'a', 'q', 'LP'],
    ['KeyW', 'z', 'w', 'LR'],
    ['KeyE', 'e', 'e', 'LM'],
    ['KeyR', 'r', 'r', 'LI'],
    ['KeyT', 't', 't', 'LI'],
    ['KeyY', 'y', 'y', 'RI'],
    ['KeyU', 'u', 'u', 'RI'],
    ['KeyI', 'i', 'i', 'RM'],
    ['KeyO', 'o', 'o', 'RR'],
    ['KeyP', 'p', 'p', 'RP'],
    ['BracketLeft', '^', '[', 'RP'],
    ['BracketRight', '$', ']', 'RP'],
  ]),
  ...row('home', 16, [
    ['KeyA', 'q', 'a', 'LP'],
    ['KeyS', 's', 's', 'LR'],
    ['KeyD', 'd', 'd', 'LM'],
    ['KeyF', 'f', 'f', 'LI'],
    ['KeyG', 'g', 'g', 'LI'],
    ['KeyH', 'h', 'h', 'RI'],
    ['KeyJ', 'j', 'j', 'RI'],
    ['KeyK', 'k', 'k', 'RM'],
    ['KeyL', 'l', 'l', 'RR'],
    ['Semicolon', 'm', ';', 'RP'],
    ['Quote', 'ù', "'", 'RP'],
    ['Backslash', '*', '\\', 'RP'],
  ]),
  ...row('bottom', 24, [
    ['KeyZ', 'w', 'z', 'LP'],
    ['KeyX', 'x', 'x', 'LR'],
    ['KeyC', 'c', 'c', 'LM'],
    ['KeyV', 'v', 'v', 'LI'],
    ['KeyB', 'b', 'b', 'LI'],
    ['KeyN', 'n', 'n', 'RI'],
    ['KeyM', ',', 'm', 'RI'],
    ['Comma', ';', ',', 'RM'],
    ['Period', ':', '.', 'RR'],
    ['Slash', '!', '/', 'RP'],
  ]),
  { code: 'ShiftLeft', row: 'mods', finger: 'LP', x: 0, y: ROW_Y.mods, w: 72, h: KEY, labels: { azerty: 'Maj', qwerty: 'Shift' } },
  { code: 'Space', row: 'mods', finger: 'RT', x: 150, y: ROW_Y.mods, w: 140, h: KEY, labels: { azerty: '', qwerty: '' } },
  { code: 'ShiftRight', row: 'mods', finger: 'RP', x: 330, y: ROW_Y.mods, w: 82, h: KEY, labels: { azerty: 'Maj', qwerty: 'Shift' } },
];

const BY_CODE = new Map(PHYSICAL_KEYS.map((k) => [k.code, k]));
const CODE_BY_AZERTY = new Map(
  PHYSICAL_KEYS.filter((k) => k.row !== 'mods').map((k) => [k.labels.azerty, k.code]),
);

export function keyByCode(code: string): PhysicalKey | undefined {
  return BY_CODE.get(code);
}

/** La position d'un caractère de base AZERTY (`physical` d'un geste du curriculum). */
export function codeForAzertyChar(char: string): string | undefined {
  return CODE_BY_AZERTY.get(char);
}

/** Les huit repères de la rangée du milieu, de l'auriculaire gauche à l'auriculaire droit. */
export const HOME_SCALE: readonly string[] = [
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon',
];
