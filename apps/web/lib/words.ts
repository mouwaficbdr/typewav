/**
 * Listes de mots pour le mode classique, apprentissage et niveaux adaptatifs.
 * Tous les mots sont en domaine public.
 *
 * Organisés par longueur pour la difficulté adaptative.
 */

import { LEARNING_LEVELS } from '@typewav/types';

/** Mots courts (2-4 lettres) — niveau facile */
export const WORDS_EASY = [
  'le',
  'la',
  'les',
  'de',
  'du',
  'un',
  'une',
  'en',
  'et',
  'ou',
  'est',
  'son',
  'sur',
  'par',
  'pas',
  'que',
  'qui',
  'l',
  'se',
  'si',
  'au',
  'aux',
  'ce',
  'il',
  'elle',
  'on',
  'je',
  'tu',
  'nous',
  'vous',
  'the',
  'of',
  'to',
  'and',
  'in',
  'is',
  'it',
  'be',
  'as',
  'at',
  'so',
  'we',
  'he',
  'by',
  'do',
  'if',
  'me',
  'my',
  'up',
  'an',
];

/** Mots moyens (5-7 lettres) — niveau normal */
export const WORDS_NORMAL = [
  'monde',
  'temps',
  'place',
  'homme',
  'femme',
  'faire',
  'grand',
  'entre',
  'aussi',
  'après',
  'avant',
  'toute',
  'comme',
  'autre',
  'selon',
  'while',
  'every',
  'first',
  'could',
  'their',
  'found',
  'watch',
  'night',
  'write',
  'under',
  'never',
  'times',
  'those',
  'light',
  'about',
  'heart',
  'think',
  'bring',
  'house',
  'learn',
  'music',
  'place',
  'today',
  'below',
  'order',
  'power',
  'point',
];

/** Mots longs (8-10 lettres) — niveau difficile */
export const WORDS_HARD = [
  'formation',
  'possible',
  'quelques',
  'toujours',
  'ensemble',
  'prochaine',
  'politique',
  'question',
  'exemple',
  'distance',
  'beautiful',
  'question',
  'together',
  'standard',
  'function',
  'keyboard',
  'practice',
  'accuracy',
  'language',
  'thousand',
  'sentence',
  'children',
  'complete',
  'mountain',
  'progress',
  'learning',
  'software',
  'position',
  'personal',
  'building',
];

/** Mots très longs (11+ lettres) — niveau expert */
export const WORDS_EXPERT = [
  'développement',
  'organisation',
  'performance',
  'apprentissage',
  'programmation',
  'environnement',
  'communication',
  'technologie',
  'information',
  'architecture',
  'intelligence',
  'connaissance',
  'understanding',
  'development',
  'relationship',
  'professional',
  'productivity',
  'independently',
  'concentration',
  'immediately',
  'approximately',
  'deliberately',
  'configuration',
  'investigation',
];

/** Mots Home Row (uniquement les touches asdf jkl;) */
export const WORDS_HOME_ROW = [
  'flask',
  'lads',
  'lass',
  'ala',
  'fads',
  'jade',
  'jades',
  'fake',
  'faked',
  'dads',
  'adds',
  'asks',
  'sash',
  'flash',
  'slash',
  'flask',
  'salad',
  'falls',
  'halls',
  'balls',
  'calls',
  // Mots Home Row anglais purs (a, s, d, f, j, k, l uniquement)
  'alas',
  'fall',
  'hall',
  'jall',
  'lads',
  'lass',
  'fads',
  'dads',
  'adds',
  'asks',
  'salads',
  'flak',
  'flags',
  'flasks',
];

/** Sélectionne des mots aléatoires d'une liste */
export function pickRandomWords(words: string[], count: number): string[] {
  const result: string[] = [];
  const available = [...words];

  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx] as string);
    available.splice(idx, 1);

    // Recycler si on n'a pas assez de mots uniques
    if (available.length === 0) available.push(...words);
  }

  return result;
}

