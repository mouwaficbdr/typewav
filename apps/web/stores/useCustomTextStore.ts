'use client';

/**
 * useCustomTextStore : texte personnel actif pour le mode Libre.
 *
 * Volontairement non persisté : le texte actif est propre à la session de
 * frappe en cours, pas une préférence durable. Les textes eux-mêmes vivent
 * dans IndexedDB (lib/db.ts, store personal_texts) ; ce store ne retient que
 * quel texte est actuellement sélectionné.
 */

import { create } from 'zustand';

interface CustomTextState {
  activePersonalTextId: string | null;
}

interface CustomTextActions {
  setActivePersonalTextId: (id: string | null) => void;
}

export const useCustomTextStore = create<CustomTextState & CustomTextActions>(
  (set) => ({
    activePersonalTextId: null,
    setActivePersonalTextId: (id) => set({ activePersonalTextId: id }),
  }),
);
