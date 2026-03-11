# Spec 28 — Soundpack Cleanup + Fix InstrumentType 'strings' (F-1)

> **Créé le : 11 Mars 2026**
> **Sévérité : 🔴 CRITIQUE (TypeScript error) + 🟠 HAUTE (dead code)**
> **Source : FORGE_NOTES.md — Points [4.1] [4.4] [4.5] + Bug F-1**
> **Dépendances : Aucune — peut être fait en Wave 0**

---

## Contexte

### Bug F-1 — InstrumentType 'strings' manquant

`packages/soundpacks/src/cinematic/soundpack.config.ts` déclare `instrument: 'strings'`.
Le type union `InstrumentType` dans `packages/types/src/soundpack.ts` ne contient pas `'strings'`.

Ce bug passe inaperçu aujourd'hui grâce à un mode de compilation laxe mais explose dès
qu'on active `noEmit: false` ou mode strict complet. `pnpm typecheck` échoue à cause de ça.

**Valeurs actuelles de InstrumentType :**

```typescript
export type InstrumentType =
  | 'piano'
  | 'marimba'
  | 'synth'
  | 'chiptune'
  | 'cinematic' // ← c'est l'ID du pack, pas un type d'instrument — confusion de sémantique
  | 'phonk' // ← idem
  | 'jazz-piano'; // ← idem
```

Note : la confusion existe parce que l'InstrumentType mélange des vrais types d'instruments
(piano, marimba, synth, chiptune) et des IDs de packs (cinematic, phonk, jazz-piano). La
correction ci-dessous normalise ça.

### FORGE [4.1] — 3 packs supprimés

Packs à retirer : **Marimba**, **Chiptune**, **Phonk**.

Packs conservés : **Piano** (gratuit), **Synth Lo-Fi** (gratuit), **Cinematic** (premium), **Jazz Piano** (premium).

### FORGE [4.4] — Code mort dans SoundPackConfig

`SoundPackConfig` contient `baseUrl`, `fileExtension`, `notes` — propriétés jamais lues
par le moteur audio (`useAudioEngine.ts` a ses propres `PACK_CONFIGS` internes).
Ces propriétés sont du code mort depuis la V1. À supprimer pour clarifier l'interface.

---

## État actuel

### `packages/types/src/soundpack.ts` (état actuel)

```typescript
export type InstrumentType =
  | 'piano'
  | 'marimba'
  | 'synth'
  | 'chiptune'
  | 'cinematic'
  | 'phonk'
  | 'jazz-piano';

export interface SoundPackConfig {
  id: string;
  name: string;
  instrument: InstrumentType;
  description: string;
  isPremium: boolean;
  baseUrl: string; // ← MORT — jamais lu par useAudioEngine
  fileExtension: 'mp3' | 'ogg' | 'wav'; // ← MORT
  notes: Record<string, string>; // ← MORT
  reverbWet: number;
  attackTime: number;
  releaseTime: number;
}
```

### `packages/soundpacks/src/index.ts` (état actuel)

```typescript
export { chiptunePack } from './chiptune/soundpack.config';
export { cinematicPack } from './cinematic/soundpack.config';
export { jazzPianoPack } from './jazz-piano/soundpack.config';
export { marimbaPack } from './marimba/soundpack.config';
export { phonkPack } from './phonk/soundpack.config';
export { pianoPack } from './piano/soundpack.config';
export { synthLofiPack } from './synth-lofi/soundpack.config';

export const ALL_SOUND_PACKS = [
  'piano',
  'marimba',
  'synth-lofi',
  'chiptune',
] as const;
export const PREMIUM_SOUND_PACKS = [
  'cinematic',
  'phonk',
  'jazz-piano',
] as const;
export type SoundPackId = (typeof ALL_SOUND_PACKS)[number];
export type PremiumSoundPackId = (typeof PREMIUM_SOUND_PACKS)[number];
```

### `apps/web/hooks/useAudioEngine.ts` — PACK_CONFIGS (état actuel)

Contient 7 configs : piano, marimba, synth-lofi, chiptune, cinematic, phonk, jazz-piano.

---

## Solution

### Fichiers à modifier

```
packages/types/src/soundpack.ts                    ← Fix InstrumentType + clean SoundPackConfig
packages/soundpacks/src/index.ts                   ← Retirer marimba, chiptune, phonk
packages/soundpacks/src/cinematic/soundpack.config.ts ← Fix instrument: 'strings'
packages/soundpacks/src/piano/soundpack.config.ts  ← Retirer champs morts
packages/soundpacks/src/synth-lofi/soundpack.config.ts ← Retirer champs morts
packages/soundpacks/src/jazz-piano/soundpack.config.ts ← Retirer champs morts
apps/web/hooks/useAudioEngine.ts                   ← Retirer marimba, chiptune, phonk de PACK_CONFIGS
```

