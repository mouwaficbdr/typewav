import { beforeEach, describe, expect, it } from 'vitest';
import { useCustomTextStore } from '../useCustomTextStore';

beforeEach(() => {
  useCustomTextStore.setState({ activePersonalTextId: null });
});

describe('useCustomTextStore', () => {
  it("démarre avec aucun texte personnel actif", () => {
    expect(useCustomTextStore.getState().activePersonalTextId).toBeNull();
  });

  it('setActivePersonalTextId met à jour l\'id actif', () => {
    useCustomTextStore.getState().setActivePersonalTextId('text-1');
    expect(useCustomTextStore.getState().activePersonalTextId).toBe('text-1');
  });

  it('setActivePersonalTextId(null) efface la sélection', () => {
    useCustomTextStore.getState().setActivePersonalTextId('text-1');
    useCustomTextStore.getState().setActivePersonalTextId(null);
    expect(useCustomTextStore.getState().activePersonalTextId).toBeNull();
  });

  it("n'est pas persisté : pas de clé dans localStorage ou IndexedDB", () => {
    useCustomTextStore.getState().setActivePersonalTextId('text-1');
    expect(Object.keys(window.localStorage)).toHaveLength(0);
  });
});
