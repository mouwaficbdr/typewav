# Spec 06 — Contenu éditorial thématique (Axe 6)

## Structure d'une collection

```typescript
// packages/types/src/collection.ts
export interface CollectionConfig {
  id: string
  name: string
  nameEn: string
  description: string
  language: 'fr' | 'en' | 'multi'
  recommendedTheme?: string
  recommendedSoundPack?: string
  isPremium: boolean
  texts: TextEntry[]
}

export interface TextEntry {
  id: string
  content: string
  source?: string         // Auteur / œuvre
  difficulty: 'easy' | 'medium' | 'hard'
  language: 'fr' | 'en'
  tags: string[]
}
```

## Collections officielles

| ID | Nom | Langue | Thème recommandé | Statut |
|----|-----|--------|-----------------|--------|
| `litterature` | Littérature | FR/EN | Noir | Gratuit |
| `code` | Code | Multi | Terminal | Gratuit |
| `poesie` | Poésie | FR/EN | Midnight Sun | Gratuit |
| `philosophie` | Philosophie | FR/EN | Noir | Gratuit |
| `gaming` | Gaming & Pop | FR/EN | Arcade | Gratuit |
| `quotidien` | Quotidien | FR/EN | Terminal | Gratuit |

## Règle de copyright — ABSOLUE

```
✅ Textes dans le domaine public (auteur mort depuis +70 ans)
✅ Textes originaux créés pour TypeWav
✅ Snippets de code sous licence MIT ou Apache 2.0
✅ Texte personnel utilisateur (espace privé)
❌ JAMAIS de texte sous copyright commercial actif
❌ JAMAIS de paroles de chansons sous copyright
```

Sources domaine public approuvées : Wikisource, Project Gutenberg, IMSLP.

## Collections communautaires

Format : `packages/collections/{id}/collection.config.ts` typé avec `CollectionConfig`.  
Soumis via PR. Critère de validation : respect copyright, qualité textuelle.

## Texte personnel

```typescript
// Stocké IndexedDB store 'personal_texts'
// Interface dans Spec 03
// Moteur A+C appliqué automatiquement
// Pas de traitement serveur — 100% local
```

## Tests requis

```
[ ] Chaque collection officielle a au moins 20 TextEntry
[ ] Aucun texte avec une source post-1954 (règle 70 ans)
[ ] loadCollection — charge correctement depuis packages/collections
[ ] getRandomText — retourne un texte de la collection, jamais le même deux fois consécutives
```
