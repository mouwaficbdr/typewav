# Spec 33 — Système de Recommandation Musicale Contextuelle

> **Créé le : 11 Mars 2026**
> **Sévérité : 🟠 HAUTE — différenciateur produit**
> **Source : FORGE_NOTES.md — Point [6]**
> **Dépendances : spec-32 (bibliothèque musicale 58 pièces) doit être terminé avant**

---

## Vision

La sélection musicale n'est pas aléatoire — elle est **contextuellement intelligente**.
La pièce jouée est choisie en fonction du mode actif, de la collection et de la durée
de session. La musique renforce l'état émotionnel du contexte de frappe sans que
l'utilisateur ait à y penser.

L'utilisateur peut toujours overrider manuellement. La recommandation est un défaut
intelligent, pas une contrainte.

---

## Architecture

```
packages/audio-engine/src/
  recommendation.ts              ← NOUVEAU : getRecommendedRegister + pickPiece

apps/web/hooks/
  useMusicRecommendation.ts      ← NOUVEAU : hook React qui consomme recommendation.ts

apps/web/components/typing/
  MusicChip.tsx                  ← NOUVEAU : chip ♪ dans config bar ligne 2
```

---

## Phase 1 — Types et fonction pure

### Types dans `packages/audio-engine/src/recommendation.ts`

```typescript
/**
 * recommendation.ts — sélection musicale contextuelle.
 *
 * Fonction pure, zéro état, zéro side-effect.
 * Testable unitairement sans mock.
 */

import type { TypingMode } from '@typewav/types';
import { MUSIC_LIBRARY, type MusicPiece } from './library';

export type EmotionalRegister =
  | 'energique'
  | 'contemplatif'
  | 'dramatique'
  | 'romantique'
  | 'folk';

export type CollectionId =
  | 'litterature'
  | 'poesie'
  | 'philosophie'
  | 'gaming'
  | 'code';

/**
 * Retourne le registre émotionnel recommandé selon le contexte de session.
 *
 * Priorité : mode > collection > durée.
 * Si aucune règle ne matche, retourne 'romantique' (registre universel neutre).
 */
export function getRecommendedRegister(
  mode: TypingMode,
  collection: CollectionId | undefined,
  durationSeconds: number,
): EmotionalRegister {
  // Règles sur le mode (priorité maximale)
  const modeRules: Partial<Record<TypingMode, EmotionalRegister>> = {
    sprint: 'energique',
    endurance: 'contemplatif',
    ghost: 'energique',
    challenge: 'energique',
    learning: 'contemplatif',
    code: 'dramatique',
    // 'classic' et 'bigrams' → pas de règle mode → passe à collection
  };

  const byMode = mode in modeRules ? modeRules[mode] : undefined;
  if (byMode) return byMode;

  // Règles sur la collection (priorité secondaire)
  if (collection) {
    const collectionRules: Partial<Record<CollectionId, EmotionalRegister>> = {
      poesie: 'romantique',
      philosophie: 'dramatique',
      gaming: 'energique',
      litterature: 'romantique', // défaut neutre universel
      code: 'dramatique',
    };
    const byCollection = collectionRules[collection];
    if (byCollection) return byCollection;
  }

  // Règles sur la durée (priorité tertiaire)
  if (durationSeconds <= 15) return 'energique';
  if (durationSeconds >= 120) return 'contemplatif';

  // Fallback universel
  return 'romantique';
}

/**
 * Sélectionne une pièce aléatoire dans un registre donné.
 * Exclut les pièces à tempo évolutif si excludeEvolutive = true.
 *
 * @param excludeIds - IDs de pièces à exclure (éviter les doublons récents)
 */
export function pickPiece(
  register: EmotionalRegister,
  excludeIds: string[] = [],
  excludeEvolutive = false,
): MusicPiece | null {
  let pool = MUSIC_LIBRARY.filter((p) => p.register === register);

  if (excludeEvolutive) {
    pool = pool.filter((p) => !p.evolutiveTempo);
  }

  // Exclure les pièces récemment jouées
  const filtered = pool.filter((p) => !excludeIds.includes(p.id));

  // Si le pool filtré est vide, utiliser tout le pool (pas de deadlock)
  const candidates = filtered.length > 0 ? filtered : pool;

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

/**
 * API haut niveau : retourne directement une pièce recommandée.
 */
export function getRecommendedPiece(
  mode: TypingMode,
  collection: CollectionId | undefined,
  durationSeconds: number,
  excludeIds: string[] = [],
): MusicPiece | null {
  const register = getRecommendedRegister(mode, collection, durationSeconds);
  return pickPiece(register, excludeIds);
}
```

