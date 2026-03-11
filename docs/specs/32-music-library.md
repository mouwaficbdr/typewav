# Spec 32 — Bibliothèque Musicale Unifiée (58 Pièces)

> **Créé le : 11 Mars 2026**
> **Sévérité : 🔵 VISION — différenciateur produit majeur**
> **Source : FORGE_NOTES.md — Points [5.1] à [5.6]**
> **Dépendances : spec-28 (soundpack cleanup) — les types doivent être propres**

---

## Vision

Supprimer la séparation entre mode "génératif pentatonique" et mode "Classiques".
**Chaque session joue une vraie composition musicale**, note par note, en avançant dans
la mélodie à chaque keystroke correct.

La bibliothèque passe de 8 pièces à **58 pièces**, organisées en 5 registres émotionnels.

---

## Architecture

```
packages/audio-engine/src/
  library.ts           ← NOUVEAU : type MusicPiece + MUSIC_LIBRARY (58 pièces)
  pieces/              ← NOUVEAU : 1 fichier par pièce (notes[][], shortTitle, register...)
    fur-elise.ts       ← existant (à migrer depuis audio-engine actuel)
    bwv846.ts          ← existant
    gymnopedie1.ts     ← existant
    korobeiniki.ts     ← existant
    ode-to-joy.ts      ← existant
    nocturne-op9-2.ts  ← existant
    rondo-alla-turca.ts ← existant
    canon-in-d.ts      ← existant
    eine-kleine-nachtmusik.ts     ← NOUVEAU
    symphony-40-theme.ts          ← NOUVEAU
    toccata-fugue.ts              ← NOUVEAU
    hungarian-dance-5.ts          ← NOUVEAU
    mountain-king.ts              ← NOUVEAU (⚠️ evolutiveTempo)
    maple-leaf-rag.ts             ← NOUVEAU
    the-entertainer.ts            ← NOUVEAU
    flight-of-bumblebee.ts        ← NOUVEAU (💀 extremeLevel)
    danse-macabre.ts              ← NOUVEAU
    can-can.ts                    ← NOUVEAU
    night-on-bald-mountain.ts     ← NOUVEAU
    kalinka.ts                    ← NOUVEAU (⚠️ evolutiveTempo)
    when-saints-go-marching.ts    ← NOUVEAU
    moonlight-sonata.ts           ← NOUVEAU
    clair-de-lune.ts              ← NOUVEAU
    arabesque-1.ts                ← NOUVEAU
    gymnopedie2.ts                ← NOUVEAU
    pavane-infante-defunte.ts     ← NOUVEAU
    traumerei.ts                  ← NOUVEAU
    new-world-largo.ts            ← NOUVEAU
    nimrod.ts                     ← NOUVEAU
    air-g-string.ts               ← NOUVEAU
    raindrop-prelude.ts           ← NOUVEAU
    scarborough-fair.ts           ← NOUVEAU
    sakura-sakura.ts              ← NOUVEAU
    lacrimosa.ts                  ← NOUVEAU
    symphony-5-theme.ts           ← NOUVEAU
    ballade-1.ts                  ← NOUVEAU
    sarabande.ts                  ← NOUVEAU
    promenade.ts                  ← NOUVEAU
    scheherazade.ts               ← NOUVEAU
    polovtsian-dances.ts          ← NOUVEAU
    habanera.ts                   ← NOUVEAU
    liebestraum-3.ts              ← NOUVEAU
    hungarian-rhapsody-2.ts       ← NOUVEAU (⚠️ evolutiveTempo)
    la-campanella.ts              ← NOUVEAU (💀 extremeLevel)
    swan-lake.ts                  ← NOUVEAU
    dance-sugar-plum.ts           ← NOUVEAU
    morning-mood.ts               ← NOUVEAU
    sicilienne.ts                 ← NOUVEAU
    waltz-a-minor.ts              ← NOUVEAU
    ave-maria.ts                  ← NOUVEAU
    greensleeves.ts               ← NOUVEAU
    danny-boy.ts                  ← NOUVEAU
    bella-ciao.ts                 ← NOUVEAU
    drunken-sailor.ts             ← NOUVEAU
    la-folia.ts                   ← NOUVEAU
    simple-gifts.ts               ← NOUVEAU
    amazing-grace.ts              ← NOUVEAU
    shenandoah.ts                 ← NOUVEAU
```

