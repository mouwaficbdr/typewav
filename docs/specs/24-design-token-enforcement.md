# Spec 24 — Enforcement du design system : tokens, rgba, typographie, identité

> **Créé le : 10 Mars 2026**
> **Sévérité : HAUTE**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #21**
> **Dépendance : Peut être fait après spec-22 et spec-23 (indépendant)**

---

## Problème

Le design system définit 3 valeurs de `border-radius` et une palette de couleurs complète en
tokens CSS. En pratique :

- 7 valeurs de `borderRadius` différentes coexistent (vs 3 définies)
- Les `rgba()` hardcodés référencent la couleur accent `#00D4AA`, rendant le changement de
  thème inefficace (les 4 thèmes utilisent des accents différents)
- Le logo GlobalNav utilise la mauvaise police (`--font-ui` au lieu de `--font-display`)
- GlobalNav affiche le début de l'email comme pseudo (risque vie privée)
- Les liens "← Retour" n'ont pas d'état hover

---

## Sous-axe 1 — Border radius : 3 tokens, zéro valeur arbitraire

### Tableau de mapping

| Valeur actuelle               | Token correct                                                | Variable CSS       |
| ----------------------------- | ------------------------------------------------------------ | ------------------ |
| `2`                           | `--radius-sm`                                                | `var(--radius-sm)` |
| `3`                           | `--radius-sm` (arrondi supérieur)                            | `var(--radius-sm)` |
| `4`                           | `--radius-md`                                                | `var(--radius-md)` |
| `6`                           | `--radius-md` (Tailwind `rounded-md` = 6px)                  | `var(--radius-md)` |
| `8`                           | `--radius-lg`                                                | `var(--radius-lg)` |
| `10`                          | `--radius-lg` (arrondi supérieur)                            | `var(--radius-lg)` |
| `12`                          | `--radius-lg` (arrondi supérieur)                            | `var(--radius-lg)` |
| `rounded-md` (Tailwind class) | Remplacer par `style={{ borderRadius: 'var(--radius-md)' }}` | —                  |

### Composants à corriger

| Composant                             | Valeur actuelle                      | Valeur cible                                                       |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `RankBadge.tsx`                       | `borderRadius: 6`                    | `borderRadius: 'var(--radius-md)'`                                 |
| `MilestoneToast.tsx`                  | `borderRadius: 10`                   | `borderRadius: 'var(--radius-lg)'`                                 |
| `ProfilClient.tsx` stat cards         | `borderRadius: 10`                   | `borderRadius: 'var(--radius-lg)'`                                 |
| `PremiumPageClient.tsx` badge         | `borderRadius: '3px'`                | `borderRadius: 'var(--radius-sm)'`                                 |
| `PremiumPageClient.tsx` pricing cards | `rounded-md` (Tailwind)              | Garder mais ajouter `style={{ borderRadius: 'var(--radius-lg)' }}` |
| `ResultsPage.tsx` StatCard            | `rounded-md` (Tailwind class)        | `style={{ borderRadius: 'var(--radius-lg)' }}`                     |
| `ClassementClient.tsx` filter buttons | `border: '1px solid'`, pas de radius | Ajouter `borderRadius: 'var(--radius-sm)'`                         |
| `ProfilClient.tsx` filter buttons     | En cohérence avec ClassementClient   | `borderRadius: 'var(--radius-sm)'`                                 |
| `AuthForm.tsx` button submit          | `borderRadius: '4px'`                | `borderRadius: 'var(--radius-md)'`                                 |
| `GlobalNav.tsx`                       | Aucun radius → ne pas ajouter        | —                                                                  |

**IMPORTANT** : Tailwind `rounded-md` génère 6px. Utiliser `style={{ borderRadius: ... }}`
à la place des classes Tailwind pour les composants qui mélangent les deux approches.

---

## Sous-axe 2 — rgba hardcodés → `color-mix()` pour compatibilité thèmes

### Motivation

Les 4 thèmes utilisent des accents différents :

- Terminal : `#00D4AA`
- Noir : `#C8963E`
- Midnight Sun : `#5B9BD5`
- Arcade : `#FF00FF`

Un `rgba(0, 212, 170, 0.04)` hardcodé reste teal même en thème Arcade.
`color-mix(in srgb, var(--color-accent) 4%, transparent)` s'adapte automatiquement.

### Remplacement exhaustif

| Fichier                              | Expression actuelle             | Expression correcte                                                            |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| `LeaderboardTable.tsx`               | `rgba(0, 212, 170, 0.04)`       | `color-mix(in srgb, var(--color-accent) 4%, transparent)`                      |
| `MilestoneToast.tsx`                 | `rgba(0,212,170,0.15)`          | `color-mix(in srgb, var(--color-accent) 15%, transparent)`                     |
| `ProfilClient.tsx` filter active     | `rgba(0,212,170,0.1)`           | `color-mix(in srgb, var(--color-accent) 10%, transparent)`                     |
| `GhostCursor.tsx` ghost bar inactive | `rgba(255,255,255,0.3)`         | `color-mix(in srgb, var(--color-text-primary) 30%, transparent)`               |
| `RankBadge.tsx` bg alpha             | `${accentColor}1A` ou similaire | Utiliser `color-mix()` si possible, sinon laisser (couleur de rang spécifique) |

**Note** : `color-mix(in srgb, ...)` est supporté par tous les navigateurs modernes
(Chrome 111+, Firefox 113+, Safari 16.2+). Cible de support TypeWav = navigateurs modernes.

### Fallback pour les couleurs de rang spécifiques

