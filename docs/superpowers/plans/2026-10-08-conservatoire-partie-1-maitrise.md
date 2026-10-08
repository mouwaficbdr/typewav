# Conservatoire, partie 1 : le moteur de maîtrise. Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Donner au Conservatoire un moteur de maîtrise par touche (quatre états, fenêtre des 30 dernières frappes, fluidité, révision espacée, erreurs corrigées comptées) et sa persistance, sans encore aucun écran.

**Architecture :** `TypingArea` émet chaque frappe brute via une nouvelle prop `onAttempt`, avant toute correction. Le moteur est un module de fonctions pures (`apps/web/lib/conservatoire/mastery.ts`) qui transforme un objet `Mastery` immuable ; sa persistance (`storage.ts`) lit et écrit une seule clé du store `user_preferences`, en échec ouvert. Les types vivent dans `@typewav/types`.

**Tech Stack :** TypeScript strict, React 19 (`TypingArea`), Vitest 4 (projets `web-lib` en node avec `fake-indexeddb`, `web-components` en jsdom), IndexedDB via `idb` (`apps/web/lib/db.ts`).

**Spec :** `docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md`, partie 1.

## Global Constraints

- Persistance IndexedDB seulement, dans le store `user_preferences` existant, sans changement de version de la base. Jamais `localStorage`.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` : props optionnelles par spread conditionnel, jamais `x: undefined`.
- TDD : chaque fonction pure a un test qui échoue d'abord.
- Fail open : une lecture IndexedDB qui échoue ne piège jamais l'utilisateur.
- Constantes exactes : `WINDOW = 30`, `MIN_ATTEMPTS = 20`, `SURE_ACCURACY = 0.95`, `AUTOMATIC_MEDIAN_MS = 450`, `PAUSE_MS = 3000`, `REVIEW_DAYS = [1, 3, 7, 14, 30]`.
- Clé de persistance : `conservatoire_mastery`. Les anciennes clés `learning_*` ne sont ni lues ni migrées.
- Aucun comportement visible de `TypingArea` ne change (le score affiché de la séance reste celui d'aujourd'hui).
- Conventional commits en français, zéro attribution IA, aucun tiret cadratin ni demi-cadratin.
- Branche de travail : `feat/conservatoire-maitrise`, depuis `main` à jour si la PR `docs/conservatoire` est mergée, sinon depuis `docs/conservatoire`.

## Review Focus

- Un caractère sans geste (espace, symbole hors curriculum) ne doit créer aucune entrée dans la maîtrise. Test dans la tâche 2.
- Une horloge qui recule ou deux frappes au même instant ne doivent jamais produire une latence négative : la latence vaut alors `null`. Test dans la tâche 2.
- Une très longue pratique ne doit jamais stocker plus de 30 tentatives par touche, y compris à la relecture d'une sauvegarde plus longue. Tests dans les tâches 2 et 4.
- Une sauvegarde corrompue (pas un objet, `attempts` qui n'est pas un tableau, tentative mal formée) doit se charger comme une maîtrise propre, sans exception. Test dans la tâche 4.
- Une leçon sans nouvelle touche (le récital de cycle) ne doit pas se déclarer validée par ce moteur : `lessonValidated` renvoie `false` pour une liste vide. Test dans la tâche 3.

---

### Task 1 : `onAttempt` dans `TypingArea` (frappes brutes, D11)

**Files :**
- Modify : `apps/web/components/typing/TypingArea.tsx` (interface des props vers la ligne 176, déstructuration vers la ligne 202, `commitChar` vers les lignes 406 à 457)
- Test : `apps/web/components/__tests__/TypingArea.test.tsx`

**Interfaces :**
- Consumes : rien.
- Produces : prop `onAttempt?: (a: { index: number; expected: string; typed: string; correct: boolean; at: number }) => void` sur `TypingArea`, appelée pour chaque caractère validé, juste ou faux, jamais pour un Retour arrière.

- [ ] **Step 1 : Write the failing test**

Ajouter à la fin de `apps/web/components/__tests__/TypingArea.test.tsx` (le mock de session du fichier fixe `position` à 1, donc le caractère attendu de « hello world » est « e ») :

```tsx
describe('TypingArea : frappes brutes (onAttempt)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('émet chaque frappe, juste ou fausse, et rien pour le Retour arrière', async () => {
    const onAttempt = vi.fn();
    const user = userEvent.setup();
    render(<TypingArea text="hello world" onAttempt={onAttempt} />);

    await user.click(screen.getByRole('application'));
    await user.keyboard('x{Backspace}e');

    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(onAttempt).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ index: 1, expected: 'e', typed: 'x', correct: false }),
    );
    expect(onAttempt).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ index: 1, expected: 'e', typed: 'e', correct: true }),
    );
    expect(typeof onAttempt.mock.calls[0]![0].at).toBe('number');
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm exec vitest run apps/web/components/__tests__/TypingArea.test.tsx -t "frappes brutes"`
Expected : FAIL, `onAttempt` appelé 0 fois.

- [ ] **Step 3 : Write minimal implementation**

Dans l'interface des props de `TypingArea.tsx`, juste après `onNoteChange` :

```ts
  /**
   * Chaque caractère validé, juste ou faux, avant toute correction par Retour
   * arrière : le moteur de maîtrise du Conservatoire compte les erreurs
   * corrigées (D11). Le Retour arrière n'émet rien.
   */
  onAttempt?: (a: {
    index: number;
    expected: string;
    typed: string;
    correct: boolean;
    at: number;
  }) => void;
