# Contribuer à TypeWav

Merci de vouloir contribuer à TypeWav. Ce guide explique comment contribuer selon le type de contribution.

## Prérequis

- Node.js 20 LTS (≥20.19.0) — Node 18 est EOL
- pnpm 9+
- Git 2.40+

## Setup local

```bash
git clone https://github.com/[username]/typewav.git
cd typewav
pnpm install
pnpm dev
```

Vérifier que tout fonctionne :

```bash
pnpm typecheck    # 0 erreur TypeScript
pnpm test         # Tous les tests passent
pnpm build        # Build sans erreur
```

## Types de contributions

### 1. Bug report

Ouvrir une issue GitHub avec le template **Bug Report**. Inclure :
- Étapes de reproduction
- Comportement attendu vs observé
- Navigateur et OS
- Capture d'écran si pertinente

### 2. Feature request

Ouvrir une issue GitHub avec le template **Feature Request**.  
Attendre un retour avant d'implémenter — éviter le travail non aligné avec la vision.

### 3. Nouveau thème

Lire `docs/create-theme.md` en intégralité.

Structure minimale :

```bash
npx create-typewav-theme mon-theme
# Génère : packages/themes/mon-theme/theme.config.ts
```

Critères de validation :
- Contraste WCAG AA minimum (4.5:1) sur le texte principal
- Tokens de couleur complets (`ThemeConfig` entier renseigné)
- Screenshot du thème en action inclus dans la PR
- Pack sonore recommandé compatible

### 4. Nouveau pack sonore

Lire `docs/create-soundpack.md`.

Critères de validation :
- Samples 100% libres de droits (CC0, CC-BY, ou originaux)
- Format : .mp3 ET .ogg (compatibilité navigateur)
- Taille totale < 2MB
- Couvre au minimum les notes : C3 C4 C5 D4 E4 G4 A4

### 5. Nouvelle collection de textes

Lire `docs/create-collection.md`.

Critères de validation :
- **Textes domaine public uniquement** — auteur mort depuis +70 ans minimum
- Source vérifiable (Wikisource, Project Gutenberg, etc.)
- Minimum 20 `TextEntry`
- Pas de contenu offensant
- Langue indiquée pour chaque entrée

### 6. Correction de bug / amélioration code

```bash
# 1. Créer une branche depuis main
git checkout -b fix/audio-tone-init-race-condition

# 2. Implémenter (TDD — test d'abord)
# 3. Vérifier
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# 4. Commit (Conventional Commits)
git commit -m "fix(audio): prevent Tone.js init race condition on fast first keypress"

# 5. Push et PR
git push origin fix/audio-tone-init-race-condition
```

## Standards de code

- TypeScript strict — `any` interdit sans justification documentée
- Pas de `localStorage` / `sessionStorage` — IndexedDB via `idb` uniquement
- `motion/react` pas `framer-motion`
- `@supabase/ssr` pas `@supabase/auth-helpers-nextjs`
- Server Components par défaut — `'use client'` uniquement si nécessaire
- Chaque export public documenté avec JSDoc

## Process de review

1. Ouvrir la PR avec le template fourni
2. CI doit passer (typecheck + lint + tests + build)
3. Review par le maintainer sous 7 jours ouvrés
4. Maximum 2 rounds de révisions
5. Squash merge sur main

## Code de conduite

- Communication respectueuse et constructive
- Les décisions architecturales du maintainer sont finales
- Les contributions de contenu (textes, sons) doivent respecter les droits d'auteur
- Zéro tolérance pour le contenu offensant ou discriminatoire
