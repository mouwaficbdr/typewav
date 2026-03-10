# Spec 05 — Progression narrative (Axe 5)

## Système de rangs

```typescript
// packages/types/src/progression.ts
export type RankTier = 'novice' | 'apprentice' | 'operator' | 'architect' | 'ghost'

export interface Rank {
  tier: RankTier
  label: string           // FR: "Fantôme" / EN: "Ghost"
  minWpm: number          // WPM médian sur 10 dernières sessions
  accentColor: string
}

export const RANKS: Record<RankTier, Rank> = {
  novice:     { tier: 'novice',     label: 'Novice',      minWpm: 0,  accentColor: '#888888' },
  apprentice: { tier: 'apprentice', label: 'Apprenti',    minWpm: 31, accentColor: '#4A9EFF' },
  operator:   { tier: 'operator',   label: 'Opérateur',   minWpm: 51, accentColor: '#00A896' },
  architect:  { tier: 'architect',  label: 'Architecte',  minWpm: 71, accentColor: '#00D4AA' },
  ghost:      { tier: 'ghost',      label: 'Fantôme',     minWpm: 91, accentColor: '#FFD700' },
}
```

Le rang est calculé sur la **médiane des 10 dernières sessions**, pas sur le meilleur score.

## Jalons débloquables

```typescript
export interface Milestone {
  id: string
  condition: MilestoneCondition
  reward: Reward
  labelFr: string
  labelEn: string
}

type Reward =
  | { type: 'soundpack'; packId: string }
  | { type: 'theme'; themeId: string }
  | { type: 'collection'; collectionId: string }
  | { type: 'accent'; color: string }
```

Stockés dans IndexedDB `user_profile.unlockables`.  
Vérifiés après chaque session dans `apps/web/hooks/useProgressionCheck.ts`.

## Saisons — statut

**Non implémentées au lancement.** Apparaissent dans ROADMAP.md comme "Coming soon".  
Déclencher uniquement quand Phase 4 (monétisation) est stable.

## Tests requis

```
[ ] calculateRank — retourne le bon rang selon WPM médian 10 sessions
[ ] checkMilestones — détecte et retourne les jalons nouvellement débloqués
[ ] unlockReward — sauvegarde dans IndexedDB correctement
[ ] Le rang or (#FFD700) n'apparaît qu'à 90 WPM médian
```
