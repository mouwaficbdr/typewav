# Spec 07 — Difficulté adaptative (Axe 7)

## Principe — invisibilité totale

L'adaptation ne s'annonce jamais. L'utilisateur ne voit aucun indicateur de changement de difficulté. Si l'utilisateur remarque l'adaptation, elle est trop agressive — réduire les deltas.

## Signaux observés — fenêtre glissante 5 secondes

```typescript
interface AdaptiveSignals {
  recentWpm: number         // WPM sur les 5 dernières secondes
  recentAccuracy: number    // Accuracy sur les 5 dernières secondes
  consistency: number       // Variance WPM sur la même fenêtre
  baseline: number          // WPM médian de la session en cours
}
```

## Règles d'ajustement

```typescript
// apps/web/lib/adaptive.ts
function evaluateAdaptation(signals: AdaptiveSignals): AdaptiveAction {
  const { recentWpm, recentAccuracy, consistency, baseline } = signals

  // Flow parfait
  if (recentAccuracy > 95 && recentWpm > baseline * 1.1 && consistency > 85) {
    return { wordComplexity: +1, tempoMultiplier: 1.05 }
  }

  // Chute
  if (recentAccuracy < 80 || recentWpm < baseline * 0.8) {
    return { wordComplexity: -1, tempoMultiplier: 0.95 }
  }

  // Stagnation (> 30s sans changement)
  if (isStagnating(signals)) {
    return { introduceNewCharType: true }
  }

  return { wordComplexity: 0, tempoMultiplier: 1.0 }
}
```

## Modes de difficulté

```typescript
type DifficultyMode = 'adaptive' | 'fixed' | 'custom'

interface FixedDifficulty {
  level: 'easy' | 'normal' | 'hard' | 'expert'
  // easy: mots 3-5 lettres, pas de ponctuation
  // normal: mots 4-7 lettres, ponctuation basique
  // hard: mots 5-10 lettres, ponctuation complète
  // expert: mots longs, chiffres, ponctuation avancée
}

interface CustomDifficulty {
  wordLengthMin: number
  wordLengthMax: number
  punctuationFrequency: number    // 0-1
  numbersFrequency: number        // 0-1
  progressionRate: number         // 0-1 (vitesse d'adaptation)
}
```

**Adaptive = défaut.** Fixed recommandé pour compétitif et leaderboards.

## Tests requis

```
[ ] evaluateAdaptation — retourne +1 complexity sur flow parfait
[ ] evaluateAdaptation — retourne -1 complexity sur chute accuracy
[ ] evaluateAdaptation — aucun changement sur performance normale
[ ] Le mode Fixed ne change jamais de difficulté pendant la session
[ ] L'adaptation ne produit aucune notification visible
```
