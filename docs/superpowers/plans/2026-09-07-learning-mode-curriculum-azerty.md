# Curriculum apprentissage AZERTY — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le mode Apprentissage (5 niveaux, s'arrête aux minuscules, pensé QWERTY) par un vrai parcours de frappe AZERTY en 11 niveaux pour débutant 10 doigts, de la rangée du repos au paragraphe français réel.

**Architecture:** Un curriculum déclaratif (`packages/types/src/learning.ts`) pilote toute la logique. `LearningMode` bifurque sur la disposition : `azerty` → nouveau `CurriculumLearningMode` ; `qwerty` → `LegacyLearningMode` (le corps actuel extrait intact, retiré par un ticket QWERTF dédié). Validation stricte par touche cible via une structure `learning_key_mastery` persistée. Étape interactive d'enseignement par niveau. Contenant visuel #91 réutilisé tel quel.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand, IndexedDB via `idb` (`apps/web/lib/db.ts`, store `user_preferences`), `motion/react`, Vitest 3 (projets `unit` / `web-lib` node+fake-indexeddb / `web-components` jsdom), Playwright headless local (QA navigateur réel).

**Spec:** `docs/superpowers/specs/2026-09-07-learning-mode-curriculum-design.md` — le plan argumente depuis la spec ; lire les deux.

## Global Constraints

- Persistance IndexedDB uniquement, jamais `localStorage`/`sessionStorage`. Nouvelles clés dans `user_preferences`, aucun bump de version de la base.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` : props optionnelles via `...(x !== undefined ? { x } : {})`, jamais `x: undefined`.
- Règle produit son : une frappe fausse est un silence, jamais une fausse note. Vraie dans les drills aussi.
- Toute évolution de la frappe passe par `commitChar` + le champ de capture caché de `TypingArea` ; jamais un nouveau listener `keydown` de texte (mémoire `project_typing_input_capture`).
- Fail open : toute erreur de lecture d'un flag de progression retombe sur un état dont l'utilisateur peut sortir.
- TDD : test qui échoue d'abord, puis implémentation minimale.
- Contenu textuel : original ou domaine public (CONTRIBUTING). Les paragraphes des niveaux `text` sont écrits originaux.
- Mode Apprentissage = desktop-only.
- Commits : Conventional Commits, `feat(apprentissage): ...` / `test(apprentissage): ...` / `refactor(apprentissage): ...`. Branche depuis `main` frais, squash merge. **Zéro attribution IA** dans commits / PR / issues. Aucun trailer `Co-Authored-By: Claude` (le retirer si le harness le pousse).
- Gate pré-PR : `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Lint TS = `cd apps/web && pnpm lint`. CI surveillée verte (`gh run watch --exit-status`) avant merge.
- Avant chaque opération git : `git restore apps/web/next-env.d.ts` (le dev server le réécrit).

---

## File Structure

**Créés :**
- `packages/types/src/learning.ts` — types curriculum + `LEARNING_CURRICULUM_AZERTY` + `CURRICULUM_VERSION` + `DEAD_KEYS`.
- `packages/types/src/__tests__/learning.test.ts` — invariants du curriculum.
- `apps/web/lib/learning-texts.ts` — données : pools de mots FR + paragraphes.
- `apps/web/lib/learning-content.ts` — `generateLearningDrill`, `pickLearningWords`, `pickLearningText`.
- `apps/web/lib/__tests__/learning-content.test.ts`.
- `apps/web/lib/__tests__/learning-mastery.test.ts` — les ajouts purs à `learning-progress.ts`.
- `apps/web/components/modes/LegacyLearningMode.tsx` — corps actuel de `LearningMode` déplacé verbatim.
- `apps/web/components/modes/KeyboardDiagramAzerty.tsx` — schéma clavier AZERTY étendu.
- `apps/web/components/modes/__tests__/KeyboardDiagramAzerty.test.tsx`.
- `apps/web/components/modes/LevelTeachStep.tsx` — étape interactive d'enseignement.
- `apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`.
- `apps/web/components/modes/CurriculumLearningMode.tsx` — le mode AZERTY piloté par curriculum.
- `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`.

**Modifiés :**
- `packages/types/src/index.ts` — réexport de `learning.ts`.
- `packages/types/src/progression.ts` — `@deprecated` sur `LearningLevel` / `LEARNING_LEVELS`.
- `apps/web/lib/learning-progress.ts` — `KeyMastery`, `applyLearningKeystrokes`, `canUnlockCurriculumLevel`, `calculateCurriculumProgress`, `loadKeyMastery`/`saveKeyMastery`, `loadTaughtLevels`/`saveTaughtLevels`, `ensureCurriculumVersion`.
- `apps/web/components/typing/TypingArea.tsx` — `onSessionComplete` inclut `keystrokeData`.
- `apps/web/components/modes/LearningMode.tsx` — devient un dispatcher de 3 lignes.
- `apps/web/app/[locale]/parametres/ParametresClient.tsx` — entrée « revoir le positionnement des doigts » masquée sur non-desktop.
- `apps/web/components/typing/HomeClient.tsx` — repli `learning → classic` sur non-desktop.
- `apps/web/messages/fr.json` + `apps/web/messages/en.json` — clés i18n.

---

## Task 1: Types curriculum + table AZERTY

**Files:**
- Create: `packages/types/src/learning.ts`
- Create: `packages/types/src/__tests__/learning.test.ts`
- Modify: `packages/types/src/index.ts` (ajouter `export * from './learning';`)
- Modify: `packages/types/src/progression.ts` (JSDoc `@deprecated` sur `LearningLevel` et `LEARNING_LEVELS`)

**Interfaces:**
- Produces: `FingerId`, `KeyLayer`, `CurriculumKey`, `LevelKind`, `CurriculumLevel`, `CURRICULUM_VERSION` (= `1`), `DEAD_KEYS` (`Record<'^' | '¨', CurriculumKey>`), `LEARNING_CURRICULUM_AZERTY` (`CurriculumLevel[]`, 11 entrées).

Types :

```ts
export type FingerId = 'LP' | 'LR' | 'LM' | 'LI' | 'RI' | 'RM' | 'RR' | 'RP' | 'LT' | 'RT';
export type KeyLayer = 'base' | 'shift' | 'deadkey';

export interface CurriculumKey {
  id: string;        // geste unique : 'e', 'E', 'é', '^e', '1', '.', '?'
  char: string;      // caractère produit
  finger: FingerId;  // doigt de la partie « cible » du geste
  layer: KeyLayer;
  deadKey?: string;  // layer:'deadkey' seulement : '^' ou '¨'
  physical: string;  // char de base sur la position physique AZERTY (schéma)
}

export type LevelKind = 'anchors' | 'drill' | 'words' | 'text';

export interface CurriculumLevel {
  id: number;
  slug: string;
  kind: LevelKind;
  newKeys: CurriculumKey[];
  poolKeys: string[];
  minAccuracyPerKey: number;
  minSamplesPerKey: number;
  minOverallAccuracy?: number;  // kind:'text'
  minSamplesTotal?: number;     // kind:'text'
  audio: 'simple' | 'piece';
}

export const CURRICULUM_VERSION = 1;
```

`DEAD_KEYS` :

```ts
export const DEAD_KEYS: Record<'^' | '¨', CurriculumKey> = {
  '^': { id: '^', char: '^', finger: 'RP', layer: 'base', physical: '^' },
  '¨': { id: '¨', char: '¨', finger: 'RP', layer: 'shift', physical: '^' },
};
```

Table AZERTY (11 niveaux). `minAccuracyPerKey: 90`, `minSamplesPerKey: 20` partout sauf niveau 1.

