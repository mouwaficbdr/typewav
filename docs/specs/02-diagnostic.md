# Spec 02 — Diagnostic intelligent post-test (Axe 2)

## Philosophie

MonkeyType mesure. TypeWav prescrit. La page de résultats est un compte-rendu actionnable.

## Métriques collectées par session

```typescript
interface SessionResult {
  id: string                        // uuid généré côté client
  timestamp: number                 // Date.now()
  wpm: number                       // WPM brut
  wpmNet: number                    // WPM net (pénalité erreurs)
  accuracy: number                  // Pourcentage
  consistency: number               // Écart-type WPM sur fenêtres 5s
  duration: number                  // ms
  mode: TypingMode
  theme: string
  collection?: string
  keystrokeData: KeystrokeEntry[]   // Timestamps par touche
}

interface KeystrokeEntry {
  char: string
  timestamp: number
  correct: boolean
  timeFromPrevious: number          // ms depuis frappe précédente
}
```

## Calculs — `apps/web/lib/stats.ts`

```typescript
// WPM : (caractères / 5) / minutes
calculateWPM(keystrokes, durationMs)

// Accuracy : (frappes correctes / total) * 100
calculateAccuracy(keystrokes)

// Consistency : 100 - (écart-type WPM / moyenne WPM * 100)
calculateConsistency(keystrokes, windowSizeMs = 5000)

// Bigrams les plus lents : top 5 enchaînements avec avg > médiane
detectBigramSlowdowns(keystrokes): BigramStats[]

// Pattern de dégradation : WPM première moitié vs deuxième moitié
detectFatigue(keystrokes, durationMs): FatiguePattern

// Recommandation textuelle générée algorithmiquement
generateRecommendation(session: SessionResult): string
```

## Visualisations post-test

### Heatmap clavier SVG

Composant `KeyboardHeatmap` dans `apps/web/components/diagnostic/`.  
Layouts : AZERTY (défaut) et QWERTY (selon `user_preferences`).  
Gradient : vert `#00D4AA` → orange `#FF8C00` → rouge `#FF4444`.  
Basé sur `timeFromPrevious` médian par touche sur la session.

### Graphe Recharts — WPM dans le temps

```typescript
// Composant ConsistencyChart
// Recharts 3.8.0 — LineChart avec données de fenêtres glissantes 5s
// Identification automatique des segments de chute (AreaChart rouge)
```

### Recommandation textuelle

```
Template : "Tes transitions vers {lettre} sont {X}% plus lentes 
que ta moyenne. Entraîne-toi sur ces bigrams : {b1}, {b2}, {b3}."

→ Bouton direct vers Mode Bigrams pré-configuré avec ces bigrams.
```

## Stockage IndexedDB

```typescript
// lib/db.ts — stores
'sessions'        // SessionResult complet
'keystroke_stats' // Agrégats par touche/bigram (mis à jour après chaque session)
```

## Tests requis

```
[ ] calculateWPM — cas normaux, cas limites (durée 0, aucune frappe)
[ ] calculateAccuracy — 100%, 0%, valeurs intermédiaires
[ ] calculateConsistency — session régulière vs irrégulière
[ ] detectBigramSlowdowns — retourne les 5 plus lents, triés
[ ] detectFatigue — détecte correctement la chute en 2ème moitié
[ ] generateRecommendation — retourne une string non vide toujours
[ ] saveSession / getSessions — round-trip IndexedDB complet
```
