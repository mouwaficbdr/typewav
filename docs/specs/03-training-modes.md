# Spec 03 — Modes d'entraînement ciblés (Axe 3)

## Modes disponibles

```typescript
type TypingMode =
  | 'classic'          // Mots aléatoires — équivalent MonkeyType
  | 'learning'         // Apprentissage Home Row — débutants
  | 'bigrams'          // Bigrams ciblés depuis diagnostic
  | 'code'             // Snippets de code réel
  | 'numbers'          // Chiffres et ponctuation
  | 'sprint'           // 10 mots, le plus vite possible
  | 'endurance'        // Session longue — analyse dégradation
  | 'custom'           // Texte personnel
  | 'classics'         // Mode MIDI — pièces classiques
```

## Mode Apprentissage — détail complet

Implémenté dans `apps/web/components/modes/LearningMode.tsx`.

### Niveaux

```typescript
interface LearningLevel {
  id: number
  name: string
  keys: string[]          // Touches autorisées à ce niveau
  minAccuracy: number     // Seuil pour débloquer le niveau suivant
  minSamples: number      // Frappes minimum avant évaluation
}

const LEVELS: LearningLevel[] = [
  { id: 1, name: 'Home Row', keys: ['a','s','d','f','j','k','l',';'], minAccuracy: 90, minSamples: 50 },
  { id: 2, name: 'Top Row', keys: [...level1.keys, 'q','w','e','r','t','y','u','i','o','p'], minAccuracy: 85, minSamples: 80 },
  { id: 3, name: 'Bottom Row', keys: [...level2.keys, 'z','x','c','v','b','n','m'], minAccuracy: 85, minSamples: 80 },
  { id: 4, name: 'Real Words', keys: 'all-lowercase', minAccuracy: 80, minSamples: 100 },
  { id: 5, name: 'Shift & Punctuation', keys: 'all', minAccuracy: 80, minSamples: 100 },
]
```

### Schéma clavier interactif

Composant SVG `KeyboardDiagram` — s'illumine sur la touche active.  
Affiche la main et le doigt recommandé pour chaque touche.

### Musique adaptée débutant

Aucun tempo imposé — les notes jouent au rythme de l'utilisateur.  
Même à 5 WPM, ça sonne harmonieusement.

## Mode Code

Collections dans `packages/collections/code/`.  
Snippets extraits de projets open source MIT.

```typescript
type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'rust' | 'go' | 'sql'
```

## Mode Texte Personnel

```typescript
// Stocké dans IndexedDB — store 'personal_texts'
interface PersonalText {
  id: string
  title: string
  content: string
  createdAt: number
  lastUsed: number
  isFavorite: boolean
}
```

Pas de validation éditoriale — 100% privé.  
Moteur A+C appliqué automatiquement.

## Tests requis

```
[ ] LearningMode — progression débloquée seulement si seuil atteint
[ ] LearningMode — niveau inférieur non accesible une fois débloqué
[ ] Code mode — affiche bien le langage sélectionné
[ ] Custom mode — sauvegarde et charge depuis IndexedDB
[ ] sprint mode — termine après exactement 10 mots
```