---

## Type `MusicPiece`

```typescript
// packages/audio-engine/src/library.ts

export type EmotionalRegister =
  | 'energique'
  | 'contemplatif'
  | 'dramatique'
  | 'romantique'
  | 'folk';

export interface MusicPiece {
  /** Identifiant unique kebab-case — correspond au nom de fichier dans pieces/ */
  id: string;
  /** Titre complet */
  title: string;
  /** Titre court pour affichage chip (max 20 caractères) */
  shortTitle: string;
  /** Compositeur ou "Traditionnel" */
  composer: string;
  /** Registre émotionnel — utilisé par la recommandation contextuelle */
  register: EmotionalRegister;
  /**
   * Séquence de notes Tone.js.
   * Note : string = note name (ex: 'E5', 'Eb5').
   * 'rest' = silence, null = fin de séquence.
   * Tableau de tableaux = polyphonie (accords) — jouer simultanément.
   */
  notes: Array<string | 'rest'>;
  /**
   * Durées correspondant à chaque note (notation Tone.js : '4n', '8n', etc.)
   * Si absent, utiliser la durée par défaut du pack sonore actif.
   */
  durations?: Array<string>;
  /** true si le tempo change au cours de la pièce — nécessite un support spécial */
  evolutiveTempo?: boolean;
  /** true si la densité de notes est extrême — afficher un badge de difficulté */
  extremeLevel?: boolean;
  /** Numéro de la pièce dans le catalogue (1–58) */
  catalogNumber: number;
}
```

---

## Conventions d'encodage

### Règles d'encodage des notes

1. **Transposition** : Toutes les pièces sont transposées dans un registre médium-aigu
   (C3–C6) adapté à la gamme pentatonique du moteur audio. L'objectif est la reconnaissance
   mélodique, pas la fidélité harmonique exacte.

2. **Simplification** : Les ornements (trilles, mordants) sont supprimés. La mélodie
   principale est conservée. Les accords complexes sont réduits à la note la plus haute.

3. **Durées** : Utiliser la notation Tone.js : `'1n'` (ronde), `'2n'` (blanche),
   `'4n'` (noire), `'8n'` (croche), `'16n'` (double croche). Les pointées : `'4n.'`.

4. **Longueur** : Encoder un extrait de 32–64 notes (environ 30–45 secondes à rythme
   normal). Les pièces très longues : encoder le thème principal uniquement, en boucle.

5. **Format de fichier** :
   ```typescript
   // packages/audio-engine/src/pieces/example.ts
   export const notes: Array<string | 'rest'> = [
     'E5',
     'Eb5',
     'E5',
     'Eb5',
     'E5',
     'B4',
     'D5',
     'C5',
     // ...
   ];
   export const durations: string[] = [
     '8n',
     '8n',
     '8n',
     '8n',
     '8n',
     '8n',
     '8n',
     '8n',
     // ...
   ];
   ```

---

## Catalogue complet — 58 pièces

### ⚡ Énergique / Vif (13 pièces)

| #   | ID                        | Titre                            | Compositeur             | Flag |
| --- | ------------------------- | -------------------------------- | ----------------------- | ---- |
| 9   | `eine-kleine-nachtmusik`  | Eine Kleine Nachtmusik (1er mvt) | Mozart (†1791)          |      |
| 10  | `symphony-40-theme`       | Symphony No.40 (1er mvt, thème)  | Mozart (†1791)          |      |
| 11  | `toccata-fugue`           | Toccata & Fugue en Ré mineur     | Bach (†1750)            |      |
| 12  | `hungarian-dance-5`       | Hungarian Dance No.5             | Brahms (†1897)          |      |
| 13  | `mountain-king`           | In the Hall of the Mountain King | Grieg (†1907)           | ⚠️   |
| 14  | `maple-leaf-rag`          | Maple Leaf Rag                   | Scott Joplin (†1917)    |      |
| 15  | `the-entertainer`         | The Entertainer                  | Scott Joplin (†1917)    |      |
| 16  | `flight-of-bumblebee`     | Flight of the Bumblebee          | Rimsky-Korsakov (†1908) | 💀   |
| 17  | `danse-macabre`           | Danse Macabre                    | Saint-Saëns (†1921)     |      |
| 18  | `can-can`                 | Can-Can (galop final)            | Offenbach (†1880)       |      |
| 19  | `night-on-bald-mountain`  | Night on Bald Mountain           | Moussorgski (†1881)     |      |
| 20  | `kalinka`                 | Kalinka                          | Ivan Larionov (†1889)   | ⚠️   |
| 21  | `when-saints-go-marching` | When the Saints Go Marching In   | Traditionnel Gospel     |      |