```

Dans la déstructuration des props (à côté de `onNoteChange,`) : ajouter `onAttempt,`.

Dans `commitChar`, juste après `const isCorrect = char === expected;` :

```ts
      onAttempt?.({
        index: position,
        expected: expected ?? '',
        typed: char,
        correct: isCorrect,
        at: Date.now(),
      });
```

Dans le tableau de dépendances du `useCallback` de `commitChar` (qui se termine par `onNoteChange,`), ajouter `onAttempt,`.

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm exec vitest run apps/web/components/__tests__/TypingArea.test.tsx`
Expected : PASS, tout le fichier vert.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/typing/TypingArea.tsx apps/web/components/__tests__/TypingArea.test.tsx
git commit -m "feat(conservatoire): TypingArea émet les frappes brutes (onAttempt)"
```

---

### Task 2 : types et enregistrement des tentatives, états de touche

**Files :**
- Create : `packages/types/src/conservatoire.ts`
- Modify : `packages/types/src/index.ts` (ajouter l'export)
- Create : `apps/web/lib/conservatoire/mastery.ts`
- Test : `apps/web/lib/__tests__/conservatoire-mastery.test.ts`

**Interfaces :**
- Consumes : `mapCharToGestureId(char: string): string` de `apps/web/lib/learning-content.ts` (renvoie `''` pour un caractère sans geste).
- Produces :
  - Types `Attempt`, `GestureRecord`, `KeyState`, `Mastery` exportés par `@typewav/types`.
  - Constantes `WINDOW`, `MIN_ATTEMPTS`, `SURE_ACCURACY`, `AUTOMATIC_MEDIAN_MS`, `PAUSE_MS`, `REVIEW_DAYS`.
  - `recordAttempt(mastery: Mastery, input: { expected: string; correct: boolean; at: number }, previousAt: number | null): Mastery`
  - `keyState(record: GestureRecord | undefined): KeyState`
  - `isSureOrBetter(state: KeyState): boolean`

- [ ] **Step 1 : Write the failing test**

Créer `apps/web/lib/__tests__/conservatoire-mastery.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import type { Mastery } from '@typewav/types';
import {
  AUTOMATIC_MEDIAN_MS,
  MIN_ATTEMPTS,
  WINDOW,
  keyState,
  recordAttempt,
} from '../conservatoire/mastery';

const T0 = new Date(2026, 9, 8, 10, 0, 0).getTime();

/** Joue `n` frappes sur `char`, espacées de `gapMs`, justes sauf celles listées. */
function play(
  char: string,
  n: number,
  { gapMs = 300, wrong = [] as number[], start = T0, mastery = {} as Mastery } = {},
): Mastery {
  let m = mastery;
  let previousAt: number | null = null;
  for (let i = 0; i < n; i += 1) {
    const at = start + i * gapMs;
    m = recordAttempt(m, { expected: char, correct: !wrong.includes(i), at }, previousAt);
    previousAt = at;
  }
  return m;
}