| id | slug | kind | audio | newKeys (id · char · finger · layer · [deadKey] · physical) |
|---|---|---|---|---|
| 1 | `anchors` | `anchors` | `simple` | `q·q·LP·base·q`, `s·s·LR·base·s`, `d·d·LM·base·d`, `f·f·LI·base·f`, `j·j·RI·base·j`, `k·k·RM·base·k`, `l·l·RR·base·l`, `m·m·RP·base·m` — niveau 1 : `minAccuracyPerKey: 0`, `minSamplesPerKey: 1` (touché une fois) |
| 2 | `home-row` | `drill` | `simple` | les 8 ci-dessus **plus** `g·g·LI·base·g`, `h·h·RI·base·h` (10 touches ; g/h = étirements d'index) |
| 3 | `top-row` | `drill` | `simple` | `a·a·LP·base·a`, `z·z·LR·base·z`, `e·e·LM·base·e`, `r·r·LI·base·r`, `t·t·LI·base·t`, `y·y·RI·base·y`, `u·u·RI·base·u`, `i·i·RM·base·i`, `o·o·RR·base·o`, `p·p·RP·base·p` |
| 4 | `bottom-row` | `drill` | `simple` | `w·w·LP·base·w`, `x·x·LR·base·x`, `c·c·LM·base·c`, `v·v·LI·base·v`, `b·b·LI·base·b`, `n·n·RI·base·n`, `,·,·RI·base·,` |
| 5 | `first-words` | `words` | `piece` | `[]` (aucun nouveau geste) |
| 6 | `uppercase` | `words` | `piece` | `A·A·LP·shift·a`, `Z·Z·LR·shift·z`, `E·E·LM·shift·e`, `R·R·LI·shift·r`, `U·U·RI·shift·u`, `I·I·RM·shift·i`, `O·O·RR·shift·o`, `P·P·RP·shift·p` (8 majuscules représentatives ; `poolKeys` inclut néanmoins **les 26 majuscules**, voir plus bas) |
| 7 | `direct-accents` | `words` | `piece` | `é·é·LR·base·é`, `è·è·RI·base·è`, `à·à·RP·base·à`, `ç·ç·RR·base·ç`, `ù·ù·RP·base·ù` |
| 8 | `dead-keys` | `words` | `piece` | `^a·â·LP·deadkey·^·a`, `^e·ê·LM·deadkey·^·e`, `^i·î·RM·deadkey·^·i`, `^o·ô·RR·deadkey·^·o`, `^u·û·RI·deadkey·^·u`, `¨e·ë·LM·deadkey·¨·e`, `¨i·ï·RM·deadkey·¨·i`, `¨u·ü·RI·deadkey·¨·u` |
| 9 | `punctuation` | `text` | `piece` | `.·.·RM·shift·;`, `?·?·RI·shift·,`, `;·;·RM·base·;`, `:·:·RR·base·:`, `!·!·RP·base·!`, `'·'·LI·base·'`, `-·-·RI·base·-` — `minSamplesTotal: 250`, `minOverallAccuracy: 92` |
| 10 | `digits` | `text` | `piece` | `1·1·LP·shift·&`, `2·2·LR·shift·é`, `3·3·LM·shift·"`, `4·4·LI·shift·'`, `5·5·LI·shift·(`, `6·6·RI·shift·-`, `7·7·RI·shift·è`, `8·8·RM·shift·_`, `9·9·RR·shift·ç`, `0·0·RP·shift·à` — `minSamplesTotal: 250`, `minOverallAccuracy: 92` |
| 11 | `full-score` | `text` | `piece` | `[]` — `minSamplesTotal: 400`, `minOverallAccuracy: 95` |

`poolKeys` par niveau = union des `newKeys.id` de ce niveau et de tous les précédents. Exceptions explicites :
- Niveau 6 `poolKeys` inclut **les 26 ids de majuscule** (`A`..`Z`, `char` = majuscule, `finger` = celui de la minuscule, `layer: 'shift'`, `physical` = minuscule), pas seulement les 8 `newKeys`. Raison : capitaliser n'importe quel mot au début d'une phrase. Seules les 8 sont validées strictement.
- Niveaux 5 et 11 : `newKeys: []`, `poolKeys` = tout l'acquis.

Helper à exporter pour construire les `poolKeys` sans recopie manuelle d'erreur :

```ts
// interne au module, pas exporté
function buildPool(prev: string[], newKeys: CurriculumKey[], extra: string[] = []): string[] {
  return Array.from(new Set([...prev, ...newKeys.map((k) => k.id), ...extra]));
}
```

- [ ] **Step 1: Write the failing test** — `packages/types/src/__tests__/learning.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_VERSION,
  DEAD_KEYS,
  LEARNING_CURRICULUM_AZERTY,
  type FingerId,
} from '../learning';

const FINGERS: FingerId[] = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP', 'LT', 'RT'];

describe('LEARNING_CURRICULUM_AZERTY', () => {
  it('a 11 niveaux numérotés 1..11 dans l’ordre', () => {
    expect(LEARNING_CURRICULUM_AZERTY.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('CURRICULUM_VERSION est un entier positif', () => {
    expect(Number.isInteger(CURRICULUM_VERSION)).toBe(true);
    expect(CURRICULUM_VERSION).toBeGreaterThan(0);
  });

  it('chaque newKey a un finger valide', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const k of level.newKeys) {
        expect(FINGERS).toContain(k.finger);
      }
    }
  });

  it('les ids de geste sont uniques sur l’ensemble des newKeys', () => {
    const ids = LEARNING_CURRICULUM_AZERTY.flatMap((l) => l.newKeys.map((k) => k.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('poolKeys de chaque niveau est un sur-ensemble de (poolKeys précédent ∪ newKeys du niveau)', () => {
    let prev = new Set<string>();
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      const pool = new Set(level.poolKeys);
      for (const id of prev) expect(pool.has(id)).toBe(true);
      for (const k of level.newKeys) expect(pool.has(k.id)).toBe(true);
      prev = pool;
    }
  });

  it('toute clé layer:"deadkey" référence un deadKey connu', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const k of level.newKeys) {
        if (k.layer === 'deadkey') {
          expect(k.deadKey).toBeDefined();
          expect(Object.keys(DEAD_KEYS)).toContain(k.deadKey!);
        }
      }
    }
  });

  it('le niveau 11 est kind:"text" avec minOverallAccuracy et minSamplesTotal', () => {
    const last = LEARNING_CURRICULUM_AZERTY[10]!;
    expect(last.kind).toBe('text');
    expect(last.minOverallAccuracy).toBeGreaterThan(0);
    expect(last.minSamplesTotal).toBeGreaterThan(0);
  });

  it('le niveau 6 poolKeys contient les 26 majuscules', () => {
    const l6 = LEARNING_CURRICULUM_AZERTY[5]!;
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(l6.poolKeys).toContain(c);
    }
  });

  it('les niveaux drill/words ont minAccuracyPerKey=90 et minSamplesPerKey=20 (sauf niveau 1)', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      if (level.id === 1) {
        expect(level.minSamplesPerKey).toBe(1);
        continue;
      }
      expect(level.minAccuracyPerKey).toBe(90);
      expect(level.minSamplesPerKey).toBe(20);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project unit packages/types/src/__tests__/learning.test.ts`
Expected: FAIL — `Cannot find module '../learning'`.

- [ ] **Step 3: Write `packages/types/src/learning.ts`**

Écrire le module complet : les types ci-dessus, `CURRICULUM_VERSION = 1`, `DEAD_KEYS`, le helper `buildPool` interne, puis `LEARNING_CURRICULUM_AZERTY` en remplissant la table ci-dessus entrée par entrée. Construire chaque `poolKeys` via `buildPool(prevPool, level.newKeys, level.id === 6 ? [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] : [])`. Pour le niveau 6, définir aussi les 18 ids de majuscule hors `newKeys` uniquement dans `poolKeys` (chaînes), pas besoin d'objets `CurriculumKey` pour eux ici — `KeyboardDiagramAzerty` et `LevelTeachStep` n'ont besoin des objets que pour les `newKeys`.

- [ ] **Step 4: Add re-export** — `packages/types/src/index.ts`

Ajouter `export * from './learning';` à côté des autres réexports.

- [ ] **Step 5: Deprecate legacy** — `packages/types/src/progression.ts`

Au-dessus de `export interface LearningLevel` et `export const LEARNING_LEVELS`, ajouter :

```ts
/**
 * @deprecated Chemin QWERTY uniquement. Le parcours AZERTY est piloté par
 * `LEARNING_CURRICULUM_AZERTY` (./learning.ts). À supprimer quand le ticket
 * « Curriculum apprentissage QWERTY » aura porté le nouveau système à QWERTY.
 */
```

- [ ] **Step 6: Run tests + typecheck**

Run: `pnpm vitest run --project unit packages/types/src/__tests__/learning.test.ts && pnpm typecheck`
Expected: PASS, typecheck OK.

- [ ] **Step 7: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add packages/types/src/learning.ts packages/types/src/__tests__/learning.test.ts packages/types/src/index.ts packages/types/src/progression.ts
git commit -m "feat(apprentissage): curriculum AZERTY declaratif en 11 niveaux (#98)"
```

---

## Task 2: Maîtrise par touche — accumulation pure

**Files:**
- Modify: `apps/web/lib/learning-progress.ts`
- Create: `apps/web/lib/__tests__/learning-mastery.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `export type KeyMastery = Record<string, { correct: number; total: number }>;`
  - `export function applyLearningKeystrokes(mastery: KeyMastery, entries: { gestureId: string; correct: boolean }[]): KeyMastery;` — pure, retourne une nouvelle map, n'altère pas l'entrée.

- [ ] **Step 1: Write the failing test** — `apps/web/lib/__tests__/learning-mastery.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { applyLearningKeystrokes, type KeyMastery } from '../learning-progress';

describe('applyLearningKeystrokes', () => {
  it('accumule correct/total par id de geste', () => {
    const next = applyLearningKeystrokes({}, [
      { gestureId: 'e', correct: true },
      { gestureId: 'e', correct: false },
      { gestureId: 'é', correct: true },
    ]);
    expect(next['e']).toEqual({ correct: 1, total: 2 });
    expect(next['é']).toEqual({ correct: 1, total: 1 });
  });

  it('part d’un état existant sans le muter', () => {
    const prev: KeyMastery = { e: { correct: 5, total: 5 } };
    const next = applyLearningKeystrokes(prev, [{ gestureId: 'e', correct: false }]);
    expect(next['e']).toEqual({ correct: 5, total: 6 });
    expect(prev['e']).toEqual({ correct: 5, total: 5 }); // non muté
  });

  it('traite les gestes Maj et touche morte comme des ids distincts', () => {
    const next = applyLearningKeystrokes({}, [
      { gestureId: 'E', correct: true },
      { gestureId: '^e', correct: true },
      { gestureId: 'e', correct: false },
    ]);
    expect(Object.keys(next).sort()).toEqual(['E', '^e', 'e']);
  });

  it('sur entrée vide, retourne une copie de l’état', () => {
    const prev: KeyMastery = { a: { correct: 1, total: 1 } };
    const next = applyLearningKeystrokes(prev, []);
    expect(next).toEqual(prev);
    expect(next).not.toBe(prev);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-mastery.test.ts`
Expected: FAIL — `applyLearningKeystrokes` non exporté.

- [ ] **Step 3: Implement** — ajouter à `apps/web/lib/learning-progress.ts`

```ts
export type KeyMastery = Record<string, { correct: number; total: number }>;

export function applyLearningKeystrokes(
  mastery: KeyMastery,
  entries: { gestureId: string; correct: boolean }[],
): KeyMastery {
  const next: KeyMastery = {};
  for (const [id, v] of Object.entries(mastery)) next[id] = { ...v };
  for (const e of entries) {
    const cur = next[e.gestureId] ?? { correct: 0, total: 0 };
    next[e.gestureId] = {
      correct: cur.correct + (e.correct ? 1 : 0),
      total: cur.total + 1,
    };
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-mastery.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/lib/learning-progress.ts apps/web/lib/__tests__/learning-mastery.test.ts
git commit -m "feat(apprentissage): accumulation de la maitrise par touche (#98)"
```

---

## Task 3: Déblocage curriculum + progression

**Files:**
- Modify: `apps/web/lib/learning-progress.ts`
- Modify: `apps/web/lib/__tests__/learning-mastery.test.ts` (ajouter des cas)

**Interfaces:**
- Consumes: `KeyMastery` (Task 2), `CurriculumLevel` (Task 1).
- Produces:
  - `export function canUnlockCurriculumLevel(level: CurriculumLevel, mastery: KeyMastery, levelProgress: { samples: number; accuracy: number }): boolean;`
  - `export function calculateCurriculumProgress(level: CurriculumLevel, mastery: KeyMastery): { percent: number; weakestKeyId: string | null; weakestKeyAccuracy: number | null };`

Sémantique `canUnlockCurriculumLevel` :
- Chaque `k ∈ level.newKeys` : `m = mastery[k.id]`, exige `m && m.total >= level.minSamplesPerKey && (m.correct / m.total) * 100 >= level.minAccuracyPerKey`. Strict, sans soupape.
- Si `level.kind === 'text'` : exige aussi `levelProgress.samples >= (level.minSamplesTotal ?? 0)` et `levelProgress.accuracy >= (level.minOverallAccuracy ?? 0)`.
- `newKeys` vide + pas `text` : ne se produit pas dans la table, mais retourne `true` (rien à valider).

Sémantique `calculateCurriculumProgress` :
- `percent` = `round(100 * (nombre de newKeys ayant atteint leur barre) / max(1, newKeys.length))`. Si `newKeys` vide → `percent` reflète `levelProgress` : à câbler côté composant, ici retourner `100` si `newKeys` vide.
- `weakestKeyId` = l'id de `newKeys` avec le plus faible `min(samplesRatio, accuracyRatio)` pas encore à 1 ; `null` si toutes validées ou `newKeys` vide.
- `weakestKeyAccuracy` = précision (0-100) de cette touche, ou `null`.

- [ ] **Step 1: Write the failing tests** — ajouter à `learning-mastery.test.ts`

```ts
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import { canUnlockCurriculumLevel, calculateCurriculumProgress } from '../learning-progress';

const L3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row, 10 newKeys, 90/20
const L11 = LEARNING_CURRICULUM_AZERTY[10]!; // full-score, text, newKeys []

function fullMastery(level = L3, correct = 20, total = 20) {
  const m: Record<string, { correct: number; total: number }> = {};
  for (const k of level.newKeys) m[k.id] = { correct, total };
  return m;
}

describe('canUnlockCurriculumLevel', () => {
  it('faux tant qu’une seule newKey est sous sa barre (aucune soupape)', () => {
    const m = fullMastery();
    m[L3.newKeys[0]!.id] = { correct: 15, total: 20 }; // 75 % < 90 %
    expect(canUnlockCurriculumLevel(L3, m, { samples: 999, accuracy: 100 })).toBe(false);
  });

  it('faux si une newKey n’a pas assez d’échantillons', () => {
    const m = fullMastery();
    m[L3.newKeys[1]!.id] = { correct: 10, total: 10 }; // 100 % mais total 10 < 20
    expect(canUnlockCurriculumLevel(L3, m, { samples: 999, accuracy: 100 })).toBe(false);
  });

  it('vrai quand toutes les newKeys atteignent leur barre', () => {
    expect(canUnlockCurriculumLevel(L3, fullMastery(), { samples: 0, accuracy: 0 })).toBe(true);
  });

  it('niveau text : exige aussi minSamplesTotal et minOverallAccuracy', () => {
    expect(canUnlockCurriculumLevel(L11, {}, { samples: 100, accuracy: 99 })).toBe(false); // pas assez de samples
    expect(canUnlockCurriculumLevel(L11, {}, { samples: 500, accuracy: 90 })).toBe(false); // précision sous 95
    expect(canUnlockCurriculumLevel(L11, {}, { samples: 500, accuracy: 96 })).toBe(true);
  });
});

describe('calculateCurriculumProgress', () => {
  it('pourcentage = fraction des newKeys ayant atteint leur barre', () => {
    const m = fullMastery();
    m[L3.newKeys[0]!.id] = { correct: 0, total: 0 };
    m[L3.newKeys[1]!.id] = { correct: 10, total: 20 };
    const r = calculateCurriculumProgress(L3, m);
    expect(r.percent).toBe(80); // 8/10
  });

  it('weakestKeyId = la touche la plus loin de sa barre', () => {
    const m = fullMastery();
    m[L3.newKeys[3]!.id] = { correct: 2, total: 20 }; // 10 %
    const r = calculateCurriculumProgress(L3, m);
    expect(r.weakestKeyId).toBe(L3.newKeys[3]!.id);
    expect(r.weakestKeyAccuracy).toBe(10);
  });

  it('newKeys vide → percent 100, weakest null', () => {
    const r = calculateCurriculumProgress(L11, {});
    expect(r).toEqual({ percent: 100, weakestKeyId: null, weakestKeyAccuracy: null });
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-mastery.test.ts`
Expected: FAIL — `canUnlockCurriculumLevel` non exporté.

- [ ] **Step 3: Implement** — ajouter à `learning-progress.ts`

```ts
import type { CurriculumLevel } from '@typewav/types';

function keyReachedBar(
  m: { correct: number; total: number } | undefined,
  level: CurriculumLevel,
): boolean {
  if (!m || m.total < level.minSamplesPerKey) return false;
  return (m.correct / m.total) * 100 >= level.minAccuracyPerKey;
}

export function canUnlockCurriculumLevel(
  level: CurriculumLevel,
  mastery: KeyMastery,
  levelProgress: { samples: number; accuracy: number },
): boolean {
  const everyKeyOk = level.newKeys.every((k) => keyReachedBar(mastery[k.id], level));
  if (!everyKeyOk) return false;
  if (level.kind === 'text') {
    if (levelProgress.samples < (level.minSamplesTotal ?? 0)) return false;
    if (levelProgress.accuracy < (level.minOverallAccuracy ?? 0)) return false;
  }
  return true;
}

export function calculateCurriculumProgress(
  level: CurriculumLevel,
  mastery: KeyMastery,
): { percent: number; weakestKeyId: string | null; weakestKeyAccuracy: number | null } {
  if (level.newKeys.length === 0) {
    return { percent: 100, weakestKeyId: null, weakestKeyAccuracy: null };
  }
  let reached = 0;
  let weakestKeyId: string | null = null;
  let weakestScore = Infinity;
  let weakestKeyAccuracy: number | null = null;
  for (const k of level.newKeys) {
    const m = mastery[k.id];
    if (keyReachedBar(m, level)) {
      reached += 1;
      continue;
    }
    const samplesRatio = (m?.total ?? 0) / level.minSamplesPerKey;
    const acc = m && m.total > 0 ? (m.correct / m.total) * 100 : 0;
    const accuracyRatio = acc / level.minAccuracyPerKey;
    const score = Math.min(samplesRatio, accuracyRatio);
    if (score < weakestScore) {
      weakestScore = score;
      weakestKeyId = k.id;
      weakestKeyAccuracy = Math.round(acc);
    }
  }
  return {
    percent: Math.round((100 * reached) / level.newKeys.length),
    weakestKeyId,
    weakestKeyAccuracy,
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-mastery.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/lib/learning-progress.ts apps/web/lib/__tests__/learning-mastery.test.ts
git commit -m "feat(apprentissage): deblocage strict par touche + progression (#98)"
```

---

## Task 4: Persistance mastery + taught-levels + migration de version

**Files:**
- Modify: `apps/web/lib/learning-progress.ts`
- Create: `apps/web/lib/__tests__/learning-curriculum-persistence.test.ts`

**Interfaces:**
- Consumes: `getPreference`/`setPreference` (`./db`), `KeyMastery` (Task 2), `CURRICULUM_VERSION`, `LEARNING_CURRICULUM_AZERTY`, `createInitialLevelProgress` (déjà présent).
- Produces:
  - `export async function loadKeyMastery(): Promise<KeyMastery>;` — `{}` si absent.
  - `export async function saveKeyMastery(m: KeyMastery): Promise<void>;`
  - `export async function loadTaughtLevels(): Promise<number[]>;` — `[]` si absent.
  - `export async function saveTaughtLevels(ids: number[]): Promise<void>;`
  - `export async function ensureCurriculumVersion(): Promise<void>;` — si `learning_curriculum_version` ≠ `CURRICULUM_VERSION` : remet `learning_level_progress` à `createInitialLevelProgress(LEARNING_CURRICULUM_AZERTY)`, `learning_key_mastery` à `{}`, `learning_taught_levels` à `[]`, écrit la version. Idempotent.

Clés `user_preferences` : `learning_key_mastery`, `learning_taught_levels`, `learning_curriculum_version`.

- [ ] **Step 1: Write the failing test** — `apps/web/lib/__tests__/learning-curriculum-persistence.test.ts`

```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getPreference, setPreference } from '../db';
import {
  ensureCurriculumVersion,
  loadKeyMastery,
  loadTaughtLevels,
  saveKeyMastery,
  saveTaughtLevels,
} from '../learning-progress';
import { CURRICULUM_VERSION } from '@typewav/types';

beforeEach(async () => {
  await setPreference('learning_curriculum_version', undefined);
  await setPreference('learning_key_mastery', undefined);
  await setPreference('learning_taught_levels', undefined);
  await setPreference('learning_level_progress', undefined);
});

describe('persistance curriculum', () => {
  it('loadKeyMastery retourne {} quand rien n’est sauvegardé', async () => {
    expect(await loadKeyMastery()).toEqual({});
  });

  it('save puis load round-trip la maîtrise', async () => {
    await saveKeyMastery({ e: { correct: 3, total: 4 } });
    expect(await loadKeyMastery()).toEqual({ e: { correct: 3, total: 4 } });
  });

  it('loadTaughtLevels round-trip', async () => {
    expect(await loadTaughtLevels()).toEqual([]);
    await saveTaughtLevels([1, 2, 3]);
    expect(await loadTaughtLevels()).toEqual([1, 2, 3]);
  });

  it('ensureCurriculumVersion reset tout si la version diffère', async () => {
    await saveKeyMastery({ e: { correct: 9, total: 9 } });
    await saveTaughtLevels([1, 2, 3, 4]);
    await setPreference('learning_level_progress', [{ levelId: 99, accuracy: 100, samples: 100, unlocked: true }]);

    await ensureCurriculumVersion();

    expect(await getPreference('learning_curriculum_version')).toBe(CURRICULUM_VERSION);
    expect(await loadKeyMastery()).toEqual({});
    expect(await loadTaughtLevels()).toEqual([]);
    const progress = (await getPreference('learning_level_progress')) as { levelId: number }[];
    expect(progress.map((p) => p.levelId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('ensureCurriculumVersion ne touche à rien si la version est à jour', async () => {
    await setPreference('learning_curriculum_version', CURRICULUM_VERSION);
    await saveKeyMastery({ e: { correct: 9, total: 9 } });
    await ensureCurriculumVersion();
    expect(await loadKeyMastery()).toEqual({ e: { correct: 9, total: 9 } });
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-curriculum-persistence.test.ts`
Expected: FAIL — fonctions non exportées.

- [ ] **Step 3: Implement** — ajouter à `learning-progress.ts`

```ts
import { CURRICULUM_VERSION, LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

const KEY_MASTERY_KEY = 'learning_key_mastery';
const TAUGHT_LEVELS_KEY = 'learning_taught_levels';
const CURRICULUM_VERSION_KEY = 'learning_curriculum_version';

export async function loadKeyMastery(): Promise<KeyMastery> {
  return (await getPreference<KeyMastery>(KEY_MASTERY_KEY)) ?? {};
}
export async function saveKeyMastery(m: KeyMastery): Promise<void> {
  await setPreference(KEY_MASTERY_KEY, m);
}
export async function loadTaughtLevels(): Promise<number[]> {
  const v = await getPreference<number[]>(TAUGHT_LEVELS_KEY);
  return Array.isArray(v) ? v : [];
}
export async function saveTaughtLevels(ids: number[]): Promise<void> {
  await setPreference(TAUGHT_LEVELS_KEY, ids);
}

export async function ensureCurriculumVersion(): Promise<void> {
  const stored = await getPreference<number>(CURRICULUM_VERSION_KEY);
  if (stored === CURRICULUM_VERSION) return;
  await setPreference(LEARNING_PROGRESS_KEY, createInitialLevelProgress(LEARNING_CURRICULUM_AZERTY));
  await setPreference(KEY_MASTERY_KEY, {});
  await setPreference(TAUGHT_LEVELS_KEY, []);
  await setPreference(CURRICULUM_VERSION_KEY, CURRICULUM_VERSION);
}
```

Note : `createInitialLevelProgress` accepte déjà `LearningLevel[]` ; `CurriculumLevel` a aussi `{ id }`, donc élargir sa signature à `{ id: number }[]` ou caster. Préférer élargir : `createInitialLevelProgress(levels: { id: number }[])`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-curriculum-persistence.test.ts && pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-progress.test.ts`
Expected: PASS (l'ancien test de `learning-progress` reste vert).

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/lib/learning-progress.ts apps/web/lib/__tests__/learning-curriculum-persistence.test.ts
git commit -m "feat(apprentissage): persistance maitrise + migration de version du curriculum (#98)"
```

---

## Task 5: Données de contenu FR

**Files:**
- Create: `apps/web/lib/learning-texts.ts`
- Create: `apps/web/lib/__tests__/learning-texts.test.ts`

**Interfaces:**
- Produces:
  - `export const WORDS_FR_PLAIN: string[];` — minuscules, sans accent, sans ponctuation. ≥ 120 mots courants (2-8 lettres). Ex. `le, chat, dort, sur, mur, train, part, gare, ville, matin, jardin, fleur, table, livre, porte, route, ...`.
  - `export const WORDS_FR_PROPER: string[];` — noms propres capitalisés sans accent (`Paris, Rome, Lyon, Marie, Louis, Anna, Léo` → **sans accent**, donc `Leo` non, garder `Paris, Rome, Lyon, Nantes, Marie, Louis, Anna, Julie, Simon, Iris`). ≥ 30.
  - `export const WORDS_FR_ACCENTS: string[];` — contiennent au moins un de `é è à ç ù`, pas de circonflexe/tréma. ≥ 80 (`été, près, très, café, école, élève, mère, père, frère` → `frère` a un circonflexe ? non, `frère` = è ; ok. Exclure `être, forêt`). `voilà, déjà, où, ça, garçon, leçon, français, çà, façon, aperçu`.
  - `export const WORDS_FR_CIRCUMFLEX: string[];` — contiennent au moins un de `â ê î ô û ë ï ü`. ≥ 60 (`être, tête, fête, forêt, hôpital, hôtel, âme, gâteau, château, goût, coût, août, île, maître, Noël, maïs, aiguë, naïf, haïr`).
  - `export interface LearningParagraph { tags: ('punctuation' | 'digits' | 'full')[]; text: string; }`
  - `export const LEARNING_PARAGRAPHS: LearningParagraph[];` — ≥ 4 par tag, **texte original**, 200-500 caractères chacun. `punctuation` : riche en `. , ; : ! ? ' -`. `digits` : dates, quantités, prix (« Le 14 juillet, 3 amis partent à 8 heures. Ils ont 250 grammes de pain et 2 litres d'eau. »). `full` : tout mélangé, majuscules + accents directs + circonflexes + ponctuation + chiffres.

Contrainte contenu (CONTRIBUTING) : tous les paragraphes sont écrits originaux et didactiques (phrases neutres sur la frappe, le quotidien, la nature), aucune citation, aucune source tierce.

- [ ] **Step 1: Write the failing test** — `apps/web/lib/__tests__/learning-texts.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  LEARNING_PARAGRAPHS,
  WORDS_FR_ACCENTS,
  WORDS_FR_CIRCUMFLEX,
  WORDS_FR_PLAIN,
  WORDS_FR_PROPER,
} from '../learning-texts';

const ACCENT_DIRECT = /[éèàçù]/;
const CIRCUMFLEX = /[âêîôûëïü]/;

describe('pools de mots FR', () => {
  it('WORDS_FR_PLAIN : minuscules, aucun accent, aucune ponctuation, ≥ 120', () => {
    expect(WORDS_FR_PLAIN.length).toBeGreaterThanOrEqual(120);
    for (const w of WORDS_FR_PLAIN) {
      expect(w).toBe(w.toLowerCase());
      expect(ACCENT_DIRECT.test(w)).toBe(false);
      expect(CIRCUMFLEX.test(w)).toBe(false);
      expect(/^[a-z]+$/.test(w)).toBe(true);
    }
  });

  it('WORDS_FR_PROPER : capitalisés, sans accent, ≥ 30', () => {
    expect(WORDS_FR_PROPER.length).toBeGreaterThanOrEqual(30);
    for (const w of WORDS_FR_PROPER) {
      expect(w[0]).toBe(w[0]!.toUpperCase());
      expect(ACCENT_DIRECT.test(w)).toBe(false);
      expect(CIRCUMFLEX.test(w)).toBe(false);
    }
  });

  it('WORDS_FR_ACCENTS : au moins un accent direct, pas de circonflexe, ≥ 80', () => {
    expect(WORDS_FR_ACCENTS.length).toBeGreaterThanOrEqual(80);
    for (const w of WORDS_FR_ACCENTS) {
      expect(ACCENT_DIRECT.test(w)).toBe(true);
      expect(CIRCUMFLEX.test(w)).toBe(false);
    }
  });

  it('WORDS_FR_CIRCUMFLEX : au moins un circonflexe/tréma, ≥ 60', () => {
    expect(WORDS_FR_CIRCUMFLEX.length).toBeGreaterThanOrEqual(60);
    for (const w of WORDS_FR_CIRCUMFLEX) {
      expect(CIRCUMFLEX.test(w)).toBe(true);
    }
  });
});

describe('LEARNING_PARAGRAPHS', () => {
  it('≥ 4 paragraphes par tag', () => {
    for (const tag of ['punctuation', 'digits', 'full'] as const) {
      expect(LEARNING_PARAGRAPHS.filter((p) => p.tags.includes(tag)).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('les paragraphes digits contiennent au moins un chiffre', () => {
    for (const p of LEARNING_PARAGRAPHS.filter((p) => p.tags.includes('digits'))) {
      expect(/[0-9]/.test(p.text)).toBe(true);
    }
  });

  it('les paragraphes full contiennent majuscule, accent, ponctuation et chiffre', () => {
    for (const p of LEARNING_PARAGRAPHS.filter((p) => p.tags.includes('full'))) {
      expect(/[A-Z]/.test(p.text)).toBe(true);
      expect(/[éèàçùâêîôûëïü]/.test(p.text)).toBe(true);
      expect(/[.,;:!?'-]/.test(p.text)).toBe(true);
      expect(/[0-9]/.test(p.text)).toBe(true);
    }
  });

  it('longueur 150-600 caractères', () => {
    for (const p of LEARNING_PARAGRAPHS) {
      expect(p.text.length).toBeGreaterThanOrEqual(150);
      expect(p.text.length).toBeLessThanOrEqual(600);
    }
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-texts.test.ts`
Expected: FAIL — module absent.

- [ ] **Step 3: Implement** — `apps/web/lib/learning-texts.ts`

Écrire les 4 pools de mots (respecter les regex du test : `WORDS_FR_PLAIN` en `^[a-z]+$`, etc.) et `LEARNING_PARAGRAPHS` (≥ 4 par tag, texte original 150-600 car., contraintes du test). Prendre le temps de vérifier chaque mot à la main contre les regex — un seul mot accentué dans `WORDS_FR_PLAIN` casse le test.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-texts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/lib/learning-texts.ts apps/web/lib/__tests__/learning-texts.test.ts
git commit -m "feat(apprentissage): pools de mots et paragraphes FR du curriculum (#98)"
```

---

## Task 6: Générateur de contenu — drills, mots, textes

**Files:**
- Create: `apps/web/lib/learning-content.ts`
- Create: `apps/web/lib/__tests__/learning-content.test.ts`

**Interfaces:**
- Consumes: `CurriculumLevel`, `LEARNING_CURRICULUM_AZERTY` (Task 1) ; `KeyMastery` (Task 2) ; les pools (Task 5).
- Produces:
  - `export function generateLearningDrill(level: CurriculumLevel, mastery: KeyMastery, wordCount?: number): string;` — groupes de « lettres » séparés par des espaces, tirés de `level.poolKeys` (uniquement des ids d'une seule lettre minuscule, ce qui est le cas des niveaux `drill`), longueurs 2-7. Pondération : chaque `newKey` non encore maîtrisée pèse `1 + deficit` (deficit = `1 - min(samplesRatio, accuracyRatio)`, borné à [0,1]) ; les autres `poolKeys` pèsent `0.25`. Densité résultante des `newKeys` bornée entre 40 % et 60 % : après tirage, si hors bande, re-tirer les positions excédentaires/manquantes.
  - `export function pickLearningWords(level: CurriculumLevel, wordCount?: number): string;` — mots tirés du pool approprié au `slug` : `first-words` → `WORDS_FR_PLAIN` ; `uppercase` → `WORDS_FR_PLAIN` capitalisés + `WORDS_FR_PROPER` ; `direct-accents` → `WORDS_FR_ACCENTS` (+ un peu de `WORDS_FR_PLAIN` pour le liant) ; `dead-keys` → `WORDS_FR_CIRCUMFLEX` (+ liant). Filtrer chaque mot pour que tous ses caractères correspondent à un id de `level.poolKeys` (une lettre = son id ; une majuscule = son id majuscule ; `é` = `é` ; etc.). Si le pool filtré est vide → repli sur le pool non filtré du niveau (jamais une chaîne vide).
  - `export function pickLearningText(level: CurriculumLevel): string;` — un `LEARNING_PARAGRAPHS` au hasard dont `tags` contient : `punctuation` pour `slug === 'punctuation'`, `digits` pour `'digits'`, `full` pour `'full-score'`.

- [ ] **Step 1: Write the failing test** — `apps/web/lib/__tests__/learning-content.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import {
  generateLearningDrill,
  pickLearningText,
  pickLearningWords,
} from '../learning-content';

const L2 = LEARNING_CURRICULUM_AZERTY[1]!; // home-row drill
const L3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row drill
const L5 = LEARNING_CURRICULUM_AZERTY[4]!; // first-words
const L7 = LEARNING_CURRICULUM_AZERTY[6]!; // direct-accents
const L9 = LEARNING_CURRICULUM_AZERTY[8]!; // punctuation
const L11 = LEARNING_CURRICULUM_AZERTY[10]!; // full-score

describe('generateLearningDrill', () => {
  it('n’émet que des caractères présents dans poolKeys (+ espace)', () => {
    const pool = new Set(L3.poolKeys);
    const out = generateLearningDrill(L3, {}, 40);
    for (const ch of out) {
      if (ch === ' ') continue;
      expect(pool.has(ch)).toBe(true);
    }
  });

  it('concentre les répétitions sur la newKey la plus faible', () => {
    const weak = L3.newKeys[4]!.id;
    const mastery = Object.fromEntries(
      L3.newKeys.map((k) => [k.id, { correct: 20, total: 20 }]),
    );
    mastery[weak] = { correct: 1, total: 20 }; // 5 %
    const out = generateLearningDrill(L3, mastery, 60).replace(/ /g, '');
    const weakShare = [...out].filter((c) => c === weak).length / out.length;
    const otherNewKey = L3.newKeys[0]!.id;
    const otherShare = [...out].filter((c) => c === otherNewKey).length / out.length;
    expect(weakShare).toBeGreaterThan(otherShare);
  });

  it('densité des newKeys entre 40 % et 60 %', () => {
    const newIds = new Set(L2.newKeys.map((k) => k.id));
    const out = generateLearningDrill(L2, {}, 80).replace(/ /g, '');
    const density = [...out].filter((c) => newIds.has(c)).length / out.length;
    expect(density).toBeGreaterThanOrEqual(0.4);
    expect(density).toBeLessThanOrEqual(0.6);
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

  it('jamais une chaîne vide', () => {
    expect(pickLearningWords(L5, 20).trim().length).toBeGreaterThan(0);
    expect(pickLearningWords(L7, 20).trim().length).toBeGreaterThan(0);
  });
});

describe('pickLearningText', () => {
  it('punctuation : renvoie un paragraphe taggé punctuation', () => {
    expect(pickLearningText(L9).length).toBeGreaterThan(100);
  });
  it('full-score : paragraphe avec majuscule, accent, ponctuation, chiffre', () => {
    const t = pickLearningText(L11);
    expect(/[A-Z]/.test(t) && /[éèàçùâêîôûëïü]/.test(t) && /[.,;:!?]/.test(t) && /[0-9]/.test(t)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-content.test.ts`
Expected: FAIL — module absent.

- [ ] **Step 3: Implement** — `apps/web/lib/learning-content.ts`

Implémenter les trois fonctions selon les interfaces ci-dessus. Points de vigilance :
- Pour la densité 40-60 % : tirer d'abord chaque caractère selon les poids, puis compter la part `newKeys` ; tant qu'elle est < 0.4, remplacer un caractère non-newKey aléatoire par un `newKey` (pondéré par déficit) ; tant qu'elle est > 0.6, l'inverse. Convergence garantie (bornes larges).
- `filterWordByPool(word, pool)` : chaque caractère du mot doit être une clé de `pool` (un `Set<string>`). Une majuscule `P` est dans le pool au niveau 6 (id `P`).
- `pickLearningText` : `LEARNING_PARAGRAPHS.filter(p => p.tags.includes(tag))`, tirage aléatoire, `.text`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/lib/learning-content.ts apps/web/lib/__tests__/learning-content.test.ts
git commit -m "feat(apprentissage): generateur de drills adaptatifs, mots et textes (#98)"
```

---

## Task 7: `TypingArea` — exposer `keystrokeData` en fin de session

**Files:**
- Modify: `apps/web/components/typing/TypingArea.tsx:166-172` (type `onSessionComplete`) et `:336-341` (émission)
- Modify: `apps/web/components/__tests__/TypingArea.*.test.tsx` si un test asserte la forme exacte du payload (sinon rien)

**Interfaces:**
- Produces: le payload de `onSessionComplete` gagne `keystrokeData: KeystrokeEntry[]` (import depuis `@typewav/types`). `keystrokeData[i]` correspond à la position `i` du `text` (le curseur avance à chaque frappe, Backspace dépile ; à la complétion `keystrokeData.length === text.length`).

- [ ] **Step 1: Write the failing test** — `apps/web/components/modes/__tests__/TypingArea.keystrokeData.test.tsx` (nouveau, ciblé)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TypingArea } from '@/components/typing/TypingArea';

// Mock minimal de useAudioEngine / useSession si nécessaire selon le repo ;
// réutiliser le harnais des tests TypingArea existants.

describe('TypingArea onSessionComplete', () => {
  it('inclut keystrokeData aligné sur le texte', async () => {
    const onSessionComplete = vi.fn();
    render(<TypingArea text="fj" mode="learning" autoNavigate={false} onSessionComplete={onSessionComplete} />);
    const user = userEvent.setup();
    await user.keyboard('fj');
    expect(onSessionComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        keystrokeData: expect.arrayContaining([
          expect.objectContaining({ char: 'f', correct: true }),
          expect.objectContaining({ char: 'j', correct: true }),
        ]),
      }),
    );
  });
});
```

(Adapter l'import du harnais et les mocks au style des tests `TypingArea` existants du repo — voir `apps/web/components/**/__tests__` pour le `vi.mock` de `useAudioEngine`.)

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/TypingArea.keystrokeData.test.tsx`
Expected: FAIL — `keystrokeData` absent du payload.

- [ ] **Step 3: Implement**

Dans l'interface `TypingAreaProps`, `onSessionComplete` :

```ts
onSessionComplete?: (stats: {
  wpm: number;
  accuracy: number;
  correct: number;
  total: number;
  keystrokeData: import('@typewav/types').KeystrokeEntry[];
}) => void;
```

Dans l'effet de complétion (`onSessionComplete?.({ ... })`), ajouter `keystrokeData: keystrokes,` (la variable `keystrokes` locale à l'effet).

- [ ] **Step 4: Run to verify pass + non-régression**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/TypingArea.keystrokeData.test.tsx && pnpm vitest run --project web-components apps/web/components/typing/__tests__ apps/web/components/__tests__/HomeClient.test.tsx`
Expected: PASS, aucun test existant cassé.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/typing/TypingArea.tsx apps/web/components/modes/__tests__/TypingArea.keystrokeData.test.tsx
git commit -m "feat(apprentissage): keystrokeData dans le payload onSessionComplete (#98)"
```

---

## Task 8: Extraire `LegacyLearningMode` (refactor sans changement de comportement)

**Files:**
- Create: `apps/web/components/modes/LegacyLearningMode.tsx` (corps actuel de `LearningMode` déplacé verbatim, `export function LegacyLearningMode`)
- Modify: `apps/web/components/modes/LearningMode.tsx` (devient un dispatcher ; pour cette task, rend **toujours** `LegacyLearningMode` — la bifurcation AZERTY arrive Task 12)
- Modify: `apps/web/components/modes/__tests__/LearningMode.test.tsx` (imports inchangés : le test cible `LearningMode`, qui délègue)

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: `export function LegacyLearningMode(props: LearningModeProps)` — signature identique à l'actuelle `LearningMode`. `LearningMode` réexporte le même type `LearningModeProps`.

- [ ] **Step 1: Déplacer le code**

Copier tout le corps actuel de `apps/web/components/modes/LearningMode.tsx` dans `LegacyLearningMode.tsx`, renommer `export function LearningMode` → `export function LegacyLearningMode`, garder tous les imports. Ne rien modifier d'autre.

- [ ] **Step 2: Réduire `LearningMode.tsx` à un dispatcher**

```tsx
'use client';

import { LegacyLearningMode } from './LegacyLearningMode';

export interface LearningModeProps {
  isOnboarding?: boolean;
  onExitTutorial: () => void;
}

export function LearningMode(props: LearningModeProps) {
  // Task 12 : bifurquer sur la disposition. Pour l'instant, toujours l'ancien.
  return <LegacyLearningMode {...props} />;
}
```

(Si `LearningModeProps` était déclaré dans l'ancien fichier, le déplacer ici et l'importer depuis `LegacyLearningMode` ou le partager via ce fichier.)

- [ ] **Step 3: Run existing tests — aucun changement de comportement**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/LearningMode.test.tsx apps/web/components/__tests__/HomeClient.test.tsx apps/web/app/[locale]/dev-onboarding` (si test) ` && pnpm typecheck`
Expected: PASS — exactement les mêmes tests, verts, sans modification.

- [ ] **Step 4: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/LegacyLearningMode.tsx apps/web/components/modes/LearningMode.tsx
git commit -m "refactor(apprentissage): extrait LegacyLearningMode, LearningMode devient un dispatcher (#98)"
```

---

## Task 9: `KeyboardDiagramAzerty`

**Files:**
- Create: `apps/web/components/modes/KeyboardDiagramAzerty.tsx`
- Create: `apps/web/components/modes/__tests__/KeyboardDiagramAzerty.test.tsx`

**Interfaces:**
- Consumes: `CurriculumKey`, `DEAD_KEYS` (Task 1) ; `FINGER_COLORS` (copier depuis `KeyboardDiagram.tsx`, ou extraire dans un module partagé `apps/web/components/modes/finger-colors.ts` — au choix de l'implémenteur, extraire est propre).
- Produces:
  ```ts
  export interface KeyboardDiagramAzertyProps {
    /** Gestes à surligner (les newKeys du niveau). */
    highlightKeys?: CurriculumKey[];
    /** Geste attendu courant (drill) : id. */
    activeKeyId?: string;
    /** Pour un geste layer:'shift' : quelle main tient Maj ('L' | 'R'). */
    expectedShiftHand?: 'L' | 'R';
    /** Pour un geste layer:'deadkey' : étape 1 (touche morte) ou 2 (voyelle). */
    deadKeyStep?: 1 | 2;
  }
  export function KeyboardDiagramAzerty(props: KeyboardDiagramAzertyProps): JSX.Element;
  ```

Grille (positions normalisées, `viewBox` à recalibrer pour 5 rangées) :
- **Rangée chiffres** `y≈4` : `² & é " ' ( - è _ ç à ) =` — libellé = char de base ; petit exposant = chiffre pour les 10 du milieu.
- **Rangée haut** `y≈36` : `a z e r t y u i o p ^ $` — sur `^`, afficher `¨` en exposant.
- **Rangée repos** `y≈68` : `q s d f g h j k l m ù *`.
- **Rangée bas** `y≈100` : `w x c v b n , ; : !`.
- **Rangée modificateurs / espace** `y≈132` : `Maj` (gauche, large), `Maj` (droite, large), `Espace` (centre).

Couleurs par doigt : réutiliser `FINGER_COLORS` de `KeyboardDiagram.tsx`. Table doigt→touches = celle de la spec (section « Table des doigts AZERTY »).

Rendu des états :
- `highlightKeys` : chaque touche correspondante teintée de sa couleur de doigt (fond), le reste neutre.
- `activeKeyId` : pulse la touche cible. Si le geste est `layer:'shift'` et `expectedShiftHand` fourni, pulser **aussi** la touche `Maj` de cette main avec un style « maintien » (bordure pleine, pas de pulse d'impact). Si `layer:'deadkey'` : `deadKeyStep === 1` → pulser la touche `^` ; `deadKeyStep === 2` → pulser la voyelle. Petit badge « 1 » / « 2 ».
- `minHeight` du SVG : `clamp(180px, 40vh, 320px)` (desktop-only, pas besoin des planchers fins de #71). `width: 100%`. `viewBox` calé pour que les 5 rangées tiennent sans rognage.

- [ ] **Step 1: Write the failing test** — `KeyboardDiagramAzerty.test.tsx`

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyboardDiagramAzerty } from '../KeyboardDiagramAzerty';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

describe('KeyboardDiagramAzerty', () => {
  it('rend les 5 rangées (chiffres, haut, repos, bas, modificateurs)', () => {
    const { container } = render(<KeyboardDiagramAzerty />);
    // chaque touche = un <g data-key="..."> ou <rect data-key="...">
    expect(container.querySelector('[data-key="&"]')).toBeTruthy();   // rangée chiffres
    expect(container.querySelector('[data-key="a"]')).toBeTruthy();   // rangée haut
    expect(container.querySelector('[data-key="q"]')).toBeTruthy();   // repos
    expect(container.querySelector('[data-key=","]')).toBeTruthy();   // bas
    expect(container.querySelector('[data-key="ShiftLeft"]')).toBeTruthy();
    expect(container.querySelector('[data-key="ShiftRight"]')).toBeTruthy();
  });

  it('surligne les highlightKeys', () => {
    const l3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row
    const { container } = render(<KeyboardDiagramAzerty highlightKeys={l3.newKeys} />);
    const aKey = container.querySelector('[data-key="a"]');
    expect(aKey?.getAttribute('data-highlight')).toBe('true');
    expect(container.querySelector('[data-key="w"]')?.getAttribute('data-highlight')).toBeNull();
  });

  it('geste Maj : marque la touche Maj de la main attendue en maintien', () => {
    const { container } = render(
      <KeyboardDiagramAzerty activeKeyId="E" expectedShiftHand="R" />,
    );
    expect(container.querySelector('[data-key="ShiftRight"]')?.getAttribute('data-hold')).toBe('true');
    expect(container.querySelector('[data-key="ShiftLeft"]')?.getAttribute('data-hold')).toBeNull();
  });

  it('touche morte : étape 1 pulse "^", étape 2 pulse la voyelle', () => {
    const step1 = render(<KeyboardDiagramAzerty activeKeyId="^e" deadKeyStep={1} />);
    expect(step1.container.querySelector('[data-key="^"]')?.getAttribute('data-active')).toBe('true');
    const step2 = render(<KeyboardDiagramAzerty activeKeyId="^e" deadKeyStep={2} />);
    expect(step2.container.querySelector('[data-key="e"]')?.getAttribute('data-active')).toBe('true');
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/KeyboardDiagramAzerty.test.tsx`
Expected: FAIL — composant absent.

- [ ] **Step 3: Implement** — `KeyboardDiagramAzerty.tsx`

SVG avec, pour chaque touche, un `<g data-key={id}>` portant `data-highlight` / `data-active` / `data-hold` selon les props, un `<rect>` (fond = couleur de doigt si `highlight`, sinon neutre) et un `<text>` (libellé de base + `<tspan>` exposant si chiffre/tréma). Table des touches en dur (positions x/y/w/h + finger + label + shiftLabel?). Les `Maj` = `data-key="ShiftLeft"` / `"ShiftRight"`. Résoudre `activeKeyId` → touche physique : pour un id d'une lettre c'est la lettre ; pour `E` (Maj) c'est `e` + Maj main opposée ; pour `^e` c'est `^` ou `e` selon `deadKeyStep` ; pour un chiffre `1` c'est `&` + Maj. Voir la spec (section `KeyboardDiagramAzerty`) pour le détail visuel.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/KeyboardDiagramAzerty.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/KeyboardDiagramAzerty.tsx apps/web/components/modes/__tests__/KeyboardDiagramAzerty.test.tsx apps/web/components/modes/finger-colors.ts
git commit -m "feat(apprentissage): schema clavier AZERTY etendu (chiffres, Maj, touches mortes) (#98)"
```

---

## Task 10: `LevelTeachStep`

**Files:**
- Create: `apps/web/components/modes/LevelTeachStep.tsx`
- Create: `apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`

**Interfaces:**
- Consumes: `CurriculumLevel`, `CurriculumKey` (Task 1) ; `KeyboardDiagramAzerty` (Task 9) ; le patron de capture caché de `TypingArea` (input hors écran + `compositionend`/`input` + normalisation NFC — **pas** `TypingArea` lui-même).
- Produces:
  ```ts
  export interface LevelTeachStepProps {
    level: CurriculumLevel;
    onDone: () => void;
  }
  export function LevelTeachStep(props: LevelTeachStepProps): JSX.Element;
  ```

Comportement :
- Affiche : `t('learning.level.<slug>.name')`, `t('learning.level.<slug>.teach')`, `<KeyboardDiagramAzerty highlightKeys={level.newKeys} />`, une barre « produire chaque geste une fois ».
- **Barre de pratique** : un `Set<string>` des ids de geste déjà produits. Chaque geste de `level.newKeys` doit y être une fois. `<button>` « Commencer » `disabled` tant que `produced.size < level.newKeys.length`, sinon appelle `onDone`.
  - Capture : un `<input aria-hidden tabIndex={-1}>` hors écran, focus délégué au montage et sur `mousedown` du conteneur. Sur `compositionend` / `input` (hors composition), lire le caractère produit (NFC), le mapper vers un id de geste attendu : comparer aux `char` des `newKeys` (`ê` → `^e`, `É`/`E` → `E` si `char` correspond, `é` → `é`, `q` → `q`). Si match → `produced.add(id)`.
- `level.kind === 'anchors'` (niveau 1) : la barre = les 8 touches `q s d f j k l m` touchées une fois ; `onDone` conclut le niveau (le composant appelant le sait, `LevelTeachStep` appelle juste `onDone`).
- Jamais de listener `keydown` de texte.

- [ ] **Step 1: Write the failing test** — `LevelTeachStep.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { LevelTeachStep } from '../LevelTeachStep';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import messages from '@/messages/fr.json';

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="fr" messages={messages}>{ui}</NextIntlClientProvider>
);

describe('LevelTeachStep', () => {
  it('« Commencer » est désactivé tant que chaque nouveau geste n’a pas été produit', async () => {
    const onDone = vi.fn();
    const level = LEARNING_CURRICULUM_AZERTY[2]!; // top-row, 10 lettres
    render(wrap(<LevelTeachStep level={level} onDone={onDone} />));
    const btn = screen.getByRole('button', { name: /commencer/i });
    expect(btn).toBeDisabled();
    const user = userEvent.setup();
    await user.keyboard('azertyuiop');
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('niveau anchors : 8 repères à toucher', async () => {
    const onDone = vi.fn();
    const level = LEARNING_CURRICULUM_AZERTY[0]!;
    render(wrap(<LevelTeachStep level={level} onDone={onDone} />));
    const btn = screen.getByRole('button', { name: /commencer/i });
    const user = userEvent.setup();
    await user.keyboard('qsdfjklm');
    expect(btn).toBeEnabled();
  });
});
```

(Adapter le harnais i18n au style des tests du repo — plusieurs tests utilisent déjà `NextIntlClientProvider` + `messages/fr.json`.)

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`
Expected: FAIL — composant absent (et clés i18n absentes, ce qui est traité Task 11).

- [ ] **Step 3: Implement** — `LevelTeachStep.tsx`

Selon l'interface ci-dessus. Extraire le patron de capture caché dans un petit hook `useHiddenCapture(onChar: (nfcChar: string) => void)` local au fichier (ou `apps/web/components/modes/useHiddenCapture.ts`) : crée le `<input>`, gère focus délégué, `compositionend`/`input`, NFC. Réutilisé par `CurriculumLearningMode` si besoin, mais `TypingArea` garde le sien.

- [ ] **Step 4: Run to verify pass** (après Task 11 pour les clés i18n ; ici, vérifier avec des clés temporaires ou accepter l'échec i18n et revalider Task 11)

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`
Expected: PASS une fois Task 11 mergée. **Ordonnancement : faire Task 11 avant la validation finale de Task 10**, ou insérer les 3 clés du niveau testé (`top-row`) à la main ici.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/LevelTeachStep.tsx apps/web/components/modes/__tests__/LevelTeachStep.test.tsx apps/web/components/modes/useHiddenCapture.ts
git commit -m "feat(apprentissage): etape interactive d'enseignement par niveau (#98)"
```

---

## Task 11: Clés i18n du curriculum

**Files:**
- Modify: `apps/web/messages/fr.json` (bloc `learning`)
- Modify: `apps/web/messages/en.json` (bloc `learning`)
- Create: `apps/web/lib/__tests__/learning-i18n.test.ts` — parité fr/en + une clé par niveau

**Interfaces:**
- Produces, sous `learning.level` : pour chaque `slug` des 11 niveaux, `{ name, tagline, teach }`. Plus `learning.teachStep.{practiceLabel, practiceProgress, start}`, `learning.mastery.{weakKey, levelProgress}`, `learning.curriculum.{levelCounter}`.

Textes (fr) — écrire les 11 `teach` en une phrase orientée geste, ex. :
- `anchors.teach` : « Sens les deux bosses sous F et J : pose tes index dessus, les six autres doigts juste à côté. »
- `home-row.teach` : « La rangée du repos. G et H se tapent en tendant l'index, sans bouger la main. »
- `top-row.teach` : « La rangée du haut. Chaque doigt monte d'un cran depuis sa touche de repos, puis y revient. »
- `bottom-row.teach` : « La rangée du bas. Chaque doigt descend d'un cran, la virgule se tape avec l'index droit. »
- `first-words.teach` : « De vrais mots, sans accent ni majuscule. Regarde l'écran, pas tes mains. »
- `uppercase.teach` : « Pour une majuscule, l'auriculaire de la main opposée tient Maj pendant que l'autre main frappe la lettre. »
- `direct-accents.teach` : « Sur AZERTY, é è à ç sont des touches directes sur la rangée des chiffres, ù est à droite du M. Aucune combinaison. »
- `dead-keys.teach` : « L'accent circonflexe se tape en deux temps : d'abord la touche ^ (rien ne s'affiche), puis la voyelle. Tréma : Maj + ^, puis la voyelle. »
- `punctuation.teach` : « Le point se fait avec Maj sur la touche point-virgule ; le point d'interrogation avec Maj sur la virgule. »
- `digits.teach` : « Sur AZERTY, les chiffres se tapent avec Maj. Chaque chiffre garde le doigt de sa colonne. »
- `full-score.teach` : « Tout est là. Un vrai texte français, à ton rythme, jusqu'à 95 % de précision. »

`name` / `tagline` : reprendre l'esprit musical des clés existantes (`learning.level.1.name` = « Les premières notes »…), en réécrire 11 cohérentes avec les nouveaux slugs.

- [ ] **Step 1: Write the failing test** — `learning-i18n.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import fr from '@/messages/fr.json';
import en from '@/messages/en.json';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

describe('i18n curriculum', () => {
  it('chaque niveau a name/tagline/teach en fr et en', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const msgs of [fr, en] as const) {
        const node = (msgs as any).learning.level[level.slug];
        expect(node, `${level.slug}`).toBeDefined();
        expect(typeof node.name).toBe('string');
        expect(typeof node.tagline).toBe('string');
        expect(typeof node.teach).toBe('string');
      }
    }
  });

  it('teachStep / mastery / curriculum présents en fr et en', () => {
    for (const msgs of [fr, en] as const) {
      expect((msgs as any).learning.teachStep.start).toBeTruthy();
      expect((msgs as any).learning.mastery.weakKey).toBeTruthy();
      expect((msgs as any).learning.curriculum.levelCounter).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-i18n.test.ts`
Expected: FAIL — clés absentes.

- [ ] **Step 3: Implement**

Ajouter les blocs sous `learning.level` (11 slugs) + `learning.teachStep` + `learning.mastery` + `learning.curriculum` dans `fr.json` et `en.json`. Garder les anciennes clés `learning.level.1..5` (le chemin QWERTY les utilise encore).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-i18n.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/messages/fr.json apps/web/messages/en.json apps/web/lib/__tests__/learning-i18n.test.ts
git commit -m "feat(apprentissage): cles i18n des 11 niveaux du curriculum (#98)"
```

---

## Task 12: `CurriculumLearningMode` — squelette (état, rail, routage étape/drill, migration)

**Files:**
- Create: `apps/web/components/modes/CurriculumLearningMode.tsx`
- Create: `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`
- Modify: `apps/web/components/modes/LearningMode.tsx` (bifurcation réelle)

**Interfaces:**
- Consumes: `LEARNING_CURRICULUM_AZERTY` (T1), `ensureCurriculumVersion` / `loadKeyMastery` / `saveKeyMastery` / `loadTaughtLevels` / `saveTaughtLevels` / `loadLearningProgress` / `saveLearningProgress` / `createInitialLevelProgress` / `canUnlockCurriculumLevel` / `calculateCurriculumProgress` (T2-4), `LevelTeachStep` (T10), briques #91 : `LevelClearedMoment` / `LEVELS_WITH_CLEARED_MOMENT` (adapter au nouveau `LEARNING_CURRICULUM_AZERTY.length`), `LevelRailSpotlight`, `useKeyboardLayoutPreference`, `getCelebratedLearningLevels` / `markLearningLevelCelebrated`.
- Produces: `export function CurriculumLearningMode(props: LearningModeProps): JSX.Element` (même `LearningModeProps` que `LearningMode`).

Comportement de cette task (drill loop + mastery → Task 13) :
- Au montage : `await ensureCurriculumVersion()` ; charger `levelProgress` (ou `createInitialLevelProgress(LEARNING_CURRICULUM_AZERTY)`), `keyMastery`, `taughtLevels`, `celebratedLevels`.
- `currentLevelId` state (démarre au plus haut niveau `unlocked`).
- `currentLevel = LEARNING_CURRICULUM_AZERTY[currentLevelId - 1]`.
- Si `currentLevelId ∉ taughtLevels` → rendre `<LevelTeachStep level={currentLevel} onDone={handleTeachDone} />`. `handleTeachDone` : `saveTaughtLevels([...taughtLevels, currentLevelId])` ; si `currentLevel.kind === 'anchors'` → déclencher directement le déblocage (comme si le niveau était validé) ; sinon passer au drill.
- Sinon → rendre le rail (11 pas, réutiliser la structure de `LegacyLearningMode`) + un placeholder de zone de drill (`<div data-testid="drill-zone" />` pour l'instant ; Task 13 le remplit).
- Rail : repli compact < 900 px (réutiliser `useMediaQuery('(max-width: 900px)')` comme `LegacyLearningMode`). `#level-rail-next-dot` porté par le point suivant.

`LearningMode.tsx` (bifurcation réelle) :

```tsx
'use client';
import { useKeyboardLayoutPreference } from '@/hooks/useKeyboardLayoutPreference';
import { CurriculumLearningMode } from './CurriculumLearningMode';
import { LegacyLearningMode } from './LegacyLearningMode';

export interface LearningModeProps {
  isOnboarding?: boolean;
  onExitTutorial: () => void;
}

export function LearningMode(props: LearningModeProps) {
  const { layout } = useKeyboardLayoutPreference();
  return layout === 'azerty'
    ? <CurriculumLearningMode {...props} />
    : <LegacyLearningMode {...props} />;
}
```

- [ ] **Step 1: Write the failing test** — `CurriculumLearningMode.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { CurriculumLearningMode } from '../CurriculumLearningMode';

// Réutiliser les mocks de LearningMode.test.tsx : useAudioEngine, TypingArea stub,
// @/lib/db (getPreference/setPreference), useKeyboardLayoutPreference -> 'azerty'.

const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="fr" messages={messages}>{ui}</NextIntlClientProvider>
);

describe('CurriculumLearningMode', () => {
  it('affiche l’étape d’enseignement du niveau 1 tant qu’il n’est pas dans taughtLevels', async () => {
    render(wrap(<CurriculumLearningMode onExitTutorial={vi.fn()} />));
    expect(await screen.findByText(/pose tes index/i)).toBeInTheDocument();
    expect(screen.queryByTestId('drill-zone')).not.toBeInTheDocument();
  });

  it('après l’étape d’enseignement d’un niveau drill, passe à la zone de drill', async () => {
    // taughtLevels seed = [] ; produire les 8 repères puis Commencer
    render(wrap(<CurriculumLearningMode onExitTutorial={vi.fn()} />));
    const user = userEvent.setup();
    await user.keyboard('qsdfjklm');
    await user.click(await screen.findByRole('button', { name: /commencer/i }));
    // niveau 1 = anchors → déblocage direct → niveau 2, étape d’enseignement du 2
    expect(await screen.findByText(/rangée du repos/i)).toBeInTheDocument();
  });

  it('appelle ensureCurriculumVersion au montage', async () => {
    const spy = vi.fn();
    vi.doMock('@/lib/learning-progress', async (orig) => ({
      ...(await orig<Record<string, unknown>>()),
      ensureCurriculumVersion: spy,
    }));
    // ... monter, waitFor(() => expect(spy).toHaveBeenCalled())
  });
});
```

(Adapter au harnais de mocks de `LearningMode.test.tsx` existant — le réutiliser tel quel.)

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`
Expected: FAIL — composant absent.

- [ ] **Step 3: Implement** le squelette + la bifurcation dans `LearningMode.tsx`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx apps/web/components/modes/__tests__/LearningMode.test.tsx apps/web/components/__tests__/HomeClient.test.tsx && pnpm typecheck`
Expected: PASS. `LearningMode.test.tsx` : si ses mocks fixent `layout` à `azerty`, il rendra désormais `CurriculumLearningMode` — vérifier/ajuster ces tests pour forcer `qwerty` là où ils visent le comportement legacy, ou les déplacer vers `CurriculumLearningMode.test.tsx`. Documenter le choix dans le message de commit.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/CurriculumLearningMode.tsx apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx apps/web/components/modes/LearningMode.tsx apps/web/components/modes/__tests__/LearningMode.test.tsx
git commit -m "feat(apprentissage): CurriculumLearningMode (squelette) + bifurcation AZERTY/QWERTY (#98)"
```

---

## Task 13: `CurriculumLearningMode` — boucle de drill, maîtrise, déblocage, audio

**Files:**
- Modify: `apps/web/components/modes/CurriculumLearningMode.tsx`
- Modify: `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`

**Interfaces:**
- Consumes: `generateLearningDrill` / `pickLearningWords` / `pickLearningText` (T6), `applyLearningKeystrokes` (T2), `canUnlockCurriculumLevel` / `calculateCurriculumProgress` (T3), `TypingArea` (payload `keystrokeData`, T7), `useAudioEngine` (`playNoteName`, `loadMidiPiece`, `playNote` — déjà présents).
- Produces: rien de nouveau exporté.

Comportement :
- Zone de drill : selon `currentLevel.kind` → `generateLearningDrill(currentLevel, keyMastery)` (`drill`) / `pickLearningWords(currentLevel)` (`words`) / `pickLearningText(currentLevel)` (`text`). Construire `targetGestureIds: string[]` position par position à partir du texte + `currentLevel` : lettre `x` → `x` ; majuscule `X` → `X` ; `é` → `é` ; `ê` → `^e` ; etc. (fonction `mapCharToGestureId(char, level)` pure, testée).
- `<TypingArea key={runIndex} text={text} mode="learning" autoNavigate={false} onSessionComplete={handleSessionComplete} onActiveKeyChange={setActiveKey} />`.
- `handleSessionComplete({ keystrokeData, accuracy, correct, total })` :
  - `entries = keystrokeData.map((k, i) => ({ gestureId: targetGestureIds[i], correct: k.correct })).filter(e => e.gestureId)` (zip par index, s'arrête au plus court).
  - `nextMastery = applyLearningKeystrokes(keyMastery, entries)` → `setKeyMastery` + `saveKeyMastery`.
  - `nextProgress = applySessionStats(levelProgress, currentLevelId, { correct, total })` → `setLevelProgress` + `saveLearningProgress`.
  - Régénère `text` + `targetGestureIds` + `runIndex++` (nouvelle série même niveau).
  - Si `canUnlockCurriculumLevel(currentLevel, nextMastery, currentLevelProgress)` → déblocage : `unlockLevel(nextProgress, currentLevelId + 1)`, `LevelClearedMoment`, spotlight, `markLearningLevelCelebrated`. Si `isLastLevel` → `tutorialComplete` → bouton `onExitTutorial`.
- **Audio** selon `currentLevel.audio` :
  - `simple` : au montage du niveau, ne PAS appeler `loadMidiPiece`. `onActiveKeyChange` / le retour de frappe : jouer `playNoteName(pitchForRow(physicalRow))` sur frappe correcte via `onNoteChange` de `TypingArea` (note != null ⇒ correcte). Mapping : repos → `C4`, haut → `G4`, bas → `G3`, espace → `C3`.
  - `piece` : `loadMidiPiece(selectedPieceId ?? 'fur-elise')` au montage du niveau ; `TypingArea` joue déjà le morceau via son chemin normal.
  - Bascule au changement de `currentLevelId`.
- Barre de progression : `calculateCurriculumProgress(currentLevel, keyMastery)` → `percent` + ligne « la touche qui coince : `X` à `N` % » via `learning.mastery.weakKey`.

- [ ] **Step 1: Write the failing tests** — ajouter à `CurriculumLearningMode.test.tsx`

```tsx
// Avec un TypingArea stub qui expose un bouton "finir série" appelant
// onSessionComplete avec un keystrokeData fabriqué :
it('intègre les frappes dans la maîtrise et débloque quand chaque newKey atteint sa barre', async () => {
  // seed taughtLevels = [1,2,3] ; forcer currentLevelId = 3 (top-row) ;
  // stub onSessionComplete avec 20 frappes correctes par newKey du niveau 3 ;
  // attendre LevelClearedMoment / le déblocage du niveau 4.
});

it('niveau audio "simple" ne charge aucune pièce MIDI', async () => {
  const loadMidiPiece = vi.fn();
  // mock useAudioEngine -> { loadMidiPiece, playNoteName: vi.fn(), ... }
  // monter au niveau 2 (drill, audio simple), attendre le rendu de drill-zone
  expect(loadMidiPiece).not.toHaveBeenCalled();
});

it('niveau audio "piece" charge une pièce', async () => {
  const loadMidiPiece = vi.fn();
  // monter au niveau 5 (words, audio piece)
  await waitFor(() => expect(loadMidiPiece).toHaveBeenCalled());
});
```

Plus un test pur du helper `mapCharToGestureId` dans `apps/web/lib/__tests__/learning-content.test.ts` (le déplacer dans `learning-content.ts` s'il est réutilisé) :

```ts
it('mapCharToGestureId : lettre, majuscule, accent direct, circonflexe', () => {
  const L8 = LEARNING_CURRICULUM_AZERTY[7]!;
  expect(mapCharToGestureId('a', L8)).toBe('a');
  expect(mapCharToGestureId('E', L8)).toBe('E');
  expect(mapCharToGestureId('é', L8)).toBe('é');
  expect(mapCharToGestureId('ê', L8)).toBe('^e');
  expect(mapCharToGestureId(' ', L8)).toBe(''); // espace : pas un geste validé
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx && pnpm vitest run --project web-lib apps/web/lib/__tests__/learning-content.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** la boucle de drill, le zip mastery, le déblocage, la bascule audio, `mapCharToGestureId` (dans `learning-content.ts`, exporté).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__ && pnpm vitest run --project web-lib apps/web/lib/__tests__ && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/CurriculumLearningMode.tsx apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx apps/web/lib/learning-content.ts apps/web/lib/__tests__/learning-content.test.ts
git commit -m "feat(apprentissage): boucle de drill, maitrise par touche, deblocage, audio (#98)"
```

---

## Task 14: Gating desktop-only — Paramètres + HomeClient

**Files:**
- Modify: `apps/web/app/[locale]/parametres/ParametresClient.tsx` (autour de `handleReviewFingerPositioning`, ~ligne 42 et le JSX du lien ~ligne 182)
- Modify: `apps/web/app/[locale]/parametres/__tests__/ParametresClient.test.tsx`
- Modify: `apps/web/components/typing/HomeClient.tsx` (garde-fou `learning → classic`)
- Modify: `apps/web/components/__tests__/HomeClient.test.tsx`

**Interfaces:**
- Consumes: `isNonDesktopDevice` (`@/lib/device`, livré par #110).

- [ ] **Step 1: Write the failing tests**

`ParametresClient.test.tsx` :

```tsx
it('masque l’entrée « revoir le positionnement des doigts » sur appareil non desktop', async () => {
  window.matchMedia = ((q: string) => ({
    matches: q === NON_DESKTOP_MEDIA_QUERY, media: q,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  render(/* ParametresClient */);
  expect(screen.queryByText(/positionnement des doigts/i)).not.toBeInTheDocument();
});

it('affiche l’entrée sur desktop', async () => {
  // matchMedia -> matches:false
  render(/* ParametresClient */);
  expect(screen.getByText(/positionnement des doigts/i)).toBeInTheDocument();
});
```

`HomeClient.test.tsx` :

```tsx
it('sur appareil non desktop, un activeMode "learning" persistant retombe sur "classic"', async () => {
  // seed useConfigStore { activeMode: 'learning' } ; matchMedia -> NON_DESKTOP_MEDIA_QUERY matche
  render(<HomeClient initialCollection={mockLitterature as never} />);
  await waitFor(() => expect(useConfigStore.getState().activeMode).toBe('classic'));
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm vitest run --project web-components apps/web/app/[locale]/parametres/__tests__/ParametresClient.test.tsx apps/web/components/__tests__/HomeClient.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`ParametresClient.tsx` : `import { isNonDesktopDevice } from '@/lib/device';` puis un state `const [nonDesktop, setNonDesktop] = useState(false); useEffect(() => setNonDesktop(isNonDesktopDevice()), []);` et envelopper le bloc du lien « revoir le positionnement des doigts » dans `{!nonDesktop && ( ... )}`.

`HomeClient.tsx` : dans un `useEffect` (à côté du garde onboarding), `if (activeMode === 'learning' && isNonDesktopDevice()) setActiveMode('classic');` — dépendances `[activeMode, setActiveMode]`. (Éviter le `setState` synchrone dans le corps d'effet, cf. lint `react-hooks/set-state-in-effect` rencontré en #110 : envelopper dans un microtask ou garder la condition dans un chemin `.then`/handler — le plus simple ici : `queueMicrotask(() => { if (...) setActiveMode('classic'); })` avec garde `cancelled`.)

- [ ] **Step 4: Run to verify pass + non-régression**

Run: `pnpm vitest run --project web-components apps/web/app/[locale]/parametres apps/web/components/__tests__/HomeClient.test.tsx && cd apps/web && pnpm lint`
Expected: PASS, lint clean (attention `react-hooks/set-state-in-effect`).

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/app/[locale]/parametres/ParametresClient.tsx apps/web/app/[locale]/parametres/__tests__/ParametresClient.test.tsx apps/web/components/typing/HomeClient.tsx apps/web/components/__tests__/HomeClient.test.tsx
git commit -m "feat(apprentissage): mode Apprentissage desktop-only (entree Parametres + garde-fou HomeClient) (#98)"
```

---

## Task 15: `LevelClearedMoment` / spotlight — adapter au nouveau nombre de niveaux

**Files:**
- Modify: `apps/web/components/modes/LevelClearedMoment.tsx:535` (`LEVELS_WITH_CLEARED_MOMENT`)
- Modify: `apps/web/components/modes/__tests__/LevelClearedMoment.test.tsx`

**Interfaces:**
- `LEVELS_WITH_CLEARED_MOMENT` doit dériver du curriculum servi. Comme le composant est partagé entre legacy (QWERTY, `LEARNING_LEVELS`, 5) et curriculum (AZERTY, 11), passer la liste de niveaux en paramètre plutôt que d'importer une constante globale, OU exporter deux constantes. Choix : `LevelClearedMoment` reçoit déjà un `levelId` ; ajouter un prop `totalLevels?: number` (défaut = `LEARNING_LEVELS.length` pour le legacy) et laisser `CurriculumLearningMode` passer `LEARNING_CURRICULUM_AZERTY.length`.

- [ ] **Step 1: Write/adjust the failing test** — que `LevelClearedMoment` avec `levelId=10, totalLevels=11` ne se comporte pas comme « dernier niveau ».

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Implement** le prop `totalLevels`.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run --project web-components apps/web/components/modes/__tests__/LevelClearedMoment.test.tsx apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`

- [ ] **Step 5: Commit**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
git add apps/web/components/modes/LevelClearedMoment.tsx apps/web/components/modes/__tests__/LevelClearedMoment.test.tsx apps/web/components/modes/CurriculumLearningMode.tsx
git commit -m "feat(apprentissage): LevelClearedMoment parametrable sur le nombre de niveaux (#98)"
```

---

## Task 16: Gate complet + QA navigateur réel

**Files:** aucun code ; scripts jetables dans le scratchpad de session.

- [ ] **Step 1: Gate local complet**

```bash
git restore apps/web/next-env.d.ts 2>/dev/null; true
pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build
```
Expected: tout vert. Noter le nombre de fichiers/tests.

- [ ] **Step 2: QA navigateur réel — Playwright headless**

Méthode : mémoire persistante `responsive-pass-71` (`resize_window` de l'extension KO sous Wayland → Chromium headless local). Installer `playwright@1.62.0` dans le scratchpad, `pnpm --filter @typewav/web start` sur un port libre, piloter :

1. **Touches mortes (niveau 8)** : naviguer, forcer `layout=azerty` + progression seedée jusqu'au niveau 8, taper `^` puis `e` dans la zone de frappe → le caractère validé est `ê` (via le champ de capture caché + `commitChar`) ; taper `¨` (Maj+`^`) puis `e` → `ë`. Vérifier qu'une frappe `ê` correcte incrémente la maîtrise du geste `^e` (lire `learning_key_mastery` via `page.evaluate` sur IndexedDB, ou l'affichage de progression).
2. **Chiffres (niveau 10)** : une frappe de la rangée des chiffres sans Maj produit `&`/`é`/... et est comptée fausse ; avec Maj, produit le chiffre et est comptée juste.
3. **`KeyboardDiagramAzerty`** : aux viewports 1024 et 1440, `document.documentElement.scrollWidth - clientWidth <= 0` (pas de débordement horizontal) et le pied de page reste visible (le diagramme + le contenu tiennent dans `calc(100dvh - var(--nav-height))`).
4. **Audio `simple`** : au niveau 2, aucune requête réseau vers un `.mid`, `loadMidiPiece` non appelé (log console ou absence de fetch `/midi/`).

- [ ] **Step 3: Consigner** les résultats (tableau viewport / attendu / obtenu) dans le message de PR.

- [ ] **Step 4: Commit** (si des scripts de QA méritent d'être gardés dans `docs/qa/`, sinon rien)

---

## Task 17: Ouvrir le ticket QWERTY

**Files:** aucun (GitHub).

- [ ] **Step 1:** Ouvrir l'issue via `gh issue create`, **écrite à la 1re personne comme Mouwafic, zéro trace IA/skills/Claude** (mémoire `feedback_ticket_writing_style`).

Titre : `Porter le nouveau curriculum d'apprentissage à QWERTY`

Corps (adapter le ton à celui des issues existantes du repo) :

```
Le mode Apprentissage a été refondu pour AZERTY (#98) : 11 niveaux, validation
stricte par touche, étape d'enseignement interactive, schéma clavier étendu.
QWERTY tourne encore sur l'ancien curriculum (`LEARNING_LEVELS`, `LegacyLearningMode`).

Ce que je veux : porter le même système de curriculum déclaratif à QWERTY, avec
son propre ordre d'enseignement (chiffres en touches directes, ponctuation, la
question des accents sur un clavier QWERTY - compose key, dispositions
internationales, ou hors périmètre), plus AltGr / symboles si pertinent.

Puis supprimer `LegacyLearningMode`, l'ancien `LEARNING_LEVELS` de
`packages/types/src/progression.ts` et le `KeyboardDiagram` QWERTY devenu inutile.

À brainstormer avant tout code, comme #98.
```

- [ ] **Step 2:** Noter le numéro d'issue obtenu dans le message de PR de #98.

---

## Task 18: PR + merge + suivi

- [ ] **Step 1:** Sync `main`, rebase la branche, `git restore apps/web/next-env.d.ts`.
- [ ] **Step 2:** Ouvrir la PR (`gh pr create --base main`). Corps : résumé du curriculum, tableau QA navigateur réel, lien vers la spec, mention du ticket QWERTY ouvert (Task 17). Zéro attribution IA.
- [ ] **Step 3:** `gh run watch <id> --exit-status` — CI verte avant merge.
- [ ] **Step 4:** `gh pr merge --squash --delete-branch`. Re-sync `main`, watcher la CI post-merge.
- [ ] **Step 5:** Mettre à jour `HANDOFF.md` (RAS + résumé #98), `docs/LAUNCH_PLAN.md` (entrée de journal + WS concerné) via un commit `chore:` sur une branche dédiée + PR (jamais direct sur `main`), redéployer l'artifact `Route de lancement TypeWav` si jalon. Mémoire : mettre à jour `project_responsive_pass_71` n'est pas le bon fichier — créer/mettre à jour une mémoire `project` dédiée au mode Apprentissage si un fait durable en ressort (le split legacy/curriculum, les seuils).

---

## Self-Review

**1. Spec coverage :**

| Section spec | Task(s) |
|---|---|
| Curriculum AZERTY 11 niveaux | 1 |
| `packages/types/src/learning.ts` (modèle) | 1 |
| `learning-progress.ts` étendu (mastery, unlock, progress) | 2, 3 |
| Persistance + migration `CURRICULUM_VERSION` | 4 |
| `learning-texts.ts` (pools + paragraphes) | 5 |
| `learning-content.ts` (drill adaptatif, mots, textes) | 6, 13 (`mapCharToGestureId`) |
| `TypingArea` → `keystrokeData` | 7 |
| `LearningMode` dispatcher + `LegacyLearningMode` | 8, 12 |
| `KeyboardDiagramAzerty` | 9 |
| `LevelTeachStep` | 10 |
| i18n | 11 |
| `CurriculumLearningMode` (rail, teach routing, migration) | 12 |
| `CurriculumLearningMode` (drill loop, mastery, unlock, audio) | 13 |
| Gating desktop (Paramètres + HomeClient) | 14 |
| Contenant #91 (`LevelClearedMoment` nb niveaux) | 15 |
| Tests 3 niveaux | chaque task + 16 (navigateur réel) |
| Split QWERTY | 8, 12 |
| Livrable : ticket QWERTY | 17 |
| Error handling (fail open, pools vides, zip court) | 4, 6, 13 (dans les implémentations) |
| Migration | 4, 12 |

Aucun trou identifié. Le « niveau bonus AltGr » et le tréma `ü` optionnel sont explicitement hors périmètre / à trancher (spec §« Hors périmètre » et §Livrables 5).

**2. Placeholder scan :** les steps « Implement » des composants lourds (9, 12, 13) renvoient à la section correspondante de la spec pour le détail visuel exhaustif, mais donnent l'interface complète (props, types, noms exportés), le code des parties non triviales (zip mastery, densité 40-60 %, `canUnlockCurriculumLevel`, bascule audio) et le code de test complet. Pas de « TODO », pas de « add error handling » nu (les cas d'erreur sont nommés : pool vide → repli, zip → plus court, fail open sur IndexedDB).

**3. Type consistency :** `KeyMastery`, `CurriculumLevel`, `CurriculumKey`, `canUnlockCurriculumLevel(level, mastery, levelProgress)`, `calculateCurriculumProgress(level, mastery)`, `applyLearningKeystrokes(mastery, entries)`, `generateLearningDrill(level, mastery, wordCount?)`, `mapCharToGestureId(char, level)`, `LevelTeachStepProps { level, onDone }`, `KeyboardDiagramAzertyProps { highlightKeys, activeKeyId, expectedShiftHand, deadKeyStep }` — noms et signatures cohérents entre les tasks qui les définissent (1-6) et celles qui les consomment (9-15).

**Ordonnancement inter-task à respecter :** 1 → 2 → 3 → 4 ; 5 → 6 ; 7 indépendant ; 8 avant 12 ; 9 avant 10 et 12 ; 11 avant la validation finale de 10 et 12 ; 12 avant 13 ; 13 avant 15 ; 14 indépendant (après #110 déjà mergé) ; 16-18 en fin.