### 🌊 Contemplatif / Lent (12 pièces — inclut pièces existantes)

| #   | ID                       | Titre                               | Compositeur           | Flag        |
| --- | ------------------------ | ----------------------------------- | --------------------- | ----------- |
| 3   | `gymnopedie1`            | Gymnopédie No.1                     | Satie (†1925)         | ✅ existant |
| 22  | `moonlight-sonata`       | Moonlight Sonata (1er mvt, Adagio)  | Beethoven (†1827)     |             |
| 23  | `clair-de-lune`          | Clair de Lune (thème A)             | Debussy (†1918)       |             |
| 24  | `arabesque-1`            | Arabesque No.1                      | Debussy (†1918)       |             |
| 25  | `gymnopedie2`            | Gymnopédie No.2                     | Satie (†1925)         |             |
| 26  | `pavane-infante-defunte` | Pavane pour une infante défunte     | Ravel (†1937)         |             |
| 27  | `traumerei`              | Träumerei                           | Schumann (†1856)      |             |
| 28  | `new-world-largo`        | New World Symphony — Largo          | Dvořák (†1904)        |             |
| 29  | `nimrod`                 | Nimrod (Enigma Variations, Var. IX) | Elgar (†1934)         |             |
| 30  | `air-g-string`           | Air on the G String (BWV 1068)      | Bach (†1750)          |             |
| 31  | `raindrop-prelude`       | Raindrop Prelude (Op.28 No.15)      | Chopin (†1849)        |             |
| 32  | `scarborough-fair`       | Scarborough Fair                    | Traditionnel anglais  |             |
| 33  | `sakura-sakura`          | Sakura Sakura                       | Traditionnel japonais |             |

### 🎭 Dramatique / Solennel (8 pièces)

