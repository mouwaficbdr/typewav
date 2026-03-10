# Workflow de développement TypeWav

> Lire et appliquer rigoureusement avant toute implémentation.
> Ce workflow est non négociable — chaque étape a une raison d'être.

## Philosophie

**Spec-Driven Development.** On ne code pas ce qui n'est pas spécifié.  
**TDD.** Le test rouge avant la première ligne de code.  
**Commits atomiques.** Un commit = une feature complète et testée.  
**Plan Mode first.** Pour toute tâche impliquant plus de 3 fichiers, planifier avant d'implémenter.

---

## Cycle de développement par feature

### Étape 1 — Lire la spec

```
AVANT D'ÉCRIRE UNE SEULE LIGNE DE CODE :
1. Lire le fichier de spec correspondant dans docs/specs/
2. Identifier les interfaces TypeScript nécessaires dans packages/types/
3. Identifier les dépendances entre features
4. Vérifier que la spec ne contredit pas une décision dans docs/ARCHITECTURE.md
```

### Étape 2 — Planifier (Plan Mode)

Pour toute tâche impliquant plus de 3 fichiers, produire un plan écrit :

```markdown
## Plan : [Nom de la feature]

### Fichiers à créer

- [ ] packages/types/src/xxx.ts
- [ ] packages/audio-engine/src/xxx.ts
- [ ] apps/web/components/xxx.tsx

### Fichiers à modifier

- [ ] packages/types/src/index.ts (re-export)

### Tests à écrire

- [ ] packages/audio-engine/src/**tests**/xxx.test.ts

### Ordre d'implémentation

1. Types → 2. Logique pure → 3. Hooks → 4. Composants → 5. Tests E2E
```

### Étape 3 — Types en premier

**Toujours commencer par définir les interfaces TypeScript** dans `packages/types/`.  
Jamais de types inline dans les composants, jamais de `any`.

```typescript
// packages/types/src/session.ts — exemple
export interface SessionResult {
  id: string;
  timestamp: number;
  wpm: number;
  accuracy: number;
  consistency: number;
  duration: number;
  mode: TypingMode;
  theme: string;
  collection?: string;
  keystrokeData: KeystrokeEntry[];
}
```

### Étape 4 — Écrire les tests (RED)

**TDD strict.** Le test doit échouer avant d'écrire l'implémentation.

```bash
pnpm test --watch  # Lancer en mode watch pendant le développement
```

Structure des fichiers de test :

```
packages/audio-engine/src/__tests__/pentatonic.test.ts
apps/web/components/__tests__/TypingArea.test.tsx
apps/web/hooks/__tests__/useSession.test.ts
```

### Étape 5 — Implémenter (GREEN)

Écrire le minimum de code pour faire passer les tests.  
Suivre l'ordre : **Logique pure → Hooks → Composants**.

```
Logique pure (packages/) :
  - Fonctions sans état, facilement testables
  - Pas d'imports React, pas de hooks

Custom hooks (apps/web/hooks/) :
  - Orchestrent la logique pure avec l'état React/Zustand
  - Testés avec Vitest

Composants (apps/web/components/) :
  - UI uniquement — la logique est dans les hooks
  - Props typées, aucun any
```

### Étape 6 — Refactoriser (REFACTOR)

Nettoyer sans casser les tests. Vérifications obligatoires :

```bash
pnpm typecheck    # 0 erreur TypeScript
pnpm lint         # 0 warning ESLint
pnpm test         # Tous les tests passent
pnpm build        # Build de production sans erreur
```

### Étape 7 — Commit atomique

Voir @docs/COMMITS.md pour le format exact.

```bash
git add -p                              # Staging interactif — vérifier chaque hunk
git commit -m "feat(audio): add pentatonic scale engine"
```

**Un commit = une feature complète.** Ne jamais committer du code cassé.

### Étape 8 — Pull Request

Voir le template `.github/PULL_REQUEST_TEMPLATE.md`.

---

## Phases de développement

### Phase 0 — Fondations (Semaines 1-2)

Objectif : monorepo opérationnel, design system de base, prototype audio.

**Ordre strict :**

1. Init monorepo pnpm workspaces + TypeScript strict
2. Setup Next.js 16.1 avec App Router
3. Tailwind CSS 4.0 + variables de design (`@theme`)
4. Google Fonts via `next/font` (Cormorant Garamond, Sora, JetBrains Mono)
5. Définir `packages/types` — interfaces TypeScript partagées
6. Prototype Tone.js — une note par keydown, gamme pentatonique
7. Zone de frappe minimale — afficher un mot, détecter les frappes
8. Vitest configuré — premier test qui passe

**Critère de validation :** `pnpm typecheck && pnpm test && pnpm build` passent tous.

### Phase 1 — MVP (Semaines 3-6)

Objectif : test de typing fonctionnel de bout en bout.

**Ordre strict :**

1. Moteur audio complet (pentatonique + progressions d'accords)
2. Zone de frappe avec WPM/accuracy/consistency en temps réel
3. Page de résultats — heatmap SVG, stats, recommandation
4. IndexedDB — stockage des sessions (lib `idb`)
5. Packs sonores core (Piano, Marimba, Synth, Chiptune)
6. Thèmes officiels (Terminal, Noir, Soleil de minuit, Arcade)
7. Collections officielles (Littérature, Code, Poésie)
8. Mode Classiques MIDI — 4 premières pièces

**Critère de validation :** Un utilisateur peut faire un test complet, entendre de la musique, et voir ses résultats.

### Phase 2 — Enrichissement (Semaines 7-10)

**Ordre strict :**

1. Mode Apprentissage (Home Row + niveaux progressifs)
2. Mode Code (JS, Python, Rust)
3. Difficulté adaptative en temps réel
4. Dashboard profil — graphes Recharts
5. Système de rangs narratifs + jalons débloquables
6. Ghost mode

### Phase 3 — Social & Open Source (Semaines 11-14)

**Ordre strict :**

1. Replay partageable (canvas recording)
2. Challenge direct (lien de challenge)
3. Leaderboards contextuels
4. CLI de scaffolding (npx create-typewav-\*)
5. Documentation de contribution complète
6. Internationalisation FR/EN (next-intl)

### Phase 4 — Monétisation (Semaines 15-18)

**Ordre strict :**

1. Supabase Auth (@supabase/ssr) — compte utilisateur
2. Sync cloud IndexedDB ↔ Supabase
3. Stripe Checkout — abonnement mensuel/annuel
4. Packs sonores premium (Cinematic, Phonk, Jazz Piano)
5. Page de transparence financière

---

## Guardrails — ce qui doit arrêter le développement

Si l'une de ces conditions est vraie, STOP et corriger avant de continuer :

```
❌ pnpm typecheck retourne des erreurs
❌ pnpm lint retourne des warnings
❌ pnpm test retourne des failures
❌ pnpm build échoue
❌ Un composant utilise 'use client' sans raison documentée
❌ Une dépendance non listée dans le cahier des charges est ajoutée
❌ Un son ou texte potentiellement sous copyright est ajouté
❌ Une clé Supabase service_role est exposée côté client
❌ localStorage ou sessionStorage est utilisé (utiliser IndexedDB via idb)
```

## Gestion du contexte de développement

- Garder les tâches de scope étroit — une feature à la fois
- Redémarrer proprement si la même erreur revient plus de 2 fois
- Ne pas mélanger des refactorings non liés dans un même contexte de travail
