import { describe, expect, it } from 'vitest';
import { ALL_SOUND_PACKS, pianoPack } from '../index';

describe('soundpacks : index', () => {
  it('ALL_SOUND_PACKS contient exactement piano', () => {
    expect(ALL_SOUND_PACKS).toEqual(['piano']);
  });

  it('aucun pack ne référence baseUrl (code mort supprimé)', () => {
    expect(
      (pianoPack as unknown as Record<string, unknown>)['baseUrl'],
    ).toBeUndefined();
  });
});
