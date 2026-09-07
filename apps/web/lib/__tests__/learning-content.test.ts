import { describe, expect, it } from 'vitest';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import type { KeyMastery } from '../learning-progress';
import {
  generateLearningDrill,
  mapCharToGestureId,
  pickLearningText,
  pickLearningWords,
} from '../learning-content';

const L2 = LEARNING_CURRICULUM_AZERTY[1]!; // home-row drill : poolKeys === newKeys
const L3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row drill : poolKeys 20, newKeys 10
const L5 = LEARNING_CURRICULUM_AZERTY[4]!; // first-words
const L7 = LEARNING_CURRICULUM_AZERTY[6]!; // direct-accents
const L8 = LEARNING_CURRICULUM_AZERTY[7]!; // dead-keys
const L9 = LEARNING_CURRICULUM_AZERTY[8]!; // punctuation (text)
const L11 = LEARNING_CURRICULUM_AZERTY[10]!; // full-score (text)

describe('mapCharToGestureId', () => {
  it('lettre minuscule ou majuscule renvoie elle-meme', () => {
    expect(mapCharToGestureId('a')).toBe('a');
    expect(mapCharToGestureId('z')).toBe('z');
    expect(mapCharToGestureId('E')).toBe('E');
    expect(mapCharToGestureId('P')).toBe('P');
  });

  it('accent direct AZERTY renvoie lui-meme', () => {
    expect(mapCharToGestureId('é')).toBe('é');
    expect(mapCharToGestureId('è')).toBe('è');
    expect(mapCharToGestureId('à')).toBe('à');
    expect(mapCharToGestureId('ç')).toBe('ç');
    expect(mapCharToGestureId('ù')).toBe('ù');
  });

  it('voyelle circonflexe ou trema renvoie un id de touche morte', () => {
    expect(mapCharToGestureId('â')).toBe('^a');
    expect(mapCharToGestureId('ê')).toBe('^e');
    expect(mapCharToGestureId('î')).toBe('^i');
    expect(mapCharToGestureId('ô')).toBe('^o');
    expect(mapCharToGestureId('û')).toBe('^u');
    expect(mapCharToGestureId('ë')).toBe('¨e');
    expect(mapCharToGestureId('ï')).toBe('¨i');
    expect(mapCharToGestureId('ü')).toBe('¨u');
  });

  it('chiffre et ponctuation du curriculum renvoient eux-memes', () => {
    expect(mapCharToGestureId('0')).toBe('0');
    expect(mapCharToGestureId('5')).toBe('5');
    expect(mapCharToGestureId('9')).toBe('9');
    for (const p of ['.', ',', ';', ':', '!', '?', "'", '-']) {
      expect(mapCharToGestureId(p)).toBe(p);
    }
  });

  it('espace et tout caractere hors curriculum renvoient une chaine vide', () => {
    expect(mapCharToGestureId(' ')).toBe('');
    expect(mapCharToGestureId('@')).toBe('');
    expect(mapCharToGestureId('%')).toBe('');
    expect(mapCharToGestureId('œ')).toBe('');
    expect(mapCharToGestureId('')).toBe('');
  });
});