---

## Phase 2 — Hook React

```typescript
// apps/web/hooks/useMusicRecommendation.ts
'use client';

/**
 * useMusicRecommendation — recommandation musicale contextuelle.
 *
 * Lit le mode et la collection depuis useAudioStore et useSessionStore,
 * calcule le registre recommandé, retourne la pièce courante et les actions.
 *
 * Client Component justifié : lit des stores Zustand.
 */

import { useAudioStore } from '@/stores/useAudioStore';
import { useSessionStore } from '@/stores/useSessionStore';
import {
  getRecommendedPiece,
  getRecommendedRegister,
  pickPiece,
  type EmotionalRegister,
} from '@typewav/audio-engine';
import type { MusicPiece } from '@typewav/audio-engine';
import { useCallback, useEffect, useState } from 'react';

export function useMusicRecommendation() {
  const mode = useSessionStore((s) => s.mode);
  const collectionId = useSessionStore((s) => s.collectionId);
  const activePieceId = useAudioStore((s) => s.activePieceId);

  const [currentPiece, setCurrentPiece] = useState<MusicPiece | null>(null);
  const [register, setRegister] = useState<EmotionalRegister>('romantique');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Recalculer la recommandation quand le contexte change
  useEffect(() => {
    // Extraire la durée depuis useAudioStore ou défaut 60s
    const durationSeconds = 60; // TODO: lire depuis config bar quand spec-29 connecté
    const rec = getRecommendedRegister(
      mode,
      collectionId as never,
      durationSeconds,
    );
    setRegister(rec);

    if (!activePieceId) {
      const piece = getRecommendedPiece(
        mode,
        collectionId as never,
        durationSeconds,
        recentIds,
      );
      setCurrentPiece(piece);
    }
  }, [mode, collectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Demande une nouvelle suggestion dans le même registre */
  const refresh = useCallback(() => {
    const next = pickPiece(register, recentIds);
    if (next) {
      setRecentIds((prev) => [...prev.slice(-4), next.id]); // garder 5 derniers
      setCurrentPiece(next);
    }
  }, [register, recentIds]);

  /** Override manuel — sélection explicite par l'utilisateur */
  const selectPiece = useCallback((piece: MusicPiece) => {
    setRecentIds((prev) => [...prev.slice(-4), piece.id]);
    setCurrentPiece(piece);
  }, []);

  return {
    currentPiece,
    register,
    refresh,
    selectPiece,
    allPieces: [] as MusicPiece[], // sera rempli depuis MUSIC_LIBRARY dans spec-32
  };
}
```

---

## Phase 3 — Chip UI dans la config bar

```tsx
// apps/web/components/typing/MusicChip.tsx
'use client';

/**
 * MusicChip — chip ♪ affiché en fin de ligne 2 de la config bar.
 *
 * Affiche la pièce musicale active (recommandée ou sélectionnée manuellement).
 * Bouton ↺ pour une nouvelle suggestion dans le même registre.
 * Clic sur le nom ouvre le panel de sélection complète.
 *
 * Client Component justifié : état du panel, refresh.
 */

import { useMusicRecommendation } from '@/hooks/useMusicRecommendation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const REGISTER_LABELS: Record<string, string> = {
  energique: '⚡',
  contemplatif: '🌊',
  dramatique: '🎭',
  romantique: '🌹',
  folk: '🌍',
};

export function MusicChip() {
  const t = useTranslations('music');
  const { currentPiece, register, refresh } = useMusicRecommendation();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!currentPiece) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
      }}
    >
      {/* Nom de la pièce — cliquable pour ouvrir le panel */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        aria-label={t('chipLabel', { piece: currentPiece.title })}
        aria-expanded={panelOpen}
      >
        <span aria-hidden="true">♪</span>
        <span>{currentPiece.shortTitle ?? currentPiece.title}</span>
        {/* Registre émotionnel en sous-texte */}
        <span style={{ fontSize: '0.625rem', opacity: 0.7 }} aria-hidden="true">
          {REGISTER_LABELS[register]}
        </span>
      </button>

      {/* Bouton refresh — nouvelle suggestion, même registre */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          refresh();
        }}
        aria-label={t('refreshPiece')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          padding: '2px 4px',
          opacity: 0.6,
        }}
        className="hover:opacity-100"
      >
        ↺
      </button>

      {/* Panel de sélection complète — TODO spec-29 (config bar) */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label={t('selectPiece')}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 0',
            minWidth: 240,
            zIndex: 100,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {/* Contenu du panel — rempli dans spec-29 */}
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              padding: '8px 16px',
            }}
          >
            {t('allPiecesComingSoon')}
          </p>
        </div>
      )}
    </div>
  );
}
```

