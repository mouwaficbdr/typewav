# Spec 15 — Navigation Globale Persistante (GlobalNav)

> **Priorité : 🟠 HAUTE #5**
> **Effort estimé : 2 fichiers (composant + intégration layout)**
> **Commit cible : `feat(nav): add persistent GlobalNav component`**

---

## Contexte et problème

TypeWav n'a aucun composant de navigation global. Navigation actuelle :

- Home (`/`) : liens vers `/profil` et `/premium` dans le footer de `HomeClient`
- Toutes autres pages : aucun lien vers d'autres sections
- `/profil` : lien `← Retour au typing` vers `/`

### Impact utilisateur

- **Le Skeptic** : fait un test → voit les résultats → nulle part où aller → ferme l'onglet
- **Le Power User** : veut consulter son profil pendant un test → doit connaître l'URL
- **Le Decision Maker** : visite, ne trouve pas le leaderboard → impression d'un produit incomplet

Référence best-in-class : MonkeyType — barre persistante en haut avec icônes, toujours visible.

---

## Objectif

Créer un composant `GlobalNav` minimal et élégant :

- Logo TypeWav (lien vers home)
- Liens vers : Profil, Classement, Premium
- Indicateur d'authentification : avatar/pseudo si connecté, lien "Connexion" sinon
- Responsive : s'effondre proprement sur mobile
- Thème-aware : utilise les tokens CSS (`--color-bg`, `--color-border`, etc.)
- Léger : Server Component pour les parties statiques, `useUser()` uniquement si nécessaire

---

## Fichiers à modifier / créer

```
# Créer
apps/web/components/ui/GlobalNav.tsx       ← composant principal
apps/web/components/ui/__tests__/GlobalNav.test.tsx

# Modifier
apps/web/app/[locale]/layout.tsx           ← intégrer GlobalNav
apps/web/messages/fr.json                  ← clés nav.*
apps/web/messages/en.json                  ← clés nav.*
```

---

## Design du composant

```
┌─────────────────────────────────────────────────────────────────┐
│  TypeWav    [Profil]  [Classement]  [Premium]          [Login]  │
│             ou si connecté :                    [pseudo] [●]    │
└─────────────────────────────────────────────────────────────────┘
```

- Hauteur : 48px
- Background : `var(--color-surface)` avec `border-bottom: 1px solid var(--color-border)`
- Sticky en haut (`position: sticky; top: 0; z-index: 50`)
- Font : `var(--font-ui)`, 0.875rem
- Liens actifs : `var(--color-accent)` (via `usePathname()` ou `aria-current="page"`)
- Mobile : liens condensés (icônes ou menu hamburger simple)

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
describe('GlobalNav', () => {
  it('affiche le logo TypeWav avec lien vers /[locale]/', () => {});
  it('affiche les liens Profil, Classement, Premium', () => {});
  it('affiche "Connexion" si utilisateur non connecté', () => {});
  it('affiche le pseudo si utilisateur connecté', () => {});
  it('marque le lien actif avec aria-current="page"', () => {});
  it('les liens incluent la locale courante', () => {});
});
```

---

## Implémentation

### `GlobalNav.tsx`

```tsx
'use client';

/**
 * GlobalNav — barre de navigation persistante.
 *
 * Client Component justifié : useUser() (état auth), usePathname(), useLocale().
 * Affiché dans [locale]/layout.tsx — visible sur toutes les routes.
 */

import { useUser } from '@/hooks/useUser';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GlobalNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user, loading } = useUser();

  const navLinks = [
    { href: `/${locale}/profil`, label: t('profile') },
    { href: `/${locale}/classement`, label: t('leaderboard') },
    { href: `/${locale}/premium`, label: t('premium') },
  ];

  return (
    <nav
      aria-label={t('mainNav')}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
      }}
    >
      {/* Logo */}
      <Link
        href={`/${locale}`}
        style={{
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          fontWeight: '600',
          letterSpacing: '0.05em',
        }}
      >
        TypeWav
      </Link>

      {/* Liens de navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              className="hover:text-[var(--color-text-primary)]"
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Auth state */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {loading ? null : user ? (
          <span
            style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}
          >
            {user.email?.split('@')[0] ?? t('account')}
          </span>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            style={{
              color: 'var(--color-accent)',
              textDecoration: 'none',
              fontSize: '0.8125rem',
            }}
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
```

### Intégration dans `[locale]/layout.tsx`

Ajouter `GlobalNav` avant `{children}` :

```tsx
import { GlobalNav } from '@/components/ui/GlobalNav';

export default async function LocaleLayout({ children, params }: Props) {
  // ... (code existant)
  return (
    <NextIntlClientProvider messages={messages}>
      <GlobalNav /> {/* ← AJOUTER */}
      {children}
      <MilestoneToast />
    </NextIntlClientProvider>
  );
}
```

### Clés i18n à ajouter

**`fr.json`** :

```json
"nav": {
  "mainNav": "Navigation principale",
  "profile": "Profil",
  "leaderboard": "Classement",
  "premium": "Premium",
  "login": "Connexion",
  "account": "Mon compte"
}
```

**`en.json`** :

```json
"nav": {
  "mainNav": "Main navigation",
  "profile": "Profile",
  "leaderboard": "Leaderboard",
  "premium": "Premium",
  "login": "Login",
  "account": "Account"
}
```

---

## Considérations UX

- Le lien "Premium" utilise `var(--color-accent)` uniquement si l'utilisateur est free (incitation à upgrader). Sinon : `var(--color-text-muted)` standard.
- Sur mobile (< 640px) : masquer les labels texte, afficher des icônes Unicode simples ou abréviations.
- La nav ne doit pas décaler visuellement la zone de frappe — s'assurer que `min-h-screen` des pages tient compte des 48px de la nav (utiliser `min-h-[calc(100dvh-48px)]` ou équivalent).

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] GlobalNav visible sur toutes les routes (`/`, `/profil`, `/results`, `/classement`, `/premium`, `/auth/login`)
- [ ] Lien actif coloré `var(--color-accent)`
- [ ] Utilisateur non connecté → "Connexion" affiché
- [ ] Utilisateur connecté → pseudo affiché
- [ ] Sticky en haut, ne disparaît pas au scroll
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
feat(nav): add persistent GlobalNav component

Adds a sticky top navigation bar visible on all routes.
Includes links to Profile, Leaderboard, Premium, and auth state.
Active links highlighted with var(--color-accent).
Integrated into [locale]/layout.tsx.
i18n keys added to fr.json and en.json.
```
