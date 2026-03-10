# Spec 12 — Fix wpmNet dans les résultats

> **Priorité : 🔴 CRITIQUE #1**
> **Effort estimé : 2 fichiers, ~15 lignes**
> **Commit cible : `fix(diagnostic): pass wpmNet to results URL params`**

---

## Contexte et problème

`calculateWPMNet` est correctement défini dans `apps/web/lib/stats.ts` et appelé dans `useSession.ts` :

```typescript
// useSession.ts — ligne ~105
const wpmNet = calculateWPMNet(keystrokes, duration);
```

Cependant, `wpmNet` n'est **pas inclus** dans les URL params lors de la navigation vers `/results` :

```typescript
// useSession.ts — URL params actuels (BUG)
const params = new URLSearchParams({
  id,
  wpm: String(Math.round(wpm)),
  accuracy: String(Math.round(accuracy)),
  consistency: String(Math.round(consistency)),
  recommendation,
  // ← wpmNet MANQUANT ICI
});
```

Et dans `ResultsPageClient.tsx`, la conséquence directe :

```typescript
// ResultsPageClient.tsx — BUG ACTUEL
return (
  <ResultsPage
    wpm={wpm}
    wpmNet={wpm}       // ← FAUX : wpmNet = wpm, toujours identique
    accuracy={accuracy}
    ...
  />
);
```

**Résultat** : un utilisateur qui commet 20 erreurs voit `wpmNet` identique à `wpm`. La punition pour les erreurs n'existe pas visuellement.

---

## Objectif

Afficher la vraie valeur `wpmNet` dans la page de résultats, calculée par `calculateWPMNet` (WPM brut - (erreurs non corrigées × 4)).

---

## Fichiers à modifier

```
apps/web/hooks/useSession.ts              ← ajouter wpmNet aux URL params
apps/web/app/[locale]/results/ResultsPageClient.tsx  ← lire wpmNet depuis searchParams
```

Aucun nouveau fichier. Aucune modification de types.

---

## Tests à écrire (TDD — RED avant GREEN)

Fichier : `apps/web/hooks/__tests__/useSession.test.ts` (créer si inexistant)

```typescript
describe('useSession — navigation vers /results', () => {
  it('inclut wpmNet dans les params URL en fin de session', async () => {
    // Simuler une session avec des erreurs : wpmNet < wpm
    // Vérifier que router.push est appelé avec wpmNet=X dans les params
    // wpmNet doit être différent de wpm si des erreurs ont été commises
  });

  it('inclut wpmNet=wpm si aucune erreur commise', async () => {
    // Session parfaite : wpmNet == wpm
  });
});
```

Fichier : `apps/web/app/[locale]/results/__tests__/ResultsPageClient.test.tsx` (créer si inexistant)

```typescript
describe('ResultsPageClient', () => {
  it('lit wpmNet depuis searchParams et le passe à ResultsPage', () => {
    // searchParams avec wpmNet=45 (différent de wpm=60)
    // Vérifier que ResultsPage reçoit wpmNet=45 et wpm=60
  });

  it('utilise 0 comme fallback si wpmNet absent des params', () => {
    // Fallback gracieux
  });
});
```

---

## Implémentation

### Étape 1 — `apps/web/hooks/useSession.ts`

Trouver le bloc `new URLSearchParams({...})` dans le `useEffect` de fin de session.

**Avant :**

```typescript
const params = new URLSearchParams({
  id,
  wpm: String(Math.round(wpm)),
  accuracy: String(Math.round(accuracy)),
  consistency: String(Math.round(consistency)),
  recommendation,
});
```

**Après :**

```typescript
const params = new URLSearchParams({
  id,
  wpm: String(Math.round(wpm)),
  wpmNet: String(Math.round(wpmNet)), // ← AJOUT
  accuracy: String(Math.round(accuracy)),
  consistency: String(Math.round(consistency)),
  recommendation,
});
```

### Étape 2 — `apps/web/app/[locale]/results/ResultsPageClient.tsx`

**Avant :**

```typescript
const wpm = Number(searchParams.get('wpm') ?? '0');

return (
  <ResultsPage
    wpm={wpm}
    wpmNet={wpm}      // ← BUG
    ...
  />
);
```

**Après :**

```typescript
const wpm = Number(searchParams.get('wpm') ?? '0');
const wpmNet = Number(searchParams.get('wpmNet') ?? '0');   // ← AJOUT

return (
  <ResultsPage
    wpm={wpm}
    wpmNet={wpmNet}   // ← CORRIGÉ
    ...
  />
);
```

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] En session avec erreurs : `wpmNet` affiché est inférieur à `wpm` dans les résultats
- [ ] En session parfaite : `wpmNet` == `wpm` dans les résultats
- [ ] URL de résultats contient `wpmNet=XX`
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
fix(diagnostic): pass wpmNet to results URL params

wpmNet was always equal to wpm because it was not included in the
URL params when navigating to /results. ResultsPageClient was
using wpm as fallback for both values.

Now wpmNet is correctly computed from calculateWPMNet and passed
through the URL, then read independently in ResultsPageClient.
```