describe('recordAttempt', () => {
  it('attribue la tentative au geste du caractère attendu, juste ou faux', () => {
    const m = recordAttempt({}, { expected: 'ê', correct: false, at: T0 }, null);
    expect(m['^e']?.attempts).toEqual([{ correct: false, latencyMs: null, at: T0 }]);
  });

  it('ignore un caractère sans geste (espace, symbole hors curriculum)', () => {
    expect(recordAttempt({}, { expected: ' ', correct: true, at: T0 }, null)).toEqual({});
    expect(recordAttempt({}, { expected: '@', correct: true, at: T0 }, null)).toEqual({});
  });

  it('latence = écart avec la frappe précédente, null au-delà de 3 s, en début ou si négative', () => {
    let m = recordAttempt({}, { expected: 'e', correct: true, at: T0 }, null);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 250 }, T0);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 5000 }, T0 + 250);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 4000 }, T0 + 5000);
    expect(m.e?.attempts.map((a) => a.latencyMs)).toEqual([null, 250, null, null]);
  });

  it('ne garde jamais plus de WINDOW tentatives', () => {
    const m = play('e', WINDOW + 15);
    expect(m.e?.attempts).toHaveLength(WINDOW);
    expect(m.e?.attempts[0]?.at).toBe(T0 + 15 * 300);
  });

  it("une erreur corrigée compte : faux puis juste sur la même position = deux tentatives (D11)", () => {
    let m = recordAttempt({}, { expected: 'e', correct: false, at: T0 }, null);
    m = recordAttempt(m, { expected: 'e', correct: true, at: T0 + 400 }, T0);
    expect(m.e?.attempts.map((a) => a.correct)).toEqual([false, true]);
  });

  it('ne modifie pas la maîtrise reçue (immuable)', () => {
    const before: Mastery = {};
    recordAttempt(before, { expected: 'e', correct: true, at: T0 }, null);
    expect(before).toEqual({});
  });
});

