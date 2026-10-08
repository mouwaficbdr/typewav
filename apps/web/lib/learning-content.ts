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

import { LEARNING_CURRICULUM_AZERTY, type CurriculumLevel } from '@typewav/types';
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

// ─── expectedKeyForChar ──────────────────────────────────────────────────────

const GESTURE_BY_ID = new Map(
  LEARNING_CURRICULUM_AZERTY.flatMap((l) => l.newKeys).map((k) => [k.id, k]),
);

/** Quelle touche montrer sur le schema clavier pour un caractere attendu. */
export interface ExpectedKey {
  /** Id de geste (ou de touche physique : `'Space'`, une minuscule). */
  activeKeyId: string;
  /** Maj a tenir : la main opposee a celle qui tape la touche. */
  expectedShiftHand?: 'L' | 'R';
}

const oppositeHand = (finger: string): 'L' | 'R' =>
  finger.startsWith('L') ? 'R' : 'L';

/**
 * Le geste a faire pour taper `char`, tel que `KeyboardDiagramAzerty` le montre
 * (touche, Maj de la main opposee pour une majuscule, un chiffre ou `.` `?`).
 * `undefined` quand il n'y a rien a montrer (caractere sans geste).
 */
export function expectedKeyForChar(
  char: string | undefined,
): ExpectedKey | undefined {
  if (char === undefined) return undefined;
  if (char === ' ') return { activeKeyId: 'Space' };

  const id = mapCharToGestureId(char);
  if (id === '') return undefined;

  const gesture = GESTURE_BY_ID.get(id);
  if (gesture) {
    return gesture.layer === 'shift'
      ? { activeKeyId: id, expectedShiftHand: oppositeHand(gesture.finger) }
      : { activeKeyId: id };
  }

  // Majuscule hors des 8 barrees au niveau 6 : la touche minuscule, Maj tenu.
  const lower = GESTURE_BY_ID.get(char.toLowerCase());
  if (lower && char !== char.toLowerCase()) {
    return { activeKeyId: lower.id, expectedShiftHand: oppositeHand(lower.finger) };
  }
  return undefined;
}

// ─── pitchForChar ────────────────────────────────────────────────────────────

/** Gamme pentatonique de do : jamais de fausse note, quelle que soit la touche. */
const PENTATONIC = ['C', 'D', 'E', 'G', 'A'] as const;

/** Rangees physiques, de gauche a droite, et leur octave de depart. */
const PITCH_ROWS: { keys: string[]; octave: number }[] = [
  { keys: [...'&é"\'(-è_çà'], octave: 5 },
  { keys: [...'azertyuiop'], octave: 5 },
  { keys: [...'qsdfghjklm'], octave: 4 },
  { keys: [...'wxcvbn,;:!'], octave: 3 },
];

/**
 * La note d'une touche : la colonne donne le degre de la gamme, la rangee
 * l'octave (haut aigu, bas grave). Taper une suite de lettres joue donc une
 * melodie qui suit la main, et les niveaux « Monter d'un ton » / « Descendre
 * d'un ton » s'entendent. `undefined` pour une espace ou un caractere sans geste.
 */