describe('generateLearningDrill', () => {
  it('L3 : n emet que des caracteres presents dans poolKeys (plus espace)', () => {
    const pool = new Set(L3.poolKeys);
    const out = generateLearningDrill(L3, {}, 40);
    expect(out.length).toBeGreaterThan(0);
    for (const ch of out) {
      if (ch === ' ') continue;
      expect(pool.has(ch)).toBe(true);
    }
  });

  it('L3 : concentre les repetitions sur la newKey la plus faible', () => {
    const weak = L3.newKeys[4]!.id;
    const mastery: KeyMastery = {};
    for (const k of L3.newKeys) mastery[k.id] = { correct: 20, total: 20 };
    mastery[weak] = { correct: 1, total: 20 }; // 5 %
    const out = generateLearningDrill(L3, mastery, 60).replace(/ /g, '');
    const weakShare = [...out].filter((c) => c === weak).length / out.length;
    const otherNewKey = L3.newKeys[0]!.id;
    const otherShare =
      [...out].filter((c) => c === otherNewKey).length / out.length;
    expect(weakShare).toBeGreaterThan(otherShare);
  });

  it('L3 (poolKeys superset strict de newKeys) : densite des newKeys entre 40 % et 60 %', () => {
    const newIds = new Set(L3.newKeys.map((k) => k.id));
    const out = generateLearningDrill(L3, {}, 80).replace(/ /g, '');
    const density = [...out].filter((c) => newIds.has(c)).length / out.length;
    expect(density).toBeGreaterThanOrEqual(0.4);
    expect(density).toBeLessThanOrEqual(0.6);
  });

  it('L2 (poolKeys === newKeys) : sortie dans le pool et biais vers la touche faible', () => {
    const poolL2 = new Set(L2.poolKeys);
    const plain = generateLearningDrill(L2, {}, 40);
    expect(plain.length).toBeGreaterThan(0);
    for (const ch of plain) {
      if (ch === ' ') continue;
      expect(poolL2.has(ch)).toBe(true);
    }

    const weak = L2.newKeys[0]!.id;
    const other = L2.newKeys[1]!.id;
    const mastery: KeyMastery = {};
    for (const k of L2.newKeys) mastery[k.id] = { correct: 20, total: 20 };
    mastery[weak] = { correct: 1, total: 20 };
    const out = generateLearningDrill(L2, mastery, 60).replace(/ /g, '');
    const weakShare = [...out].filter((c) => c === weak).length / out.length;
    const otherShare = [...out].filter((c) => c === other).length / out.length;
    expect(weakShare).toBeGreaterThan(otherShare);
  });

  it('longueurs de groupes entre 2 et 7', () => {
    const groups = generateLearningDrill(L3, {}, 30).split(' ');
    expect(groups.length).toBe(30);
    for (const g of groups) {
      expect(g.length).toBeGreaterThanOrEqual(2);
      expect(g.length).toBeLessThanOrEqual(7);
    }
  });
});

describe('pickLearningWords', () => {
  it('first-words : que des mots sans accent, chaque lettre dans poolKeys', () => {
    const pool = new Set(L5.poolKeys);
    const out = pickLearningWords(L5, 20);
    for (const w of out.split(' ')) {
      expect(/[éèàçùâêîôûëïü]/.test(w)).toBe(false);
      for (const ch of w) expect(pool.has(ch)).toBe(true);
    }
  });

  it('direct-accents : au moins un mot contient un accent direct', () => {
    const out = pickLearningWords(L7, 20);
    expect(/[éèàçù]/.test(out)).toBe(true);
  });

  it('dead-keys : garde les mots a circonflexe (ê passe par ^e dans poolKeys)', () => {
    const out = pickLearningWords(L8, 30);
    expect(/[âêîôûëïü]/.test(out)).toBe(true);
  });

  it('jamais une chaine vide', () => {
    expect(pickLearningWords(L5, 20).trim().length).toBeGreaterThan(0);
    expect(pickLearningWords(L7, 20).trim().length).toBeGreaterThan(0);
    expect(pickLearningWords(L8, 20).trim().length).toBeGreaterThan(0);
  });
});

describe('pickLearningText', () => {
  it('punctuation : renvoie un paragraphe long', () => {
    expect(pickLearningText(L9).length).toBeGreaterThan(100);
  });

  it('full-score : paragraphe avec majuscule, accent, ponctuation et chiffre', () => {
    const t = pickLearningText(L11);
    expect(
      /[A-Z]/.test(t) &&
        /[éèàçùâêîôûëïü]/.test(t) &&
        /[.,;:!?]/.test(t) &&
        /[0-9]/.test(t),
    ).toBe(true);
  });
});
