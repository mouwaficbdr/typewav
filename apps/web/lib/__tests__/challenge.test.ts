import type { ChallengeParams } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import {
  decodeChallenge,
  encodeChallenge,
  generateChallengeLink,
  getChallengeText,
  hashText,
} from '../challenge';

const SAMPLE_PARAMS: ChallengeParams = {
  textHash: 'abc12345',
  textB64: btoa('hello world')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, ''),
  duration: 60000,
  mode: 'classic',
  creatorWpm: 72,
};

describe('encodeChallenge / decodeChallenge', () => {
  it('round-trip — encode puis decode retourne les mêmes données', () => {
    const encoded = encodeChallenge(SAMPLE_PARAMS);
    const decoded = decodeChallenge(encoded);
    expect(decoded).toEqual(SAMPLE_PARAMS);
  });

  it('produit une chaîne base64url sans +, /, ni =', () => {
    const encoded = encodeChallenge(SAMPLE_PARAMS);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('lève une erreur si le payload est invalide', () => {
    expect(() => decodeChallenge('!!!invalid!!!')).toThrow();
  });

  it('lève une erreur si les champs requis sont manquants', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ textHash: 'x' }));
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    expect(() => decodeChallenge(b64)).toThrow('Invalid challenge data');
  });
});

describe('generateChallengeLink', () => {
  it('produit une URL contenant /challenge?c=', () => {
    const url = generateChallengeLink('hello world', {
      duration: 60000,
      mode: 'classic',
      creatorWpm: 65,
    });
    expect(url).toContain('/challenge?c=');
  });

  it('reste sous 2048 caractères avec un texte long', () => {
    const longText = 'Lorem ipsum dolor sit amet '.repeat(30);
    const url = generateChallengeLink(longText, {
      duration: 60000,
      mode: 'classic',
    });
    expect(url.length).toBeLessThanOrEqual(2048);
  });

  it('le textHash correspond au texte extrait', () => {
    const text = 'TypeWav challenge test';
    const url = generateChallengeLink(text, {
      duration: 30000,
      mode: 'sprint',
    });
    const encoded = url.split('?c=')[1]!;
    const params = decodeChallenge(encoded);
    const extractedText = getChallengeText(params);
    expect(params.textHash).toBe(hashText(extractedText));
  });

  it('getChallengeText restitue le texte original', () => {
    const original = 'le renard brun saute par-dessus le chien paresseux';
    const url = generateChallengeLink(original, {
      duration: 60000,
      mode: 'classic',
    });
    const encoded = url.split('?c=')[1]!;
    const params = decodeChallenge(encoded);
    expect(getChallengeText(params)).toBe(original);
  });
});

describe('hashText', () => {
  it('deux textes identiques → même hash', () => {
    expect(hashText('hello')).toBe(hashText('hello'));
  });

  it('deux textes différents → hash différents (quasi-certitude)', () => {
    expect(hashText('hello')).not.toBe(hashText('world'));
  });

  it('retourne une chaîne hex de 8 chars', () => {
    expect(hashText('')).toMatch(/^[0-9a-f]{8}$/);
    expect(hashText('TypeWav')).toMatch(/^[0-9a-f]{8}$/);
  });
});
