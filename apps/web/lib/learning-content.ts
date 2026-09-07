/**
 * Generateur de contenu du mode Apprentissage (curriculum AZERTY) :
 *  - suites de lettres adaptatives pour les niveaux `drill` (generateLearningDrill)
 *  - mots reels du vocabulaire acquis pour les niveaux `words` (pickLearningWords)
 *  - paragraphes francais pour les niveaux `text` (pickLearningText)
 *
 * Donnees pures : aucun acces IndexedDB, aucun React. Consomme le curriculum
 * (`@typewav/types`), la maitrise par touche (`learning-progress.ts`) et les
 * pools FR (`learning-texts.ts`).
 */

import type { CurriculumLevel } from '@typewav/types';
import type { KeyMastery } from './learning-progress';
import {
  LEARNING_PARAGRAPHS,
  WORDS_FR_ACCENTS,
  WORDS_FR_CIRCUMFLEX,
  WORDS_FR_PLAIN,
  WORDS_FR_PROPER,
} from './learning-texts';

// ─── mapCharToGestureId ──────────────────────────────────────────────────────

/**
 * Correspondance contexte-libre d'un caractere affiche vers l'`id` de geste du
 * curriculum. Sert a filtrer les pools de mots par touches autorisees : un mot
 * est eligible ssi chacun de ses caracteres a un id present dans `poolKeys`.
 *
 *  - lettre minuscule ou majuscule : elle-meme (`id === char`)
 *  - accent direct AZERTY `é è à ç ù` : lui-meme
 *  - voyelle circonflexe ou trema : id de touche morte (`ê` : `'^e'`, `ë` : `'¨e'`)
 *  - chiffre `0` a `9` : lui-meme (ids de chiffres du curriculum : `'1'`..`'0'`)
 *  - ponctuation `. , ; : ! ? ' -` : elle-meme
 *  - espace : `''`
 *  - tout le reste : `''` (aucun geste)
 */
const DEAD_KEY_GESTURE_BY_CHAR: Record<string, string> = {
  â: '^a',
  ê: '^e',
  î: '^i',
  ô: '^o',
  û: '^u',
  ë: '¨e',
  ï: '¨i',
  ü: '¨u',
};

const DIRECT_ACCENT_CHARS = new Set(['é', 'è', 'à', 'ç', 'ù']);
const PUNCTUATION_CHARS = new Set(['.', ',', ';', ':', '!', '?', "'", '-']);

export function mapCharToGestureId(char: string): string {
  if (char === ' ') return '';

  const deadKeyId = DEAD_KEY_GESTURE_BY_CHAR[char];
  if (deadKeyId !== undefined) return deadKeyId;

  if (DIRECT_ACCENT_CHARS.has(char)) return char;
  if (PUNCTUATION_CHARS.has(char)) return char;

  if (char.length === 1) {
    const code = char.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isLower = code >= 97 && code <= 122;
    const isUpper = code >= 65 && code <= 90;
    if (isDigit || isLower || isUpper) return char;
  }

  return '';
}

// ─── generateLearningDrill ───────────────────────────────────────────────────

const DEFAULT_GROUP_COUNT = 12;
const GROUP_MIN_LEN = 2;
const GROUP_MAX_LEN = 7;
/**
 * Bande de densite des `newKeys` visee apres tirage. La spec autorise
 * `[0.40, 0.60]` ; on resserre la cible interne pour garder de la marge face a
 * la variance du tirage (chaque echange deplace la densite de `1 / N`).
 */
const DENSITY_TARGET_LOW = 0.45;
const DENSITY_TARGET_HIGH = 0.55;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted(ids: string[], weightOf: (id: string) => number): string {
  const total = ids.reduce((sum, id) => sum + Math.max(0, weightOf(id)), 0);
  if (total <= 0) return ids[Math.floor(Math.random() * ids.length)] ?? '';
  let r = Math.random() * total;
  for (const id of ids) {
    r -= Math.max(0, weightOf(id));
    if (r <= 0) return id;
  }
  return ids[ids.length - 1] ?? '';
}

