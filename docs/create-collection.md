# Créer une collection de textes TypeWav

Ce guide explique comment créer et soumettre une collection de textes pour TypeWav.

## Règle absolue — droits d'auteur

**Textes domaine public uniquement.** Un texte est dans le domaine public si :

- L'auteur est décédé depuis **plus de 70 ans** (règle UE / France)
- OU la licence est explicitement **CC0** (Creative Commons Zero)

Sources fiables : [Wikisource](https://fr.wikisource.org), [Project Gutenberg](https://www.gutenberg.org), [Gallica BnF](https://gallica.bnf.fr).

**Exception** : les textes originaux créés spécifiquement pour TypeWav (ex : collection Gaming) sont autorisés.

## Prérequis

- Node.js 20 LTS + pnpm 9+
- Minimum 20 textes vérifiés domaine public

## Générer la structure

```bash
npx create-typewav-collection nom-de-la-collection
```

Cette commande crée :

```
nom-de-la-collection/
├── collection.config.ts   # Config principale
├── package.json
└── README.md
```

## Remplir `collection.config.ts`

```typescript
import type { CollectionConfig } from '@typewav/types';

const collection: CollectionConfig = {
  id: 'nom-de-la-collection',
  name: 'Nom FR',
  nameEn: 'Name EN',
  description: 'Description courte de la collection.',
  language: 'fr', // 'fr' | 'en' | 'multi'
  recommendedTheme: 'terminal', // Thème suggéré (optionnel)
  recommendedSoundPack: 'piano', // Pack sonore suggéré (optionnel)
  isPremium: false,
  texts: [
    {
      id: 'nom-de-la-collection-001',
      content:
        'Le texte à taper — sans retours à la ligne sauf si intentionnels.',
      source: "Auteur — Titre de l'œuvre (année de publication)",
      difficulty: 'medium', // 'easy' | 'medium' | 'hard'
      language: 'fr', // 'fr' | 'en'
      tags: ['philosophie', 'classique'],
    },
    // ... au moins 19 autres entrées
  ],
};

export default collection;
```

## Règles de contenu

| Critère                                                  | Requis            |
| -------------------------------------------------------- | ----------------- |
| Minimum 20 `TextEntry`                                   | ✅                |
| Chaque texte a un champ `source` vérifiable              | ✅                |
| Texte domaine public (auteur mort +70 ans)               | ✅                |
| Pas de contenu offensant ou discriminatoire              | ✅                |
| Longueur recommandée par texte                           | 80–400 caractères |
| `id` unique dans la collection (`slug-001`, `slug-002`…) | ✅                |

## Choisir la difficulté

| Niveau   | Critères                                                          |
| -------- | ----------------------------------------------------------------- |
| `easy`   | Phrases courtes, vocabulaire courant, aucune ponctuation complexe |
| `medium` | Phrases moyennes, quelques virgules et tirets                     |
| `hard`   | Phrases longues, ponctuation dense, mots rares ou techniques      |

## Tester localement

1. Copier le dossier dans `packages/collections/src/nom-de-la-collection/`
2. Exporter depuis `packages/collections/src/index.ts` :
   ```typescript
   export { maCollection } from './nom-de-la-collection/collection.config';
   ```
3. Mettre à jour `ALL_COLLECTIONS` dans le même fichier
4. Passer la collection en prop dans `apps/web/app/[locale]/page.tsx`
5. Vérifier : `pnpm typecheck` — 0 erreur

## Soumettre une PR

1. Fork le dépôt
2. Copier votre dossier dans `packages/collections/src/`
3. Mettre à jour `packages/collections/src/index.ts`
4. PR avec titre `feat(collections): add <nom> collection (<N> texts)`
5. Lister les sources de chaque texte dans la description de la PR

**Rappel** : toute PR contenant des textes dont les droits ne sont pas vérifiables sera rejetée immédiatement.
