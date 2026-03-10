# Spec 13 — Implémenter le backspace dans TypingArea

> **Priorité : 🔴 CRITIQUE #2**
> **Effort estimé : 3 fichiers**
> **Commit cible : `fix(typing): implement backspace correction in TypingArea and useSessionStore`**

---

## Contexte et problème

### Situation actuelle

**`useSessionStore.ts`** : expose `recordKeystroke` mais n'a pas d'action `moveBack` ou équivalent.

**`useSession.ts`** : expose `handleBackspace` mais c'est un **stub vide** :

```typescript
const handleBackspace = useCallback(() => {
  // Backspace non implémenté en Phase 1 (prévu Phase 2)
  // Le curseur ne recule pas, mais on pourrait implémenter ici plus tard
}, []);
```

**`TypingArea.tsx`** : retourne silencieusement sur Backspace :

```typescript
if (e.key === 'Backspace') {
  // Backspace : pas encore implémenté côté store en Phase 1
  return;
}
```

### Impact

Toute faute de frappe est permanente. L'utilisateur voit une lettre rouge et ne peut rien faire. C'est la raison de friction #1 à la rétention. **MonkeyType, Keybr, 10fastfingers, TypeRacer** supportent tous le backspace depuis leur premier jour de vie.

---

## Objectif

Implémenter le backspace avec ces règles métier :

1. Backspace recule d'une position (si `position > 0`)
2. Le dernier keystroke est retiré du tableau `keystrokes`
3. Aucun son n'est joué sur backspace (cohérent avec le principe : seules les frappes correctes produisent des notes)
4. Backspace ne fonctionne pas si `position === 0` (début du texte)
5. Backspace ne fonctionne pas si la session est terminée (`isComplete`)

---

## Fichiers à modifier

```
apps/web/stores/useSessionStore.ts        ← ajouter action moveBack
apps/web/hooks/useSession.ts              ← implémenter handleBackspace
apps/web/components/typing/TypingArea.tsx ← wirer handleBackspace, retirer le early return
```

---

## Types TypeScript

Aucun type nouveau nécessaire. L'action `moveBack` est interne au store.

---

## Tests à écrire (TDD — RED avant GREEN)

### Tests du store — `apps/web/stores/__tests__/useSessionStore.test.ts`

```typescript
describe('useSessionStore — moveBack', () => {
  it('décrémente position de 1', () => {
    // Après 3 frappes, moveBack → position = 2
  });

  it('retire le dernier keystroke du tableau', () => {
    // Après 3 frappes, moveBack → keystrokes.length = 2
  });

  it('ne fait rien si position === 0', () => {
    // Au début, moveBack → position reste 0, keystrokes reste vide
  });

  it('ne fait rien si la session est terminée (endedAt !== null)', () => {
    // Après endSession, moveBack → aucun changement
  });
});
```

### Tests du hook — `apps/web/hooks/__tests__/useSession.test.ts`

```typescript
describe('useSession — handleBackspace', () => {
  it('appelle moveBack sur le store', () => {
    // handleBackspace() → store.moveBack() appelé
  });

  it('ne fait rien si position === 0', () => {
    // Pas d'appel à moveBack si on est au début
  });
});
```

### Tests du composant — `apps/web/components/__tests__/TypingArea.test.tsx`

```typescript
describe('TypingArea — Backspace', () => {
  it('appelle handleBackspace quand la touche Backspace est pressée', () => {
    // Simuler keydown avec key='Backspace'
    // Vérifier que handleBackspace est appelé
  });

  it('ne joue pas de son sur Backspace', () => {
    // playNote ne doit pas être appelé sur Backspace
  });

  it('ne fait rien sur Backspace si position === 0', () => {
    // Pas de régression sur position négative
  });
});
```

---

## Implémentation

### Étape 1 — `apps/web/stores/useSessionStore.ts`

Trouver l'interface du store et y ajouter `moveBack`.

Ajouter dans le type du store :

```typescript
moveBack: () => void;
```

Ajouter dans l'implémentation du store :

```typescript
moveBack: () =>
  set((state) => {
    if (state.position === 0) return state;           // garde
    if (state.endedAt !== null) return state;          // session terminée
    return {
      position: state.position - 1,
      keystrokes: state.keystrokes.slice(0, -1),       // retire le dernier keystroke
    };
  }),
```

### Étape 2 — `apps/web/hooks/useSession.ts`

Extraire `moveBack` du store :

```typescript
const {
  position,
  keystrokes,
  startedAt,
  endedAt,
  soundPackId,
  themeId,
  startSession,
  recordKeystroke,
  moveBack, // ← AJOUTER
  endSession,
  reset,
} = useSessionStore();
```

Implémenter `handleBackspace` :

```typescript
const handleBackspace = useCallback(() => {
  if (endedAt !== null) return; // session terminée
  if (position === 0) return; // début du texte
  moveBack();
}, [endedAt, position, moveBack]);
```

### Étape 3 — `apps/web/components/typing/TypingArea.tsx`

Extraire `handleBackspace` du hook :

```typescript
const { position, keystrokes, liveStats, isComplete, handleKeystroke, handleBackspace } =
  useSession({ ... });
```

Dans `handleKeyDown`, remplacer le bloc Backspace :

**Avant :**

```typescript
if (e.key === 'Backspace') {
  // Backspace : pas encore implémenté côté store en Phase 1
  return;
}
```

**Après :**

```typescript
if (e.key === 'Backspace') {
  e.preventDefault(); // éviter comportement navigateur (retour page)
  handleBackspace();
  return;
}
```

---

## Comportement audio sur Backspace

**Aucun son.** Backspace ne produit ni note, ni silence, ni reverb. C'est intentionnel : seules les frappes correctes produisent de la musique. Backspace est une action de correction neutre.

---

## Edge cases à couvrir

| Cas                                   | Comportement attendu                          |
| ------------------------------------- | --------------------------------------------- |
| `position === 0`                      | No-op silencieux                              |
| Session terminée (`isComplete`)       | No-op silencieux                              |
| Backspace répété jusqu'au début       | S'arrête à position 0, pas d'erreur           |
| Backspace avec `metaKey` ou `ctrlKey` | Non géré (laisser le comportement navigateur) |

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent (existants + nouveaux)
- [ ] Frappe une lettre incorrecte → Backspace → position recule, `.char-error` disparaît
- [ ] Backspace en début de texte → aucun changement, aucune erreur console
- [ ] Backspace ne produit aucun son
- [ ] WPM live recalculé après backspace (le keystroke retiré ne compte plus)
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
fix(typing): implement backspace correction in TypingArea and useSessionStore

Backspace was silently ignored (early return in TypingArea, empty stub
in useSession, no action in useSessionStore).

Now:
- useSessionStore.moveBack() decrements position and removes last keystroke
- useSession.handleBackspace() calls moveBack with guards (position>0, !isComplete)
- TypingArea wires handleBackspace to the Backspace keydown event
- No audio is played on backspace (intentional — only correct keystrokes make music)
```
