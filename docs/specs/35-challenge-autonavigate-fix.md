# Spec 35 — Fix ChallengeClient : autoNavigate manquant (F-2)

> **Créé le : 11 Mars 2026**
> **Sévérité : 🔴 CRITIQUE (comportement cassé)**
> **Source : FORGE_NOTES.md — Point [8] Bug F-2**
> **Effort : 1 ligne de code**

---

## Contexte et problème

**Fichier** : `apps/web/app/[locale]/challenge/ChallengeClient.tsx`

`ChallengeClient` gère trois états : chargement → frappe active → post-complétion (résultat + contre-défier). L'état post-complétion ne s'affiche jamais car `<TypingArea>` navigue automatiquement vers `/results` à la fin d'une session.

**Cause racine** : `TypingArea` accepte une prop `autoNavigate?: boolean` (défaut `true`). Quand `autoNavigate` est `true`, la complétion déclenche `router.push('/results')` avant que `onComplete` ait le temps d'exécuter `setCompleted(true)`.

**Preuve directe** (ligne 126) :

```tsx
// ACTUEL — manque autoNavigate={false}
<TypingArea text={text} mode={params.mode} onComplete={handleComplete} />
```

L'écran post-complétion (`completed === true`) ne s'affiche donc jamais. Le bouton "Contre-défier" est inaccessible.

---

## État actuel du code

```
apps/web/app/[locale]/challenge/ChallengeClient.tsx
  └── ligne 126 : <TypingArea text={text} mode={params.mode} onComplete={handleComplete} />
      ↑ autoNavigate={true} par défaut → navigation vers /results dès complétion
```

---

## Solution

Passer explicitement `autoNavigate={false}` à `<TypingArea>`.

### Fichier à modifier

```
apps/web/app/[locale]/challenge/ChallengeClient.tsx
```

### Changement

```diff
- <TypingArea
-   text={text}
-   mode={params.mode}
-   onComplete={handleComplete}
- />
+ <TypingArea
+   text={text}
+   mode={params.mode}
+   onComplete={handleComplete}
+   autoNavigate={false}
+ />
```

---

## Tests requis

```typescript
// apps/web/app/[locale]/challenge/__tests__/ChallengeClient.test.tsx

describe('ChallengeClient', () => {
  it('affiche le résultat post-complétion sans redirection', async () => {
    // Simuler challenge valide
    // Déclencher onComplete(85)
    // Vérifier que setCompleted(true) s'exécute
    // Vérifier que router.push('/results') n'est PAS appelé
    // Vérifier que "Contre-défier" est visible
  });

  it("n'appelle pas router.push automatiquement en fin de session", () => {
    // TypingArea reçoit autoNavigate={false}
    // Mock useRouter → verify push is not called on completion
  });
});
```

---

## Workflow

```
1. RED : écrire les tests (ils échouent)
2. Modifier ChallengeClient.tsx ligne 126 : ajouter autoNavigate={false}
3. GREEN : tests passent
4. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
5. Commit
```

---

## Commit

```
fix(challenge): add autoNavigate={false} to TypingArea in ChallengeClient

Without this prop, TypingArea auto-navigates to /results on session
completion, bypassing the post-challenge screen (win/loss + counter-
challenge button). The completion state was never rendered in practice.

One-line fix. Resolves FORGE F-2.
```
