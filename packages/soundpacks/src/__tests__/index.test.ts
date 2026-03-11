import { describe, expect, it } from 'vitest';
import {
  ALL_SOUND_PACKS,
  PREMIUM_SOUND_PACKS,
  cinematicPack,
  jazzPianoPack,
  pianoPack,
  synthLofiPack,
} from '../index';

describe('soundpacks — index', () => {
  it('ALL_SOUND_PACKS contient exactement piano et synth-lofi', () => {
    expect(ALL_SOUND_PACKS).toEqual(['piano', 'synth-lofi']);
  });

  it('PREMIUM_SOUND_PACKS contient exactement cinematic et jazz-piano', () => {
    expect(PREMIUM_SOUND_PACKS).toEqual(['cinematic', 'jazz-piano']);
  });

  it('cinematicPack.instrument est strings', () => {
    expect(cinematicPack.instrument).toBe('strings');
  });

  it('aucun pack ne référence baseUrl (code mort supprimé)', () => {
    const packs = [pianoPack, synthLofiPack, cinematicPack, jazzPianoPack];
    for (const pack of packs) {
      expect((pack as Record<string, unknown>)['baseUrl']).toBeUndefined();
    }
  });
});
