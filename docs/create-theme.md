# Créer un thème TypeWav

Ce guide explique comment créer et soumettre un thème visuel pour TypeWav.

## Prérequis

- Node.js 20 LTS + pnpm 9+
- TypeScript strict
- Un outil de vérification de contraste (ex : [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/))

## Générer la structure

```bash
npx create-typewav-theme nom-du-theme
```

Cette commande crée un dossier `nom-du-theme/` avec :

```
nom-du-theme/
├── theme.config.ts    # Config principale (TypeScript)
├── package.json
└── README.md
```

## Remplir `theme.config.ts`

```typescript
import type { ThemeConfig } from '@typewav/types';

const theme: ThemeConfig = {
  id: 'nom-du-theme',
  name: 'Nom du Thème',
  colors: {
    bg: '#000000', // Fond principal
    surface: '#0A0A0A', // Fond des cartes / panels
    border: '#1A1A2E', // Bordures
    accent: '#00D4AA', // Couleur d'emphase
    textPrimary: '#E8E8E8', // Texte principal
    textMuted: '#888888', // Texte secondaire
    error: '#FF4444', // Erreur de frappe
  },
  fonts: {
    display: 'Cormorant Garamond', // Titres — ou autre Google Font
    ui: 'Sora', // Interface
    mono: 'JetBrains Mono', // Zone de frappe
  },
};

export default theme;
```

Tous les champs de `ThemeConfig` sont **obligatoires**. Aucun champ ne peut être omis.

## Critères de validation

| Critère                                     | Requis           |
| ------------------------------------------- | ---------------- |
| Contraste WCAG AA — texte principal vs fond | ✅ ratio ≥ 4.5:1 |
| Contraste WCAG AA — texte muted vs fond     | ✅ ratio ≥ 3:1   |
| Tous les tokens de couleur définis          | ✅               |
| Polices Google Fonts disponibles            | ✅               |
| `id` en kebab-case, unique                  | ✅               |
| Fichier `preview.png` inclus à la racine    | ✅               |

## Tester localement

1. Copier le dossier dans `packages/themes/src/nom-du-theme/`
2. Exporter depuis `packages/themes/src/index.ts`
3. Importer dans l'application pour test visuel
4. Vérifier : `pnpm typecheck` — 0 erreur

## Soumettre une PR

1. Fork le dépôt
2. Copier votre dossier dans `packages/themes/src/`
3. Ajouter l'export dans `packages/themes/src/index.ts`
4. Inclure un screenshot `preview.png` (au moins 1280×720)
5. PR avec titre `feat(themes): add <nom-du-theme> theme`

**Important** : les polices personnalisées doivent être disponibles via Google Fonts avec `display: 'optional'`.
