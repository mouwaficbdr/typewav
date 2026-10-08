/**
 * Détection de la disposition (D10) : par la carte du navigateur quand elle
 * existe (Chromium), sinon à la première touche discriminante pendant
 * l'onboarding. Aucune détection : l'appelant garde AZERTY par défaut.
 */

import type { KeyboardLayout } from '../keyboardLayouts';

const AZERTY_SIGNS: Record<string, string> = { KeyA: 'q', KeyQ: 'a', KeyW: 'z', Semicolon: 'm' };
const QWERTY_SIGNS: Record<string, string> = { KeyA: 'a', KeyQ: 'q', KeyW: 'w', Semicolon: ';' };

export function detectLayoutFromKey(code: string, key: string): KeyboardLayout | null {
  const produced = key.toLowerCase();
  if (produced === '') return null;
  if (AZERTY_SIGNS[code] === produced) return 'azerty';
  if (QWERTY_SIGNS[code] === produced) return 'qwerty';
  return null;
}

interface KeyboardApi {
  getLayoutMap?: () => Promise<{ get(code: string): string | undefined }>;
}

/** `navigator.keyboard.getLayoutMap()`, absent des types DOM, d'où le paramètre `object`. */
export async function detectLayoutFromNavigator(nav: object): Promise<KeyboardLayout | null> {
  try {
    const map = await (nav as { keyboard?: KeyboardApi }).keyboard?.getLayoutMap?.();
    return map ? detectLayoutFromKey('KeyQ', map.get('KeyQ') ?? '') : null;
  } catch {
    return null;
  }
}