Fichiers à supprimer (git rm) :

```
packages/soundpacks/src/marimba/soundpack.config.ts
packages/soundpacks/src/chiptune/soundpack.config.ts
packages/soundpacks/src/phonk/soundpack.config.ts
```

Fichiers UI à vérifier (sélecteur de pack) :

```
apps/web/components/   ← grep 'marimba\|chiptune\|phonk' pour trouver les références UI
apps/web/stores/       ← useAudioStore.ts potentiellement
```

---

## Implémentation

### 1. `packages/types/src/soundpack.ts` — Après

```typescript
/**
 * Type d'instrument Tone.js utilisé pour la synthèse audio.
 * Représente le caractère sonore du pack, pas l'ID du pack.
 */
export type InstrumentType =
  | 'piano' // oscillateur triangle, son arrondi
  | 'strings' // oscillateur sawtooth avec reverb élevé — cordes orchestrales
  | 'synth' // oscillateur sawtooth — lo-fi, analogique
  | 'chiptune'; // oscillateur square — 8-bit (conservé pour forward-compat)

/**
 * Configuration d'un sound pack.
 * Contient uniquement les paramètres consommés par useAudioEngine.
 * Les propriétés baseUrl/fileExtension/notes (futures samples .mp3) ont
 * été retirées — jamais branchées dans le moteur actuel (Tone.js synthèse pure).
 */
export interface SoundPackConfig {
  id: string;
  name: string;
  /** Nom affiché sous l'icône ♪ dans la config bar */
  displayName: string;
  description: string;
  isPremium: boolean;
  instrument: InstrumentType;
  /** Niveau de reverb dry/wet (0–1) */
  reverbWet: number;
  /** Temps d'attaque en secondes */
  attackTime: number;
  /** Temps de release en secondes */
  releaseTime: number;
}
```

### 2. `packages/soundpacks/src/index.ts` — Après

```typescript
export { cinematicPack } from './cinematic/soundpack.config';
export { jazzPianoPack } from './jazz-piano/soundpack.config';
export { pianoPack } from './piano/soundpack.config';
export { synthLofiPack } from './synth-lofi/soundpack.config';

export const ALL_SOUND_PACKS = ['piano', 'synth-lofi'] as const;
export const PREMIUM_SOUND_PACKS = ['cinematic', 'jazz-piano'] as const;
export type SoundPackId = (typeof ALL_SOUND_PACKS)[number];
export type PremiumSoundPackId = (typeof PREMIUM_SOUND_PACKS)[number];
export type AnyPackId = SoundPackId | PremiumSoundPackId;
```

### 3. `packages/soundpacks/src/cinematic/soundpack.config.ts` — Après

```typescript
import type { SoundPackConfig } from '@typewav/types';

export const cinematicPack: SoundPackConfig = {
  id: 'cinematic',
  name: 'Cinematic',
  displayName: 'Cinematic',
  description: 'Cordes orchestrales et piano — épique et immersif.',
  isPremium: true,
  instrument: 'strings', // ← désormais valide (Fix F-1)
  reverbWet: 0.45,
  attackTime: 0.08,
  releaseTime: 2.0,
};
```

### 4. Pack configs propres — pattern (piano, synth-lofi, jazz-piano)

Retirer `baseUrl`, `fileExtension`, `notes`. Ajouter `displayName`. Exemple pour piano :

```typescript
export const pianoPack: SoundPackConfig = {
  id: 'piano',
  name: 'Grand Piano',
  displayName: 'Piano',
  description: 'Piano acoustique — le son par défaut, chaud et équilibré.',
  isPremium: false,
  instrument: 'piano',
  reverbWet: 0.25,
  attackTime: 0.005,
  releaseTime: 1.2,
};
```

### 5. `apps/web/hooks/useAudioEngine.ts` — Retirer marimba, chiptune, phonk