/**
 * Génère un texte de test avec N mots selon le niveau de complexité.
 * complexity: 1 (très simple) → 5 (expert)
 */
export function generateWordList(complexity: number, wordCount = 30): string {
  const level = Math.max(1, Math.min(5, complexity));

  let pool: string[];
  if (level === 1) pool = WORDS_EASY;
  else if (level === 2) pool = [...WORDS_EASY, ...WORDS_NORMAL];
  else if (level === 3) pool = WORDS_NORMAL;
  else if (level === 4) pool = [...WORDS_NORMAL, ...WORDS_HARD];
  else pool = [...WORDS_HARD, ...WORDS_EXPERT];

  return pickRandomWords(pool, wordCount).join(' ');
}

/** Ne garde que les mots dont toutes les lettres sont dans `allowedKeys`. */
function filterWordsByKeys(words: string[], allowedKeys: string[]): string[] {
  if (allowedKeys.length === 0) return words;
  const allowed = new Set(allowedKeys.map((k) => k.toLowerCase()));
  return words.filter((word) =>
    word
      .toLowerCase()
      .split('')
      .every((ch) => allowed.has(ch)),
  );
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0]!.toUpperCase() + word.slice(1);
}

const SENTENCE_TERMINATORS = ['.', '!', '?'];
const SENTENCE_LENGTH = 5;

/**
 * Génère un texte avec majuscules de début de phrase et ponctuation —
 * niveau 5 "Shift & Punctuation". Le thème du niveau est justement
 * d'introduire Shift et la ponctuation, donc leur présence est garantie
 * plutôt que laissée au hasard.
 */
function generatePunctuatedText(wordCount: number): string {
  const words = pickRandomWords([...WORDS_NORMAL, ...WORDS_HARD], wordCount);

  const sentences: string[] = [];
  for (let start = 0; start < words.length; start += SENTENCE_LENGTH) {
    const sentenceWords = words.slice(start, start + SENTENCE_LENGTH);
    if (sentenceWords.length === 0) continue;

    const [first, ...rest] = sentenceWords;
    const capitalized = capitalize(first!);
    // Virgule après le deuxième mot pour les phrases assez longues.
    const withComma =
      rest.length >= 2 ? [`${rest[0]},`, ...rest.slice(1)] : rest;
    const terminator =
      SENTENCE_TERMINATORS[sentences.length % SENTENCE_TERMINATORS.length]!;

    sentences.push(`${[capitalized, ...withComma].join(' ')}${terminator}`);
  }

  return sentences.join(' ');
}

/**
 * Génère un texte pour le mode Apprentissage selon le niveau.
 * Les mots n'utilisent que les touches autorisées au niveau courant.
 */
export function generateLearningText(levelId: number, wordCount = 20): string {
  if (levelId === 1) {
    const allowedKeys = LEARNING_LEVELS.find((l) => l.id === 1)?.keys ?? [];
    const filtered = filterWordsByKeys(WORDS_HOME_ROW, allowedKeys);
    const pool = filtered.length > 0 ? filtered : WORDS_HOME_ROW;
    return pickRandomWords(pool, wordCount).join(' ');
  }

  if (levelId === 5) {
    return generatePunctuatedText(wordCount);
  }

  // Pour les niveaux 2-4, utiliser des mots de difficulté croissante
  const basePool =
    levelId === 2
      ? WORDS_EASY
      : levelId === 3
        ? [...WORDS_EASY, ...WORDS_NORMAL]
        : WORDS_NORMAL;

  const allowedKeys =
    LEARNING_LEVELS.find((l) => l.id === levelId)?.keys ?? [];
  const filtered = filterWordsByKeys(basePool, allowedKeys);
  const pool = filtered.length > 0 ? filtered : basePool;

  return pickRandomWords(pool, wordCount).join(' ');
}