/**
 * Deficit d'une touche cible dans `[0, 1]` : `1 - min(samplesRatio, accuracyRatio)`
 * ou les deux ratios sont bornes a `[0, 1]` et calcules sur `mastery[id]` face
 * aux barres du niveau. `0` = touche a niveau, `1` = jamais touchee juste.
 */
function keyDeficit(
  level: CurriculumLevel,
  mastery: KeyMastery,
  id: string,
): number {
  const m = mastery[id];
  const total = m?.total ?? 0;
  const correct = m?.correct ?? 0;
  const samplesRatio =
    level.minSamplesPerKey > 0 ? Math.min(total / level.minSamplesPerKey, 1) : 1;
  const accuracyPct = total > 0 ? (correct / total) * 100 : 0;
  const accuracyRatio =
    level.minAccuracyPerKey > 0
      ? Math.min(accuracyPct / level.minAccuracyPerKey, 1)
      : 1;
  const deficit = 1 - Math.min(samplesRatio, accuracyRatio);
  return Math.min(1, Math.max(0, deficit));
}

function keyReachedBar(
  level: CurriculumLevel,
  mastery: KeyMastery,
  id: string,
): boolean {
  const m = mastery[id];
  if (!m || m.total < level.minSamplesPerKey) return false;
  return (m.correct / m.total) * 100 >= level.minAccuracyPerKey;
}

/**
 * Suite de groupes de lettres separes par des espaces, tires de `level.poolKeys`
 * (ids d'une seule lettre : le cas des niveaux `drill`). Ponderation : chaque
 * `newKey` non encore maitrisee pese `1 + deficit`, toutes les autres touches
 * (acquis anterieur, `newKey` deja maitrisee) pesent `0.25`. La densite des
 * `newKeys` est ensuite ramenee dans `[0.40, 0.60]` par echanges de caracteres
 * apres tirage. Quand `poolKeys` ne contient que des `newKeys` (niveau 2), cette
 * etape est sautee : la densite y vaut trivialement ~1.0 et n'a pas de sens.
 *
 * Sortie non deterministe mais toujours conforme : uniquement des caracteres de
 * `poolKeys`, groupes de 2 a 7, jamais une chaine vide.
 */
export function generateLearningDrill(
  level: CurriculumLevel,
  mastery: KeyMastery,
  wordCount: number = DEFAULT_GROUP_COUNT,
): string {
  const groupCount = Math.max(1, Math.floor(wordCount));
  const singleCharIds = level.poolKeys.filter((id) => id.length === 1);
  const poolIds = singleCharIds.length > 0 ? singleCharIds : level.poolKeys;
  const newIds = new Set(level.newKeys.map((k) => k.id));

  const weightOf = (id: string): number => {
    if (!newIds.has(id)) return 0.25;
    if (keyReachedBar(level, mastery, id)) return 0.25;
    return 1 + keyDeficit(level, mastery, id);
  };

  const groupLengths: number[] = [];
  const chars: string[] = [];
  for (let g = 0; g < groupCount; g += 1) {
    const len = randomInt(GROUP_MIN_LEN, GROUP_MAX_LEN);
    groupLengths.push(len);
    for (let i = 0; i < len; i += 1) chars.push(pickWeighted(poolIds, weightOf));
  }

  const newKeyIds = poolIds.filter((id) => newIds.has(id));
  const otherIds = poolIds.filter((id) => !newIds.has(id));

  if (newKeyIds.length > 0 && otherIds.length > 0) {
    const isNew = (c: string): boolean => newIds.has(c);
    const swapInWeight = (id: string): number =>
      keyReachedBar(level, mastery, id)
        ? 0.1
        : 1 + keyDeficit(level, mastery, id);

    let newCount = chars.filter(isNew).length;
    let guard = chars.length * 4 + 16;

    const indicesWhere = (want: boolean): number[] => {
      const out: number[] = [];
      for (let i = 0; i < chars.length; i += 1) {
        if (isNew(chars[i] ?? '') === want) out.push(i);
      }
      return out;
    };

    while (newCount / chars.length < DENSITY_TARGET_LOW && guard > 0) {
      guard -= 1;
      const slots = indicesWhere(false);
      if (slots.length === 0) break;
      const at = slots[Math.floor(Math.random() * slots.length)]!;
      chars[at] = pickWeighted(newKeyIds, swapInWeight);
      newCount += 1;
    }

    while (newCount / chars.length > DENSITY_TARGET_HIGH && guard > 0) {
      guard -= 1;
      const slots = indicesWhere(true);
      if (slots.length === 0) break;
      const at = slots[Math.floor(Math.random() * slots.length)]!;
      chars[at] = pickWeighted(otherIds, () => 1);
      newCount -= 1;
    }
  }

  const groups: string[] = [];
  let pos = 0;
  for (const len of groupLengths) {
    groups.push(chars.slice(pos, pos + len).join(''));
    pos += len;
  }
  return groups.join(' ');
}

