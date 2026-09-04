'use client';

/**
 * useKeyboardLayoutPreference — disposition de clavier physique choisie par
 * l'utilisateur (azerty, qwerty...), persistée dans IndexedDB
 * (user_preferences). Consommée par le clavier visuel du mode Apprentissage
 * pour suivre le vrai clavier physique de la personne plutôt qu'un QWERTY
 * figé (voir ticket #62).
 */

import { getPreference, setPreference } from '@/lib/db';
import { useEffect, useState } from 'react';

export type KeyboardLayout = 'qwerty' | 'azerty';

export const KEYBOARD_LAYOUTS: readonly KeyboardLayout[] = [
  'qwerty',
  'azerty',
];

const PREFERENCE_KEY = 'keyboardLayout';
const DEFAULT_LAYOUT: KeyboardLayout = 'qwerty';

export function useKeyboardLayoutPreference() {
  const [layout, setLayoutState] = useState<KeyboardLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    getPreference<KeyboardLayout>(PREFERENCE_KEY)
      .then((stored) => {
        if (stored) setLayoutState(stored);
      })
      .catch(() => undefined);
  }, []);

  function setLayout(next: KeyboardLayout) {
    setLayoutState(next);
    void setPreference(PREFERENCE_KEY, next).catch(() => undefined);
  }

  return { layout, setLayout };
}