| #   | ID                  | Titre                                 | Compositeur             | Flag |
| --- | ------------------- | ------------------------------------- | ----------------------- | ---- |
| 34  | `lacrimosa`         | Lacrimosa (Requiem K.626)             | Mozart (†1791)          |      |
| 35  | `symphony-5-theme`  | Symphony No.5 (1er mvt)               | Beethoven (†1827)       |      |
| 36  | `ballade-1`         | Ballade No.1 en Sol mineur            | Chopin (†1849)          |      |
| 37  | `sarabande`         | Sarabande en Ré mineur                | Handel (†1759)          |      |
| 38  | `promenade`         | Promenade (Tableaux d'une exposition) | Moussorgski (†1881)     |      |
| 39  | `scheherazade`      | Scheherazade Op.35 (1er mvt)          | Rimsky-Korsakov (†1908) |      |
| 40  | `polovtsian-dances` | Danses Polovtsiennes (thème lyrique)  | Borodin (†1887)         |      |
| 41  | `habanera`          | Habanera (Carmen, 1er acte)           | Bizet (†1875)           |      |

### 🌹 Romantique / Lyrique (13 pièces — inclut pièces existantes)

| #   | ID                     | Titre                                | Compositeur         | Flag        |
| --- | ---------------------- | ------------------------------------ | ------------------- | ----------- |
| 1   | `fur-elise`            | Für Elise                            | Beethoven (†1827)   | ✅ existant |
| 2   | `bwv846`               | Prélude BWV 846                      | Bach (†1750)        | ✅ existant |
| 6   | `nocturne-op9-2`       | Nocturne Op.9 No.2                   | Chopin (†1849)      | ✅ existant |
| 8   | `canon-in-d`           | Canon in D                           | Pachelbel (†1706)   | ✅ existant |
| 42  | `liebestraum-3`        | Liebestraum No.3                     | Liszt (†1886)       |             |
| 43  | `hungarian-rhapsody-2` | Hungarian Rhapsody No.2 (Lassan)     | Liszt (†1886)       | ⚠️          |
| 44  | `la-campanella`        | La Campanella                        | Liszt (†1886)       | 💀          |
| 45  | `swan-lake`            | Lac des Cygnes — Thème du cygne      | Tchaïkovski (†1893) |             |
| 46  | `dance-sugar-plum`     | Danse de la Fée Dragée               | Tchaïkovski (†1893) |             |
| 47  | `morning-mood`         | Morning Mood (Peer Gynt, Suite No.1) | Grieg (†1907)       |             |
| 48  | `sicilienne`           | Sicilienne Op.78                     | Fauré (†1924)       |             |
| 49  | `waltz-a-minor`        | Waltz in A minor (B.150)             | Chopin (†1849)      |             |
| 50  | `ave-maria`            | Ave Maria                            | Schubert (†1828)    |             |

### 🌍 Folk / Traditionnel / World (12 pièces — inclut pièces existantes)

| #   | ID                 | Titre                       | Compositeur             | Flag        |
| --- | ------------------ | --------------------------- | ----------------------- | ----------- |
| 4   | `korobeiniki`      | Korobeiniki (Tetris)        | Traditionnel russe      | ✅ existant |
| 5   | `ode-to-joy`       | Ode to Joy                  | Beethoven (†1827)       | ✅ existant |
| 7   | `rondo-alla-turca` | Rondo alla Turca            | Mozart (†1791)          | ✅ existant |
| 51  | `greensleeves`     | Greensleeves                | Traditionnel anglais    |             |
| 52  | `danny-boy`        | Danny Boy (Londonderry Air) | Traditionnel irlandais  |             |
| 53  | `bella-ciao`       | Bella Ciao                  | Traditionnel italien    |             |
| 54  | `drunken-sailor`   | Drunken Sailor              | Traditionnel (shanty)   |             |
| 55  | `la-folia`         | La Folia (Op.5 No.12)       | Corelli (†1713)         |             |
| 56  | `simple-gifts`     | Simple Gifts                | Joseph Brackett (†1882) |             |
| 57  | `amazing-grace`    | Amazing Grace               | Traditionnel (hymne)    |             |
| 58  | `shenandoah`       | Shenandoah                  | Traditionnel américain  |             |

**Légende** : ⚠️ tempo évolutif (implémenter après les pièces fixes) · 💀 niveau extrême · ✅ existant

---

## `MUSIC_LIBRARY` — structure dans `library.ts`

```typescript
// packages/audio-engine/src/library.ts

import {
  notes as furEliseNotes,
  durations as furEliseDurations,
} from './pieces/fur-elise';
// ... autres imports

export const MUSIC_LIBRARY: MusicPiece[] = [
  {
    id: 'fur-elise',
    title: 'Für Elise',
    shortTitle: 'Für Elise',
    composer: 'Beethoven',
    register: 'romantique',
    catalogNumber: 1,
    notes: furEliseNotes,
    durations: furEliseDurations,
  },
  // ... 57 autres entrées
];

/** Accès par ID — O(1) */
export const MUSIC_LIBRARY_MAP = new Map(MUSIC_LIBRARY.map((p) => [p.id, p]));

export type { MusicPiece, EmotionalRegister };
```

---

## Migration des pièces existantes

Les 8 pièces actuelles sont dans `packages/audio-engine/src/pentatonic.ts` ou équivalent.
Avant d'encoder les nouvelles, migrer les 8 existantes vers le nouveau format :

```bash
# Vérifier l'emplacement actuel des séquences MIDI
grep -r "fur-elise\|bwv846\|gymnopedie\|korobeiniki" packages/audio-engine/src/ -l
```

---

## Flags d'implémentation — plan de travail

### Ordre d'encodage recommandé

1. **Phase A** (critique, débloquent le reste) : Migrer les 8 pièces existantes
2. **Phase B** (populaires, reconnaissance immédiate) : Moonlight Sonata, Clair de Lune,
   Eine Kleine Nachtmusik, Symphony No.5, Swan Lake, Ode to Joy (déjà présent)
3. **Phase C** (compléter les registres) : Toutes les autres pièces à tempo fixe
4. **Phase D** (tempo évolutif, en dernier) : Mountain King, Kalinka, Hungarian Rhapsody No.2

### Pièces ⚠️ tempo évolutif — traitement spécial

Ces 3 pièces nécessitent le support de `tempo variable` dans le séquenceur. Option :

- Encoder uniquement l'introduction à tempo fixe pour l'instant
- Marquer `evolutiveTempo: true` mais ne pas l'activer en production tant que non supporté
- Ne pas inclure dans la recommandation par défaut (`pickPiece(..., excludeEvolutive: true)`)

### Pièces 💀 niveau extrême

Flight of the Bumblebee et La Campanella ont une densité de notes extrêmement élevée.
Encoder normalement mais afficher un badge de difficulté dans le sélecteur UI.

---

## Tests requis

```typescript
// packages/audio-engine/src/__tests__/library.test.ts

describe('MUSIC_LIBRARY', () => {
  it('contient exactement 58 pièces', () => {
    expect(MUSIC_LIBRARY).toHaveLength(58);
  });

  it('tous les IDs sont uniques', () => {
    const ids = MUSIC_LIBRARY.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les catalogNumbers sont uniques et entre 1 et 58', () => {
    const numbers = MUSIC_LIBRARY.map((p) => p.catalogNumber);
    expect(new Set(numbers).size).toBe(58);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(58);
    });
  });

  it('tous les registres sont valides', () => {
    const validRegisters = [
      'energique',
      'contemplatif',
      'dramatique',
      'romantique',
      'folk',
    ];
    MUSIC_LIBRARY.forEach((p) => {
      expect(validRegisters).toContain(p.register);
    });
  });

  it('chaque pièce a au moins 16 notes', () => {
    MUSIC_LIBRARY.forEach((p) => {
      expect(p.notes.length).toBeGreaterThanOrEqual(16);
    });
  });

  it('les 8 pièces existantes sont toujours présentes', () => {
    const existing = [
      'fur-elise',
      'bwv846',
      'gymnopedie1',
      'korobeiniki',
      'ode-to-joy',
      'nocturne-op9-2',
      'rondo-alla-turca',
      'canon-in-d',
    ];
    existing.forEach((id) => {
      expect(MUSIC_LIBRARY_MAP.has(id)).toBe(true);
    });
  });

  it('MUSIC_LIBRARY_MAP contient toutes les pièces', () => {
    expect(MUSIC_LIBRARY_MAP.size).toBe(58);
  });
});
```

---

## Workflow

```
1. Vérifier l'emplacement actuel des 8 séquences existantes dans audio-engine
2. Créer packages/audio-engine/src/library.ts (type + MUSIC_LIBRARY vide)
3. Créer packages/audio-engine/src/pieces/ (répertoire)
4. RED : écrire les tests library.test.ts
5. Phase A — migrer les 8 pièces existantes
6. Vérifier que les 8 pièces existantes passent les tests
7. Phase B — encoder les 8 pièces populaires (Moonlight, Clair de Lune...)
8. Phase C — compléter avec les pièces à tempo fixe restantes (40 pièces)
9. Phase D — pièces à tempo évolutif (3 pièces — marquer evolutiveTempo: true)
10. GREEN : tous les tests passent (58 pièces)
11. Mettre à jour les exports de packages/audio-engine/src/index.ts
12. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
13. Commit
```

---

## Commit

```
feat(audio): unified music library with 58 public-domain pieces

- Add MusicPiece type with id, title, composer, register, notes[], durations[]
- Add EmotionalRegister type: energique/contemplatif/dramatique/romantique/folk
- MUSIC_LIBRARY: 58 pieces across 5 emotional registers (all public domain)
- MUSIC_LIBRARY_MAP: O(1) lookup by piece ID
- Migrate existing 8 pieces (Für Elise, BWV 846, Gymnopédie 1, Korobeiniki,
  Ode to Joy, Nocturne Op.9 No.2, Rondo alla Turca, Canon in D) to new format
- Encode 50 new pieces covering Energique/Contemplatif/Dramatique/Romantique/Folk
- Flag evolutiveTempo (3 pieces) and extremeLevel (2 pieces)

Every session now has a musically curated soundtrack by default.
Zero network requests — all sequences are hardcoded arrays.
```