describe('keyState', () => {
  it('new sans tentative juste', () => {
    expect(keyState(undefined)).toBe('new');
    expect(keyState(play('e', 3, { wrong: [0, 1, 2] }).e)).toBe('new');
  });

  it('learned dès une tentative juste, tant que MIN_ATTEMPTS ou 95 % ne sont pas atteints', () => {
    expect(keyState(play('e', 1).e)).toBe('learned');
    expect(keyState(play('e', MIN_ATTEMPTS - 1).e)).toBe('learned');
    expect(keyState(play('e', MIN_ATTEMPTS, { wrong: [0, 1] }).e)).toBe('learned');
  });

  it('sure à MIN_ATTEMPTS frappes et au moins 95 % sur la fenêtre, lentes', () => {
    expect(keyState(play('e', MIN_ATTEMPTS, { gapMs: 800 }).e)).toBe('sure');
  });

  it('automatic quand la médiane des latences justes est sous le seuil', () => {
    expect(keyState(play('e', MIN_ATTEMPTS, { gapMs: AUTOMATIC_MEDIAN_MS - 50 }).e)).toBe('automatic');
  });

  it('retombe à learned quand la justesse récente passe sous 95 %', () => {
    let m = play('e', WINDOW, { gapMs: 800 });
    expect(keyState(m.e)).toBe('sure');
    m = play('e', 3, { gapMs: 800, wrong: [0, 1, 2], start: T0 + 60_000, mastery: m });
    expect(keyState(m.e)).toBe('learned');
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-mastery.test.ts`
Expected : FAIL, module `../conservatoire/mastery` introuvable.

- [ ] **Step 3 : Write minimal implementation**

Créer `packages/types/src/conservatoire.ts` :

```ts
/**
 * Le Conservatoire : modèle de maîtrise par geste.
 * Spec : docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md, partie 1.
 */

/** Une frappe sur un geste : juste ou non, et le temps écoulé depuis la frappe précédente. */
export interface Attempt {
  correct: boolean;
  /** `null` en début d'exercice, après une pause de plus de 3 s, ou si l'horloge recule. */
  latencyMs: number | null;
  at: number;
}

export interface GestureRecord {
  /** Les 30 dernières tentatives au plus, de la plus ancienne à la plus récente. */
  attempts: Attempt[];
  lastSeenAt: number;
  /** Rang dans `REVIEW_DAYS` : avance quand la touche reste sûre un autre jour. */
  reviewStep: number;
}

/** Calculé, jamais stocké. */
export type KeyState = 'new' | 'learned' | 'sure' | 'automatic';

/** Clé = id de geste (`'e'`, `'é'`, `'^e'`, `'A'`…), voir `mapCharToGestureId`. */
export type Mastery = Record<string, GestureRecord>;
```

Dans `packages/types/src/index.ts`, ajouter à côté de `export * from './learning';` :

```ts
export * from './conservatoire';
```

Créer `apps/web/lib/conservatoire/mastery.ts` :

```ts
/**
 * Moteur de maîtrise du Conservatoire : fonctions pures sur un objet
 * `Mastery` immuable. Spec : 2026-10-08-conservatoire-v1-design.md, partie 1.
 */

import type { Attempt, GestureRecord, KeyState, Mastery } from '@typewav/types';
import { mapCharToGestureId } from '../learning-content';

export const WINDOW = 30;
export const MIN_ATTEMPTS = 20;
export const SURE_ACCURACY = 0.95;
export const AUTOMATIC_MEDIAN_MS = 450;
export const PAUSE_MS = 3000;
export const REVIEW_DAYS = [1, 3, 7, 14, 30] as const;

export function accuracy(attempts: readonly Attempt[]): number {
  if (attempts.length === 0) return 0;
  return attempts.filter((a) => a.correct).length / attempts.length;
}

export function medianLatency(attempts: readonly Attempt[]): number | null {
  const values = attempts
    .filter((a) => a.correct && a.latencyMs !== null)
    .map((a) => a.latencyMs as number)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 1
    ? values[mid]!
    : (values[mid - 1]! + values[mid]!) / 2;
}

export function isSureOrBetter(state: KeyState): boolean {
  return state === 'sure' || state === 'automatic';
}

export function keyState(record: GestureRecord | undefined): KeyState {
  if (!record || !record.attempts.some((a) => a.correct)) return 'new';
  const { attempts } = record;
  if (attempts.length < MIN_ATTEMPTS || accuracy(attempts) < SURE_ACCURACY) {
    return 'learned';
  }
  const median = medianLatency(attempts);
  return median !== null && median <= AUTOMATIC_MEDIAN_MS ? 'automatic' : 'sure';
}

function sameLocalDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/**
 * Ajoute une tentative au geste du caractère attendu (juste ou fausse : une
 * erreur corrigée compte, D11). `previousAt` = instant de la frappe précédente
 * de l'exercice, `null` en début d'exercice.
 */
export function recordAttempt(
  mastery: Mastery,
  input: { expected: string; correct: boolean; at: number },
  previousAt: number | null,
): Mastery {
  const id = mapCharToGestureId(input.expected);
  if (id === '') return mastery;

  const gap = previousAt === null ? null : input.at - previousAt;
  const latencyMs = gap !== null && gap >= 0 && gap <= PAUSE_MS ? gap : null;

  const prev = mastery[id];
  const attempts = [
    ...(prev?.attempts ?? []),
    { correct: input.correct, latencyMs, at: input.at },
  ].slice(-WINDOW);
  const draft: GestureRecord = {
    attempts,
    lastSeenAt: input.at,
    reviewStep: prev?.reviewStep ?? 0,
  };

  let reviewStep = draft.reviewStep;
  if (keyState(draft) === 'learned') {
    reviewStep = 0;
  } else if (
    prev &&
    isSureOrBetter(keyState(prev)) &&
    !sameLocalDay(prev.lastSeenAt, input.at)
  ) {
    reviewStep = Math.min(reviewStep + 1, REVIEW_DAYS.length - 1);
  }

  return { ...mastery, [id]: { ...draft, reviewStep } };
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-mastery.test.ts`
Expected : PASS (11 tests).
Puis : `pnpm typecheck` ; expected : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add packages/types/src/conservatoire.ts packages/types/src/index.ts apps/web/lib/conservatoire/mastery.ts apps/web/lib/__tests__/conservatoire-mastery.test.ts
git commit -m "feat(conservatoire): moteur de maîtrise, tentatives et états de touche"
```

---

### Task 3 : validation de leçon, révision espacée, touches faibles

**Files :**
- Modify : `apps/web/lib/conservatoire/mastery.ts`
- Test : `apps/web/lib/__tests__/conservatoire-mastery.test.ts`

**Interfaces :**
- Consumes : `keyState`, `isSureOrBetter`, `accuracy`, `medianLatency`, `recordAttempt`, `REVIEW_DAYS` (tâche 2).
- Produces :
  - `lessonValidated(mastery: Mastery, gestureIds: readonly string[]): boolean`
  - `dueForReview(mastery: Mastery, now: number): string[]`
  - `weakestKeys(mastery: Mastery, gestureIds: readonly string[], count: number): string[]`

- [ ] **Step 1 : Write the failing test**

Compléter l'import du fichier de test (`dueForReview`, `lessonValidated`, `weakestKeys`, `REVIEW_DAYS`) et ajouter :

```ts
const DAY = 86_400_000;

describe('lessonValidated', () => {
  it('vrai quand toutes les nouvelles touches sont sûres ou automatiques', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('a', MIN_ATTEMPTS, { gapMs: 300, mastery: m, start: T0 + 60_000 });
    expect(lessonValidated(m, ['e', 'a'])).toBe(true);
  });

  it('faux tant qu\'une touche est seulement apprise', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('a', 5, { mastery: m, start: T0 + 60_000 });
    expect(lessonValidated(m, ['e', 'a'])).toBe(false);
  });

  it('faux pour une leçon sans nouvelle touche (le récital a sa propre règle)', () => {
    expect(lessonValidated(play('e', MIN_ATTEMPTS), [])).toBe(false);
  });
});

describe('dueForReview et reviewStep', () => {
  it('une touche sûre est due après REVIEW_DAYS[0] jour, pas avant', () => {
    const m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    const last = m.e!.lastSeenAt;
    expect(dueForReview(m, last + REVIEW_DAYS[0] * DAY - 1)).toEqual([]);
    expect(dueForReview(m, last + REVIEW_DAYS[0] * DAY)).toEqual(['e']);
  });

  it("reviewStep avance quand la touche reste sûre un autre jour, l'intervalle s'allonge", () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('e', 1, { mastery: m, start: T0 + 2 * DAY });
    expect(m.e?.reviewStep).toBe(1);
    const last = m.e!.lastSeenAt;
    expect(dueForReview(m, last + 2 * DAY)).toEqual([]);
    expect(dueForReview(m, last + REVIEW_DAYS[1] * DAY)).toEqual(['e']);
  });

  it('reviewStep revient à 0 quand la touche retombe à apprise', () => {
    let m = play('e', MIN_ATTEMPTS, { gapMs: 800 });
    m = play('e', 1, { mastery: m, start: T0 + 2 * DAY });
    m = play('e', 3, { mastery: m, start: T0 + 3 * DAY, wrong: [0, 1, 2] });
    expect(m.e?.reviewStep).toBe(0);
  });

  it("une touche seulement apprise n'est jamais due en révision", () => {
    const m = play('e', 3);
    expect(dueForReview(m, T0 + 60 * DAY)).toEqual([]);
  });
});

describe('weakestKeys', () => {
  it('trie par justesse récente, puis par lenteur ; une touche jamais jouée passe en premier', () => {
    let m = play('e', 10, { wrong: [0, 1, 2] }); // 70 %
    m = play('a', 10, { gapMs: 900, mastery: m, start: T0 + 60_000 }); // 100 %, lente
    m = play('s', 10, { gapMs: 200, mastery: m, start: T0 + 120_000 }); // 100 %, rapide
    expect(weakestKeys(m, ['s', 'a', 'e', 'i'], 3)).toEqual(['i', 'e', 'a']);
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-mastery.test.ts`
Expected : FAIL, `lessonValidated`, `dueForReview`, `weakestKeys` non exportés.

- [ ] **Step 3 : Write minimal implementation**

Ajouter à la fin de `apps/web/lib/conservatoire/mastery.ts` :

```ts
const DAY_MS = 86_400_000;

/**
 * Toutes les nouvelles touches de la leçon sont sûres ou automatiques au même
 * moment. Liste vide : faux (le récital de cycle a sa propre règle).
 */
export function lessonValidated(
  mastery: Mastery,
  gestureIds: readonly string[],
): boolean {
  if (gestureIds.length === 0) return false;
  return gestureIds.every((id) => isSureOrBetter(keyState(mastery[id])));
}

/** Touches sûres dont l'intervalle de révision (`REVIEW_DAYS[reviewStep]`) est écoulé. */
export function dueForReview(mastery: Mastery, now: number): string[] {
  return Object.entries(mastery)
    .filter(([, record]) => isSureOrBetter(keyState(record)))
    .filter(([, record]) => {
      const step = Math.min(record.reviewStep, REVIEW_DAYS.length - 1);
      return now - record.lastSeenAt >= REVIEW_DAYS[step]! * DAY_MS;
    })
    .map(([id]) => id);
}

/**
 * Les `count` touches les plus faibles parmi `gestureIds` : justesse récente
 * croissante, puis latence médiane décroissante. Jamais jouée = la plus faible.
 */
export function weakestKeys(
  mastery: Mastery,
  gestureIds: readonly string[],
  count: number,
): string[] {
  return gestureIds
    .map((id) => {
      const record = mastery[id];
      return {
        id,
        acc: record ? accuracy(record.attempts) : 0,
        lat: (record && medianLatency(record.attempts)) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.acc - b.acc || b.lat - a.lat)
    .slice(0, count)
    .map((k) => k.id);
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-mastery.test.ts`
Expected : PASS (19 tests).

- [ ] **Step 5 : Commit**

```bash
git add apps/web/lib/conservatoire/mastery.ts apps/web/lib/__tests__/conservatoire-mastery.test.ts
git commit -m "feat(conservatoire): validation de leçon, révision espacée et touches faibles"
```

---

### Task 4 : persistance de la maîtrise, en échec ouvert

**Files :**
- Create : `apps/web/lib/conservatoire/storage.ts`
- Test : `apps/web/lib/__tests__/conservatoire-storage.test.ts`
- Test : `apps/web/lib/__tests__/conservatoire-storage-failure.test.ts`

**Interfaces :**
- Consumes : `getPreference`, `setPreference` de `apps/web/lib/db.ts` ; `WINDOW` (tâche 2) ; types `Attempt`, `GestureRecord`, `Mastery`.
- Produces :
  - `loadMastery(): Promise<{ mastery: Mastery; persisted: boolean }>` : `persisted: false` quand IndexedDB est inaccessible (l'écran affichera « Tes progrès ne peuvent pas être enregistrés dans ce navigateur », partie 4).
  - `saveMastery(mastery: Mastery): Promise<boolean>` : `false` si l'écriture échoue, jamais d'exception.
  - L'écriture « à la fin de chaque mouvement et à `visibilitychange` » est câblée par les lecteurs d'exercice (partie 3), pas ici.

- [ ] **Step 1 : Write the failing tests**

Créer `apps/web/lib/__tests__/conservatoire-storage.test.ts` :

```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { setPreference } from '../db';
import { loadMastery, saveMastery } from '../conservatoire/storage';

const T0 = new Date(2026, 9, 8, 10, 0, 0).getTime();

beforeEach(async () => {
  await setPreference('conservatoire_mastery', undefined);
});

describe('persistance de la maîtrise', () => {
  it('maîtrise vide et persistée quand rien n\'est sauvegardé', async () => {
    expect(await loadMastery()).toEqual({ mastery: {}, persisted: true });
  });

  it('save puis load fait l\'aller-retour', async () => {
    const mastery = {
      e: { attempts: [{ correct: true, latencyMs: 300, at: T0 }], lastSeenAt: T0, reviewStep: 1 },
    };
    expect(await saveMastery(mastery)).toBe(true);
    expect(await loadMastery()).toEqual({ mastery, persisted: true });
  });

  it('une sauvegarde corrompue se charge comme une maîtrise propre', async () => {
    await setPreference('conservatoire_mastery', {
      e: { attempts: 'pas un tableau', lastSeenAt: T0, reviewStep: 0 },
      a: { attempts: [{ correct: 'oui', at: T0 }, { correct: true, latencyMs: null, at: T0 }], lastSeenAt: T0, reviewStep: 0 },
      s: null,
    });
    expect(await loadMastery()).toEqual({
      mastery: { a: { attempts: [{ correct: true, latencyMs: null, at: T0 }], lastSeenAt: T0, reviewStep: 0 } },
      persisted: true,
    });
  });

  it('une valeur qui n\'est pas un objet donne une maîtrise vide', async () => {
    await setPreference('conservatoire_mastery', [1, 2, 3]);
    expect((await loadMastery()).mastery).toEqual({});
  });

  it('une sauvegarde de plus de 30 tentatives est tronquée aux 30 dernières', async () => {
    const attempts = Array.from({ length: 40 }, (_, i) => ({ correct: true, latencyMs: null, at: T0 + i }));
    await setPreference('conservatoire_mastery', { e: { attempts, lastSeenAt: T0 + 39, reviewStep: 0 } });
    const { mastery } = await loadMastery();
    expect(mastery.e?.attempts).toHaveLength(30);
    expect(mastery.e?.attempts[0]?.at).toBe(T0 + 10);
  });
});
```

Créer `apps/web/lib/__tests__/conservatoire-storage-failure.test.ts` :

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({
  getPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
  setPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
}));

import { loadMastery, saveMastery } from '../conservatoire/storage';

describe('persistance de la maîtrise en échec', () => {
  it('lecture impossible : maîtrise vide, non persistée, aucune exception', async () => {
    await expect(loadMastery()).resolves.toEqual({ mastery: {}, persisted: false });
  });

  it('écriture impossible : false, aucune exception', async () => {
    await expect(saveMastery({})).resolves.toBe(false);
  });
});
```

- [ ] **Step 2 : Run tests to verify they fail**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-storage.test.ts apps/web/lib/__tests__/conservatoire-storage-failure.test.ts`
Expected : FAIL, module `../conservatoire/storage` introuvable.

- [ ] **Step 3 : Write minimal implementation**

Créer `apps/web/lib/conservatoire/storage.ts` :

```ts
/**
 * Persistance de la maîtrise du Conservatoire : une seule clé du store
 * `user_preferences`, en échec ouvert (jamais d'exception vers l'appelant).
 */

import type { Attempt, GestureRecord, Mastery } from '@typewav/types';
import { getPreference, setPreference } from '../db';
import { WINDOW } from './mastery';

const MASTERY_KEY = 'conservatoire_mastery';

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.correct === 'boolean' &&
    typeof a.at === 'number' &&
    (a.latencyMs === null || typeof a.latencyMs === 'number')
  );
}

/** Ne garde que les enregistrements bien formés, tronqués à `WINDOW` tentatives. */
function sanitize(raw: unknown): Mastery {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Mastery = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const record = value as Partial<Record<keyof GestureRecord, unknown>>;
    if (
      !Array.isArray(record.attempts) ||
      typeof record.lastSeenAt !== 'number' ||
      typeof record.reviewStep !== 'number'
    ) {
      continue;
    }
    out[id] = {
      attempts: record.attempts.filter(isAttempt).slice(-WINDOW),
      lastSeenAt: record.lastSeenAt,
      reviewStep: record.reviewStep,
    };
  }
  return out;
}

export async function loadMastery(): Promise<{ mastery: Mastery; persisted: boolean }> {
  try {
    const raw = await getPreference<unknown>(MASTERY_KEY);
    return { mastery: sanitize(raw), persisted: true };
  } catch {
    return { mastery: {}, persisted: false };
  }
}

export async function saveMastery(mastery: Mastery): Promise<boolean> {
  try {
    await setPreference(MASTERY_KEY, mastery);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm exec vitest run apps/web/lib/__tests__/conservatoire-storage.test.ts apps/web/lib/__tests__/conservatoire-storage-failure.test.ts`
Expected : PASS (7 tests).

- [ ] **Step 5 : Commit**

```bash
git add apps/web/lib/conservatoire/storage.ts apps/web/lib/__tests__/conservatoire-storage.test.ts apps/web/lib/__tests__/conservatoire-storage-failure.test.ts
git commit -m "feat(conservatoire): persistance de la maîtrise en échec ouvert"
```

---

### Task 5 : gate complet et PR

**Files :** aucun nouveau.

- [ ] **Step 1 : Gate complet**

Run, depuis la racine : `pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build`
Expected : tout vert. Un échec de `packages/collections/src/__tests__/fetch.test.ts` est un test instable connu (#119), à relancer et à mentionner, jamais à masquer.

- [ ] **Step 2 : Vérifier l'absence de tirets longs et de secrets**

Run : `git diff origin/main --unified=0 | grep -nP '^\+.*[\x{2013}\x{2014}]'` ; expected : aucune sortie.
Run : `gitleaks detect --no-git --source apps/web/lib/conservatoire --redact --no-banner` ; expected : `no leaks found`.

- [ ] **Step 3 : Push et PR (seulement avec le feu vert de Mouwafic)**

```bash
git push -u origin feat/conservatoire-maitrise
gh pr create --title "feat(conservatoire): moteur de maîtrise (partie 1)" --body "Partie 1 de la spec docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md (#120) : frappes brutes dans TypingArea (onAttempt), moteur de maîtrise (quatre états, fenêtre de 30 frappes, révision espacée, touches faibles), persistance en échec ouvert. Aucun écran : la partie 2 branchera ce moteur."
```

Puis `gh run watch <id> --exit-status` jusqu'au vert. Aucun merge sans feu vert explicite.