`RankBadge` utilise des couleurs propres à chaque rang (`#888888`, `#4A9EFF`, `#FFD700`…)
qui ne sont pas `var(--color-accent)`. Ces alpha sont dans le design system des rangs,
pas dans le thème. Les laisser en hex alpha (`#FFD70033`) ou utiliser les variables de rang :

```css
/* globals.css — variables de rang déjà définies en spec-04 */
--color-rank-novice: #888888;
--color-rank-apprentice: #4a9eff;
--color-rank-ghost: #ffd700;
/* etc. */
```

Utiliser `color-mix(in srgb, var(--color-rank-ghost) 30%, transparent)`.

---

## Sous-axe 3 — GlobalNav : police du logo

### Problème

`GlobalNav.tsx` logo :

```tsx
// ACTUEL (BUG identitaire)
style={{
  fontFamily: 'var(--font-ui)',   // Sora — police UI générique
  fontWeight: '600',
  letterSpacing: '0.05em',
}}
```

Le produit utilise Cormorant Garamond (`--font-display`) comme signature visuelle.
Le logo dans la hero page utilise `--font-display`. Le logo dans la nav (présent sur TOUTES
les pages) utilise `--font-ui`. Incohérence de marque majeure.

### Fix

```tsx
// APRÈS
style={{
  color: 'var(--color-text-primary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',  // ← Cormorant Garamond
  fontWeight: '300',                   // ← Light comme dans la hero
  fontSize: '1.125rem',               // légèrement plus grand pour compenser le poids light
  letterSpacing: '0.08em',
}}
```

---

## Sous-axe 4 — GlobalNav : email → pseudo

### Problème

```tsx
// ACTUEL (risque vie privée)
{
  user.email?.split('@')[0] ?? t('account');
}
// "marie.dupont@gmail.com" → affiche "marie.dupont" en clair dans la nav
```

Le type `UserProfile` a un champ `pseudo` (utilisé dans les leaderboards).
Utiliser le `pseudo` depuis IndexedDB via un hook ou store.

### Fix — approche avec `useProgressionStore`

Le `useProgressionStore` expose déjà le profil utilisateur via `setProfile`.
Ajouter un sélecteur `selectPseudo` ou utiliser le store directement :

```tsx
// Dans GlobalNav.tsx
import { useProgressionStore } from '@/stores/useProgressionStore';

// Dans le composant
const pseudo = useProgressionStore((s) => s.profile?.pseudo);

// Affichage
{
  pseudo || user.email?.split('@')[0] || t('account');
}
```

**Logique de fallback** :

1. `pseudo` (depuis IndexedDB UserProfile) — priorité
2. Partie locale de l'email — fallback si `pseudo` vide ou non chargé
3. `t('account')` — si non connecté

**Note** : `useProgressionStore` est un Client Component store (Zustand). `GlobalNav` est
déjà un Client Component (`'use client'`). Pas de changement d'architecture nécessaire.
Vérifier que le `profile` est bien chargé dans le store au moment de l'affichage
(le `ProfilClient` charge le store — mais si l'utilisateur va directement sur `/profil`,
le store est rempli. Si l'utilisateur est sur la home, il faut que le store soit hydraté.).

**Alternative plus robuste** : Charger le pseudo dans `useUser.ts` directement depuis
`getUserProfile()` (IndexedDB) et l'exposer via le hook :

```tsx
// hooks/useUser.ts — AJOUTER
const [pseudo, setPseudo] = useState<string>('');

useEffect(() => {
  getUserProfile().then((profile) => setPseudo(profile.pseudo));
}, []);

return { user, isPremium, loading, pseudo };
```

Utiliser ensuite `const { user, pseudo } = useUser()` dans `GlobalNav`.

---

## Tests requis

```typescript
// apps/web/components/__tests__/GlobalNav.test.tsx
describe('GlobalNav — identité visuelle', () => {
  it('le logo utilise --font-display, pas --font-ui', () => {
    render(<GlobalNav />)
    const logo = screen.getByRole('link', { name: /typewav/i })
    expect(logo).toHaveStyle({ fontFamily: 'var(--font-display)' })
  })

  it('affiche le pseudo quand disponible, pas le début de l'email', () => {
    // mock useUser → { user: { email: 'alice@example.com' }, pseudo: 'Alice', loading: false }
    render(<GlobalNav />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })
})

// apps/web/components/__tests__/design-tokens.test.tsx
describe('Design tokens — border radius', () => {
  it('RankBadge utilise --radius-md pour son borderRadius', () => {
    // Vérifier que le style calculé ne contient pas de valeur arbitraire
  })
})
```

---

## Workflow

```
1. Identifier tous les fichiers avec rgba(0, 212, 170, ...) via grep
2. Remplacer par color-mix() dans chaque fichier
3. Corriger tous les borderRadius dans les composants listés
4. Modifier GlobalNav.tsx : font logo + pseudo
5. Modifier useUser.ts : ajouter pseudo depuis getUserProfile()
6. Écrire les tests
7. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
8. Commit
```

## Commit

```
style(design): enforce border-radius tokens, color-mix, nav font and pseudo

- Replace all arbitrary borderRadius values with var(--radius-sm/md/lg)
- Replace rgba(0,212,170,...) with color-mix(in srgb, var(--color-accent) X%, transparent)
  in LeaderboardTable, MilestoneToast, ProfilClient, GhostCursor
- GlobalNav logo: --font-ui → --font-display, weight 600 → 300
- GlobalNav user display: email.split('@')[0] → pseudo from UserProfile
- Add pseudo field to useUser hook (from getUserProfile() IndexedDB)

Theme switching now correctly updates all alpha colors
Brand mark consistent across all pages
```
