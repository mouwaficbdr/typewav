import { describe, expect, it } from 'vitest';
import {
  HOME_ROW_AZERTY,
  mapKeyForLayout,
  resolvePhysicalKey,
} from '../keyboardLayouts';

describe('mapKeyForLayout (rendu : position physique → caractère affiché)', () => {
  it('renvoie la touche inchangée en qwerty', () => {
    expect(mapKeyForLayout('q', 'qwerty')).toBe('q');
    expect(mapKeyForLayout('a', 'qwerty')).toBe('a');
    expect(mapKeyForLayout('s', 'qwerty')).toBe('s');
  });

  it('échange q/a et w/z en azerty (vrais échanges à 2 positions)', () => {
    expect(mapKeyForLayout('q', 'azerty')).toBe('a');
    expect(mapKeyForLayout('a', 'azerty')).toBe('q');
    expect(mapKeyForLayout('w', 'azerty')).toBe('z');
    expect(mapKeyForLayout('z', 'azerty')).toBe('w');
  });

  it("';' affiche 'm', et 'm' affiche ',' : pas un échange à 2, deux relabellings distincts", () => {
    expect(mapKeyForLayout(';', 'azerty')).toBe('m');
    expect(mapKeyForLayout('m', 'azerty')).toBe(',');
  });

  it('laisse les touches non affectées inchangées en azerty', () => {
    expect(mapKeyForLayout('s', 'azerty')).toBe('s');
    expect(mapKeyForLayout('d', 'azerty')).toBe('d');
    expect(mapKeyForLayout('f', 'azerty')).toBe('f');
    expect(mapKeyForLayout('j', 'azerty')).toBe('j');
    expect(mapKeyForLayout('k', 'azerty')).toBe('k');
    expect(mapKeyForLayout('l', 'azerty')).toBe('l');
  });
});

describe('resolvePhysicalKey (lecture : caractère tapé → position physique)', () => {
  it('renvoie le caractère inchangé en qwerty', () => {
    expect(resolvePhysicalKey('a', 'qwerty')).toBe('a');
  });

  it('retrouve la bonne position physique pour chaque caractère réellement tapé en azerty', () => {
    expect(resolvePhysicalKey('a', 'azerty')).toBe('q');
    expect(resolvePhysicalKey('q', 'azerty')).toBe('a');
    expect(resolvePhysicalKey('z', 'azerty')).toBe('w');
    expect(resolvePhysicalKey('w', 'azerty')).toBe('z');
    expect(resolvePhysicalKey('m', 'azerty')).toBe(';');
    expect(resolvePhysicalKey(',', 'azerty')).toBe('m');
  });

  it('est bien la fonction réciproque de mapKeyForLayout pour chaque touche affectée', () => {
    for (const physicalId of ['q', 'a', 'w', 'z', ';', 'm']) {
      const displayed = mapKeyForLayout(physicalId, 'azerty');
      expect(resolvePhysicalKey(displayed, 'azerty')).toBe(physicalId);
    }
  });
});

describe('HOME_ROW_AZERTY', () => {
  it("contient les 8 touches de la rangée du repos physique en AZERTY, sans voyelle", () => {
    expect(HOME_ROW_AZERTY).toEqual(['q', 's', 'd', 'f', 'j', 'k', 'l', 'm']);
    expect(HOME_ROW_AZERTY).not.toContain('a');
    expect(HOME_ROW_AZERTY).not.toContain('e');
  });
});
