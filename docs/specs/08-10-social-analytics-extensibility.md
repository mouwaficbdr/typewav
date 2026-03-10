# Spec 08 — Social layer réinventé (Axe 8)

## Philosophie

Pas de graph social, pas de follow, pas de feed. Des **moments de connexion ponctuels**.

## Features

### Replay partageable

```typescript
// apps/web/lib/replay.ts
interface ReplayData {
  sessionId: string
  text: string
  keystrokeTimings: number[]    // ms entre chaque frappe
  wpm: number
  accuracy: number
  theme: string
  soundPack: string
}

// Génération côté client — canvas recording ou lien partageable
// La musique est régénérée depuis les timings lors de la lecture
async function generateReplayLink(data: ReplayData): Promise<string>
async function recordReplayVideo(data: ReplayData): Promise<Blob>  // Phase 3
```

### Challenge direct

```typescript
// URL : /challenge?text={base64}&duration={ms}&mode={mode}
// Pas de serveur — tout dans l'URL (max 2048 chars)
// Comparaison de scores côté client

interface ChallengeParams {
  textHash: string      // hash du texte — même texte garanti
  duration: number
  mode: TypingMode
  creatorWpm?: number   // WPM du créateur (optionnel, pour afficher "battre X WPM")
}
```

### Ghost mode

```typescript
// Stocké dans IndexedDB — personal_records
// Un curseur fantôme avance au rythme du record personnel
// Implémenté dans TypingArea — prop ghostTimings?: number[]
```

### Leaderboards contextuels

```typescript
// Pour Phase 3 — nécessite un pseudonyme local (pas de compte)
// Hebdomadaires, réinitialisés chaque lundi 00:00 UTC
// Stockés dans Supabase (table publique, sans auth)
// Par collection + mode + langue

interface LeaderboardEntry {
  pseudo: string
  wpm: number
  accuracy: number
  achievedAt: number
  collectionId: string
  mode: TypingMode
  week: string    // 'YYYY-WW'
}
```

## Ce qui est exclu — Phase 1-3

```
❌ Follow / abonnements
❌ Feed d'activité
❌ Notifications push
❌ Mode multijoueur temps réel
❌ Chat ou messagerie
```

## Tests requis

```
[ ] generateReplayLink — produit une URL valide décodable
[ ] ChallengeParams — encodage/décodage URL round-trip
[ ] Ghost mode — cursor avance au bon timing
[ ] Leaderboard — n'accepte que des pseudonymes (pas d'emails)
```

---

# Spec 09 — Profil & analytics long terme (Axe 9)

## Dashboard — route `/profil`

Server Component pour le shell, Client Components pour les graphes Recharts.

## Composants analytics

### `WpmProgressChart`

```typescript
// Recharts 3.8.0 — LineChart
// Données : sessions groupées par jour, médiane WPM
// Filtres : 7j / 30j / 90j
// Courbe de tendance : régression linéaire simple
```

### `ContributionHeatmap`

```typescript
// Inspiré du heatmap GitHub contributions
// 90 derniers jours — nombre de sessions par jour
// Couleur : #1A1A2E → #00A882 → #00D4AA selon intensité
```

### `PersonalRecords`

```typescript
interface PersonalRecords {
  maxWpm: { value: number; sessionId: string; achievedAt: number }
  maxAccuracy: { value: number; sessionId: string; achievedAt: number }
  maxConsistency: { value: number; sessionId: string; achievedAt: number }
  longestSession: { duration: number; sessionId: string; achievedAt: number }
  byCollection: Record<string, { wpm: number; achievedAt: number }>
}
```

### Résumé hebdomadaire

```typescript
// Généré le lundi, stocké en cache IndexedDB
interface WeeklySummary {
  weekStart: number
  sessionsCount: number
  avgWpm: number
  wpmDelta: number          // vs semaine précédente
  bestDay: string           // 'Mercredi'
  mostImprovedBigram: string
}
```

### Détection de plateau

```typescript
// Si WPM médian stable sur 14 sessions consécutives (delta < 2 WPM)
// Afficher banner avec recommandation spécifique
// Stocker dans IndexedDB pour ne pas réafficher dans la même semaine
function detectPlateau(sessions: SessionResult[]): PlateauInfo | null
```

## Tests requis

```
[ ] calculateWeeklyStats — calculs corrects sur données réelles
[ ] detectPlateau — détecte plateau sur 14 sessions stables
[ ] detectPlateau — ne détecte pas de plateau si amélioration > 2 WPM
[ ] PersonalRecords — mis à jour correctement après chaque session
[ ] WpmProgressChart — render sans erreur avec 0 sessions
```

---

# Spec 10 — Extensibilité & écosystème open source (Axe 10)

## Architecture de plugins

Toutes les contributions sont des modules TypeScript typés, indépendants du core.

## CLI de scaffolding

```bash
# tools/cli/ — package autonome publishé sur npm
npx create-typewav-theme mon-theme
npx create-typewav-soundpack mon-pack
npx create-typewav-collection ma-collection
```

Génère la structure correcte avec types importés depuis `@typewav/types`.

## Processus de validation PR

Critères obligatoires pour merge :
```
Thèmes     : contraste WCAG AA min, tokens complets, preview screenshot
Packs      : samples libres de droits, format .mp3 ou .ogg, < 2MB total
Collections: textes domaine public avec source vérifiable, min 20 entrées
```

## Fichiers de contribution requis

```
CONTRIBUTING.md           # Processus complet
docs/create-theme.md      # Guide pas-à-pas thème
docs/create-soundpack.md  # Guide audio Tone.js
docs/create-collection.md # Critères textes, format JSON
ROADMAP.md                # Features planifiées, axes ouverts
```

## Licence

```
Usage personnel     : MIT (libre, attribution appréciée)
Contributions OSS   : MIT (attribution auteur dans galerie)
Usage commercial    : Licence commerciale — contacter l'auteur
```

## Tests requis

```
[ ] ThemeConfig — validation TypeScript complète (zod schema)
[ ] SoundPackConfig — validation des champs obligatoires
[ ] CollectionConfig — au moins 20 TextEntry, langue valide
[ ] CLI create-theme — génère des fichiers valides et compilables
```
