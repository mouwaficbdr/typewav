# Spec 18 — Performance : Lazy Loading des Collections

> **Priorité : 🟡 MOYEN TERME**
> **Effort estimé : 2-3 fichiers**
> **Commit cible : `perf(collections): lazy-load inactive collections in HomeClient`**

---

## Contexte et problème

### Situation actuelle

Dans `apps/web/app/[locale]/page.tsx` :

```tsx
import {
  codeCollection,
  gamingCollection,
  litteratureCollection,
  philosophieCollection,
  poesieCollection,
} from '@typewav/collections';

export default function HomePage() {
  return (
    <HomeClient
      litterature={litteratureCollection} // ~50+ entrées
      poesie={poesieCollection} // ~30+ entrées
      code={codeCollection} // ~20+ entrées avec keystrokeData
      philosophie={philosophieCollection} // partielle
      gaming={gamingCollection} // partielle
    />
  );
}
```

**Problème** : Les 5 collections sont importées côté serveur et sérialisées dans le RSC payload, même si l'utilisateur n'en consulte qu'une seule. Si chaque collection contient 50 textes × 200 caractères en moyenne, c'est ~500KB de JSON envoyés systématiquement.

---

## Objectif

Passer uniquement la collection active dans le RSC payload. Charger les autres collections dynamiquement (Server Actions ou route handlers) lors du changement d'onglet.

---

## Approche retenue : Server Actions

Next.js 16 avec React 19 supporte nativement les Server Actions. On peut appeler une Server Action depuis le Client Component pour charger une collection à la demande.

---

## Fichiers à modifier / créer

```
# Créer
apps/web/app/[locale]/actions/collections.ts    ← Server Actions pour charger les collections

# Modifier
apps/web/app/[locale]/page.tsx                  ← passer seulement la collection initiale
apps/web/components/typing/HomeClient.tsx        ← utiliser la Server Action au changement d'onglet
```

---

## Types à ajouter

Aucun nouveau type. `CollectionConfig` existe déjà dans `@typewav/types`.

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
describe('HomeClient — lazy loading collections', () => {
  it('charge seulement litterature au premier rendu', () => {
    // La prop initiale ne contient que litterature
    // Les autres collections sont null au départ
  });

  it("charge la collection code quand l'onglet code est sélectionné", async () => {
    // Mock de la Server Action
    // Cliquer sur l'onglet "Code"
    // Server Action appelée avec identifier 'code'
    // Collection affichée après chargement
  });

  it('cache les collections déjà chargées', () => {
    // Naviguer code → poesie → code
    // Server Action appelée une seule fois pour code
  });

  it('affiche un état de chargement pendant le fetch', () => {
    // Spinner ou skeleton visible pendant le chargement
  });
});
```

---

## Implémentation

### Étape 1 — Server Actions `apps/web/app/[locale]/actions/collections.ts`

```typescript
'use server';

/**
 * Server Actions pour le chargement lazy des collections.
 * Appelées depuis HomeClient lors du changement d'onglet.
 */

import {
  codeCollection,
  gamingCollection,
  litteratureCollection,
  philosophieCollection,
  poesieCollection,
} from '@typewav/collections';
import type { CollectionConfig } from '@typewav/types';

type CollectionId =
  | 'litterature'
  | 'poesie'
  | 'code'
  | 'philosophie'
  | 'gaming';

const COLLECTIONS: Record<CollectionId, CollectionConfig> = {
  litterature: litteratureCollection,
  poesie: poesieCollection,
  code: codeCollection,
  philosophie: philosophieCollection,
  gaming: gamingCollection,
};

export async function fetchCollection(
  id: CollectionId,
): Promise<CollectionConfig> {
  // En production, ceci pourrait être un vrai fetch DB
  // Pour l'instant, les collections sont des imports statiques
  const collection = COLLECTIONS[id];
  if (!collection) throw new Error(`Collection inconnue : ${id}`);
  return collection;
}
```

### Étape 2 — `apps/web/app/[locale]/page.tsx`

Ne passer que la collection initiale (litterature par défaut) :

```tsx
import { litteratureCollection } from '@typewav/collections';
// Retirer les 4 autres imports

export default function HomePage() {
  return (
    <HomeClient
      initialCollection={litteratureCollection} // ← seulement la collection initiale
    />
  );
}
```

### Étape 3 — `HomeClient.tsx`

Adapter les props et ajouter le cache local :

```tsx
interface HomeClientProps {
  initialCollection: CollectionConfig; // ← remplace les 5 props individuelles
}

export function HomeClient({ initialCollection }: HomeClientProps) {
  // Cache des collections chargées
  const [collectionsCache, setCollectionsCache] = useState<
    Partial<Record<CollectionTab, CollectionConfig>>
  >({
    litterature: initialCollection,
  });
  const [loadingCollection, setLoadingCollection] = useState(false);

  const activeCollection = collectionsCache[activeTab] ?? null;

  // Au changement d'onglet, charger si pas dans le cache
  const handleTabChange = async (tab: CollectionTab) => {
    setActiveTab(tab);
    if (collectionsCache[tab]) return; // déjà en cache

    setLoadingCollection(true);
    try {
      const collection = await fetchCollection(tab as CollectionId);
      setCollectionsCache((prev) => ({ ...prev, [tab]: collection }));
    } finally {
      setLoadingCollection(false);
    }
  };

  // Pendant le chargement, afficher un skeleton
  if (loadingCollection || !activeCollection) {
    return <CollectionLoadingSkeleton />;
  }

  // ... reste du composant inchangé
}
```

`CollectionLoadingSkeleton` : div avec même hauteur que la TypingArea, fond `var(--color-surface)`, animation pulse subtile.

---

## Considérations

- **Pas de régression sur le dailyIndex** : Le calcul déterministe `getDailyIndex` doit être appliqué après le fetch, pas avant.
- **Philosophie et Gaming** sont partielles mais doivent être disponibles — ne pas bloquer le chargement sur des collections vides.
- **Bundle size** : Vérifier que les imports statiques dans la Server Action ne se retrouvent pas dans le bundle client via Webpack/Turbopack. Utiliser `import()` dynamique si nécessaire.

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] RSC payload de la home page allégé (vérifier avec Chrome DevTools → Network → Fetch/XHR)
- [ ] Changement d'onglet "Poésie" : collection chargée correctement
- [ ] Changement d'onglet "Code" : collection chargée correctement
- [ ] Cache fonctionnel : retour à "Littérature" → pas de nouveau fetch
- [ ] État de chargement visible pendant le fetch inter-onglets
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
perf(collections): lazy-load inactive collections in HomeClient

All 5 collections were imported server-side and serialized in the
RSC payload on every page load, regardless of active tab.

Now only the initial collection (litterature) is passed as a prop.
Other collections are loaded on-demand via a Server Action when
the user switches tabs. Results are cached in React state.
```