// ─── pickLearningWords ───────────────────────────────────────────────────────

const DEFAULT_WORD_COUNT = 12;
/** Mots simples melanges aux pools accentues pour le liant (phrases lisibles). */
const LIAISON_WORDS = WORDS_FR_PLAIN.slice(0, 24);

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function stageWordPool(slug: string): string[] {
  switch (slug) {
    case 'uppercase':
      return [...WORDS_FR_PLAIN.map(capitalise), ...WORDS_FR_PROPER];
    case 'direct-accents':
      return [...WORDS_FR_ACCENTS, ...LIAISON_WORDS];
    case 'dead-keys':
      return [...WORDS_FR_CIRCUMFLEX, ...LIAISON_WORDS];
    case 'first-words':
    default:
      return [...WORDS_FR_PLAIN];
  }
}

/**
 * Un mot est eligible ssi chacun de ses caracteres est un espace, ou a un
 * `mapCharToGestureId` non vide present dans `poolKeys`. C'est ce qui garde les
 * mots a circonflexe au niveau 8 : `ê` n'est pas dans `poolKeys`, mais son
 * geste `'^e'` l'est.
 */
function wordFitsPool(word: string, pool: Set<string>): boolean {
  for (const ch of word) {
    if (ch === ' ') continue;
    const id = mapCharToGestureId(ch);
    if (id === '' || !pool.has(id)) return false;
  }
  return true;
}

function pickFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? '';
}

/**
 * `wordCount` mots tires du pool adapte au `slug` du niveau, filtres pour que
 * chaque caractere corresponde a un `id` de `level.poolKeys` (via
 * `mapCharToGestureId`). Repli sur le pool non filtre si le filtre vide tout ;
 * jamais une chaine vide.
 */
export function pickLearningWords(
  level: CurriculumLevel,
  wordCount: number = DEFAULT_WORD_COUNT,
): string {
  const count = Math.max(1, Math.floor(wordCount));
  const stagePool = stageWordPool(level.slug);
  const poolSet = new Set(level.poolKeys);

  let eligible = stagePool.filter((w) => wordFitsPool(w, poolSet));
  if (eligible.length === 0) eligible = stagePool;
  if (eligible.length === 0) eligible = [...WORDS_FR_PLAIN];

  const picks: string[] = [];
  for (let i = 0; i < count; i += 1) picks.push(pickFrom(eligible));
  return picks.join(' ');
}

// ─── pickLearningText ────────────────────────────────────────────────────────

type ParagraphTag = 'punctuation' | 'digits' | 'full';

function tagForSlug(slug: string): ParagraphTag {
  switch (slug) {
    case 'punctuation':
      return 'punctuation';
    case 'digits':
      return 'digits';
    case 'full-score':
    default:
      return 'full';
  }
}

/**
 * Un paragraphe `LEARNING_PARAGRAPHS` au hasard dont les `tags` contiennent le
 * tag du niveau : `punctuation` pour le stade ponctuation, `digits` pour les
 * chiffres, `full` pour la partition complete. Renvoie le `.text`.
 */
export function pickLearningText(level: CurriculumLevel): string {
  const tag = tagForSlug(level.slug);
  const candidates = LEARNING_PARAGRAPHS.filter((p) => p.tags.includes(tag));
  const list = candidates.length > 0 ? candidates : LEARNING_PARAGRAPHS;
  const chosen = list[Math.floor(Math.random() * list.length)];
  return chosen ? chosen.text : '';
}
