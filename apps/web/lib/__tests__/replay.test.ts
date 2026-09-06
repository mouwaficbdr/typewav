import type { ReplayData } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { decodeReplay, encodeReplay, generateReplayLink } from '../replay';

const SAMPLE_REPLAY: ReplayData = {
  sessionId: 'test-session-1',
  text: 'hello world',
  keystrokeTimings: [200, 150, 180, 220, 190, 160, 210, 170, 195, 205, 185],
  wpm: 65,
  accuracy: 97.5,
  theme: 'terminal',
  soundPack: 'piano',
  achievedAt: 1700000000000,
};

describe('encodeReplay / decodeReplay', () => {
  it('round-trip : encode puis decode retourne les mêmes données', () => {
    const encoded = encodeReplay(SAMPLE_REPLAY);
    const decoded = decodeReplay(encoded);
    expect(decoded).toEqual(SAMPLE_REPLAY);
  });

  it('produit une chaîne base64url sans +, /, ni =', () => {
    const encoded = encodeReplay(SAMPLE_REPLAY);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('lève une erreur si le payload est invalide', () => {
    const invalid = btoa('not valid json');
    expect(() => decodeReplay(invalid)).toThrow();
  });

  it('lève une erreur si les champs requis sont manquants', () => {
    const partial = btoa(JSON.stringify({ sessionId: 'x' }));
    expect(() => decodeReplay(partial)).toThrow('Invalid replay data');
  });

  it('encode des textes avec caractères non-ASCII', () => {
    const withAccents = { ...SAMPLE_REPLAY, text: 'café résumé naïf' };
    const encoded = encodeReplay(withAccents);
    const decoded = decodeReplay(encoded);
    expect(decoded.text).toBe('café résumé naïf');
  });
});

describe('generateReplayLink', () => {
  it('produit une URL contenant /replay?d=', () => {
    const url = generateReplayLink(SAMPLE_REPLAY);
    expect(url).toContain('/replay?d=');
  });

  it('reste sous 2048 caractères même avec beaucoup de timings', () => {
    const longTimings: ReplayData = {
      ...SAMPLE_REPLAY,
      keystrokeTimings: Array.from({ length: 5000 }, () => 180),
    };
    const url = generateReplayLink(longTimings);
    expect(url.length).toBeLessThanOrEqual(2048);
  });

  it('préfixe avec baseUrl si fourni', () => {
    const url = generateReplayLink(SAMPLE_REPLAY, 'https://typewav.mouwaficbdr.me');
    expect(url).toMatch(/^https:\/\/typewav\.mouwaficbdr\.me\/replay\?d=/);
  });
});