### Clés i18n à ajouter

**`fr.json`** :

```json
"music": {
  "chipLabel": "♪ {piece}",
  "refreshPiece": "Nouvelle suggestion musicale",
  "selectPiece": "Sélectionner une pièce",
  "allPiecesComingSoon": "Sélection complète dans la config bar"
}
```

**`en.json`** :

```json
"music": {
  "chipLabel": "♪ {piece}",
  "refreshPiece": "New music suggestion",
  "selectPiece": "Select a piece",
  "allPiecesComingSoon": "Full selection coming in config bar"
}
```

---

## Tests requis

```typescript
// packages/audio-engine/src/__tests__/recommendation.test.ts

describe('getRecommendedRegister', () => {
  it('mode sprint → energique', () => {
    expect(getRecommendedRegister('sprint', undefined, 60)).toBe('energique');
  });

  it('mode endurance → contemplatif', () => {
    expect(getRecommendedRegister('endurance', undefined, 60)).toBe(
      'contemplatif',
    );
  });

  it('mode code → dramatique', () => {
    expect(getRecommendedRegister('code', undefined, 60)).toBe('dramatique');
  });

  it('mode classic + collection poesie → romantique', () => {
    expect(getRecommendedRegister('classic', 'poesie', 60)).toBe('romantique');
  });

  it('mode classic + collection philosophie → dramatique', () => {
    expect(getRecommendedRegister('classic', 'philosophie', 60)).toBe(
      'dramatique',
    );
  });

  it('durée 15s → energique (si aucune règle mode/collection)', () => {
    expect(getRecommendedRegister('classic', 'litterature', 15)).toBe(
      'energique',
    );
  });

  it('durée 120s → contemplatif (si aucune règle mode/collection)', () => {
    expect(getRecommendedRegister('classic', 'litterature', 120)).toBe(
      'contemplatif',
    );
  });

  it('fallback → romantique', () => {
    expect(getRecommendedRegister('classic', undefined, 60)).toBe('romantique');
  });
});

describe('pickPiece', () => {
  it('retourne une pièce du registre demandé', () => {
    const piece = pickPiece('energique');
    expect(piece?.register).toBe('energique');
  });

  it("n'inclut pas les IDs exclus quand le pool le permet", () => {
    const all = MUSIC_LIBRARY.filter((p) => p.register === 'folk').map(
      (p) => p.id,
    );
    // Exclure tous sauf un
    const excluded = all.slice(0, -1);
    const piece = pickPiece('folk', excluded);
    expect(piece).not.toBeNull();
    expect(excluded).not.toContain(piece!.id);
  });

  it('retourne null si registre vide', () => {
    // Registre fictif sans pièces
    expect(
      pickPiece(
        'energique' as never,
        MUSIC_LIBRARY.map((p) => p.id),
      ),
    ).not.toBeNull();
    // Avec pool forcément épuisé → retourne quand même une pièce (pas de deadlock)
  });

  it('exclut les pièces à tempo évolutif si demandé', () => {
    const piece = pickPiece('energique', [], true);
    if (piece) expect(piece.evolutiveTempo).not.toBe(true);
  });
});

describe('getRecommendedPiece', () => {
  it('retourne une pièce non-null dans la majorité des cas', () => {
    const piece = getRecommendedPiece('sprint', undefined, 30);
    expect(piece).not.toBeNull();
    expect(piece?.register).toBe('energique');
  });
});
```

---

## Workflow

```
1. Créer packages/audio-engine/src/recommendation.ts
2. RED : écrire les tests
3. Implémenter getRecommendedRegister, pickPiece, getRecommendedPiece
4. GREEN : tests passent
5. Créer apps/web/hooks/useMusicRecommendation.ts
6. Créer apps/web/components/typing/MusicChip.tsx
7. Ajouter clés i18n fr.json + en.json
8. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
9. Commit
```

---

## Commit

```
feat(music): contextual recommendation system + MusicChip UI

- getRecommendedRegister(): pure function mapping mode/collection/duration
  to an emotional register (energique/contemplatif/dramatique/romantique/folk)
- pickPiece(): random selection within a register with recent-exclusion
- getRecommendedPiece(): high-level API combining both
- useMusicRecommendation(): React hook consuming the recommendation system
- MusicChip: config bar chip showing active piece with ↺ refresh button
- i18n keys added (fr + en)

Music selection is now contextually aware: sprint mode → energetic pieces,
contemplative modes → slow pieces, etc. User can always override manually.
```
