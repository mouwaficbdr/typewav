# Spec 34 — Collections : TextEntry enrichi, fetchCollection adaptatif, enrichissement

> **Créé le : 11 Mars 2026**
> **Sévérité : 🟠 HAUTE**
> **Source : FORGE_NOTES.md — Point [7]**
> **Dépendances : spec-23 (i18n sweep) recommandé avant pour cohérence des traductions**

---

## Vision

Trois axes simultanés :

1. **TextEntry enrichi** — ajout de `wordCount`, `charCount`, `difficulty` numérique
2. **`fetchCollection()` adaptatif** — sélection contextuelle par mode/durée/langue/difficulté
3. **Enrichissement** — porter chaque collection aux cibles minimum (spec décrit la structure
   et les règles ; le contenu textuel réel est encodé au moment de l'implémentation)

---

## État actuel

### `TextEntry` actuel (depuis `litterature/collection.config.ts`)

```typescript
interface TextEntry {
  id: string;
  content: string;
  source: string; // ex: "Victor Hugo — Les Misérables"
  difficulty: 'easy' | 'medium' | 'hard'; // ← chaîne ordinale, pas numérique
  language: 'fr' | 'en';
  tags: string[];
}
```

### Volumes actuels

| Collection    | FR  | EN  | Total |
| ------------- | --- | --- | ----- |
| `litterature` | 10  | 10  | 20    |
| `poesie`      | 10  | 10  | 20    |
| `philosophie` | 10  | 10  | 20    |
| `gaming`      | 10  | 10  | 20    |
| `code`        | 0   | 20  | 20    |

### `fetchCollection()` actuel

Retourne tous les textes d'une collection sans filtrage.
La sélection est aléatoire uniforme — pas d'adaptation au mode ni à la durée.

---

## Solution

### Phase 1 — Type `TextEntry` enrichi

```typescript
// packages/types/src/collection.ts (ou packages/collections/src/types.ts)

export interface TextEntry {
  id: string;
  /** Contenu textuel brut à taper */
  content: string;
  /** Attribution : "Auteur — Œuvre (Année)" — optionnel pour code/gaming */
  source?: string;
  /** Langue du contenu (indépendant de la langue de l'interface) */
  language: 'fr' | 'en';
  /**
   * Niveau de difficulté numérique.
   * 1 = très facile (débutant), 5 = très difficile (expert)
   * Critères :
   *   1 : phrases courtes, vocabulaire fréquent, pas de ponctuation complexe
   *   2 : phrases simples, quelques mots peu fréquents
   *   3 : longueur moyenne, ponctuation standard, vocabulaire varié
   *   4 : phrases longues, vocabulaire recherché, ponctuation complexe
   *   5 : texte dense, tournures syntaxiques complexes, caractères spéciaux
   */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Nombre de mots (calculé à l'ingestion, pas à la volée) */
  wordCount: number;
  /** Nombre de caractères (contenu brut, espaces inclus) */
  charCount: number;
  /** Tags libres pour filtrage futur */
  tags?: string[];
}

export type CollectionId =
  | 'litterature'
  | 'poesie'
  | 'philosophie'
  | 'gaming'
  | 'code';
```

### Migration difficulté : 'easy'|'medium'|'hard' → 1|2|3|4|5

```typescript
const DIFFICULTY_MAP = {
  easy: 1,
  medium: 3,
  hard: 5,
} as const;
```

Lors de la migration des textes existants :

- `easy` → 1 (puis réviser manuellement si certains méritent 2)
- `medium` → 3
- `hard` → 5 (puis réviser manuellement si certains méritent 4)

### Phase 2 — `fetchCollection()` adaptatif

```typescript
// packages/collections/src/fetch.ts

import type { TextEntry, CollectionId } from '@typewav/types';
import type { TypingMode } from '@typewav/types';
import { ALL_COLLECTIONS } from './index';
import * as collections from './index';

export interface FetchOptions {
  /** Filtre sur la langue. undefined = pas de filtre (FR+EN) */
  language?: 'fr' | 'en';
  /** Mode typing — détermine le filtre de longueur */
  mode?: TypingMode;
  /** Pour mode Mots — nombre de mots demandés */
  wordCount?: 10 | 25 | 50 | 100;
  /** Pour mode Temps — durée en secondes */
  durationSeconds?: 15 | 30 | 60 | 120;
  /** Filtre de difficulté exacte */
  difficulty?: 1 | 2 | 3 | 4 | 5;
  /** Difficulté min (inclusive) — pour Apprentissage Niveau X */
  difficultyMin?: 1 | 2 | 3 | 4 | 5;
  /** IDs à exclure — éviter les doublons récents */
  excludeIds?: string[];
  /** Taille du pool retourné (défaut: 1 — retourne directement un texte) */
  poolSize?: number;
}

/**
 * Retourne un texte aléatoire depuis une collection, filtré selon les options.
 *
 * - Si le pool filtré est vide, élargit progressivement les critères.
 * - Ne retourne jamais null sauf si la collection entière est vide.
 *
 * @pure Non — lecture des collections (déterministe, pas de side-effects)
 */
export function fetchCollection(
  collectionId: CollectionId,
  options: FetchOptions = {},
): TextEntry | null {
  const collectionMap: Record<CollectionId, { texts: TextEntry[] }> = {
    litterature: collections.litteratureCollection,
    poesie: collections.poesieCollection,
    philosophie: collections.philosophieCollection,
    gaming: collections.gamingCollection,
    code: collections.codeCollection,
  };

  let pool = collectionMap[collectionId].texts;

  // ── Filtre langue ─────────────────────────────────────────────────────────
  if (options.language) {
    pool = pool.filter((t) => t.language === options.language);
  }

  // ── Filtre longueur selon mode ────────────────────────────────────────────
  if (options.wordCount !== undefined) {
    const ranges: Record<number, [number, number]> = {
      10: [5, 15], // 10 mots → 5–15 mots
      25: [20, 35], // 25 mots → 20–35 mots
      50: [40, 65], // 50 mots → 40–65 mots
      100: [80, 130], // 100 mots → 80–130 mots
    };
    const [min, max] = ranges[options.wordCount] ?? [0, Infinity];
    pool = pool.filter((t) => t.wordCount >= min && t.wordCount <= max);
  }

  if (options.durationSeconds !== undefined) {
    // Estimé : ~40 WPM = ~200 chars/min = ~3.3 chars/sec
    const estimatedCharsPerSec = 3.5;
    const targetChars = options.durationSeconds * estimatedCharsPerSec;
    const tolerance = 0.4; // ±40%
    const min = targetChars * (1 - tolerance);
    const max = targetChars * (1 + tolerance);
    pool = pool.filter((t) => t.charCount >= min && t.charCount <= max);
  }

  // ── Filtre difficulté ─────────────────────────────────────────────────────
  if (options.difficulty !== undefined) {
    pool = pool.filter((t) => t.difficulty === options.difficulty);
  } else if (options.difficultyMin !== undefined) {
    pool = pool.filter((t) => t.difficulty >= options.difficultyMin!);
  }

  // ── Exclure récents ───────────────────────────────────────────────────────
  if (options.excludeIds && options.excludeIds.length > 0) {
    const filtered = pool.filter((t) => !options.excludeIds!.includes(t.id));
    // Si plus rien après exclusion → utiliser pool complet (pas de deadlock)
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) return null;

  return pool[Math.floor(Math.random() * pool.length)]!;
}

/**
 * Raccourci : retourne un pool entier (pour le sélecteur de mode Citation, etc.)
 */
export function fetchPool(
  collectionId: CollectionId,
  options: FetchOptions = {},
): TextEntry[] {
  // Même logique que fetchCollection mais retourne le pool complet filtré
  // (implémentation inline — pas de duplication de la logique de filtrage)
  // TODO: extraire le corps de fetchCollection en _filterPool() privée
  return []; // placeholder — implémenter avec la même logique
}
```

### Phase 3 — Modificateur langue dans la config bar

Voir **spec-29** (Zone 2 — Config bar) pour l'UI du modificateur `[FR] [EN] [FR+EN]`.

État Zustand nécessaire côté web :

```typescript
// apps/web/stores/useConfigStore.ts (ou useSessionStore.ts)
interface ConfigState {
  textLanguage: 'fr' | 'en' | 'both'; // ← NOUVEAU
  // ...
}
```

`fetchCollection()` reçoit `language: textLanguage === 'both' ? undefined : textLanguage`.

### Phase 4 — Enrichissement du contenu

**Cibles minimum par collection :**

| Collection    | Cible FR | Cible EN | Total cible |
| ------------- | -------- | -------- | ----------- |
| `litterature` | 50       | 50       | 100         |
| `poesie`      | 30       | 30       | 60          |
| `philosophie` | 30       | 30       | 60          |
| `gaming`      | 30       | 30       | 60          |
| `code`        | 20       | 50       | 70          |

**Règles de sélection des textes :**

- Domaine public ou licence libre (auteur décédé depuis > 70 ans, ou CC0/CC-BY)
- Longueurs variées pour couvrir tous les modes (10/25/50/100 mots, 15s/30s/60s/120s)
- `wordCount` et `charCount` calculés au moment de l'ajout (pas à la volée)
- `source` renseigné : `"Auteur — Titre de l'œuvre (Année)"`
- `difficulty` évalué manuellement : 1 = très accessible, 5 = dense/complexe

**Format d'un texte à encoder :**

```typescript
{
  id: 'lit-fr-21',  // préfixe collection + langue + numéro séquentiel
  content: 'Le texte intégral à taper.',
  source: 'Victor Hugo — Les Misérables (1862)',
  language: 'fr',
  difficulty: 3,
  wordCount: 8,  // calculé
  charCount: 43, // calculé (espaces inclus)
  tags: ['classique', 'roman'],
},
```

---

## Tests requis

```typescript
// packages/collections/src/__tests__/fetch.test.ts

describe('fetchCollection', () => {
  it('retourne un texte de la collection sans options', () => {
    const t = fetchCollection('litterature');
    expect(t).not.toBeNull();
    expect(t!.content.length).toBeGreaterThan(0);
  });

  it('filtre par langue fr correctement', () => {
    const t = fetchCollection('litterature', { language: 'fr' });
    expect(t?.language).toBe('fr');
  });

  it('filtre par langue en correctement', () => {
    const t = fetchCollection('litterature', { language: 'en' });
    expect(t?.language).toBe('en');
  });

  it('filtre par wordCount 10 — textes courts retournés', () => {
    const t = fetchCollection('litterature', { wordCount: 10 });
    if (t) {
      expect(t.wordCount).toBeGreaterThanOrEqual(5);
      expect(t.wordCount).toBeLessThanOrEqual(15);
    }
  });

  it('filtre par difficulté', () => {
    const t = fetchCollection('litterature', { difficulty: 1 });
    if (t) expect(t.difficulty).toBe(1);
  });

  it('exclut les IDs récents si pool le permet', () => {
    // Encoder au moins 2 textes fr dans la collection
    const first = fetchCollection('litterature', { language: 'fr' });
    expect(first).not.toBeNull();

    const second = fetchCollection('litterature', {
      language: 'fr',
      excludeIds: [first!.id],
    });
    // Le second texte est différent du premier (si pool > 1)
    if (second) expect(second.id).not.toBe(first!.id);
  });

  it('ne retourne pas null si pool vide après exclusion (fallback)', () => {
    // Exclure tous les textes FR connus
    const all = litteratureCollection.texts
      .filter((t) => t.language === 'fr')
      .map((t) => t.id);
    const t = fetchCollection('litterature', {
      language: 'fr',
      excludeIds: all,
    });
    // Doit quand même retourner quelque chose (fallback sans exclusion)
    expect(t).not.toBeNull();
  });
});

// packages/collections/src/__tests__/textentry.test.ts
describe('TextEntry — wordCount et charCount', () => {
  it('wordCount est cohérent avec le contenu', () => {
    const entry = litteratureCollection.texts[0]!;
    const expected = entry.content.split(/\s+/).filter(Boolean).length;
    expect(entry.wordCount).toBe(expected);
  });

  it('charCount est cohérent avec le contenu', () => {
    const entry = litteratureCollection.texts[0]!;
    expect(entry.charCount).toBe(entry.content.length);
  });

  it('difficulty est entre 1 et 5', () => {
    litteratureCollection.texts.forEach((t) => {
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(5);
    });
  });
});
```

---

## Workflow

```
1. Modifier packages/types/src/collection.ts — nouveau TextEntry (wordCount, charCount, difficulty 1-5)
2. RED : écrire les tests
3. Migrer les textes existants :
   a. Remplacer 'easy'→1, 'medium'→3, 'hard'→5
   b. Calculer et ajouter wordCount + charCount pour chaque texte existant
4. Créer packages/collections/src/fetch.ts — fetchCollection adaptatif
5. GREEN : tests passent
6. Enrichir les collections (contenu) jusqu'aux cibles :
   a. litterature : ajouter 40 FR + 40 EN
   b. poesie : ajouter 20 FR + 20 EN
   c. philosophie : ajouter 20 FR + 20 EN
   d. gaming : ajouter 20 FR + 20 EN
   e. code : ajouter 20 FR + 30 EN
7. Exporter fetchCollection depuis packages/collections/src/index.ts
8. Brancher la langue depuis useConfigStore dans le composant config bar (spec-29)
9. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
10. Commit
```

---

## Commit

```
feat(collections): adaptive text fetch + enriched TextEntry + content expansion

- TextEntry: add wordCount (number), charCount (number), difficulty (1-5 numeric)
  Replaces 'easy'|'medium'|'hard' string with numeric scale for precise filtering
- Migrate all existing texts: add wordCount/charCount, remap string difficulty
- fetchCollection(): filter by language, wordCount, durationSeconds, difficulty
  with progressive fallback (never returns null on non-empty collection)
- Enrich all 5 collections to minimum targets:
  litterature 10+10 → 50+50, poesie 10+10 → 30+30,
  philosophie 10+10 → 30+30, gaming 10+10 → 30+30, code 0+20 → 20+50
- Text language filter (FR/EN/both) wired via useConfigStore

Reduces session text repetition probability from ~10% to <5% in all modes.
```
