# Conservatoire, partie 2 : l'onboarding, le clavier vivant et l'instrument. Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** À la première visite sur ordinateur, TypeWav ouvre le Conservatoire sur un onboarding musical de onze écrans (le clavier devient un instrument, la gamme du repos, le silence d'une erreur, les données locales, deux questions, un test de placement), joué au clavier sur un clavier vivant qui ne colore que la touche attendue et répond à chaque frappe juste par une onde.

**Architecture :** Logique pure dans `apps/web/lib/conservatoire/` (table physique des touches par `code`, instrument une note par doigt, détection de disposition, profil et règles du placement). Composants dans `apps/web/components/conservatoire/` : `Stage` (un écran, une chose), `LivingKeyboard` (SVG pour les touches, canvas pour l'onde), `onboarding/OnboardingFlow` (machine à écrans pilotée par `keydown` + `code`), `onboarding/PlacementTest` (`TypingArea` en mode Temps, 30 s). Route `/[locale]/conservatoire` ; en attendant les parties 3 et 4, l'espace après l'onboarding affiche le mode Apprentissage actuel.

**Tech Stack :** Next.js 16 (App Router), React 19.2 (`useEffectEvent`, `ref` en prop), `motion/react`, next-intl, Vitest 4 (`web-lib` node + `fake-indexeddb`, `web-components` jsdom), Playwright (Chromium, build de production).

**Spec :** `docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md`, partie 2 (et la philosophie d'interaction R1 à R6).

## Global Constraints

- Persistance IndexedDB seulement, store `user_preferences` existant (`apps/web/lib/db.ts`), sans changement de version de la base. Jamais `localStorage`.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` : props optionnelles par spread conditionnel, jamais `x: undefined`.
- TDD : chaque fonction pure et chaque comportement de composant a un test qui échoue d'abord.
- Fail open : une lecture ou une écriture IndexedDB qui échoue ne piège jamais l'utilisateur et ne bloque jamais la fin de l'onboarding.
- Exception documentée à la règle de capture : les écrans d'onboarding lisent `KeyboardEvent.code` sur `keydown` (touches physiques, aucun texte composé). Le test de placement passe par `TypingArea` et sa capture cachée.
- Son : uniquement `useAudioEngine().playNoteName` (piano échantillonné). Aucun son sur une erreur, jamais.
- Mouvement : `cubic-bezier(0.16, 1, 0.3, 1)` pour l'onde et l'apparition d'un écran, `cubic-bezier(0.25, 0.46, 0.45, 0.94)` pour le reste ; changement de texte en 240 ms, fondu et 8 px ; sous `prefers-reduced-motion`, pas de canvas, la touche s'enfonce.
- Constantes exactes : `ADVANCE_MS = 650` (après F et J), `HINT_MS = 1600` (aide sur hésitation), `CHOICE_MS = 400` (après un choix), `PLACEMENT_SECONDS = 30`, seuils du placement 30 mots par minute et 95 % inclus, onde de 1150 ms, second anneau à 140 ms, opacités 0,5 et 0,28, traits de 1,5 et 1 px, enfoncement `scale(0.94)` en 120 ms, clavier limité à 42 % de la hauteur de fenêtre.
- Clés de persistance : `has_completed_onboarding` (existante), `keyboardLayout` (existante, via `useKeyboardLayoutPreference`), `conservatoire_profile` (nouvelle), `conservatoire_mastery` (partie 1).
- Tutoiement partout. Textes dans le namespace i18n `conservatoire` (fr et en, mêmes clés). Aucun tiret cadratin ni demi-cadratin, ni dans le code ni dans les textes ni dans les commits.
- Conventional commits en français, zéro attribution IA. Branche de travail : `feat/conservatoire-onboarding`, depuis `main` à jour une fois ce plan mergé (sinon depuis `docs/conservatoire-partie-2`).

## Écarts assumés par rapport à la spec

- **Mode carte du `LivingKeyboard` et `loadProfile` : reportés à la partie 4**, où vivent leurs seuls consommateurs (écran Clavier, accueil). Les écrire ici, sans consommateur, ce serait du code mort à maintenir.
- **`ripple(code)` sans paramètre `strength`** : aucun écran de la partie 2 n'en a besoin.
- **Écran 10 : « Ta première leçon t'attend. »** au lieu de « dure 4 minutes », et l'espace affiche le mode Apprentissage actuel (`LearningMode`) tant que la partie 3 n'a pas livré la leçon 1. Le placement « validé par le test » est enregistré dans le profil, consommé en partie 4.
- **Entrée `GlobalNav` avancée de la partie 4 à la partie 2** : sans elle, la route n'est atteignable qu'une fois.
- **Pastille sur l'accueil de TypeWav : « Le Conservatoire t'attend »** pour tout visiteur sur ordinateur qui a passé l'onboarding (terminé ou passé). La partie 4 la remplace par « Ta leçon N t'attend ».
- **Utilisateur QWERTY** : en intérim, `LearningMode` l'envoie déjà vers l'ancien parcours QWERTY. Le message « Le parcours QWERTY arrive bientôt » arrive avec l'accueil (partie 4).
- **« Passer » : bouton seulement**, jamais Échap (évite un abandon par réflexe). Il reste visible sur les écrans 0 à 8.
- **IndexedDB illisible sur `/conservatoire`** : l'onboarding se joue quand même, en mémoire, avec une ligne honnête ; l'accueil de TypeWav, lui, ne redirige jamais quand le drapeau est illisible.
- **Son bloqué** (`initialize()` qui échoue) : l'onboarding continue en visuel, onde comprise, car `playNoteName` reste muet sans erreur. La ligne « Le son n'a pas pu démarrer » avec son geste pour réessayer arrive avec la leçon (partie 3), où elle sert à tous les écrans.
- **`/conservatoire` ajouté au sitemap** (page publique), `dev-onboarding` retirée partout.

## Review Focus

- Sur AZERTY, la touche « 1 » produit « & » : les choix 1, 2, 3 se lisent par `code` (`Digit1..3`, `Numpad1..3`), jamais par `key`. Test dans la tâche 8.
- Une touche tenue (`repeat`) ou un raccourci (Ctrl, Alt, Méta) ne joue rien et n'avance rien. Test dans la tâche 8.
- Espace ou Entrée sur un bouton focalisé (« Passer », un choix) ne déclenche jamais deux actions : l'écoute globale ignore les évènements dont la cible est un bouton. Test dans la tâche 8.
- IndexedDB indisponible : `markOnboardingComplete` qui rejette et `saveProfile` qui échoue ne bloquent pas la fin de l'onboarding (tâche 8) ; un drapeau illisible n'impose jamais la redirection depuis l'accueil (tâche 10) et laisse jouer l'onboarding en mémoire avec une ligne honnête (tâche 9).
- Disposition non détectée (pas de `getLayoutMap`, aucune touche discriminante) : libellés AZERTY par défaut et aucune écriture de préférence ; Verr. Maj ne fausse pas la détection (`'Q'` vaut `'q'`). Tests dans les tâches 2 et 8.

---

### Task 1 : la table physique des touches et l'instrument (D6)

**Files :**
- Create : `apps/web/lib/conservatoire/physical-keys.ts`
- Create : `apps/web/lib/conservatoire/instrument.ts`
- Modify : `apps/web/lib/learning-content.ts` (section `pitchForChar`, lignes 117 à 149)
- Test : `apps/web/lib/__tests__/conservatoire-instrument.test.ts` (nouveau), `apps/web/lib/__tests__/learning-content.test.ts` (describe `pitchForChar`), `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx` (test « niveau 'simple' »), `apps/web/components/modes/__tests__/LevelTeachStep.test.tsx` (test « joue la note de chaque nouveau geste »)

**Interfaces :**
- Consumes : `FingerId` (`@typewav/types`), `KeyboardLayout` (`apps/web/lib/keyboardLayouts.ts`).
- Produces :
  - `physical-keys.ts` : `type PhysicalRow = 'digits' | 'top' | 'home' | 'bottom' | 'mods'` ; `interface PhysicalKey { code: string; row: PhysicalRow; finger: FingerId; x: number; y: number; w: number; h: number; labels: Record<KeyboardLayout, string>; bump?: true }` ; `KEYBOARD_VIEW = { width: 416, height: 164 }` ; `PHYSICAL_KEYS: readonly PhysicalKey[]` (50 touches) ; `keyByCode(code: string): PhysicalKey | undefined` ; `codeForAzertyChar(char: string): string | undefined` ; `HOME_SCALE: readonly string[]` (les huit repères, de gauche à droite).
  - `instrument.ts` : `pitchForCode(code: string): string | null` ; `CADENCE` (tuples `[note, délai ms, durée s]`) ; `CHOICE_NOTE = 'E5'`.
  - `pitchForChar` (même signature) passe par `pitchForCode`.

- [ ] **Step 1 : Write the failing test**

Créer `apps/web/lib/__tests__/conservatoire-instrument.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { CADENCE, pitchForCode } from '../conservatoire/instrument';
import {
  HOME_SCALE,
  PHYSICAL_KEYS,
  codeForAzertyChar,
  keyByCode,
} from '../conservatoire/physical-keys';

describe('table physique des touches', () => {
  it('décrit 50 touches, chacune une seule fois', () => {
    expect(PHYSICAL_KEYS).toHaveLength(50);
    expect(new Set(PHYSICAL_KEYS.map((k) => k.code)).size).toBe(50);
  });

  it('le doigt dépend de la position physique', () => {
    expect(keyByCode('KeyF')?.finger).toBe('LI');
    expect(keyByCode('KeyG')?.finger).toBe('LI');
    expect(keyByCode('KeyH')?.finger).toBe('RI');
    expect(keyByCode('KeyJ')?.finger).toBe('RI');
    expect(keyByCode('Semicolon')?.finger).toBe('RP');
    expect(keyByCode('Space')?.finger).toBe('RT');
  });

  it('les libellés viennent de la disposition', () => {
    expect(keyByCode('KeyQ')?.labels).toEqual({ azerty: 'a', qwerty: 'q' });
    expect(keyByCode('KeyA')?.labels).toEqual({ azerty: 'q', qwerty: 'a' });
    expect(keyByCode('Semicolon')?.labels).toEqual({ azerty: 'm', qwerty: ';' });
    expect(keyByCode('KeyM')?.labels).toEqual({ azerty: ',', qwerty: 'm' });
  });

  it('seules F et J portent une bosse', () => {
    expect(PHYSICAL_KEYS.filter((k) => k.bump).map((k) => k.code)).toEqual([
      'KeyF',
      'KeyJ',
    ]);
  });

  it("retrouve la position d'un caractère AZERTY", () => {
    expect(codeForAzertyChar('q')).toBe('KeyA');
    expect(codeForAzertyChar('m')).toBe('Semicolon');
    expect(codeForAzertyChar('é')).toBe('Digit2');
    expect(codeForAzertyChar(' ')).toBeUndefined();
    expect(codeForAzertyChar('Maj')).toBeUndefined();
  });
});

describe("instrument : une note par doigt, l'octave par rangée (D6)", () => {
  it('la rangée du milieu joue do ré mi fa sol la si do sous les huit doigts', () => {
    expect(HOME_SCALE.map(pitchForCode)).toEqual([
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
    ]);
  });

  it("les deux touches d'un même doigt sur une rangée sonnent pareil", () => {
    expect(pitchForCode('KeyG')).toBe('F4');
    expect(pitchForCode('KeyH')).toBe('G4');
  });

  it('haut 5, bas 3, chiffres 6', () => {
    expect(pitchForCode('KeyQ')).toBe('C5');
    expect(pitchForCode('KeyZ')).toBe('C3');
    expect(pitchForCode('Digit1')).toBe('C6');
    expect(pitchForCode('Equal')).toBe('C7');
  });

  it('Espace et Maj ne jouent rien, un code inconnu non plus', () => {
    expect(pitchForCode('Space')).toBeNull();
    expect(pitchForCode('ShiftLeft')).toBeNull();
    expect(pitchForCode('ShiftRight')).toBeNull();
    expect(pitchForCode('F13')).toBeNull();
  });

  it('la cadence se résout sur la tonique', () => {
    expect(CADENCE.map(([note]) => note)).toEqual(['E4', 'G4', 'C5']);
  });
});
```

Dans `apps/web/lib/__tests__/learning-content.test.ts`, remplacer le premier test du describe `pitchForChar` (« une note par touche : chaque colonne… ») par :

```ts
  it('une note par doigt sur la rangée du repos (D6)', () => {
    const home = [...'qsdfghjklm'].map((c) => pitchForChar(c));
    expect(home).toEqual([
      'C4', 'D4', 'E4', 'F4', 'F4', 'G4', 'G4', 'A4', 'B4', 'C5',
    ]);
  });
```

Dans `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`, test « niveau 'simple' : chaque frappe juste joue la note de sa touche » : remplacer `toHaveBeenNthCalledWith(1, 'G4')` par `toHaveBeenNthCalledWith(1, 'F4')`.

Dans `apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`, test « joue la note de chaque nouveau geste tape » : commentaire `// home-row : q C4, f F4` et `toHaveBeenNthCalledWith(2, 'F4')`.

- [ ] **Step 2 : Run tests to verify they fail**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-instrument.test.ts apps/web/lib/__tests__/learning-content.test.ts`
Expected : FAIL, module `../conservatoire/instrument` introuvable, et `pitchForChar('f')` vaut `G4` au lieu de `F4`.

- [ ] **Step 3 : Write the implementation**

Créer `apps/web/lib/conservatoire/physical-keys.ts` :

```ts
/**
 * Le clavier physique du Conservatoire, décrit par `KeyboardEvent.code` :
 * position, taille, doigt et rangée ne dépendent que de la position ; seuls
 * les libellés dépendent de la disposition. Géométrie en unités de viewBox,
 * reprise de `KeyboardDiagramAzerty` (pas de 32, touche de 28).
 * Spec : 2026-10-08-conservatoire-v1-design.md, partie 2.
 */

import type { FingerId } from '@typewav/types';
import type { KeyboardLayout } from '../keyboardLayouts';

export type PhysicalRow = 'digits' | 'top' | 'home' | 'bottom' | 'mods';

export interface PhysicalKey {
  code: string;
  row: PhysicalRow;
  finger: FingerId;
  x: number;
  y: number;
  w: number;
  h: number;
  labels: Record<KeyboardLayout, string>;
  /** Les repères tactiles de F et J. */
  bump?: true;
}

const KEY = 28;
const PITCH = 32;
const ROW_Y: Record<PhysicalRow, number> = {
  digits: 4,
  top: 36,
  home: 68,
  bottom: 100,
  mods: 132,
};

export const KEYBOARD_VIEW = { width: 416, height: 164 } as const;

type Entry = [code: string, azerty: string, qwerty: string, finger: FingerId];

function row(name: PhysicalRow, x0: number, entries: Entry[]): PhysicalKey[] {
  return entries.map(([code, azerty, qwerty, finger], i) => ({
    code,
    row: name,
    finger,
    x: x0 + i * PITCH,
    y: ROW_Y[name],
    w: KEY,
    h: KEY,
    labels: { azerty, qwerty },
    ...(code === 'KeyF' || code === 'KeyJ' ? { bump: true as const } : {}),
  }));
}

export const PHYSICAL_KEYS: readonly PhysicalKey[] = [
  ...row('digits', 0, [
    ['Backquote', '²', '`', 'LP'],
    ['Digit1', '&', '1', 'LP'],
    ['Digit2', 'é', '2', 'LR'],
    ['Digit3', '"', '3', 'LM'],
    ['Digit4', "'", '4', 'LI'],
    ['Digit5', '(', '5', 'LI'],
    ['Digit6', '-', '6', 'RI'],
    ['Digit7', 'è', '7', 'RI'],
    ['Digit8', '_', '8', 'RM'],
    ['Digit9', 'ç', '9', 'RR'],
    ['Digit0', 'à', '0', 'RP'],
    ['Minus', ')', '-', 'RP'],
    ['Equal', '=', '=', 'RP'],
  ]),
  ...row('top', 8, [
    ['KeyQ', 'a', 'q', 'LP'],
    ['KeyW', 'z', 'w', 'LR'],
    ['KeyE', 'e', 'e', 'LM'],
    ['KeyR', 'r', 'r', 'LI'],
    ['KeyT', 't', 't', 'LI'],
    ['KeyY', 'y', 'y', 'RI'],
    ['KeyU', 'u', 'u', 'RI'],
    ['KeyI', 'i', 'i', 'RM'],
    ['KeyO', 'o', 'o', 'RR'],
    ['KeyP', 'p', 'p', 'RP'],
    ['BracketLeft', '^', '[', 'RP'],
    ['BracketRight', '$', ']', 'RP'],
  ]),
  ...row('home', 16, [
    ['KeyA', 'q', 'a', 'LP'],
    ['KeyS', 's', 's', 'LR'],
    ['KeyD', 'd', 'd', 'LM'],
    ['KeyF', 'f', 'f', 'LI'],
    ['KeyG', 'g', 'g', 'LI'],
    ['KeyH', 'h', 'h', 'RI'],
    ['KeyJ', 'j', 'j', 'RI'],
    ['KeyK', 'k', 'k', 'RM'],
    ['KeyL', 'l', 'l', 'RR'],
    ['Semicolon', 'm', ';', 'RP'],
    ['Quote', 'ù', "'", 'RP'],
    ['Backslash', '*', '\\', 'RP'],
  ]),
  ...row('bottom', 24, [
    ['KeyZ', 'w', 'z', 'LP'],
    ['KeyX', 'x', 'x', 'LR'],
    ['KeyC', 'c', 'c', 'LM'],
    ['KeyV', 'v', 'v', 'LI'],
    ['KeyB', 'b', 'b', 'LI'],
    ['KeyN', 'n', 'n', 'RI'],
    ['KeyM', ',', 'm', 'RI'],
    ['Comma', ';', ',', 'RM'],
    ['Period', ':', '.', 'RR'],
    ['Slash', '!', '/', 'RP'],
  ]),
  { code: 'ShiftLeft', row: 'mods', finger: 'LP', x: 0, y: ROW_Y.mods, w: 72, h: KEY, labels: { azerty: 'Maj', qwerty: 'Shift' } },
  { code: 'Space', row: 'mods', finger: 'RT', x: 150, y: ROW_Y.mods, w: 140, h: KEY, labels: { azerty: '', qwerty: '' } },
  { code: 'ShiftRight', row: 'mods', finger: 'RP', x: 330, y: ROW_Y.mods, w: 82, h: KEY, labels: { azerty: 'Maj', qwerty: 'Shift' } },
];

const BY_CODE = new Map(PHYSICAL_KEYS.map((k) => [k.code, k]));
const CODE_BY_AZERTY = new Map(
  PHYSICAL_KEYS.filter((k) => k.row !== 'mods').map((k) => [k.labels.azerty, k.code]),
);

export function keyByCode(code: string): PhysicalKey | undefined {
  return BY_CODE.get(code);
}

/** La position d'un caractère de base AZERTY (`physical` d'un geste du curriculum). */
export function codeForAzertyChar(char: string): string | undefined {
  return CODE_BY_AZERTY.get(char);
}

/** Les huit repères de la rangée du milieu, de l'auriculaire gauche à l'auriculaire droit. */
export const HOME_SCALE: readonly string[] = [
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon',
];
```

Créer `apps/web/lib/conservatoire/instrument.ts` :

```ts
/**
 * L'instrument du Conservatoire (D6) : une note par doigt, l'octave par
 * rangée. Remplace la gamme pentatonique par colonne livrée pour #117.
 */

import type { FingerId } from '@typewav/types';
import { keyByCode, type PhysicalRow } from './physical-keys';

const DEGREE: Partial<Record<FingerId, readonly [note: string, octaveShift: number]>> = {
  LP: ['C', 0],
  LR: ['D', 0],
  LM: ['E', 0],
  LI: ['F', 0],
  RI: ['G', 0],
  RM: ['A', 0],
  RR: ['B', 0],
  RP: ['C', 1],
};

const OCTAVE: Record<PhysicalRow, number | null> = {
  home: 4,
  top: 5,
  bottom: 3,
  digits: 6,
  mods: null,
};

/** La note d'une touche physique ; `null` pour Espace, Maj ou un code inconnu. */
export function pitchForCode(code: string): string | null {
  const key = keyByCode(code);
  if (!key) return null;
  const octave = OCTAVE[key.row];
  const degree = DEGREE[key.finger];
  if (octave === null || !degree) return null;
  return `${degree[0]}${octave + degree[1]}`;
}

/** Cadence de validation, reprise de `LevelClearedMoment` : [note, délai ms, durée s]. */
export const CADENCE = [
  ['E4', 0, 0.45],
  ['G4', 160, 0.45],
  ['C5', 340, 1.1],
] as const;

/** Le son doux et bref d'un choix. */
export const CHOICE_NOTE = 'E5';
```

Dans `apps/web/lib/learning-content.ts`, ajouter après les imports existants :

```ts
import { pitchForCode } from './conservatoire/instrument';
import { codeForAzertyChar } from './conservatoire/physical-keys';
```

puis remplacer toute la section `pitchForChar` (constantes `PENTATONIC`, `PITCH_ROWS` et la fonction, en gardant la ligne de titre de section) par :

```ts
/**
 * La note d'un caractère : celle de la touche physique de son geste (D6, une
 * note par doigt, l'octave par rangée). `undefined` pour une espace ou un
 * caractère sans geste.
 */
export function pitchForChar(char: string | undefined): string | undefined {
  if (char === undefined) return undefined;
  const id = mapCharToGestureId(char);
  if (id === '') return undefined;
  const gesture = GESTURE_BY_ID.get(id) ?? GESTURE_BY_ID.get(char.toLowerCase());
  if (!gesture) return undefined;
  const code = codeForAzertyChar(gesture.physical);
  return (code !== undefined ? pitchForCode(code) : null) ?? undefined;
}
```

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-instrument.test.ts apps/web/lib/__tests__/learning-content.test.ts apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx apps/web/components/modes/__tests__/LevelTeachStep.test.tsx`
Expected : PASS.

- [ ] **Step 5 : Typecheck et commit**

```bash
pnpm typecheck
git add apps/web/lib/conservatoire/physical-keys.ts apps/web/lib/conservatoire/instrument.ts apps/web/lib/learning-content.ts apps/web/lib/__tests__/conservatoire-instrument.test.ts apps/web/lib/__tests__/learning-content.test.ts apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx apps/web/components/modes/__tests__/LevelTeachStep.test.tsx
git commit -m "feat(conservatoire): instrument une note par doigt et table physique des touches"
```

---

### Task 2 : détecter la disposition (D10)

**Files :**
- Create : `apps/web/lib/conservatoire/layout-detection.ts`
- Test : `apps/web/lib/__tests__/conservatoire-layout-detection.test.ts`

**Interfaces :**
- Consumes : `KeyboardLayout`.
- Produces : `detectLayoutFromKey(code: string, key: string): KeyboardLayout | null` ; `detectLayoutFromNavigator(nav: object): Promise<KeyboardLayout | null>` (jamais d'exception).

- [ ] **Step 1 : Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  detectLayoutFromKey,
  detectLayoutFromNavigator,
} from '../conservatoire/layout-detection';

describe('detectLayoutFromKey', () => {
  it('reconnaît AZERTY sur les quatre positions discriminantes', () => {
    expect(detectLayoutFromKey('KeyA', 'q')).toBe('azerty');
    expect(detectLayoutFromKey('KeyQ', 'a')).toBe('azerty');
    expect(detectLayoutFromKey('KeyW', 'z')).toBe('azerty');
    expect(detectLayoutFromKey('Semicolon', 'm')).toBe('azerty');
  });

  it('reconnaît QWERTY sur les produits inverses', () => {
    expect(detectLayoutFromKey('KeyA', 'a')).toBe('qwerty');
    expect(detectLayoutFromKey('KeyQ', 'q')).toBe('qwerty');
    expect(detectLayoutFromKey('KeyW', 'w')).toBe('qwerty');
    expect(detectLayoutFromKey('Semicolon', ';')).toBe('qwerty');
  });

  it('Verr. Maj ou Maj ne faussent rien', () => {
    expect(detectLayoutFromKey('KeyA', 'Q')).toBe('azerty');
    expect(detectLayoutFromKey('KeyQ', 'Q')).toBe('qwerty');
  });

  it('une touche non discriminante ne dit rien', () => {
    expect(detectLayoutFromKey('KeyF', 'f')).toBeNull();
    expect(detectLayoutFromKey('Space', ' ')).toBeNull();
    expect(detectLayoutFromKey('KeyA', '')).toBeNull();
  });
});

describe('detectLayoutFromNavigator', () => {
  const withMap = (value: string | undefined) => ({
    keyboard: { getLayoutMap: async () => ({ get: () => value }) },
  });

  it('lit la carte de disposition quand elle existe', async () => {
    await expect(detectLayoutFromNavigator(withMap('a'))).resolves.toBe('azerty');
    await expect(detectLayoutFromNavigator(withMap('q'))).resolves.toBe('qwerty');
  });

  it("null sans API, sans valeur, ou si l'API échoue", async () => {
    await expect(detectLayoutFromNavigator({})).resolves.toBeNull();
    await expect(detectLayoutFromNavigator(withMap(undefined))).resolves.toBeNull();
    await expect(
      detectLayoutFromNavigator({
        keyboard: {
          getLayoutMap: async () => {
            throw new Error('SecurityError');
          },
        },
      }),
    ).resolves.toBeNull();
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-layout-detection.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : Write the implementation**

```ts
/**
 * Détection de la disposition (D10) : par la carte du navigateur quand elle
 * existe (Chromium), sinon à la première touche discriminante pendant
 * l'onboarding. Aucune détection : l'appelant garde AZERTY par défaut.
 */

import type { KeyboardLayout } from '../keyboardLayouts';

const AZERTY_SIGNS: Record<string, string> = { KeyA: 'q', KeyQ: 'a', KeyW: 'z', Semicolon: 'm' };
const QWERTY_SIGNS: Record<string, string> = { KeyA: 'a', KeyQ: 'q', KeyW: 'w', Semicolon: ';' };

export function detectLayoutFromKey(code: string, key: string): KeyboardLayout | null {
  const produced = key.toLowerCase();
  if (produced === '') return null;
  if (AZERTY_SIGNS[code] === produced) return 'azerty';
  if (QWERTY_SIGNS[code] === produced) return 'qwerty';
  return null;
}

interface KeyboardApi {
  getLayoutMap?: () => Promise<{ get(code: string): string | undefined }>;
}

/** `navigator.keyboard.getLayoutMap()`, absent des types DOM, d'où le paramètre `object`. */
export async function detectLayoutFromNavigator(nav: object): Promise<KeyboardLayout | null> {
  try {
    const map = await (nav as { keyboard?: KeyboardApi }).keyboard?.getLayoutMap?.();
    return map ? detectLayoutFromKey('KeyQ', map.get('KeyQ') ?? '') : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-layout-detection.test.ts`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/lib/conservatoire/layout-detection.ts apps/web/lib/__tests__/conservatoire-layout-detection.test.ts
git commit -m "feat(conservatoire): détection de la disposition clavier"
```

---

### Task 3 : le profil et les règles du placement

**Files :**
- Modify : `packages/types/src/conservatoire.ts` (ajout en fin de fichier)
- Create : `apps/web/lib/conservatoire/profile.ts`
- Test : `apps/web/lib/__tests__/conservatoire-profile.test.ts`, `apps/web/lib/__tests__/conservatoire-profile-failure.test.ts`

**Interfaces :**
- Consumes : `setPreference` (`apps/web/lib/db.ts`).
- Produces :
  - types : `ExperienceLevel = 'beginner' | 'some-fingers' | 'touch-typist'` ; `DailyMinutes = 5 | 10 | 15` ; `PlacementOutcome = 'lesson1' | 'lesson1-fast' | 'cycle1-validated'` ; `interface PlacementResult { wpm: number; accuracy: number }` (justesse en pourcentage, de 0 à 100) ; `interface ConservatoireProfile { version: 1; startedAt: number; experience: ExperienceLevel | null; dailyMinutes: DailyMinutes | null; placement: PlacementResult | null; outcome: PlacementOutcome | null; skipped: boolean }`.
  - `profile.ts` : `PLACEMENT_MIN_WPM = 30` ; `PLACEMENT_MIN_ACCURACY = 95` ; `placementOutcome(experience: ExperienceLevel, placement: PlacementResult | null): PlacementOutcome` ; `saveProfile(profile: ConservatoireProfile): Promise<boolean>` (clé `conservatoire_profile`, jamais d'exception).

- [ ] **Step 1 : Write the failing tests**

`apps/web/lib/__tests__/conservatoire-profile.test.ts` (charger `fake-indexeddb` exactement comme `conservatoire-storage.test.ts` le fait ; si le projet `web-lib` le charge déjà en setup, ne rien importer) :

```ts
import type { ConservatoireProfile } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { getPreference } from '../db';
import { placementOutcome, saveProfile } from '../conservatoire/profile';

describe('placementOutcome', () => {
  it('« Je débute » : la leçon 1, quel que soit le score', () => {
    expect(placementOutcome('beginner', null)).toBe('lesson1');
    expect(placementOutcome('beginner', { wpm: 80, accuracy: 99 })).toBe('lesson1');
  });

  it('« Avec quelques doigts » : la leçon 1 en parcours accéléré', () => {
    expect(placementOutcome('some-fingers', { wpm: 80, accuracy: 99 })).toBe('lesson1-fast');
  });

  it('« Sans regarder » : cycle 1 validé à partir de 30 MPM et 95 %, bornes incluses', () => {
    expect(placementOutcome('touch-typist', { wpm: 30, accuracy: 95 })).toBe('cycle1-validated');
    expect(placementOutcome('touch-typist', { wpm: 29, accuracy: 99 })).toBe('lesson1-fast');
    expect(placementOutcome('touch-typist', { wpm: 60, accuracy: 94 })).toBe('lesson1-fast');
    expect(placementOutcome('touch-typist', null)).toBe('lesson1-fast');
  });
});

describe('saveProfile', () => {
  it('écrit le profil sous conservatoire_profile', async () => {
    const profile: ConservatoireProfile = {
      version: 1,
      startedAt: 1,
      experience: 'beginner',
      dailyMinutes: 10,
      placement: null,
      outcome: 'lesson1',
      skipped: false,
    };
    await expect(saveProfile(profile)).resolves.toBe(true);
    await expect(getPreference('conservatoire_profile')).resolves.toEqual(profile);
  });
});
```

`apps/web/lib/__tests__/conservatoire-profile-failure.test.ts` :

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({
  setPreference: vi.fn(async () => {
    throw new Error('IndexedDB indisponible');
  }),
}));

import { saveProfile } from '../conservatoire/profile';

describe('profil en échec', () => {
  it('écriture impossible : false, aucune exception', async () => {
    await expect(
      saveProfile({
        version: 1,
        startedAt: 1,
        experience: null,
        dailyMinutes: null,
        placement: null,
        outcome: null,
        skipped: true,
      }),
    ).resolves.toBe(false);
  });
});
```

- [ ] **Step 2 : Run tests to verify they fail**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-profile.test.ts apps/web/lib/__tests__/conservatoire-profile-failure.test.ts`
Expected : FAIL, module `../conservatoire/profile` introuvable.

- [ ] **Step 3 : Write the implementation**

Ajouter à la fin de `packages/types/src/conservatoire.ts` :

```ts
/** Réponse à « Tu tapes déjà un peu ? ». */
export type ExperienceLevel = 'beginner' | 'some-fingers' | 'touch-typist';

/** Réponse à « Combien de minutes par jour ? ». */
export type DailyMinutes = 5 | 10 | 15;

export type PlacementOutcome = 'lesson1' | 'lesson1-fast' | 'cycle1-validated';

/** Résultat du test de placement : mots par minute, justesse en pourcentage (0 à 100). */
export interface PlacementResult {
  wpm: number;
  accuracy: number;
}

/** Clé `conservatoire_profile`. La partie 4 y ajoute les jours par semaine. */
export interface ConservatoireProfile {
  version: 1;
  startedAt: number;
  experience: ExperienceLevel | null;
  dailyMinutes: DailyMinutes | null;
  placement: PlacementResult | null;
  outcome: PlacementOutcome | null;
  /** Onboarding quitté par « Passer ». */
  skipped: boolean;
}
```

Créer `apps/web/lib/conservatoire/profile.ts` :

```ts
/**
 * Le profil du Conservatoire et les règles du test de placement (spec partie
 * 2, « Le test de placement »). La lecture arrive avec son consommateur, en
 * partie 4.
 */

import type {
  ConservatoireProfile,
  ExperienceLevel,
  PlacementOutcome,
  PlacementResult,
} from '@typewav/types';
import { setPreference } from '../db';

const PROFILE_KEY = 'conservatoire_profile';
export const PLACEMENT_MIN_WPM = 30;
export const PLACEMENT_MIN_ACCURACY = 95;

export function placementOutcome(
  experience: ExperienceLevel,
  placement: PlacementResult | null,
): PlacementOutcome {
  if (experience === 'beginner') return 'lesson1';
  if (
    experience === 'touch-typist' &&
    placement !== null &&
    placement.wpm >= PLACEMENT_MIN_WPM &&
    placement.accuracy >= PLACEMENT_MIN_ACCURACY
  ) {
    return 'cycle1-validated';
  }
  return 'lesson1-fast';
}

export async function saveProfile(profile: ConservatoireProfile): Promise<boolean> {
  try {
    await setPreference(PROFILE_KEY, profile);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-profile.test.ts apps/web/lib/__tests__/conservatoire-profile-failure.test.ts && pnpm typecheck`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add packages/types/src/conservatoire.ts apps/web/lib/conservatoire/profile.ts apps/web/lib/__tests__/conservatoire-profile.test.ts apps/web/lib/__tests__/conservatoire-profile-failure.test.ts
git commit -m "feat(conservatoire): profil et règles du test de placement"
```

---

### Task 4 : les textes du Conservatoire (fr et en)

**Files :**
- Modify : `apps/web/messages/fr.json`, `apps/web/messages/en.json` (namespace `conservatoire` au premier niveau, clé `nav.conservatoire`)
- Test : `apps/web/lib/__tests__/conservatoire-i18n.test.ts`

**Interfaces :**
- Produces : namespace `conservatoire` (clés ci-dessous), `nav.conservatoire`.

- [ ] **Step 1 : Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

// Construits depuis leurs points de code : ce fichier ne contient jamais les
// caractères qu'il interdit.
const FORBIDDEN_DASHES = new RegExp(
  `[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`,
);

function leaves(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function values(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (typeof node !== 'object' || node === null) return [];
  return Object.values(node).flatMap(values);
}

describe('textes du Conservatoire', () => {
  it('fr et en ont exactement les mêmes clés', () => {
    const frRoot = (fr as Record<string, unknown>).conservatoire;
    const enRoot = (en as Record<string, unknown>).conservatoire;
    expect(frRoot).toBeDefined();
    expect(leaves(enRoot).sort()).toEqual(leaves(frRoot).sort());
    expect((en.nav as Record<string, string>).conservatoire).toBeTruthy();
    expect((fr.nav as Record<string, string>).conservatoire).toBeTruthy();
  });

  it('aucun tiret cadratin ni demi-cadratin', () => {
    for (const msgs of [fr, en]) {
      for (const text of values((msgs as Record<string, unknown>).conservatoire)) {
        expect(text).not.toMatch(FORBIDDEN_DASHES);
      }
    }
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-i18n.test.ts`
Expected : FAIL (namespace absent).

- [ ] **Step 3 : Ajouter les textes**

Dans `nav` de `fr.json` : `"conservatoire": "Conservatoire"` ; de `en.json` : `"conservatoire": "Conservatory"`.

Ajouter dans `fr.json`, au premier niveau :

```json
"conservatoire": {
  "metaTitle": "Le Conservatoire",
  "skip": "Passer",
  "continue": "Espace pour continuer",
  "keyboard": "Clavier",
  "announceTarget": "Touche {key}, {finger}.",
  "mobile": "Le Conservatoire se joue avec un clavier d'ordinateur.",
  "nudge": "Le Conservatoire t'attend",
  "unsaved": "Ce navigateur ne peut pas enregistrer tes progrès : ils s'effaceront en fermant la page.",
  "onboarding": {
    "intro": { "title": "Ton clavier est un instrument.", "support": "Monte le son.", "start": "Espace pour commencer" },
    "f": { "title": "Pose ton index gauche sur F.", "support": "Sens la petite bosse : c'est ton repère." },
    "j": { "title": "Et ton index droit sur J.", "support": "La même bosse, de l'autre côté." },
    "scale": { "title": "Pose les six autres doigts. Joue de gauche à droite.", "done": "Tu viens de jouer ta première gamme." },
    "blind": { "title": "Rejoue-la sans regarder tes mains.", "support": "La touche réapparaît si tu hésites.", "done": "Tes doigts connaissent déjà le chemin." },
    "silence": { "title": "Appuie sur K.", "other": "Maintenant, appuie sur une autre touche.", "done": "Silence. Une erreur ne joue rien." },
    "data": {
      "title": "Tes progrès restent dans ce navigateur.",
      "support": "I pour en savoir plus",
      "detail1": "Effacer les données du navigateur efface tes progrès.",
      "detail2": "La navigation privée ne garde rien.",
      "detail3": "Tu peux tout sauvegarder dans un fichier depuis Paramètres."
    },
    "choiceHint": "1, 2 ou 3",
    "experience": { "title": "Tu tapes déjà un peu ?", "beginner": "Je débute", "someFingers": "Avec quelques doigts", "touchTypist": "Sans regarder" },
    "minutes": { "title": "Combien de minutes par jour ?", "option": "{minutes} minutes" },
    "placement": {
      "title": "Tape les mots qui viennent. 30 secondes.",
      "support": "Le chrono part à ta première frappe.",
      "result": "{wpm} mots par minute, {accuracy} % de notes justes."
    },
    "ready": { "title": "Ta première leçon t'attend." }
  }
}
```

Et dans `en.json` :

```json
"conservatoire": {
  "metaTitle": "The Conservatory",
  "skip": "Skip",
  "continue": "Space to continue",
  "keyboard": "Keyboard",
  "announceTarget": "Key {key}, {finger}.",
  "mobile": "The Conservatory is played on a computer keyboard.",
  "nudge": "The Conservatory is waiting for you",
  "unsaved": "This browser can't save your progress: it will be lost when you close the page.",
  "onboarding": {
    "intro": { "title": "Your keyboard is an instrument.", "support": "Turn the sound up.", "start": "Space to begin" },
    "f": { "title": "Rest your left index finger on F.", "support": "Feel the little bump: that's your anchor." },
    "j": { "title": "And your right index finger on J.", "support": "Same bump, other side." },
    "scale": { "title": "Place your other six fingers. Play from left to right.", "done": "You just played your first scale." },
    "blind": { "title": "Play it again without looking at your hands.", "support": "The key reappears if you hesitate.", "done": "Your fingers already know the way." },
    "silence": { "title": "Press K.", "other": "Now press any other key.", "done": "Silence. A mistake plays nothing." },
    "data": {
      "title": "Your progress stays in this browser.",
      "support": "I to learn more",
      "detail1": "Clearing your browser data erases your progress.",
      "detail2": "A private window keeps nothing.",
      "detail3": "You can save everything to a file from Settings."
    },
    "choiceHint": "1, 2 or 3",
    "experience": { "title": "Do you already type a little?", "beginner": "I'm just starting", "someFingers": "With a few fingers", "touchTypist": "Without looking" },
    "minutes": { "title": "How many minutes a day?", "option": "{minutes} minutes" },
    "placement": {
      "title": "Type the words as they come. 30 seconds.",
      "support": "The timer starts on your first keystroke.",
      "result": "{wpm} words per minute, {accuracy}% correct notes."
    },
    "ready": { "title": "Your first lesson is waiting." }
  }
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/lib/__tests__/conservatoire-i18n.test.ts`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/messages/fr.json apps/web/messages/en.json apps/web/lib/__tests__/conservatoire-i18n.test.ts
git commit -m "feat(conservatoire): textes de l'onboarding en français et en anglais"
```

---

### Task 5 : `Stage`, un écran pour une seule chose (R1, R5)

**Files :**
- Create : `apps/web/components/conservatoire/Stage.tsx`
- Create : `apps/web/components/conservatoire/__tests__/intl.ts` (mock next-intl sur les vrais textes fr, partagé par les tests du dossier)
- Test : `apps/web/components/conservatoire/__tests__/Stage.test.tsx`

**Interfaces :**
- Consumes : namespace `conservatoire` (`skip`).
- Produces : `Stage(props: { title: string; support?: string; footer?: string; announce?: string; onSkip?: () => void; children?: ReactNode })`. Rend `section[data-stage]` ; parties marquées `data-part` : `title` (h1), `support`, `slot`, `footer`, `skip` ; région `role="status"` `aria-live="polite"` (classe `sr-only`) qui annonce `announce ?? title`. Exporte `EASE_STRONG`.

- [ ] **Step 1 : Write the failing test**

`apps/web/components/conservatoire/__tests__/intl.ts` (vérifier que l'`include` du projet Vitest `web-components` ne vise que `*.test.ts(x)` : ce fichier n'est pas un test) :

```ts
import fr from '@/messages/fr.json';

/** next-intl sur les vrais textes français : les tests vérifient la copie réelle. */
export const nextIntlFr = {
  useLocale: () => 'fr',
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) => {
      let msg: unknown = fr;
      for (const segment of `${namespace}.${key}`.split('.')) {
        msg = (msg as Record<string, unknown> | undefined)?.[segment];
      }
      if (typeof msg !== 'string') return `${namespace}.${key}`;
      return msg.replace(/\{(\w+)\}/g, (_m, token: string) => String(values?.[token] ?? ''));
    },
};
```

`apps/web/components/conservatoire/__tests__/Stage.test.tsx` :

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { Stage } from '../Stage';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

describe('Stage', () => {
  it("une phrase, une ligne d'appui, l'emplacement et la touche à presser", () => {
    const { container } = render(
      <Stage title="Titre" support="Appui" footer="Espace">
        <div data-testid="contenu" />
      </Stage>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Titre' })).toHaveAttribute('data-part', 'title');
    expect(screen.getByText('Appui')).toHaveAttribute('data-part', 'support');
    expect(container.querySelector('[data-part="slot"]')).toContainElement(screen.getByTestId('contenu'));
    expect(screen.getByText('Espace')).toHaveAttribute('data-part', 'footer');
  });

  it('rien de plus que ce qui est demandé', () => {
    const { container } = render(<Stage title="Seul" />);
    expect(container.querySelectorAll('[data-part]')).toHaveLength(1);
  });

  it("annonce l'écran aux lecteurs d'écran, le titre par défaut", () => {
    const { rerender } = render(<Stage title="Titre" />);
    expect(screen.getByRole('status')).toHaveTextContent('Titre');
    rerender(<Stage title="Titre" announce="Titre Touche F, Index gauche." />);
    expect(screen.getByRole('status')).toHaveTextContent('Titre Touche F, Index gauche.');
  });

  it("« Passer » n'existe que si on le demande", () => {
    const onSkip = vi.fn();
    const { rerender } = render(<Stage title="Titre" />);
    expect(screen.queryByRole('button', { name: fr.conservatoire.skip })).toBeNull();
    rerender(<Stage title="Titre" onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/Stage.test.tsx`
Expected : FAIL, module `../Stage` introuvable.

- [ ] **Step 3 : Write the implementation**

```tsx
'use client';

/**
 * Stage : la primitive « un écran, une chose » du Conservatoire (R1, R5).
 * Une phrase principale, une ligne d'appui au plus, un emplacement, la touche
 * à presser en pied d'écran, « Passer » en haut à droite si demandé. Chaque
 * nouvelle phrase entre en 240 ms (fondu et 8 px) ; chaque écran est annoncé
 * dans une région aria-live. Les parties portent `data-part` (tests de rendu).
 */

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export const EASE_STRONG = [0.16, 1, 0.3, 1] as const;

export interface StageProps {
  title: string;
  support?: string;
  footer?: string;
  /** Texte lu par les lecteurs d'écran ; le titre par défaut. */
  announce?: string;
  onSkip?: () => void;
  children?: ReactNode;
}

export function Stage({ title, support, footer, announce, onSkip, children }: StageProps) {
  const t = useTranslations('conservatoire');
  const reduceMotion = useReducedMotion() === true;

  return (
    <section
      data-stage
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '24px 16px',
        minHeight: 0,
      }}
    >
      {onSkip && (
        <button
          type="button"
          data-part="skip"
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '6px 12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('skip')}
        </button>
      )}

      <motion.div
        key={title}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: EASE_STRONG }}
        style={{ textAlign: 'center', maxWidth: 720 }}
      >
        <h1
          data-part="title"
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {support && (
          <p
            data-part="support"
            style={{ margin: '10px 0 0', fontFamily: 'var(--font-ui)', color: 'var(--color-text-muted)' }}
          >
            {support}
          </p>
        )}
      </motion.div>

      {children !== undefined && (
        <div
          data-part="slot"
          style={{
            width: '100%',
            maxWidth: 880,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {children}
        </div>
      )}

      {footer && (
        <p
          data-part="footer"
          style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          {footer}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announce ?? title}
      </p>
    </section>
  );
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/Stage.test.tsx`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/conservatoire/Stage.tsx apps/web/components/conservatoire/__tests__/intl.ts apps/web/components/conservatoire/__tests__/Stage.test.tsx
git commit -m "feat(conservatoire): primitive d'écran Stage"
```

---

### Task 6 : `LivingKeyboard`, le clavier vivant (R3, R4, R6)

**Files :**
- Create : `apps/web/components/conservatoire/LivingKeyboard.tsx`
- Modify : `apps/web/styles/globals.css` (respiration de la cible, en fin de fichier)
- Test : `apps/web/components/conservatoire/__tests__/LivingKeyboard.test.tsx`

**Interfaces :**
- Consumes : `PHYSICAL_KEYS`, `KEYBOARD_VIEW`, `keyByCode` (tâche 1) ; `FINGER_COLORS` (`components/modes/finger-colors.ts`) ; `typing.finger.*` et `conservatoire.keyboard` (i18n).
- Produces : `LivingKeyboard(props: { layout: KeyboardLayout; target?: string; targetStyle?: 'full' | 'faint'; hintAfterMs?: number; ref?: Ref<LivingKeyboardHandle> })` ; `interface LivingKeyboardHandle { ripple(code: string): void }`. Attributs : `data-living-keyboard` et `data-ripple-count` (absent = 0) sur la racine, `data-code` sur chaque touche, `data-target` (`full` ou `faint`) sur la seule cible visible, `data-bump` sur les bosses, `data-pressed` pendant l'enfoncement. Le nom du doigt de la cible s'écrit sous le clavier. Avec `hintAfterMs`, la cible reste cachée jusqu'au délai, puis apparaît en contour (`faint`).

- [ ] **Step 1 : Write the failing test**

```tsx
import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { LivingKeyboard, type LivingKeyboardHandle } from '../LivingKeyboard';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

const { motionPref } = vi.hoisted(() => ({ motionPref: { reduce: false } }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => motionPref.reduce,
}));

const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  motionPref.reduce = false;
  // jsdom n'a pas de canvas : aucun dessin, mais le reste du clavier vit.
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  vi.useRealTimers();
});

const keyEl = (container: HTMLElement, code: string) =>
  container.querySelector(`g[data-code="${code}"]`);

describe('LivingKeyboard', () => {
  it('dessine les 50 touches, libellées selon la disposition', () => {
    const { container, rerender } = render(<LivingKeyboard layout="azerty" />);
    expect(container.querySelectorAll('g[data-code]')).toHaveLength(50);
    expect(keyEl(container, 'KeyQ')).toHaveTextContent('a');
    rerender(<LivingKeyboard layout="qwerty" />);
    expect(keyEl(container, 'KeyQ')).toHaveTextContent('q');
  });

  it("seule la cible porte la couleur, et le nom de son doigt s'écrit dessous", () => {
    const { container } = render(<LivingKeyboard layout="azerty" target="KeyF" />);
    const targets = container.querySelectorAll('[data-target]');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('data-code', 'KeyF');
    expect(targets[0]).toHaveAttribute('data-target', 'full');
    expect(screen.getByText(fr.typing.finger.LI)).toBeInTheDocument();
  });

  it('sans cible, aucune touche en couleur', () => {
    const { container } = render(<LivingKeyboard layout="azerty" />);
    expect(container.querySelector('[data-target]')).toBeNull();
  });

  it('les bosses de F et J sont toujours dessinées', () => {
    const { container } = render(<LivingKeyboard layout="azerty" />);
    const bumps = [...container.querySelectorAll('[data-bump]')].map((b) =>
      b.closest('g')?.getAttribute('data-code'),
    );
    expect(bumps.sort()).toEqual(['KeyF', 'KeyJ']);
  });

  it('aide sur hésitation : contour après le délai, recaché pour la cible suivante', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <LivingKeyboard layout="azerty" target="KeyA" hintAfterMs={1600} />,
    );
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1599));
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(keyEl(container, 'KeyA')).toHaveAttribute('data-target', 'faint');

    rerender(<LivingKeyboard layout="azerty" target="KeyS" hintAfterMs={1600} />);
    expect(container.querySelector('[data-target]')).toBeNull();
    act(() => vi.advanceTimersByTime(1600));
    expect(keyEl(container, 'KeyS')).toHaveAttribute('data-target', 'faint');
  });

  it('chaque onde demandée est comptée, un code inconnu est ignoré', () => {
    const ref = createRef<LivingKeyboardHandle>();
    const { container } = render(<LivingKeyboard ref={ref} layout="azerty" />);
    const root = container.querySelector('[data-living-keyboard]');
    expect(root).not.toHaveAttribute('data-ripple-count');
    act(() => ref.current!.ripple('KeyF'));
    act(() => ref.current!.ripple('Inconnue'));
    expect(root).toHaveAttribute('data-ripple-count', '1');
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it("mouvement réduit : pas de canvas, la touche s'enfonce 120 ms", () => {
    motionPref.reduce = true;
    vi.useFakeTimers();
    const ref = createRef<LivingKeyboardHandle>();
    const { container } = render(<LivingKeyboard ref={ref} layout="azerty" />);
    expect(container.querySelector('canvas')).toBeNull();
    act(() => ref.current!.ripple('KeyF'));
    expect(keyEl(container, 'KeyF')).toHaveAttribute('data-pressed', 'true');
    act(() => vi.advanceTimersByTime(120));
    expect(keyEl(container, 'KeyF')).not.toHaveAttribute('data-pressed');
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/LivingKeyboard.test.tsx`
Expected : FAIL, module `../LivingKeyboard` introuvable.

- [ ] **Step 3 : Write the implementation**

```tsx
'use client';

/**
 * LivingKeyboard : le clavier vivant du Conservatoire (spec partie 2).
 * - R4 : le clavier reste neutre, seule la cible prend la couleur de son
 *   doigt, et le nom du doigt s'écrit dessous.
 * - R3 : `ripple(code)` lance une onde « goutte d'eau » de la couleur du
 *   doigt, dessinée dans un canvas au-dessus des touches, sans aucune
 *   écriture DOM par touche ; la boucle rAF ne tourne que tant qu'un anneau
 *   vit.
 * - R6 : sous mouvement réduit, pas de canvas, la touche s'enfonce.
 * Attributs de test : `data-code`, `data-target` (`full` ou `faint`),
 * `data-bump`, `data-pressed`, et `data-ripple-count` sur la racine.
 */

import { FINGER_COLORS } from '@/components/modes/finger-colors';
import { KEYBOARD_VIEW, PHYSICAL_KEYS, keyByCode } from '@/lib/conservatoire/physical-keys';
import type { KeyboardLayout } from '@/lib/keyboardLayouts';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';

export interface LivingKeyboardHandle {
  ripple: (code: string) => void;
}

export interface LivingKeyboardProps {
  layout: KeyboardLayout;
  /** `code` physique de la touche attendue. */
  target?: string;
  targetStyle?: 'full' | 'faint';
  /** Cible cachée tant que ce délai n'est pas écoulé, puis montrée en contour. */
  hintAfterMs?: number;
  ref?: Ref<LivingKeyboardHandle>;
}

const RING_MS = 1150;
const RINGS = [
  { delay: 0, alpha: 0.5, width: 1.5 },
  { delay: 140, alpha: 0.28, width: 1 },
] as const;
const WAVE_LIFE_MS = RING_MS + RINGS[1].delay;
const PRESS_MS = 120;
/** Rayon de départ : le quart de la touche. */
const START_RADIUS = 7;
/** Demi-épaisseur du front d'onde qui teinte un contour au passage. */
const FRONT = 16;

// ponytail: exponentielle à la place d'un solveur de cubic-bezier(0.16, 1,
// 0.3, 1) ; indiscernable à l'œil, à remplacer si la courbe doit être exacte.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

interface Wave {
  x: number;
  y: number;
  color: string;
  start: number;
}

function farthestCorner(x: number, y: number): number {
  const { width, height } = KEYBOARD_VIEW;
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  );
}

export function LivingKeyboard({
  layout,
  target,
  targetStyle = 'full',
  hintAfterMs,
  ref,
}: LivingKeyboardProps) {
  const t = useTranslations('conservatoire');
  const tTyping = useTranslations('typing');
  const reduceMotion = useReducedMotion() === true;
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesRef = useRef<Wave[]>([]);
  const handlesRef = useRef<{
    frame: number | null;
    press: ReturnType<typeof setTimeout> | null;
  }>({ frame: null, press: null });
  const [pressed, setPressed] = useState<string | null>(null);
  const [hintFor, setHintFor] = useState<string | null>(null);

  useEffect(() => {
    if (hintAfterMs === undefined || target === undefined) return;
    const id = setTimeout(() => setHintFor(target), hintAfterMs);
    return () => clearTimeout(id);
  }, [target, hintAfterMs]);

  useEffect(() => {
    const handles = handlesRef.current;
    return () => {
      if (handles.frame !== null) cancelAnimationFrame(handles.frame);
      if (handles.press !== null) clearTimeout(handles.press);
    };
  }, []);

  const draw = useCallback(function draw(now: number) {
    const handles = handlesRef.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !svg || !ctx) {
      wavesRef.current = [];
      handles.frame = null;
      return;
    }
    const rect = svg.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // viewBox en « meet » : échelle uniforme, contenu centré dans la boîte.
    const scale = Math.min(rect.width / KEYBOARD_VIEW.width, rect.height / KEYBOARD_VIEW.height);
    const ox = (rect.width - KEYBOARD_VIEW.width * scale) / 2;
    const oy = (rect.height - KEYBOARD_VIEW.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    wavesRef.current = wavesRef.current.filter((wave) => now - wave.start < WAVE_LIFE_MS);
    for (const wave of wavesRef.current) {
      const maxRadius = farthestCorner(wave.x, wave.y);
      ctx.strokeStyle = wave.color;
      for (const ring of RINGS) {
        const progress = (now - wave.start - ring.delay) / RING_MS;
        if (progress <= 0 || progress >= 1) continue;
        const radius = START_RADIUS + (maxRadius - START_RADIUS) * easeOutExpo(progress);
        const alpha = ring.alpha * (1 - progress);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = ring.width / scale;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (ring.delay !== 0) continue; // seul le premier anneau teinte les contours
        for (const key of PHYSICAL_KEYS) {
          const d = Math.hypot(key.x + key.w / 2 - wave.x, key.y + key.h / 2 - wave.y);
          if (Math.abs(d - radius) < FRONT) ctx.strokeRect(key.x, key.y, key.w, key.h);
        }
      }
    }
    ctx.globalAlpha = 1;
    handles.frame = wavesRef.current.length > 0 ? requestAnimationFrame(draw) : null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      ripple(code: string) {
        const key = keyByCode(code);
        const root = rootRef.current;
        if (!key || !root) return;
        root.dataset.rippleCount = String(Number(root.dataset.rippleCount ?? '0') + 1);
        const handles = handlesRef.current;
        if (reduceMotion) {
          setPressed(code);
          if (handles.press !== null) clearTimeout(handles.press);
          handles.press = setTimeout(() => setPressed(null), PRESS_MS);
          return;
        }
        if (!canvasRef.current?.getContext('2d')) return;
        wavesRef.current.push({
          x: key.x + key.w / 2,
          y: key.y + key.h / 2,
          color: FINGER_COLORS[key.finger],
          start: performance.now(),
        });
        if (handles.frame === null) handles.frame = requestAnimationFrame(draw);
      },
    }),
    [reduceMotion, draw],
  );

  const targetVisible =
    target !== undefined && (hintAfterMs === undefined || hintFor === target);
  const shownStyle = hintAfterMs === undefined ? targetStyle : 'faint';
  const targetKey = targetVisible ? keyByCode(target) : undefined;

  return (
    <div
      ref={rootRef}
      data-living-keyboard
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${KEYBOARD_VIEW.width} ${KEYBOARD_VIEW.height}`}
          role="img"
          aria-label={t('keyboard')}
          style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '42vh' }}
        >
          {PHYSICAL_KEYS.map((key) => {
            const isTarget = targetKey?.code === key.code;
            const filled = isTarget && shownStyle === 'full';
            const color = FINGER_COLORS[key.finger];
            const isPressed = pressed === key.code;
            return (
              <g
                key={key.code}
                data-code={key.code}
                {...(isTarget ? { 'data-target': shownStyle } : {})}
                {...(isPressed ? { 'data-pressed': 'true' } : {})}
                className={filled ? 'lk-breathe' : undefined}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transform: isPressed ? 'scale(0.94)' : 'none',
                  transition: `transform ${PRESS_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                }}
              >
                <rect
                  x={key.x}
                  y={key.y}
                  width={key.w}
                  height={key.h}
                  rx={5}
                  fill={filled ? color : 'var(--color-surface)'}
                  stroke={isTarget ? color : 'var(--color-border)'}
                  strokeWidth={isTarget ? 1.5 : 1}
                />
                <text
                  x={key.x + key.w / 2}
                  y={key.y + key.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  fill={filled ? 'var(--color-bg)' : 'var(--color-text-muted)'}
                >
                  {key.labels[layout]}
                </text>
                {key.bump && (
                  <line
                    data-bump="true"
                    x1={key.x + key.w / 2 - 4}
                    y1={key.y + key.h - 5}
                    x2={key.x + key.w / 2 + 4}
                    y2={key.y + key.h - 5}
                    stroke={filled ? 'var(--color-bg)' : 'var(--color-text-muted)'}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
        {!reduceMotion && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        )}
      </div>
      <p
        style={{
          margin: 0,
          minHeight: '1.4em',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          color: targetKey ? FINGER_COLORS[targetKey.finger] : 'var(--color-text-muted)',
        }}
      >
        {targetKey ? tTyping(`finger.${targetKey.finger}`) : ''}
      </p>
    </div>
  );
}
```

Ajouter à la fin de `apps/web/styles/globals.css` :

```css
/* Conservatoire : respiration lente de la seule touche attendue (R4). */
@keyframes lk-breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.72;
  }
}

.lk-breathe {
  animation: lk-breathe 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .lk-breathe {
    animation: none;
  }
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/LivingKeyboard.test.tsx && (cd apps/web && pnpm lint)`
Expected : PASS, lint sans avertissement.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/conservatoire/LivingKeyboard.tsx apps/web/components/conservatoire/__tests__/LivingKeyboard.test.tsx apps/web/styles/globals.css
git commit -m "feat(conservatoire): clavier vivant, cible seule en couleur et onde sur frappe juste"
```

---

### Task 7 : `PlacementTest`, 30 secondes de mots fréquents

**Files :**
- Create : `apps/web/components/conservatoire/onboarding/PlacementTest.tsx`
- Test : `apps/web/components/conservatoire/onboarding/__tests__/PlacementTest.test.tsx`

**Interfaces :**
- Consumes : `TypingArea` (props `text`, `mode`, `durationSeconds`, `autoNavigate`, `trackProgress`, `onAttempt`, `onSessionComplete`) ; `recordAttempt` (partie 1) ; `loadMastery`, `saveMastery` (partie 1) ; `WORDS_FR_PLAIN` (`apps/web/lib/learning-texts.ts`).
- Produces : `PLACEMENT_SECONDS = 30` ; `placementText(words: readonly string[], random?: () => number): string` ; `PlacementTest(props: { onDone: (result: PlacementResult) => void })` (mots par minute et justesse arrondis).

- [ ] **Step 1 : Write the failing test**

```tsx
import { act, render, waitFor } from '@testing-library/react';
import type { Mastery } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';
import { PlacementTest, placementText } from '../PlacementTest';

const { typing } = vi.hoisted(() => ({
  typing: { props: null as null | Record<string, unknown> },
}));
vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: (props: Record<string, unknown>) => {
    typing.props = props;
    return <div data-testid="typing-area" />;
  },
}));

const { storage } = vi.hoisted(() => ({
  storage: {
    loadMastery: vi.fn(async () => ({ mastery: {}, persisted: true })),
    saveMastery: vi.fn(async (_m: Mastery) => true),
  },
}));
vi.mock('@/lib/conservatoire/storage', () => storage);

describe('PlacementTest', () => {
  it('30 secondes de mots fréquents en minuscules, sans navigation ni séance comptée', () => {
    render(<PlacementTest onDone={vi.fn()} />);
    const props = typing.props!;
    expect(props).toMatchObject({
      mode: 'classic',
      durationSeconds: 30,
      autoNavigate: false,
      trackProgress: false,
    });
    const words = String(props.text).split(' ');
    expect(words.length).toBeGreaterThanOrEqual(120);
    expect(words.every((w) => /^[a-z]+$/.test(w))).toBe(true);
  });

  it('les frappes nourrissent la maîtrise, sauvegardée à la fin ; le résultat est arrondi', async () => {
    const onDone = vi.fn();
    render(<PlacementTest onDone={onDone} />);
    await waitFor(() => expect(storage.loadMastery).toHaveBeenCalled());
    const props = typing.props as {
      onAttempt: (a: object) => void;
      onSessionComplete: (s: object) => void;
    };
    act(() => {
      props.onAttempt({ index: 0, expected: 'l', typed: 'l', correct: true, at: 1000 });
      props.onAttempt({ index: 1, expected: 'e', typed: 'r', correct: false, at: 1200 });
      props.onSessionComplete({ wpm: 34.4, accuracy: 95.6, correct: 1, total: 2, keystrokeData: [] });
    });
    const saved = storage.saveMastery.mock.calls[0]![0];
    expect(saved.l?.attempts).toHaveLength(1);
    expect(saved.e?.attempts[0]).toMatchObject({ correct: false, latencyMs: 200 });
    expect(onDone).toHaveBeenCalledWith({ wpm: 34, accuracy: 96 });
  });

  it('placementText mélange sans perdre ni dupliquer', () => {
    expect(placementText(['a', 'b', 'c'], () => 0).split(' ').sort()).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/components/conservatoire/onboarding/__tests__/PlacementTest.test.tsx`
Expected : FAIL, module `../PlacementTest` introuvable.

- [ ] **Step 3 : Write the implementation**

```tsx
'use client';

/**
 * Le test de placement (écran 9) : 30 secondes de mots fréquents en
 * minuscules, sur le morceau par défaut (chargé par ConservatoireClient). Les
 * frappes nourrissent le moteur de maîtrise ; la séance n'est ni sauvegardée
 * ni comptée.
 */

import { TypingArea } from '@/components/typing/TypingArea';
import { recordAttempt } from '@/lib/conservatoire/mastery';
import { loadMastery, saveMastery } from '@/lib/conservatoire/storage';
import { WORDS_FR_PLAIN } from '@/lib/learning-texts';
import type { Mastery, PlacementResult } from '@typewav/types';
import { useEffect, useRef, useState } from 'react';

export const PLACEMENT_SECONDS = 30;

/** Les mots, mélangés (Fisher-Yates) et joints par des espaces. */
export function placementText(
  words: readonly string[],
  random: () => number = Math.random,
): string {
  const pool = [...words];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.join(' ');
}

export function PlacementTest({ onDone }: { onDone: (result: PlacementResult) => void }) {
  const [text] = useState(() => placementText(WORDS_FR_PLAIN));
  const masteryRef = useRef<Mastery>({});
  const previousAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMastery().then(({ mastery }) => {
      // Si une frappe est déjà passée, elle a commencé sur une maîtrise vide :
      // on la garde (la lecture prend quelques millisecondes).
      if (!cancelled && previousAtRef.current === null) masteryRef.current = mastery;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TypingArea
      text={text}
      mode="classic"
      durationSeconds={PLACEMENT_SECONDS}
      autoNavigate={false}
      trackProgress={false}
      onAttempt={(a) => {
        masteryRef.current = recordAttempt(masteryRef.current, a, previousAtRef.current);
        previousAtRef.current = a.at;
      }}
      onSessionComplete={(stats) => {
        void saveMastery(masteryRef.current);
        onDone({ wpm: Math.round(stats.wpm), accuracy: Math.round(stats.accuracy) });
      }}
    />
  );
}
```

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/components/conservatoire/onboarding/__tests__/PlacementTest.test.tsx`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/conservatoire/onboarding/PlacementTest.tsx apps/web/components/conservatoire/onboarding/__tests__/PlacementTest.test.tsx
git commit -m "feat(conservatoire): test de placement de 30 secondes"
```

---

### Task 8 : `OnboardingFlow`, les onze écrans

**Files :**
- Create : `apps/web/components/conservatoire/onboarding/OnboardingFlow.tsx`
- Test : `apps/web/components/conservatoire/onboarding/__tests__/OnboardingFlow.test.tsx`

**Interfaces :**
- Consumes : `Stage` (tâche 5), `LivingKeyboard` (tâche 6), `PlacementTest` (tâche 7), `pitchForCode`, `CADENCE`, `CHOICE_NOTE`, `HOME_SCALE`, `keyByCode` (tâche 1), `detectLayoutFromKey`, `detectLayoutFromNavigator` (tâche 2), `placementOutcome`, `saveProfile` (tâche 3), `markOnboardingComplete` (`lib/onboarding.ts`), `useAudioEngine` (`initialize`, `playNoteName`), `useKeyboardLayoutPreference` (`layout`, `setLayout`), `FINGER_COLORS`.
- Produces : `OnboardingFlow(props: { onComplete: () => void; onSkip: () => void })`. `onComplete` après l'écran 10 ; `onSkip` après « Passer » (précédé de l'écran 6 s'il n'avait pas été vu). Les deux marquent l'onboarding fait et enregistrent le profil avant d'appeler le callback, en échec ouvert.

Les écrans et leurs règles (spec, « Les écrans ») :

| Étape | Titre | Touche juste | Réponse |
|---|---|---|---|
| `intro` | intro.title | Espace ou Entrée | `initialize()`, vers `f` |
| `f` | f.title | `KeyF` | fa et onde ; vers `j` après 650 ms |
| `j` | j.title | `KeyJ` | sol et onde ; vers `scale` après 650 ms |
| `scale` | scale.title, puis scale.done | les 8 `HOME_SCALE` dans l'ordre | une note et une onde par touche ; à la 8e, cadence (300 ms après) et vague sur la rangée ; Espace vers `blind` |
| `blind` | blind.title, puis blind.done | idem, cible cachée, contour après 1,6 s | idem ; Espace vers `silence` |
| `silence` | silence.title, silence.other, silence.done | `KeyK`, puis n'importe quelle autre touche | la et onde ; puis rien (le silence) ; Espace vers `data` |
| `data` | data.title | `KeyI` ouvre ou ferme le détail ; Espace | vers `experience`, ou fin « Passer » si on y est venu par « Passer » |
| `experience` | experience.title | `Digit1..3`, `Numpad1..3` ou clic | le choix se remplit, son doux, vers `minutes` après 400 ms |
| `minutes` | minutes.title | idem | vers `ready` si « Je débute », sinon `placement` |
| `placement` | placement.title, puis placement.result | `TypingArea` ; Espace une fois le résultat affiché | vers `ready` |
| `ready` | ready.title | Espace | fin, `onComplete` |

- Une touche fausse ne produit rien (R3). `e.repeat`, Ctrl, Alt, Méta : ignorés. Un évènement dont la cible est un bouton est laissé au bouton. Pendant les transitions de 650 et 400 ms, les touches sont ignorées.
- La détection de disposition tourne sur chaque `keydown` (y compris une touche ignorée pour le reste) et au montage via `navigator` ; `setLayout` n'est appelé que si le résultat diffère.
- « Passer » est visible sur les écrans `intro` à `minutes`, sauf sur `data` quand on y est arrivé par « Passer ».

- [ ] **Step 1 : Write the failing test**

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { OnboardingFlow } from '../OnboardingFlow';

vi.mock('next-intl', async () => (await import('../../__tests__/intl')).nextIntlFr);

const { audio } = vi.hoisted(() => ({
  audio: {
    initialize: vi.fn(async () => undefined),
    playNoteName: vi.fn(async (_note: string, _duration?: number) => undefined),
  },
}));
vi.mock('@/hooks/useAudioEngine', () => ({ useAudioEngine: () => audio }));

const { layoutPref } = vi.hoisted(() => ({
  layoutPref: { layout: 'azerty' as 'azerty' | 'qwerty', setLayout: vi.fn() },
}));
vi.mock('@/hooks/useKeyboardLayoutPreference', () => ({
  useKeyboardLayoutPreference: () => layoutPref,
}));

const { onboarding } = vi.hoisted(() => ({
  onboarding: { markOnboardingComplete: vi.fn(async () => undefined) },
}));
vi.mock('@/lib/onboarding', () => onboarding);

const { saveProfile } = vi.hoisted(() => ({ saveProfile: vi.fn(async () => true) }));
vi.mock('@/lib/conservatoire/profile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/conservatoire/profile')>()),
  saveProfile,
}));

vi.mock('@/lib/conservatoire/layout-detection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/conservatoire/layout-detection')>()),
  detectLayoutFromNavigator: vi.fn(async () => null),
}));

vi.mock('../PlacementTest', () => ({
  PlacementTest: ({ onDone }: { onDone: (r: { wpm: number; accuracy: number }) => void }) => (
    <button type="button" onClick={() => onDone({ wpm: 34, accuracy: 96 })}>
      fin du placement
    </button>
  ),
}));

const ob = fr.conservatoire.onboarding;
const SCALE = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
const originalGetContext = HTMLCanvasElement.prototype.getContext;

function press(code: string, init: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(window, { code, key: '', ...init });
}
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
function title() {
  return screen.getByRole('heading', { level: 1 }).textContent;
}
function renderFlow() {
  const onComplete = vi.fn();
  const onSkip = vi.fn();
  const utils = render(<OnboardingFlow onComplete={onComplete} onSkip={onSkip} />);
  return { ...utils, onComplete, onSkip };
}
function toScale() {
  press('Space');
  press('KeyF');
  wait(650);
  press('KeyJ');
  wait(650);
}
function toBlind() {
  toScale();
  SCALE.forEach((c) => press(c));
  press('Space');
}
function toSilence() {
  toBlind();
  SCALE.forEach((c) => press(c));
  press('Space');
}
function toData() {
  toSilence();
  press('KeyK');
  press('KeyX');
  press('Space');
}

beforeEach(() => {
  vi.useFakeTimers();
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
  layoutPref.layout = 'azerty';
  layoutPref.setLayout.mockClear();
  audio.initialize.mockClear();
  audio.playNoteName.mockClear();
  onboarding.markOnboardingComplete.mockReset().mockResolvedValue(undefined);
  saveProfile.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("OnboardingFlow : l'instrument (écrans 0 à 5)", () => {
  it('Espace active le son puis montre F, seule touche en couleur', () => {
    const { container } = renderFlow();
    expect(title()).toBe(ob.intro.title);
    press('Space');
    expect(audio.initialize).toHaveBeenCalledOnce();
    expect(title()).toBe(ob.f.title);
    const targets = container.querySelectorAll('[data-target]');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('data-code', 'KeyF');
    expect(screen.getByText(fr.typing.finger.LI)).toBeInTheDocument();
  });

  it('F joue fa et lance une onde ; une autre touche ne fait rien', () => {
    const { container } = renderFlow();
    press('Space');
    const keyboard = container.querySelector('[data-living-keyboard]');
    press('KeyJ');
    expect(audio.playNoteName).not.toHaveBeenCalled();
    expect(keyboard).not.toHaveAttribute('data-ripple-count');
    press('KeyF');
    expect(audio.playNoteName).toHaveBeenCalledWith('F4');
    expect(keyboard).toHaveAttribute('data-ripple-count', '1');
    expect(title()).toBe(ob.f.title);
    wait(650);
    expect(title()).toBe(ob.j.title);
    press('KeyJ');
    expect(audio.playNoteName).toHaveBeenLastCalledWith('G4');
  });

  it('la gamme du repos joue do ré mi fa sol la si do, puis la cadence', () => {
    renderFlow();
    toScale();
    audio.playNoteName.mockClear();
    expect(title()).toBe(ob.scale.title);
    SCALE.forEach((c) => press(c));
    expect(audio.playNoteName.mock.calls.map((c) => c[0])).toEqual([
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
    ]);
    expect(title()).toBe(ob.scale.done);
    wait(1000);
    expect(audio.playNoteName).toHaveBeenCalledWith('C5', 1.1);
  });

  it("sans regarder : aucune cible, puis le contour après 1,6 s d'hésitation", () => {
    const { container } = renderFlow();
    toBlind();
    expect(title()).toBe(ob.blind.title);
    expect(container.querySelector('[data-target]')).toBeNull();
    wait(1599);
    expect(container.querySelector('[data-target]')).toBeNull();
    wait(1);
    const hint = container.querySelector('[data-target]');
    expect(hint).toHaveAttribute('data-code', 'KeyA');
    expect(hint).toHaveAttribute('data-target', 'faint');
  });

  it("répétition et raccourcis ne jouent rien et n'avancent rien", () => {
    renderFlow();
    press('Space');
    press('KeyF', { repeat: true });
    press('KeyF', { ctrlKey: true });
    press('KeyF', { altKey: true });
    press('KeyF', { metaKey: true });
    expect(audio.playNoteName).not.toHaveBeenCalled();
    wait(650);
    expect(title()).toBe(ob.f.title);
  });

  it('K joue une note, une autre touche ne joue rien : le silence', () => {
    renderFlow();
    toSilence();
    expect(title()).toBe(ob.silence.title);
    press('KeyK');
    expect(audio.playNoteName).toHaveBeenLastCalledWith('A4');
    expect(title()).toBe(ob.silence.other);
    audio.playNoteName.mockClear();
    press('KeyQ');
    expect(audio.playNoteName).not.toHaveBeenCalled();
    expect(title()).toBe(ob.silence.done);
  });

  it('la disposition est détectée à la première touche discriminante', () => {
    renderFlow();
    press('KeyA', { key: 'a' });
    expect(layoutPref.setLayout).toHaveBeenCalledWith('qwerty');
  });

  it("Verr. Maj ne fausse pas la détection, et rien n'est écrit si la disposition ne change pas", () => {
    layoutPref.layout = 'qwerty';
    renderFlow();
    press('KeyQ', { key: 'Q' });
    expect(layoutPref.setLayout).not.toHaveBeenCalled();
    press('KeyA', { key: 'Q' });
    expect(layoutPref.setLayout).toHaveBeenCalledWith('azerty');
  });
});

describe('OnboardingFlow : données, choix, fin (écrans 6 à 10)', () => {
  it('I ouvre et ferme le détail des données, Espace continue', () => {
    renderFlow();
    toData();
    expect(title()).toBe(ob.data.title);
    expect(screen.queryByText(ob.data.detail2)).toBeNull();
    press('KeyI');
    for (const line of [ob.data.detail1, ob.data.detail2, ob.data.detail3]) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    press('KeyI');
    expect(screen.queryByText(ob.data.detail2)).toBeNull();
    press('Space');
    expect(title()).toBe(ob.experience.title);
  });

  it('1, 2, 3 par position physique ; « Je débute » saute le placement', async () => {
    const { onComplete } = renderFlow();
    toData();
    press('Space');
    press('Digit1', { key: '&' });
    expect(audio.playNoteName).toHaveBeenLastCalledWith('E5', 0.3);
    expect(screen.getByRole('button', { name: /Je débute/ })).toHaveAttribute('aria-pressed', 'true');
    wait(400);
    expect(title()).toBe(ob.minutes.title);
    press('Numpad2', { key: '2' });
    wait(400);
    expect(title()).toBe(ob.ready.title);
    await act(async () => {
      press('Space');
    });
    expect(onboarding.markOnboardingComplete).toHaveBeenCalledOnce();
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        experience: 'beginner',
        dailyMinutes: 10,
        placement: null,
        outcome: 'lesson1',
        skipped: false,
      }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('« Sans regarder » : placement, un seul résultat, puis la première leçon', async () => {
    renderFlow();
    toData();
    press('Space');
    press('Digit3');
    wait(400);
    press('Digit1');
    wait(400);
    expect(title()).toBe(ob.placement.title);
    fireEvent.click(screen.getByRole('button', { name: 'fin du placement' }));
    expect(title()).toBe('34 mots par minute, 96 % de notes justes.');
    press('Space');
    expect(title()).toBe(ob.ready.title);
    await act(async () => {
      press('Space');
    });
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        experience: 'touch-typist',
        dailyMinutes: 5,
        placement: { wpm: 34, accuracy: 96 },
        outcome: 'cycle1-validated',
      }),
    );
  });

  it("« Passer » avant l'écran des données y mène d'abord, puis sort", async () => {
    const { onSkip, onComplete } = renderFlow();
    press('Space');
    fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    expect(title()).toBe(ob.data.title);
    expect(screen.queryByRole('button', { name: fr.conservatoire.skip })).toBeNull();
    await act(async () => {
      press('Space');
    });
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onboarding.markOnboardingComplete).toHaveBeenCalledOnce();
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ skipped: true, outcome: null }));
  });

  it("« Passer » après l'écran des données sort aussitôt", async () => {
    const { onSkip } = renderFlow();
    toData();
    press('Space');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('Espace sur un bouton focalisé est laissé au bouton : une seule action', () => {
    renderFlow();
    const skip = screen.getByRole('button', { name: fr.conservatoire.skip });
    skip.focus();
    fireEvent.keyDown(skip, { code: 'Space', key: ' ' });
    expect(title()).toBe(ob.intro.title);
    expect(audio.initialize).not.toHaveBeenCalled();
  });

  it("IndexedDB indisponible : la fin de l'onboarding n'est jamais bloquée", async () => {
    onboarding.markOnboardingComplete.mockRejectedValueOnce(new Error('IndexedDB indisponible'));
    saveProfile.mockResolvedValueOnce(false);
    const { onComplete } = renderFlow();
    toData();
    press('Space');
    press('Digit1');
    wait(400);
    press('Digit1');
    wait(400);
    await act(async () => {
      press('Space');
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/components/conservatoire/onboarding/__tests__/OnboardingFlow.test.tsx`
Expected : FAIL, module `../OnboardingFlow` introuvable.

- [ ] **Step 3 : Write the implementation**

```tsx
'use client';

/**
 * L'onboarding de TypeWav, dans le Conservatoire (spec partie 2, « Les
 * écrans ») : onze écrans d'une seule chose chacun.
 *
 * Exception documentée à la règle de capture : ces écrans visent des touches
 * physiques sans composer de texte, donc une seule écoute `keydown` sur
 * `window` lit `KeyboardEvent.code`. Le test de placement, lui, passe par
 * `TypingArea` et sa capture cachée.
 */

import { FINGER_COLORS } from '@/components/modes/finger-colors';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useKeyboardLayoutPreference } from '@/hooks/useKeyboardLayoutPreference';
import { CADENCE, CHOICE_NOTE, pitchForCode } from '@/lib/conservatoire/instrument';
import { detectLayoutFromKey, detectLayoutFromNavigator } from '@/lib/conservatoire/layout-detection';
import { HOME_SCALE, keyByCode } from '@/lib/conservatoire/physical-keys';
import { placementOutcome, saveProfile } from '@/lib/conservatoire/profile';
import type { KeyboardLayout } from '@/lib/keyboardLayouts';
import { markOnboardingComplete } from '@/lib/onboarding';
import type { DailyMinutes, ExperienceLevel, PlacementResult } from '@typewav/types';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { LivingKeyboard, type LivingKeyboardHandle } from '../LivingKeyboard';
import { Stage } from '../Stage';
import { PlacementTest } from './PlacementTest';

type Step =
  | 'intro' | 'f' | 'j' | 'scale' | 'blind' | 'silence'
  | 'data' | 'experience' | 'minutes' | 'placement' | 'ready';

const SKIPPABLE: readonly Step[] = [
  'intro', 'f', 'j', 'scale', 'blind', 'silence', 'data', 'experience', 'minutes',
];
const ADVANCE_MS = 650;
const CHOICE_MS = 400;
const HINT_MS = 1600;
/** La cadence attend que la dernière note de la gamme ait sonné. */
const CADENCE_DELAY_MS = 300;
const EXPERIENCES: readonly ExperienceLevel[] = ['beginner', 'some-fingers', 'touch-typist'];
const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  beginner: 'beginner',
  'some-fingers': 'someFingers',
  'touch-typist': 'touchTypist',
};
const MINUTES: readonly DailyMinutes[] = [5, 10, 15];

/** 1, 2, 3 par position physique : sur AZERTY, la touche « 1 » produit « & ». */
function choiceIndex(code: string): number | null {
  const match = /^(?:Digit|Numpad)([123])$/.exec(code);
  return match ? Number(match[1]) - 1 : null;
}

function isContinue(code: string): boolean {
  return code === 'Space' || code === 'Enter' || code === 'NumpadEnter';
}

export interface OnboardingFlowProps {
  /** Fin de l'écran 10 : la première leçon commence. */
  onComplete: () => void;
  /** « Passer » confirmé : retour à l'accueil de TypeWav. */
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const t = useTranslations('conservatoire.onboarding');
  const tc = useTranslations('conservatoire');
  const tTyping = useTranslations('typing');
  const { initialize, playNoteName } = useAudioEngine();
  const { layout, setLayout } = useKeyboardLayoutPreference();
  const keyboardRef = useRef<LivingKeyboardHandle>(null);
  const lockedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [step, setStep] = useState<Step>('intro');
  const [scaleIndex, setScaleIndex] = useState(0);
  const [silencePhase, setSilencePhase] = useState<'title' | 'other' | 'done'>('title');
  const [detailOpen, setDetailOpen] = useState(false);
  const [dataSeen, setDataSeen] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);
  const [placement, setPlacement] = useState<PlacementResult | null>(null);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function later(ms: number, fn: () => void) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  function go(next: Step) {
    setStep(next);
    setScaleIndex(0);
    setDetailOpen(false);
    if (next === 'data') setDataSeen(true);
  }

  function goAfter(ms: number, next: Step) {
    lockedRef.current = true;
    later(ms, () => {
      lockedRef.current = false;
      go(next);
    });
  }

  function play(code: string) {
    const note = pitchForCode(code);
    if (note) void playNoteName(note);
    keyboardRef.current?.ripple(code);
  }

  function celebrate() {
    for (const [note, delay, duration] of CADENCE) {
      later(CADENCE_DELAY_MS + delay, () => void playNoteName(note, duration));
    }
    HOME_SCALE.forEach((code, i) =>
      later(CADENCE_DELAY_MS + i * 60, () => keyboardRef.current?.ripple(code)),
    );
  }

  async function finish(skipped: boolean) {
    lockedRef.current = true;
    await Promise.all([
      markOnboardingComplete().catch(() => undefined),
      saveProfile({
        version: 1,
        startedAt: Date.now(),
        experience,
        dailyMinutes: minutes,
        placement,
        outcome: !skipped && experience ? placementOutcome(experience, placement) : null,
        skipped,
      }),
    ]);
    if (skipped) onSkip();
    else onComplete();
  }

  function skip() {
    if (dataSeen) {
      void finish(true);
      return;
    }
    setSkipping(true);
    go('data');
  }

  function choose(index: number) {
    void playNoteName(CHOICE_NOTE, 0.3);
    if (step === 'experience') {
      setExperience(EXPERIENCES[index]!);
      goAfter(CHOICE_MS, 'minutes');
    } else {
      setMinutes(MINUTES[index]!);
      goAfter(CHOICE_MS, experience === 'beginner' ? 'ready' : 'placement');
    }
  }

  const applyLayout = useEffectEvent((detected: KeyboardLayout | null) => {
    if (detected && detected !== layout) setLayout(detected);
  });

  useEffect(() => {
    let cancelled = false;
    void detectLayoutFromNavigator(navigator).then((detected) => {
      if (!cancelled) applyLayout(detected);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    applyLayout(detectLayoutFromKey(e.code, e.key));
    if (e.target instanceof Element && e.target.closest('button')) return;
    if (lockedRef.current) return;
    const scaleDone = scaleIndex >= HOME_SCALE.length;

    switch (step) {
      case 'intro':
        if (!isContinue(e.code)) return;
        e.preventDefault();
        void initialize();
        go('f');
        return;
      case 'f':
      case 'j': {
        const want = step === 'f' ? 'KeyF' : 'KeyJ';
        if (e.code !== want) return;
        e.preventDefault();
        play(want);
        goAfter(ADVANCE_MS, step === 'f' ? 'j' : 'scale');
        return;
      }
      case 'scale':
      case 'blind':
        if (scaleDone) {
          if (!isContinue(e.code)) return;
          e.preventDefault();
          go(step === 'scale' ? 'blind' : 'silence');
          return;
        }
        if (e.code !== HOME_SCALE[scaleIndex]) return;
        e.preventDefault();
        play(e.code);
        if (scaleIndex + 1 === HOME_SCALE.length) celebrate();
        setScaleIndex(scaleIndex + 1);
        return;
      case 'silence':
        if (silencePhase === 'done') {
          if (!isContinue(e.code)) return;
          e.preventDefault();
          setSilencePhase('title');
          go('data');
          return;
        }
        if (e.code === 'KeyK') {
          e.preventDefault();
          play('KeyK');
          setSilencePhase('other');
          return;
        }
        if (silencePhase === 'other') {
          e.preventDefault();
          setSilencePhase('done');
        }
        return;
      case 'data':
        if (e.code === 'KeyI') {
          e.preventDefault();
          setDetailOpen((open) => !open);
          return;
        }
        if (!isContinue(e.code)) return;
        e.preventDefault();
        if (skipping) void finish(true);
        else go('experience');
        return;
      case 'experience':
      case 'minutes': {
        const index = choiceIndex(e.code);
        if (index === null) return;
        e.preventDefault();
        choose(index);
        return;
      }
      case 'placement':
        if (!placement || !isContinue(e.code)) return;
        e.preventDefault();
        go('ready');
        return;
      case 'ready':
        if (!isContinue(e.code)) return;
        e.preventDefault();
        void finish(false);
        return;
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Rendu

  const scaleDone = scaleIndex >= HOME_SCALE.length;
  let target: string | undefined;
  if (step === 'f') target = 'KeyF';
  else if (step === 'j') target = 'KeyJ';
  else if ((step === 'scale' || step === 'blind') && !scaleDone) target = HOME_SCALE[scaleIndex];
  else if (step === 'silence' && silencePhase === 'title') target = 'KeyK';

  const continueHint = tc('continue');
  let title: string;
  let support: string | undefined;
  let footer: string | undefined;
  let slot: ReactNode;

  // Même position dans l'arbre d'un écran à l'autre : le clavier (et ses ondes
  // en cours) survit aux transitions de F à la fin du silence.
  const keyboard = (
    <>
      {(step === 'scale' || step === 'blind') && (
        <div aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
          {HOME_SCALE.map((code, i) => (
            <span
              key={code}
              style={{
                width: 28,
                height: 4,
                borderRadius: 2,
                background: i < scaleIndex ? FINGER_COLORS[keyByCode(code)!.finger] : 'var(--color-border)',
                transition: 'background 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          ))}
        </div>
      )}
      <LivingKeyboard
        ref={keyboardRef}
        layout={layout}
        {...(target !== undefined ? { target } : {})}
        {...(step === 'blind' ? { targetStyle: 'faint' as const, hintAfterMs: HINT_MS } : {})}
      />
    </>
  );

  const choices = (options: string[], chosen: number) => (
    <div role="group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {options.map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={chosen === i}
          onClick={() => {
            if (!lockedRef.current) choose(i);
          }}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: chosen === i ? 'var(--color-accent)' : 'transparent',
            color: chosen === i ? 'var(--color-bg)' : 'inherit',
            fontFamily: 'var(--font-ui)',
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6, marginRight: 8 }}>{i + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );

  switch (step) {
    case 'intro':
      title = t('intro.title');
      support = t('intro.support');
      footer = t('intro.start');
      break;
    case 'f':
    case 'j':
      title = t(`${step}.title`);
      support = t(`${step}.support`);
      slot = keyboard;
      break;
    case 'scale':
      title = scaleDone ? t('scale.done') : t('scale.title');
      if (scaleDone) footer = continueHint;
      slot = keyboard;
      break;
    case 'blind':
      title = scaleDone ? t('blind.done') : t('blind.title');
      if (scaleDone) footer = continueHint;
      else support = t('blind.support');
      slot = keyboard;
      break;
    case 'silence':
      title = t(`silence.${silencePhase}`);
      if (silencePhase === 'done') footer = continueHint;
      slot = keyboard;
      break;
    case 'data':
      title = t('data.title');
      support = t('data.support');
      footer = continueHint;
      if (detailOpen) {
        slot = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
            {(['detail1', 'detail2', 'detail3'] as const).map((k) => (
              <p key={k} style={{ margin: 0, fontFamily: 'var(--font-ui)' }}>
                {t(`data.${k}`)}
              </p>
            ))}
          </div>
        );
      }
      break;
    case 'experience':
      title = t('experience.title');
      footer = t('choiceHint');
      slot = choices(
        EXPERIENCES.map((e) => t(`experience.${EXPERIENCE_LABEL[e]}`)),
        experience ? EXPERIENCES.indexOf(experience) : -1,
      );
      break;
    case 'minutes':
      title = t('minutes.title');
      footer = t('choiceHint');
      slot = choices(
        MINUTES.map((m) => t('minutes.option', { minutes: m })),
        minutes ? MINUTES.indexOf(minutes) : -1,
      );
      break;
    case 'placement':
      if (placement) {
        title = t('placement.result', { wpm: placement.wpm, accuracy: placement.accuracy });
        footer = continueHint;
      } else {
        title = t('placement.title');
        support = t('placement.support');
        slot = <PlacementTest onDone={setPlacement} />;
      }
      break;
    case 'ready':
      title = t('ready.title');
      footer = continueHint;
      break;
  }

  // Sans regarder, l'annonce ne trahit pas la touche attendue.
  const targetKey = target !== undefined && step !== 'blind' ? keyByCode(target) : undefined;
  const announce = targetKey
    ? `${title} ${tc('announceTarget', {
        key: targetKey.labels[layout].toUpperCase(),
        finger: tTyping(`finger.${targetKey.finger}`),
      })}`
    : title;
  const canSkip = SKIPPABLE.includes(step) && !(step === 'data' && skipping);

  return (
    <Stage
      title={title}
      announce={announce}
      {...(support !== undefined ? { support } : {})}
      {...(footer !== undefined ? { footer } : {})}
      {...(canSkip ? { onSkip: skip } : {})}
    >
      {slot}
    </Stage>
  );
}
```

Note pour l'implémenteur : `Stage` ne rend l'emplacement que si `children !== undefined` ; `slot` reste `undefined` sur les écrans sans emplacement, c'est voulu (R1). `lockedRef.current` n'est lu que dans des gestionnaires d'évènement (`onClick`, `onKey`), jamais pendant le rendu.

- [ ] **Step 4 : Run test to verify it passes**

Run : `pnpm vitest run apps/web/components/conservatoire/onboarding/__tests__/OnboardingFlow.test.tsx && pnpm typecheck && (cd apps/web && pnpm lint)`
Expected : PASS, lint sans avertissement.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/conservatoire/onboarding/OnboardingFlow.tsx apps/web/components/conservatoire/onboarding/__tests__/OnboardingFlow.test.tsx
git commit -m "feat(conservatoire): onboarding musical en onze écrans"
```

---

### Task 9 : la route `/conservatoire`

**Files :**
- Create : `apps/web/app/[locale]/conservatoire/page.tsx`
- Create : `apps/web/components/conservatoire/ConservatoireClient.tsx`
- Modify : `apps/web/app/sitemap.ts` (`PUBLIC_PATHS` et commentaire de tête), `apps/web/app/__tests__/sitemap-robots.test.ts`
- Test : `apps/web/components/conservatoire/__tests__/ConservatoireClient.test.tsx`

**Interfaces :**
- Consumes : `OnboardingFlow` (tâche 8), `Stage` (tâche 5), `LearningMode`, `useAudioEngine().loadMidiPiece`, `hasCompletedOnboarding`, `isNonDesktopDevice`, `buildMetadata` (`lib/seo`).
- Produces : page `/{locale}/conservatoire` ; `ConservatoireClient` rend un `<main>` qui montre : rien pendant la lecture du drapeau ; l'écran mobile ; l'onboarding ; l'espace intérim (`LearningMode`). Ligne `role="note"` si le drapeau est illisible.

- [ ] **Step 1 : Write the failing test**

`apps/web/components/conservatoire/__tests__/ConservatoireClient.test.tsx` :

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { ConservatoireClient } from '../ConservatoireClient';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const { audio } = vi.hoisted(() => ({ audio: { loadMidiPiece: vi.fn(async () => undefined) } }));
vi.mock('@/hooks/useAudioEngine', () => ({ useAudioEngine: () => audio }));

const { flags } = vi.hoisted(() => ({
  flags: { hasCompletedOnboarding: vi.fn(async () => false), nonDesktop: false },
}));
vi.mock('@/lib/onboarding', () => ({
  hasCompletedOnboarding: () => flags.hasCompletedOnboarding(),
}));
vi.mock('@/lib/device', () => ({ isNonDesktopDevice: () => flags.nonDesktop }));

vi.mock('@/components/modes/LearningMode', () => ({
  LearningMode: () => <div data-testid="learning-mode" />,
}));
vi.mock('../onboarding/OnboardingFlow', () => ({
  OnboardingFlow: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="onboarding">
      <button type="button" onClick={onComplete}>fin</button>
      <button type="button" onClick={onSkip}>passer</button>
    </div>
  ),
}));

beforeEach(() => {
  flags.nonDesktop = false;
  flags.hasCompletedOnboarding.mockReset().mockResolvedValue(false);
  router.push.mockClear();
  audio.loadMidiPiece.mockClear();
});

describe('ConservatoireClient', () => {
  it("première visite : l'onboarding, puis la première leçon", async () => {
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('onboarding')).toBeInTheDocument();
    expect(audio.loadMidiPiece).toHaveBeenCalledWith('fur-elise');
    fireEvent.click(screen.getByRole('button', { name: 'fin' }));
    expect(screen.getByTestId('learning-mode')).toBeInTheDocument();
  });

  it("« Passer » ramène à l'accueil de TypeWav", async () => {
    render(<ConservatoireClient />);
    fireEvent.click(await screen.findByRole('button', { name: 'passer' }));
    expect(router.push).toHaveBeenCalledWith('/fr');
  });

  it("onboarding déjà fait : l'espace directement", async () => {
    flags.hasCompletedOnboarding.mockResolvedValue(true);
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('learning-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding')).toBeNull();
  });

  it("rien tant que le drapeau n'est pas lu (pas de flash)", () => {
    flags.hasCompletedOnboarding.mockImplementation(() => new Promise<boolean>(() => {}));
    render(<ConservatoireClient />);
    expect(screen.queryByTestId('onboarding')).toBeNull();
    expect(screen.queryByTestId('learning-mode')).toBeNull();
  });

  it('sur mobile : un seul écran, aucune lecture du drapeau', async () => {
    flags.nonDesktop = true;
    render(<ConservatoireClient />);
    expect(
      await screen.findByRole('heading', { name: fr.conservatoire.mobile }),
    ).toBeInTheDocument();
    expect(flags.hasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it("IndexedDB illisible : l'onboarding se joue quand même, avec une ligne honnête", async () => {
    flags.hasCompletedOnboarding.mockRejectedValue(new Error('IndexedDB indisponible'));
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('onboarding')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('note')).toHaveTextContent(fr.conservatoire.unsaved),
    );
  });
});
```

Dans `apps/web/app/__tests__/sitemap-robots.test.ts`, test « liste chaque page publique » : `['', '/classement', '/about', '/conservatoire']`.

- [ ] **Step 2 : Run tests to verify they fail**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/ConservatoireClient.test.tsx apps/web/app/__tests__/sitemap-robots.test.ts`
Expected : FAIL (module `../ConservatoireClient` introuvable ; `/fr/conservatoire` absent du sitemap).

- [ ] **Step 3 : Write the implementation**

`apps/web/components/conservatoire/ConservatoireClient.tsx` :

```tsx
'use client';

/**
 * Le Conservatoire (spec partie 2, « Entrée ») : l'onboarding à la première
 * visite, puis l'espace. En attendant les parties 3 et 4 (cycle 1, accueil,
 * séance du jour), l'espace affiche le mode Apprentissage actuel.
 */

import { LearningMode } from '@/components/modes/LearningMode';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { isNonDesktopDevice } from '@/lib/device';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { Stage } from './Stage';

type View = 'loading' | 'mobile' | 'onboarding' | 'space';

export function ConservatoireClient() {
  const t = useTranslations('conservatoire');
  const router = useRouter();
  const locale = useLocale();
  const { loadMidiPiece } = useAudioEngine();
  const [view, setView] = useState<View>('loading');
  const [unsaved, setUnsaved] = useState(false);

  // Le placement et le mode Apprentissage jouent le morceau par défaut : sans
  // HomeClient dans cet arbre, personne d'autre ne le charge.
  useEffect(() => {
    void loadMidiPiece('fur-elise');
  }, [loadMidiPiece]);

  useEffect(() => {
    let cancelled = false;
    if (isNonDesktopDevice()) {
      queueMicrotask(() => {
        if (!cancelled) setView('mobile');
      });
    } else {
      hasCompletedOnboarding()
        .then((done) => {
          if (!cancelled) setView(done ? 'space' : 'onboarding');
        })
        .catch(() => {
          // Drapeau illisible : l'onboarding reste jouable, en mémoire, avec
          // une ligne honnête sur l'enregistrement impossible.
          if (cancelled) return;
          setUnsaved(true);
          setView('onboarding');
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const goHome = () => router.push(`/${locale}`);

  return (
    <main
      style={{
        height: 'calc(100dvh - var(--nav-height))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 32px 32px',
        overflow: 'hidden',
      }}
    >
      {unsaved && view !== 'mobile' && (
        <p
          role="note"
          style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-text-muted)' }}
        >
          {t('unsaved')}
        </p>
      )}
      {view === 'mobile' && <Stage title={t('mobile')} />}
      {view === 'onboarding' && (
        <div style={{ flex: '1 1 0%', minHeight: 0, width: '100%' }}>
          <OnboardingFlow onComplete={() => setView('space')} onSkip={goHome} />
        </div>
      )}
      {view === 'space' && (
        <div style={{ flex: '1 1 0%', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
          <LearningMode onExitTutorial={goHome} />
        </div>
      )}
    </main>
  );
}
```

`apps/web/app/[locale]/conservatoire/page.tsx` :

```tsx
import { ConservatoireClient } from '@/components/conservatoire/ConservatoireClient';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const t = await getTranslations({ locale: loc, namespace: 'conservatoire' });
  return buildMetadata({ locale: loc, title: t('metaTitle') });
}

export default function ConservatoirePage() {
  return <ConservatoireClient />;
}
```

Vérifier la signature de `buildMetadata` dans `apps/web/lib/seo.ts` (le modèle ci-dessus vient de `parametres/page.tsx`) ; si les pages publiques (`classement`, `about`) lui passent un `path` pour le canonique, passer `path: '/conservatoire'` de la même façon.

Dans `apps/web/app/sitemap.ts` : `const PUBLIC_PATHS = ['', '/classement', '/about', '/conservatoire'] as const;`, et retirer `` `/dev-onboarding` `` du commentaire de tête.

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm vitest run apps/web/components/conservatoire/__tests__/ConservatoireClient.test.tsx apps/web/app/__tests__/sitemap-robots.test.ts && pnpm typecheck`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/conservatoire/ConservatoireClient.tsx "apps/web/app/[locale]/conservatoire/page.tsx" apps/web/components/conservatoire/__tests__/ConservatoireClient.test.tsx apps/web/app/sitemap.ts apps/web/app/__tests__/sitemap-robots.test.ts
git commit -m "feat(conservatoire): route du Conservatoire, onboarding puis espace"
```

---

### Task 10 : l'entrée (accueil, navigation) et le retrait de `dev-onboarding`

**Files :**
- Modify : `apps/web/components/typing/HomeClient.tsx` (imports lignes 18 à 71 ; état `isOnboarding` ligne 162 ; `onboardingResolved` ligne 167 ; commentaire et effet lignes 458 à 505 ; `handleExitTutorial` ligne 507 ; effet lignes 529 à 545 ; ConfigBar ligne 783 ; commentaire lignes 1006 à 1010 ; `LearningMode` ligne 1066)
- Modify : `apps/web/components/ui/GlobalNav.tsx` (`NAV_ITEMS`, import lucide)
- Modify : `apps/web/lib/onboarding.ts` (commentaire de tête)
- Modify : `apps/web/app/robots.ts` (retirer `'/*/dev-onboarding'`), `apps/web/app/__tests__/sitemap-robots.test.ts` (retirer l'attente sur `dev-onboarding`)
- Delete : `apps/web/app/[locale]/dev-onboarding/` (dossier entier, `git rm -r`)
- Test : `apps/web/components/__tests__/HomeClient.test.tsx` (mocks `next/navigation` et `next/link`, `learningModePropsRef`, describe « onboarding première visite »), `apps/web/components/ui/__tests__/GlobalNav.test.tsx`

**Interfaces :**
- Consumes : route `/{locale}/conservatoire` (tâche 9), `nav.conservatoire` et `conservatoire.nudge` (tâche 4).
- Produces : première visite sur ordinateur redirigée vers `/{locale}/conservatoire` ; lien `data-testid="conservatoire-nudge"` sur l'accueil desktop ; entrée `conservatoire` en tête de `GlobalNav`.

- [ ] **Step 1 : Write the failing tests**

Dans `apps/web/components/__tests__/HomeClient.test.tsx` :

1. Remplacer le mock `next/navigation` par un routeur stable et observable, et ajouter le mock `next/link` :

```tsx
const { mockPush, mockRouter } = vi.hoisted(() => {
  const mockPush = vi.fn();
  return { mockPush, mockRouter: { push: mockPush } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/fr',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
```

2. Dans le `beforeEach` global (vers la ligne 329), ajouter `mockPush.mockClear();`.

3. `learningModePropsRef` et le mock `LearningMode` : retirer `isOnboarding?: boolean;` des deux types.

4. Remplacer le describe `'HomeClient : onboarding première visite'` en entier par :

```tsx
describe('HomeClient : première visite', () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  const nonDesktop = () => {
    window.matchMedia = ((query: string) => ({
      matches: query === NON_DESKTOP_MEDIA_QUERY,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  };

  it('première visite sur ordinateur : redirige vers le Conservatoire sans montrer la frappe', async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/fr/conservatoire'));
    expect(screen.queryByTestId('typing-area')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
    expect(mockMarkOnboardingComplete).not.toHaveBeenCalled();
  });

  it('appareil non desktop : frappe directe, aucune redirection, flag jamais touché', async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);
    nonDesktop();
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockHasCompletedOnboarding).not.toHaveBeenCalled();
    expect(mockMarkOnboardingComplete).not.toHaveBeenCalled();
  });

  it("un activeMode 'learning' persistant retombe sur 'classic' sur appareil non desktop (#98)", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    nonDesktop();
    const { useConfigStore } = await import('@/stores/useConfigStore');
    const { HomeClient } = await import('../typing/HomeClient');
    useConfigStore.setState({ activeMode: 'learning' });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => expect(useConfigStore.getState().activeMode).toBe('classic'));
  });

  it("ne montre ni frappe ni apprentissage tant que la première visite n'est pas tranchée (pas de flash)", async () => {
    mockHasCompletedOnboarding.mockImplementation(() => new Promise<boolean>(() => {}));
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(screen.queryByTestId('typing-area')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
  });

  it("montre la frappe dès que l'onboarding est confirmé terminé", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("flag illisible : aucune redirection forcée, la frappe s'affiche", async () => {
    mockHasCompletedOnboarding.mockRejectedValue(new Error('IndexedDB indisponible'));
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("la pastille du Conservatoire reste visible sur l'accueil desktop", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    const nudge = await screen.findByTestId('conservatoire-nudge');
    expect(nudge).toHaveAttribute('href', '/fr/conservatoire');
  });

  it("la sortie réelle du tutoriel marque l'onboarding fait et repasse en mode classique", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    const { useConfigStore } = await import('@/stores/useConfigStore');
    const { HomeClient } = await import('../typing/HomeClient');
    useConfigStore.setState({ activeMode: 'learning' });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() =>
      expect(learningModePropsRef.current?.onExitTutorial).toBeInstanceOf(Function),
    );
    act(() => {
      learningModePropsRef.current?.onExitTutorial();
    });
    expect(mockMarkOnboardingComplete).toHaveBeenCalledOnce();
    expect(useConfigStore.getState().activeMode).toBe('classic');
  });
});
```

Dans `apps/web/components/ui/__tests__/GlobalNav.test.tsx`, remplacer « affiche les cinq entrées » par :

```tsx
  it('affiche les six entrées, le Conservatoire en premier', () => {
    render(<GlobalNav />);
    for (const name of ['conservatoire', 'typing', 'leaderboard', 'profile', 'settings', 'about']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    const conservatoire = screen.getByRole('link', { name: 'conservatoire' });
    expect(conservatoire).toHaveAttribute('href', '/fr/conservatoire');
    expect(
      conservatoire.compareDocumentPosition(screen.getByRole('link', { name: 'typing' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
```

- [ ] **Step 2 : Run tests to verify they fail**

Run : `pnpm vitest run apps/web/components/__tests__/HomeClient.test.tsx apps/web/components/ui/__tests__/GlobalNav.test.tsx`
Expected : FAIL (aucune redirection, pas de pastille, pas d'entrée `conservatoire`).

- [ ] **Step 3 : Write the implementation**

`HomeClient.tsx` :

1. Imports : supprimer `import { IS_DEV_MODE } from '@/lib/featureFlags';` ; ajouter `import Link from 'next/link';` et `import { useRouter } from 'next/navigation';` ; l'import next-intl devient `import { useLocale, useTranslations } from 'next-intl';`.
2. Avec les autres hooks en tête du composant : `const router = useRouter();`, `const locale = useLocale();`, `const tConservatoire = useTranslations('conservatoire');`.
3. Supprimer `const [isOnboarding, setIsOnboarding] = useState(false);`. Remplacer le commentaire et la déclaration de `onboardingResolved` par :

```tsx
  // Tant que la première visite n'est pas tranchée (lecture IndexedDB async),
  // et pendant la redirection vers le Conservatoire, on ne rend NI la zone de
  // frappe NI l'apprentissage : pas de flash.
  const [onboardingResolved, setOnboardingResolved] = useState(false);
```

4. Remplacer le bloc commentaire « Déclenche le tutoriel d'onboarding… » et l'effet qui le suit (jusqu'à `}, [setActiveMode]);` inclus) par :

```tsx
  // Première visite sur ordinateur : l'onboarding vit dans le Conservatoire
  // (spec Conservatoire, partie 2). Appareil non desktop (#110) : ni lecture
  // ni écriture du flag, frappe directe ; le vrai onboarding apparaîtra si la
  // personne revient sur ordinateur.
  useEffect(() => {
    let cancelled = false;
    const resolveOnboarding = isNonDesktopDevice()
      ? Promise.resolve(true)
      : hasCompletedOnboarding();
    resolveOnboarding
      .then((done) => {
        if (cancelled) return;
        if (done) setOnboardingResolved(true);
        else router.push(`/${locale}/conservatoire`);
      })
      .catch(() => {
        // Fail open : jamais de redirection forcée si l'état est illisible.
        if (!cancelled) setOnboardingResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router, locale]);
```

5. `handleExitTutorial` : retirer la ligne `setIsOnboarding(false);`.
6. Supprimer le commentaire « Si l'utilisateur quitte le mode Apprentissage via la ConfigBar pendant l'onboarding… » et l'effet qui dépend de `[isOnboarding, activeMode]`.
7. Juste après `<ConfigBar controlsMode={effectiveMode} />` dans la branche `!isLearningMode` (zone 2, vers la ligne 783), ajouter :

```tsx
            {!isMobile && onboardingResolved && (
              <Link
                href={`/${locale}/conservatoire`}
                data-testid="conservatoire-nudge"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13,
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                }}
              >
                {tConservatoire('nudge')}
              </Link>
            )}
```

(Elle hérite du fondu et de `inert` de son conteneur pendant la frappe.)

8. Commentaire au-dessus de la seconde `<ConfigBar>` (branche Apprentissage) : remplacer « La ConfigBar reste visible même pendant l'onboarding : sans elle, … » par « La ConfigBar reste visible en mode Apprentissage : sans elle, le mode devient un piège sans issue de navigation. ».
9. `<LearningMode isOnboarding={isOnboarding} onExitTutorial={handleExitTutorial} />` devient `<LearningMode onExitTutorial={handleExitTutorial} />`.

`GlobalNav.tsx` : `import { Info, Keyboard, Piano, Settings, Trophy, UserCircle } from 'lucide-react';` (vérifier que `Piano` est exporté par la version installée de lucide-react ; sinon `Music`), et en tête de `NAV_ITEMS` :

```tsx
    {
      key: 'conservatoire',
      label: t('conservatoire'),
      Icon: Piano,
      path: 'conservatoire',
    },
```

`lib/onboarding.ts`, commentaire de tête :

```ts
/**
 * Détection "première visite" : un seul flag persisté (IndexedDB, via le
 * store générique user_preferences), posé à la fin de l'onboarding du
 * Conservatoire (écran 10) ou après « Passer ».
 */
```

`robots.ts` : retirer `'/*/dev-onboarding',`. `sitemap-robots.test.ts` : retirer `expect(joined).not.toMatch(/\/dev-onboarding\b/);`.

Supprimer la route : `git rm -r "apps/web/app/[locale]/dev-onboarding"`.

Vérifier qu'il ne reste aucune référence : `grep -rn "dev-onboarding\|isOnboarding\|IS_DEV_MODE" apps/web/components/typing/HomeClient.tsx apps/web/app` ne doit rien renvoyer (`isOnboarding` survit dans `LegacyLearningMode`, retiré au chantier 9 : hors de ce grep).

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm vitest run apps/web/components/__tests__/HomeClient.test.tsx apps/web/components/ui/__tests__/GlobalNav.test.tsx apps/web/app/__tests__/sitemap-robots.test.ts && pnpm typecheck && (cd apps/web && pnpm lint)`
Expected : PASS, lint sans avertissement.

- [ ] **Step 5 : Commit**

```bash
git add -A apps/web/components/typing/HomeClient.tsx apps/web/components/__tests__/HomeClient.test.tsx apps/web/components/ui/GlobalNav.tsx apps/web/components/ui/__tests__/GlobalNav.test.tsx apps/web/lib/onboarding.ts apps/web/app/robots.ts apps/web/app/__tests__/sitemap-robots.test.ts "apps/web/app/[locale]/dev-onboarding"
git commit -m "feat(conservatoire): première visite redirigée vers le Conservatoire, entrée de navigation"
```

---

### Task 11 : retirer l'ancienne porte d'accueil de l'Apprentissage

**Files :**
- Delete : `apps/web/components/modes/LearningWelcome.tsx`
- Modify : `apps/web/components/modes/CurriculumLearningMode.tsx` (imports lignes 32, 36, 59 ; état `welcomed` ligne 100 ; `Promise.all` lignes 122 à 138 ; `handleWelcomeStart` ligne 310 ; garde ligne 364)
- Modify : `apps/web/lib/learning-progress.ts` (`WELCOMED_KEY` ligne 15, `loadWelcomed` et `saveWelcomed` lignes 143 à 149)
- Modify : `apps/web/messages/fr.json`, `apps/web/messages/en.json` (bloc `learning.welcome`)
- Test : `apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`

**Interfaces :**
- Produces : `CurriculumLearningMode` ouvre directement le niveau en cours (l'accueil est désormais l'onboarding du Conservatoire).

- [ ] **Step 1 : Write the failing test**

Dans `CurriculumLearningMode.test.tsx` :
- `beforeEach` : supprimer `store.set('learning_welcomed', true);` et son commentaire.
- Describe « accueil, règle et premiers sons (#117) » : le renommer « règle et premiers sons (#117) », supprimer `const welcome = frMessages.learning.welcome;` et les deux tests « à la toute première arrivée… » et « pas d'accueil quand une progression existe déjà ». Ajouter :

```tsx
  it("à la toute première arrivée, le niveau 1 s'ouvre directement", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    expect(await screen.findByText(/pose tes index/i)).toBeInTheDocument();
  });
```

- [ ] **Step 2 : Run test to verify it fails**

Run : `pnpm vitest run apps/web/components/modes/__tests__/CurriculumLearningMode.test.tsx`
Expected : FAIL sur le nouveau test (l'accueil `LearningWelcome` s'affiche à la place du niveau 1, `learning_welcomed` n'étant plus posé).

- [ ] **Step 3 : Retirer la porte**

`CurriculumLearningMode.tsx` :
- retirer `loadWelcomed,` et `saveWelcomed,` de l'import `@/lib/learning-progress`, et `import { LearningWelcome } from './LearningWelcome';` ;
- supprimer `const [welcomed, setWelcomed] = useState(true);` ;
- dans l'effet de chargement : `const [progress, mastery, taught, celebrated] = await Promise.all([loadLearningProgress(), loadKeyMastery(), loadTaughtLevels(), getCelebratedLearningLevels()]);`, et supprimer `setWelcomed(seenWelcome || taught.length > 0);` avec son commentaire ;
- supprimer `handleWelcomeStart` et la ligne `if (!welcomed) return <LearningWelcome onStart={handleWelcomeStart} />;`.

`learning-progress.ts` : supprimer `WELCOMED_KEY`, `loadWelcomed`, `saveWelcomed`.

`fr.json` et `en.json` : supprimer le bloc `"welcome": { ... }` de `learning`.

`git rm apps/web/components/modes/LearningWelcome.tsx`.

Vérifier : `grep -rn "learning_welcomed\|loadWelcomed\|saveWelcomed\|LearningWelcome\|learning.welcome" apps/web --include='*.ts' --include='*.tsx' --include='*.json' | grep -v node_modules` ne renvoie plus que `apps/web/e2e/learning-layout.spec.ts` (traité en tâche 12).

- [ ] **Step 4 : Run tests to verify they pass**

Run : `pnpm vitest run apps/web/components/modes && pnpm typecheck && (cd apps/web && pnpm lint)`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add -A apps/web/components/modes apps/web/lib/learning-progress.ts apps/web/messages/fr.json apps/web/messages/en.json
git commit -m "refactor(apprentissage): retire l'écran d'accueil, remplacé par l'onboarding du Conservatoire"
```

---

### Task 12 : tests de rendu, gate complet et PR

**Files :**
- Create : `apps/web/e2e/helpers.ts`
- Create : `apps/web/e2e/conservatoire-onboarding.spec.ts`
- Modify : `apps/web/e2e/learning-layout.spec.ts`

**Interfaces :**
- Consumes : tout ce qui précède, sur le build de production (port 3100).
- Produces : helpers partagés `seedPreferences`, `boxOf`, `overlapArea`, `expectNoOverlap`.

- [ ] **Step 1 : Extraire les helpers**

Déplacer `seedPreferences`, le type `Box`, `boxOf`, `overlapArea` et `expectNoOverlap` de `learning-layout.spec.ts` vers `apps/web/e2e/helpers.ts`, tels quels, exportés, avec en tête `import { expect, type Locator, type Page } from '@playwright/test';`. Dans `learning-layout.spec.ts`, les importer depuis `./helpers` (le `testMatch` par défaut de Playwright ne vise que `*.spec.ts` et `*.test.ts` : `helpers.ts` n'est pas exécuté comme une spec).

- [ ] **Step 2 : Adapter l'ouverture du mode Apprentissage**

Dans `learning-layout.spec.ts`, `openLearning` :

```ts
async function openLearning(page: Page, level: number, taughtUpTo: number): Promise<void> {
  // La première visite mène à l'onboarding du Conservatoire ; on le marque
  // fait pour ouvrir directement l'espace (mode Apprentissage en intérim).
  await page.goto('/fr/conservatoire');
  await page.waitForLoadState('networkidle');
  await seedPreferences(page, {
    has_completed_onboarding: true,
    learning_curriculum_version: CURRICULUM_VERSION,
    learning_level_progress: Array.from({ length: LEVEL_COUNT }, (_, i) => ({
      levelId: i + 1,
      accuracy: 0,
      samples: 0,
      unlocked: i + 1 <= level,
    })),
    learning_taught_levels: Array.from({ length: taughtUpTo }, (_, i) => i + 1),
    learning_key_mastery: {},
  });
  await page.reload();
}
```

Supprimer le bloc « Accueil (premiere arrivee) » et sa boucle de tests en fin de fichier (remplacé par la spec de l'onboarding).

- [ ] **Step 3 : Écrire la spec de l'onboarding**

`apps/web/e2e/conservatoire-onboarding.spec.ts` :

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoOverlap } from './helpers';

/**
 * Onboarding du Conservatoire joue entierement au clavier : a chaque ecran,
 * aucune partie de Stage n'en recouvre une autre et toutes restent dans la
 * fenetre, aux deux tailles de portable visees.
 */
const VIEWPORTS = [
  { width: 1280, height: 650 },
  { width: 1024, height: 600 },
];
const SCALE = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

async function expectScreen(page: Page, title: string): Promise<void> {
  const main = page.locator('main');
  await expect(main.locator('[data-part="title"]')).toHaveText(title);
  const parts: Record<string, Locator> = {};
  for (const [i, part] of (await main.locator('[data-part]').all()).entries()) {
    parts[`${(await part.getAttribute('data-part')) ?? 'part'} ${i}`] = part;
  }
  await expectNoOverlap(parts);
  for (const part of Object.values(parts)) {
    await expect(part).toBeInViewport({ ratio: 1 });
  }
}

for (const viewport of VIEWPORTS) {
  test(`onboarding au clavier a ${viewport.width}x${viewport.height} : chaque ecran lisible, rien ne se chevauche`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/fr');
    await page.waitForURL('**/fr/conservatoire');
    const main = page.locator('main');
    const keyboard = main.locator('[data-living-keyboard]');

    await expectScreen(page, 'Ton clavier est un instrument.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Pose ton index gauche sur F.');
    await expect(main.locator('[data-target]')).toHaveAttribute('data-code', 'KeyF');
    await page.keyboard.press('KeyF');
    await expect(keyboard).toHaveAttribute('data-ripple-count', '1');

    await expectScreen(page, 'Et ton index droit sur J.');
    await page.keyboard.press('KeyJ');

    await expectScreen(page, 'Pose les six autres doigts. Joue de gauche à droite.');
    for (const code of SCALE) await page.keyboard.press(code);
    await expectScreen(page, 'Tu viens de jouer ta première gamme.');
    // Chromium sous Playwright tape en QWERTY US : la disposition est detectee
    // et le clavier se reetiquette.
    await expect(keyboard.locator('[data-code="KeyQ"] text')).toHaveText('q');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Rejoue-la sans regarder tes mains.');
    await expect(main.locator('[data-target]')).toHaveCount(0);
    for (const code of SCALE) await page.keyboard.press(code);
    await expectScreen(page, 'Tes doigts connaissent déjà le chemin.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Appuie sur K.');
    await page.keyboard.press('KeyK');
    await expectScreen(page, 'Maintenant, appuie sur une autre touche.');
    await page.keyboard.press('KeyX');
    await expectScreen(page, 'Silence. Une erreur ne joue rien.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Tes progrès restent dans ce navigateur.');
    await page.keyboard.press('KeyI');
    await expect(main.getByText('La navigation privée ne garde rien.')).toBeVisible();
    await expectScreen(page, 'Tes progrès restent dans ce navigateur.');
    await page.keyboard.press('Space');

    await expectScreen(page, 'Tu tapes déjà un peu ?');
    await page.keyboard.press('Digit1');
    await expectScreen(page, 'Combien de minutes par jour ?');
    await page.keyboard.press('Digit2');
    await expectScreen(page, "Ta première leçon t'attend.");
    await page.keyboard.press('Space');

    // L'onboarding est fini pour de bon : l'espace s'ouvre, et un rechargement
    // ne le rejoue pas.
    await expect(main.locator('[data-part="title"]')).toHaveCount(0);
    await page.reload();
    await expect(page).toHaveURL(/\/fr\/conservatoire$/);
    await expect(main.locator('[data-part="title"]')).toHaveCount(0);
  });
}

test('mouvement reduit : aucun canvas, la frappe juste repond quand meme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fr/conservatoire');
  const main = page.locator('main');
  await expect(main.locator('[data-part="title"]')).toHaveText('Ton clavier est un instrument.');
  await page.keyboard.press('Space');
  await expect(main.locator('[data-target]')).toHaveAttribute('data-code', 'KeyF');
  await expect(main.locator('canvas')).toHaveCount(0);
  await page.keyboard.press('KeyF');
  await expect(main.locator('[data-living-keyboard]')).toHaveAttribute('data-ripple-count', '1');
});
```

- [ ] **Step 4 : Lancer les tests de rendu**

Run : `pnpm build && (cd apps/web && pnpm test:e2e)`
Expected : PASS, y compris les tests existants de `learning-layout.spec.ts`. Si un écran déborde à 1024x600, corriger la mise en page (espacements de `Stage`, `maxHeight` du clavier), jamais l'assertion.

- [ ] **Step 5 : Gate complet**

Run : `pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build`
Expected : tout vert. Puis `gitleaks protect --staged` comme à la partie 1, et la recherche des tirets interdits par leurs octets UTF-8 : `grep -rnP '\xE2\x80[\x93\x94]' apps/web/components/conservatoire apps/web/lib/conservatoire apps/web/e2e apps/web/messages` ne renvoie rien.

- [ ] **Step 6 : Commit, push, PR**

```bash
git add apps/web/e2e
git commit -m "test(conservatoire): parcours complet de l'onboarding au clavier, sans chevauchement"
git fetch origin && git rebase origin/main
git push -u origin feat/conservatoire-onboarding
gh pr create --base main --title "feat(conservatoire): onboarding musical, clavier vivant et instrument (partie 2)" --body "$(cat <<'EOF'
Partie 2 du Conservatoire (#120), selon la spec docs/superpowers/specs/2026-10-08-conservatoire-v1-design.md.

## Ce que ça change
- Première visite sur ordinateur : redirection vers /conservatoire, onboarding de onze écrans joué au clavier (F, J, la gamme du repos, la gamme sans regarder, le silence d'une erreur, les données locales, deux questions, le test de placement de 30 secondes).
- Clavier vivant : seule la touche attendue en couleur, onde sur chaque frappe juste, rien sur une erreur, pas de canvas sous mouvement réduit.
- Instrument : une note par doigt, l'octave par rangée ; pitchForChar passe dessus.
- Disposition détectée (carte du navigateur, puis première touche discriminante) et enregistrée.
- Entrée Conservatoire en tête de la navigation, pastille sur l'accueil.
- Retirés : la route dev-onboarding, l'écran d'accueil de l'Apprentissage.

## En attendant les parties 3 et 4
Après l'onboarding, l'espace affiche le mode Apprentissage actuel.

## Vérification
Gate complet vert, tests de rendu Playwright de l'onboarding à 1280x650 et 1024x600.
EOF
)"
gh pr checks --watch
```

Expected : CI verte. Ne pas merger sans le feu vert de Mouwafic, après la revue (obsession-architect en mode revue, elite-ui-designer, web-design-guidelines) et sa vérification à l'oreille, sur son clavier.
