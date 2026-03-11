# Spec 26 — Finitions composants : 5 corrections UX ciblées

> **Créé le : 10 Mars 2026**
> **Sévérité : MOYEN**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #23**
> **Dépendance : Indépendant, peut être fait en parallèle avec spec-25**

---

## Vue d'ensemble des 5 corrections

| #   | Composant                            | Problème                                         | Fix                                  |
| --- | ------------------------------------ | ------------------------------------------------ | ------------------------------------ |
| A   | `PremiumPageClient`                  | CTA mensuel visuellement "désactivé"             | Bouton ghost transparent propre      |
| B   | `ProfilClient` + `PremiumPageClient` | "Chargement…" seul sur fond noir                 | Skeletons CSS structurés             |
| C   | `GhostCursor`                        | Label "👻 record" chevauche le texte             | Repositionnement + overflow-safe     |
| D   | `TypingArea`                         | Zone inactive = zone active visuellement         | Overlay d'activation au premier clic |
| E   | Multiple                             | Liens "← Retour" sans hover, filtres sans radius | Hover + border-radius cohérent       |

---

## Fix A — Premium CTA mensuel : bouton ghost lisible

### Problème

```tsx
// ACTUEL — fond #1A1A2E sur surface #0A0A0A = invisible (1.3:1)
backgroundColor: 'var(--color-border)',
border: '1px solid var(--color-accent)',
color: 'var(--color-accent)',
```

### Fix

```tsx
// APRÈS — bouton ghost avec fond transparent et bordure accent 2px
backgroundColor: 'transparent',
border: '2px solid var(--color-accent)',
borderRadius: 'var(--radius-md)',
color: 'var(--color-accent)',
cursor: 'pointer',
fontFamily: 'var(--font-ui)',
fontSize: '0.875rem',
fontWeight: '600',
letterSpacing: '0.05em',
padding: '10px 20px',
textTransform: 'uppercase',
transition: 'background-color var(--transition-fast)',
width: '100%',
```

Différenciation claire : mensuel = ghost outline, annuel = filled accent.

---

## Fix B — Skeletons de chargement structurés

### Problème

```tsx
// ACTUEL — une seule ligne de texte au centre d'un écran noir
<div
  style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  Chargement…
</div>
```

### Fix — Ajouter l'animation shimmer dans globals.css

```css
/* apps/web/styles/globals.css — AJOUTER */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-border) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

### Skeleton ProfilClient

Reproduire la structure de la page : 4 stat cards + titre chart + zone chart + zone heatmap.

```tsx
// ProfilClient.tsx — remplacer le loading state
if (loading) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: '48px 24px',
        maxWidth: 860,
        margin: '0 auto',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 40,
        }}
      >
        <div>
          <div
            className="skeleton"
            style={{ width: 120, height: 36, marginBottom: 8 }}
          />
          <div className="skeleton" style={{ width: 180, height: 16 }} />
        </div>
        <div
          className="skeleton"
          style={{ width: 80, height: 28, borderRadius: 'var(--radius-lg)' }}
        />
      </div>
      {/* Stats skeleton — 4 cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 88, borderRadius: 'var(--radius-lg)' }}
          />
        ))}
      </div>
      {/* Chart skeleton */}
      <div
        className="skeleton"
        style={{
          height: 200,
          marginBottom: 40,
          borderRadius: 'var(--radius-lg)',
        }}
      />
      {/* Heatmap skeleton */}
      <div
        className="skeleton"
        style={{ height: 100, borderRadius: 'var(--radius-lg)' }}
      />
    </main>
  );
}
```

### Skeleton PremiumPageClient

```tsx
// PremiumPageClient.tsx — remplacer le loading state
if (loading) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center gap-12 p-8 pt-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Titre */}
      <div
        className="skeleton"
        style={{ width: 280, height: 48, borderRadius: 'var(--radius-lg)' }}
      />
      {/* Feature list */}
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 24, borderRadius: 'var(--radius-sm)' }}
          />
        ))}
      </div>
      {/* Cards skeleton */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div
          className="skeleton"
          style={{ width: 200, height: 200, borderRadius: 'var(--radius-lg)' }}
        />
        <div
          className="skeleton"
          style={{ width: 200, height: 200, borderRadius: 'var(--radius-lg)' }}
        />
      </div>
    </main>
  );
}
```

---

## Fix C — GhostCursor : repositionnement du label

### Problème

Le label `"👻 record"` est positionné à `top: 8`. La barre fait `height: 4px`.
Le label à `top: 8` se superpose au contenu de la zone de frappe.

### Fix

```tsx
// AVANT
<div style={{
  position: 'absolute',
  top: 8,
  left: `${ghostPercent * 100}%`,
  transform: 'translateX(-50%)',
  fontSize: 10,
  ...
}}>
  👻 record
</div>

// APRÈS — label AU-DESSUS de la barre de progression
<div style={{
  position: 'absolute',
  bottom: 8,                         // ← 8px au-dessus de la barre (qui est en top:0)
  left: `${ghostPercent * 100}%`,
  transform: 'translateX(-50%)',
  fontSize: 10,
  color: isAhead ? '#FFD700' : 'color-mix(in srgb, var(--color-text-primary) 30%, transparent)',
  fontFamily: 'var(--font-mono)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  maxWidth: 'calc(100% - 16px)',     // ← éviter le débordement
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}}>
  👻