```typescript
// AVANT (7 configurations)
const PACK_CONFIGS: Record<string, PackSynthConfig> = {
  piano: { ... },
  marimba: { ... },      // ← RETIRER
  'synth-lofi': { ... },
  chiptune: { ... },     // ← RETIRER
  cinematic: { ... },
  phonk: { ... },        // ← RETIRER
  'jazz-piano': { ... },
};

// APRÈS (4 configurations)
const PACK_CONFIGS: Record<string, PackSynthConfig> = {
  piano: {
    oscillatorType: 'triangle',
    attack: 0.005,
    decay: 0.3,
    sustain: 0.4,
    release: 1.2,
    reverbWet: 0.25,
    noteDuration: '16n',
  },
  'synth-lofi': {
    oscillatorType: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.5,
    release: 0.8,
    reverbWet: 0.35,
    noteDuration: '16n',
  },
  cinematic: {
    oscillatorType: 'sawtooth',
    attack: 0.08,
    decay: 0.5,
    sustain: 0.7,
    release: 2.0,
    reverbWet: 0.45,
    noteDuration: '8n',
  },
  'jazz-piano': {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.4,
    sustain: 0.3,
    release: 1.5,
    reverbWet: 0.28,
    noteDuration: '16n',
  },
};
```

Mettre à jour le commentaire JSDoc ligne 12-13 :

```typescript
// Packs supportés : piano | synth-lofi | cinematic | jazz-piano
```

### 6. Grep et nettoyage UI

Chercher toutes les références aux packs supprimés dans l'UI :

```bash
grep -r "marimba\|chiptune\|phonk" apps/web/ --include="*.tsx" --include="*.ts" -l
```

Pour chaque fichier trouvé : retirer les entrées correspondantes du sélecteur de packs.

---

## Tests requis

```typescript
// packages/soundpacks/src/__tests__/index.test.ts

describe('soundpacks — index', () => {
  it('ALL_SOUND_PACKS contient exactement piano et synth-lofi', () => {
    expect(ALL_SOUND_PACKS).toEqual(['piano', 'synth-lofi']);
  });

  it('PREMIUM_SOUND_PACKS contient exactement cinematic et jazz-piano', () => {
    expect(PREMIUM_SOUND_PACKS).toEqual(['cinematic', 'jazz-piano']);
  });

  it('cinematicPack.instrument est strings', () => {
    expect(cinematicPack.instrument).toBe('strings');
  });

  it('aucun pack ne référence baseUrl (code mort supprimé)', () => {
    const packs = [pianoPack, synthLofiPack, cinematicPack, jazzPianoPack];
    for (const pack of packs) {
      expect((pack as Record<string, unknown>).baseUrl).toBeUndefined();
    }
  });
});

// packages/types/src/__tests__/soundpack.test.ts
describe('InstrumentType — strings est valide', () => {
  it('strings est assignable à InstrumentType', () => {
    const t: InstrumentType = 'strings'; // doit compiler
    expect(t).toBe('strings');
  });
});
```

---

## Workflow

```
1. RED : écrire les tests (ils échouent — 'strings' absent du type)
2. Modifier packages/types/src/soundpack.ts (InstrumentType + SoundPackConfig)
3. Modifier packages/soundpacks/src/cinematic/soundpack.config.ts
4. Modifier packages/soundpacks/src/piano/soundpack.config.ts
5. Modifier packages/soundpacks/src/synth-lofi/soundpack.config.ts
6. Modifier packages/soundpacks/src/jazz-piano/soundpack.config.ts
7. Modifier packages/soundpacks/src/index.ts (retirer marimba/chiptune/phonk)
8. git rm packages/soundpacks/src/marimba/soundpack.config.ts
9. git rm packages/soundpacks/src/chiptune/soundpack.config.ts
10. git rm packages/soundpacks/src/phonk/soundpack.config.ts
11. Modifier apps/web/hooks/useAudioEngine.ts (retirer PACK_CONFIGS marimba/chiptune/phonk)
12. Grep et nettoyer les refs UI
13. GREEN : tests passent
14. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
15. Commit
```

---

## Commit

```
fix(soundpacks): remove deprecated packs, fix InstrumentType, clean dead code

- Add 'strings' to InstrumentType (fixes F-1 TypeScript error in cinematic pack)
- Remove marimba, chiptune, phonk from ALL_SOUND_PACKS, PREMIUM_SOUND_PACKS,
  useAudioEngine PACK_CONFIGS, and soundpacks/src/index.ts exports
- Remove dead properties from SoundPackConfig: baseUrl, fileExtension, notes
  were never consumed by the Tone.js audio engine (purely synthesized, no .mp3)
- Add displayName field to SoundPackConfig for UI rendering
- Clean all pack config files accordingly

Active packs: piano (free), synth-lofi (free), cinematic (premium), jazz-piano (premium)
Resolves FORGE F-1
```
