import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

// Construits depuis leurs points de code : ce fichier ne contient jamais les
// caractères qu'il interdit.
const FORBIDDEN_DASHES = new RegExp(
  `[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`,
);

function leaves(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function values(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (typeof node !== 'object' || node === null) return [];
  return Object.values(node).flatMap(values);
}

describe('textes du Conservatoire', () => {
  it('fr et en ont exactement les mêmes clés', () => {
    const frRoot = (fr as Record<string, unknown>).conservatoire;
    const enRoot = (en as Record<string, unknown>).conservatoire;
    expect(frRoot).toBeDefined();
    expect(leaves(enRoot).sort()).toEqual(leaves(frRoot).sort());
    expect((en.nav as Record<string, string>).conservatoire).toBeTruthy();
    expect((fr.nav as Record<string, string>).conservatoire).toBeTruthy();
  });

  it('aucun tiret cadratin ni demi-cadratin', () => {
    for (const msgs of [fr, en]) {
      for (const text of values((msgs as Record<string, unknown>).conservatoire)) {
        expect(text).not.toMatch(FORBIDDEN_DASHES);
      }
    }
  });
});