</div>
```

**Note** : La barre est en `position: absolute, top: 0, height: 4px`. Le conteneur du
GhostCursor a `height: 4px` et `overflow: hidden`. Le label ne peut pas être "au-dessus"
de la barre dans ce conteneur.

**Solution alternative** : supprimer le label texte. Le code couleur (or = en avance,
blanc transparent = en retard) suffit. Le label "👻 record" n'ajoute pas d'information
que la couleur ne communique déjà. Le supprimer élimine l'overlap entièrement.

**Décision** : Supprimer le label texte du GhostCursor. Garder uniquement la barre colorée.
Si une indication textuelle est souhaitée, l'ajouter HORS du conteneur GhostCursor,
dans le composant parent (TypingArea), sous la zone de texte.

---

## Fix D — TypingArea : affordance d'activation

### Problème

La zone de frappe non-focusée est visuellement identique à la zone focusée.
Les utilisateurs n'ont aucun signal pour cliquer avant de taper.

### Fix — Overlay d'activation

`TypingArea` a déjà un état `isFocused` (ou équivalent via `onFocus`/`onBlur`).
Ajouter un overlay conditionnel qui disparaît au focus :

```tsx
// TypingArea.tsx — AJOUTER dans le rendu (wrapper position: relative déjà présent)
{
  !isFocused && (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--color-bg) 60%, transparent)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        zIndex: 1,
        pointerEvents: 'none', // le click passe au conteneur parent
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.05em',
        }}
      >
        {t('typing.hint')}
      </span>
    </div>
  );
}
```

**Note** : Vérifier dans `TypingArea.tsx` que `isFocused` state existe déjà (ou ajouter
`const [isFocused, setIsFocused] = useState(false)` + `onFocus={() => setIsFocused(true)}`

- `onBlur={() => setIsFocused(false)}` sur le div `role="textbox"`).

La clé `typing.hint` existe déjà dans fr.json et en.json — ne pas créer une nouvelle clé.

---

## Fix E — Liens "← Retour" et border-radius filtres

### Liens Retour — ProfilClient, PremiumPageClient, ClassementClient

```tsx
// Pattern pour tous les liens "← Retour" (appliquer partout)
// Ajouter une classe ou utiliser un style cohérent

// AVANT (pas d'état hover visible)
style={{
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.8125rem',
}}

// APRÈS — ajouter transition avec className hover
// Option 1 : Tailwind class (cohérent avec le pattern GlobalNav)
className="transition-colors duration-150 hover:text-[var(--color-text-primary)] hover:underline"
style={{
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.8125rem',
  textDecoration: 'none',
}}
```

Appliquer systematiquement dans :

- `ProfilClient.tsx` lien "← Retour au test"
- `PremiumPageClient.tsx` lien "← Retour" et "Transparence financière →"
- `ClassementClient.tsx` lien "← Profil"

### Filter buttons — border-radius manquant

```tsx
// ClassementClient.tsx et ProfilClient.tsx — filter buttons
// AJOUTER dans le style des filter buttons :
borderRadius: 'var(--radius-sm)',
```

---

## Tests requis

```typescript
// apps/web/components/__tests__/GhostCursor.test.tsx
describe('GhostCursor', () => {
  it("n'affiche pas de label texte qui superposerait le contenu", () => {
    render(<GhostCursor ghostTimings={[100,200]} userPosition={0} textLength={10} />)
    // Le composant ne doit pas contenir de span avec "👻 record" en texte
    expect(screen.queryByText(/record/i)).not.toBeInTheDocument()
  })
})

// apps/web/components/__tests__/TypingArea.test.tsx
describe('TypingArea — affordance', () => {
  it('affiche le hint quand non focusé', () => {
    render(<TypingArea text="hello" />)
    // L'overlay d'activation doit être présent (aria-hidden=true overlay)
    // Vérifier via aria-hidden
  })

  it("cache le hint quand focusé", () => {
    render(<TypingArea text="hello" />)
    const area = screen.getByRole('textbox')
    fireEvent.focus(area)
    // L'overlay doit disparaître
  })
})
```

---

## Workflow

```
1. Fix A : PremiumPageClient CTA mensuel (1 fichier, 5 lignes)
2. Fix B : Ajouter .skeleton dans globals.css, remplacer loading dans ProfilClient et PremiumPageClient
3. Fix C : Supprimer le label texte de GhostCursor
4. Fix D : Ajouter isFocused state + overlay dans TypingArea (vérifier si state existe déjà)
5. Fix E : Ajouter className hover sur tous les liens Retour + borderRadius sur filter buttons
6. Écrire les tests
7. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
8. Commit
```

## Commit

```
fix(ux): premium CTA contrast, loading skeletons, ghost label, typing affordance

- PremiumPageClient: monthly CTA from invisible (--color-border bg) to ghost outline
- ProfilClient: replace "Chargement…" with structured shimmer skeleton
- PremiumPageClient: replace "Chargement…" with structured shimmer skeleton
- GhostCursor: remove text label that overlapped typing content
- TypingArea: add activation overlay hint when area not focused
- ClassementClient/ProfilClient: add borderRadius to filter buttons
- Add .skeleton @keyframes shimmer to globals.css
- Back links: add hover:underline + transition across all pages
```