export function pitchForChar(char: string | undefined): string | undefined {
  if (char === undefined) return undefined;
  const id = mapCharToGestureId(char);
  if (id === '') return undefined;
  const gesture = GESTURE_BY_ID.get(id) ?? GESTURE_BY_ID.get(char.toLowerCase());
  if (!gesture) return undefined;
  for (const row of PITCH_ROWS) {
    const col = row.keys.indexOf(gesture.physical);
    if (col >= 0) {
      return `${PENTATONIC[col % PENTATONIC.length]}${row.octave + Math.floor(col / PENTATONIC.length)}`;
    }
  }
  return undefined;
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

/** Part des mots d'une serie tires pour entrainer une touche encore barree. */
const TARGET_SHARE = 0.9;

/** Ids de geste d'un mot (sans doublon, sans les caracteres sans geste). */
function gestureIdsOf(word: string): Set<string> {
  const ids = new Set<string>();
  for (const ch of word) {
    const id = mapCharToGestureId(ch);
    if (id !== '') ids.add(id);
  }
  return ids;
}

/**
 * `wordCount` mots tires du pool adapte au `slug` du niveau, filtres pour que
 * chaque caractere corresponde a un `id` de `level.poolKeys` (via
 * `mapCharToGestureId`). Les touches du niveau pas encore a la barre sont
 * ciblees : environ `TARGET_SHARE` des mots en contiennent une, tiree selon son
 * deficit (sans cela, une touche rare comme Z ou ü n'arrive presque jamais).
 * Jamais deux fois le meme mot de suite quand le pool le permet. Repli sur le
 * pool non filtre si le filtre vide tout ; jamais une chaine vide.
 */
export function pickLearningWords(
  level: CurriculumLevel,
  wordCount: number = DEFAULT_WORD_COUNT,
  mastery: KeyMastery = {},
): string {
  const count = Math.max(1, Math.floor(wordCount));
  const stagePool = stageWordPool(level.slug);
  const poolSet = new Set(level.poolKeys);

  let eligible = stagePool.filter((w) => wordFitsPool(w, poolSet));
  if (eligible.length === 0) eligible = stagePool;
  if (eligible.length === 0) eligible = [...WORDS_FR_PLAIN];

  const wordsByGesture = new Map<string, string[]>();
  for (const w of eligible) {
    for (const id of gestureIdsOf(w)) {
      const list = wordsByGesture.get(id);
      if (list) list.push(w);
      else wordsByGesture.set(id, [w]);
    }
  }
  const targets = level.newKeys
    .map((k) => k.id)
    .filter((id) => wordsByGesture.has(id) && !keyReachedBar(level, mastery, id));

  const picks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let word = '';
    if (targets.length > 0 && Math.random() < TARGET_SHARE) {
      const id = pickWeighted(targets, (t) => 1 + keyDeficit(level, mastery, t));
      word = pickFrom(wordsByGesture.get(id) ?? []);
    }
    if (word === '' || word === picks[i - 1]) word = pickFrom(eligible);
    picks.push(word);
  }
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
 * Un paragraphe `LEARNING_PARAGRAPHS` dont les `tags` contiennent le tag du
 * niveau : `punctuation` pour le stade ponctuation, `digits` pour les chiffres,
 * `full` pour la partition complete. Parmi eux, celui qui contient le plus de
 * touches du niveau pas encore a la barre (pondere par leur deficit) ; egalite
 * ou aucune touche cible (`full`) : au hasard. Renvoie le `.text`.
 */
export function pickLearningText(
  level: CurriculumLevel,
  mastery: KeyMastery = {},
): string {
  const tag = tagForSlug(level.slug);
  const candidates = LEARNING_PARAGRAPHS.filter((p) => p.tags.includes(tag));
  const list = candidates.length > 0 ? candidates : LEARNING_PARAGRAPHS;

  const weights = new Map<string, number>();
  for (const k of level.newKeys) {
    if (!keyReachedBar(level, mastery, k.id)) {
      weights.set(k.id, 1 + keyDeficit(level, mastery, k.id));
    }
  }
  const scoreOf = (text: string): number => {
    let score = 0;
    for (const ch of text) score += weights.get(mapCharToGestureId(ch)) ?? 0;
    return score;
  };

  const scored = list.map((p) => ({ p, score: scoreOf(p.text) }));
  const best = Math.max(...scored.map((s) => s.score));
  const top = scored.filter((s) => s.score === best);
  const chosen = top[Math.floor(Math.random() * top.length)];
  return chosen ? chosen.p.text : '';
}

// ─── generateLevelText ───────────────────────────────────────────────────────

/** Mots (ou groupes de lettres) par serie pour les niveaux `drill` et `words`. */
const RUN_WORD_COUNT = 18;

/** Contenu d'une serie du niveau, selon son `kind` (vide pour `anchors`). */
export function generateLevelText(
  level: CurriculumLevel,
  mastery: KeyMastery,
): string {
  switch (level.kind) {
    case 'drill':
      return generateLearningDrill(level, mastery, RUN_WORD_COUNT);
    case 'words':
      return pickLearningWords(level, RUN_WORD_COUNT, mastery);
    case 'text':
      return pickLearningText(level, mastery);
    case 'anchors':
    default:
      return '';
  }
}
