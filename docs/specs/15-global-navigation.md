# Spec 15 — Navigation Globale Persistante (GlobalNav) — v2

> **Mise à jour le : 11 Mars 2026**
> **Version originale : 10 Mars 2026**
> **Sévérité : 🟠 HAUTE #5**
> **Source mise à jour : FORGE_NOTES.md — Point [1.2]**

> ⚠️ **MISE À JOUR FORGE** : Le design de la GlobalNav a été significativement repensé
> par rapport à la V1. Cette spec remplace entièrement la version originale.
> Les changements clés : navigation icônes-only, style flottant backdrop-blur,
> logo SVG composite `[▁▃▅] TypeWav█`.

---

## Contexte et problème

TypeWav n'a aucune navigation globale. Routes invisibles sans connaître les URLs.
Voir spec-11 item #5 pour le contexte complet.

---

## Design — FORGE [1.2]

### Structure

```
[Logo]    [⌨ home]  [⌃ classement]  [★ premium]       [🔔 notif]  [○ profil/connexion]
```

**Style :**

- Navigation **flottante** — aucune bordure, aucun fond solide
- `backdrop-filter: blur(8px)` + `background: color-mix(in srgb, var(--color-bg) 70%, transparent)`
- **Icônes uniquement** — pas de labels texte (comme MonkeyType)
- Height : 48px
- `position: sticky; top: 0; z-index: 50`

### Logo — `[▁▃▅] TypeWav█`

- `[▁▃▅]` : SVG custom — 3 barres verticales (égaliseur audio), `--color-accent` (teal), 12×14px
  - Animation barres : **au chargement de la page uniquement** (monte de 0 une fois, se fige ensuite)
  - Classe CSS `nav-logo-bars` — animation CSS keyframe `barRise` une seule itération
  - **Pas d'animation pendant que l'utilisateur tape**
- `TypeWav` : Cormorant Garamond, font-weight 300, `--font-display`
- `█` : curseur clignotant, `--color-accent`, animation CSS `cursor-blink`
- Ensemble lié : clic → `/{locale}/`

---

## Fichiers à modifier / créer

```
# Créer
apps/web/components/ui/GlobalNav.tsx
apps/web/components/ui/NavLogo.tsx              ← SVG logo séparé (réutilisable sur /auth)
apps/web/components/ui/__tests__/GlobalNav.test.tsx

# Modifier
apps/web/app/[locale]/layout.tsx               ← intégrer GlobalNav
apps/web/messages/fr.json                       ← clés nav.*
apps/web/messages/en.json
```

---

## Implémentation

### `NavLogo.tsx`

```tsx
'use client';

/**
 * NavLogo — composition [▁▃▅] TypeWav█
 *
 * Utilisé dans GlobalNav et sur les pages /auth/*.
 * Client Component justifié : animation CSS contrôlée par JS (stopAnimation après mount).
 * La barre SVG s'anime au chargement une seule fois, puis se fige.
 */

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface NavLogoProps {
  locale: string;
  /** Si true, le curseur clignotant est visible (défaut : true) */
  showCursor?: boolean;
}

export function NavLogo({ locale, showCursor = true }: NavLogoProps) {
  const barsRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Arrêter l'animation après 600ms (une seule "montée")
    const timer = setTimeout(() => {
      if (barsRef.current) {
        barsRef.current.style.animationPlayState = 'paused';
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      href={`/${locale}`}
      aria-label="TypeWav — Retour à l'accueil"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* SVG égaliseur [▁▃▅] */}
      <svg
        ref={barsRef}
        width="12"
        height="14"
        viewBox="0 0 12 14"
        fill="none"
        aria-hidden="true"
        className="nav-logo-bars"
        style={{ flexShrink: 0 }}
      >
        {/* 3 barres : graves (gauche) → aigus (droite) */}
        <rect
          x="0"
          y="10"
          width="3"
          height="4"
          fill="var(--color-accent)"
          rx="0.5"
        />
        <rect
          x="4.5"
          y="6"
          width="3"
          height="8"
          fill="var(--color-accent)"
          rx="0.5"
        />
        <rect
          x="9"
          y="2"
          width="3"
          height="12"
          fill="var(--color-accent)"
          rx="0.5"
        />
      </svg>

      {/* TypeWav + curseur */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.125rem',
          color: 'var(--color-text-primary)',
          letterSpacing: '0.05em',
        }}
      >
        TypeWav
        {showCursor && (
          <span
            aria-hidden="true"
            className="cursor-blink"
            style={{ color: 'var(--color-accent)' }}
          >
            █
          </span>
        )}
      </span>
    </Link>
  );
}
```

**CSS global à ajouter dans `globals.css` :**

```css
/* Animation barres logo — une seule itération au chargement */
@keyframes barRise {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
    transform-origin: bottom;
  }
}

.nav-logo-bars rect {
  transform-origin: bottom;
  animation: barRise 0.4s ease-out 1 forwards;
}
.nav-logo-bars rect:nth-child(1) {
  animation-delay: 0ms;
}
.nav-logo-bars rect:nth-child(2) {
  animation-delay: 80ms;
}
.nav-logo-bars rect:nth-child(3) {
  animation-delay: 160ms;
}

/* Curseur clignotant TypeWav█ */
@keyframes cursorBlink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
.cursor-blink {
  animation: cursorBlink 1.2s step-end infinite;
}
```

### `GlobalNav.tsx`

```tsx
'use client';

/**
 * GlobalNav — barre de navigation persistante et flottante.
 *
 * Icônes uniquement (pas de labels texte). Flottante (backdrop-blur).
 * Client Component justifié : usePathname() (état actif), useUser().
 */

import { NavLogo } from './NavLogo';
import { useUser } from '@/hooks/useUser';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Icônes Unicode simples — substituer par des SVG si une lib d'icônes est ajoutée */
const NAV_ITEMS = [
  { key: 'home', icon: '⌨', path: '' }, // /{locale}
  { key: 'leaderboard', icon: '◎', path: 'classement' },
  { key: 'premium', icon: '★', path: 'premium' },
] as const;

export function GlobalNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
        backdropFilter: 'blur(8px)',
        background: 'color-mix(in srgb, var(--color-bg) 70%, transparent)',
      }}
    >
      {/* Logo */}
      <NavLogo locale={locale} />

      {/* Liens principaux — icônes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {NAV_ITEMS.map(({ key, icon, path }) => {
          const href = path ? `/${locale}/${path}` : `/${locale}`;
          const isActive = path
            ? pathname.startsWith(`/${locale}/${path}`)
            : pathname === `/${locale}` || pathname === `/${locale}/`;

          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              className="hover:text-[var(--color-text-primary)]"
            >
              {icon}
            </Link>
          );
        })}
      </div>

      {/* Auth state — icône profil ou connexion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <Link
            href={`/${locale}/profil`}
            aria-label={`Profil — ${user.user_metadata?.pseudo ?? user.email?.split('@')[0] ?? 'Compte'}`}
            aria-current={
              pathname.startsWith(`/${locale}/profil`) ? 'page' : undefined
            }
            style={{
              color: pathname.startsWith(`/${locale}/profil`)
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
          >
            ○
          </Link>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            aria-label="Se connecter"
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-ui)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            className="hover:text-[var(--color-accent)]"
          >
            Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}
```

### Intégration dans `[locale]/layout.tsx`

```tsx
import { GlobalNav } from '@/components/ui/GlobalNav';

export default async function LocaleLayout({ children, params }: Props) {
  return (
    <NextIntlClientProvider messages={messages}>
      <GlobalNav />
      {children}
      <MilestoneToast />
    </NextIntlClientProvider>
  );
}
```

**Important** : Les pages qui utilisent `min-h-dvh` doivent ajuster la hauteur pour tenir
compte des 48px de la nav : `min-h-[calc(100dvh-48px)]`.

---

## Clés i18n

La nav est icon-only — les clés i18n servent uniquement aux `aria-label`.

**`fr.json`** — dans le namespace `nav` :

```json
"nav": {
  "home": "Retour à l'accueil",
  "leaderboard": "Classement",
  "premium": "Premium",
  "profile": "Mon profil",
  "login": "Se connecter"
}
```

**`en.json`** :

```json
"nav": {
  "home": "Back to home",
  "leaderboard": "Leaderboard",
  "premium": "Premium",
  "profile": "My profile",
  "login": "Sign in"
}
```

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
// apps/web/components/ui/__tests__/GlobalNav.test.tsx

describe('GlobalNav', () => {
  it('affiche le logo NavLogo', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /typewav/i })).toBeInTheDocument();
  });

  it('affiche les liens home, classement, premium', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /classement/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /premium/i })).toBeInTheDocument();
  });

  it('affiche "Connexion" si utilisateur non connecté', () => {
    // Mock useUser → { user: null }
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /connexion/i })).toBeInTheDocument();
  });

  it('affiche le lien profil si utilisateur connecté', () => {
    // Mock useUser → { user: { user_metadata: { pseudo: 'Alice' } } }
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /profil/i })).toBeInTheDocument();
  });

  it('marque le lien actif avec aria-current="page"', () => {
    // Mock usePathname → '/fr/classement'
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /classement/i }))
      .toHaveAttribute('aria-current', 'page');
  });

  it('les liens incluent la locale courante', () => {
    // Mock useLocale → 'en'
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /classement/i }))
      .toHaveAttribute('href', '/en/classement');
  });
});

describe('NavLogo', () => {
  it('contient un lien vers /{locale}/', () => {
    render(<NavLogo locale="fr" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/fr');
  });

  it('affiche le texte TypeWav', () => {
    render(<NavLogo locale="fr" />);
    expect(screen.getByText(/TypeWav/)).toBeInTheDocument();
  });
});
```

---

## Validation — Checklist d'acceptance

- [ ] Nav visible sur toutes les routes (`/`, `/profil`, `/results`, `/classement`, `/premium`)
- [ ] Style flottant : backdrop-blur, pas de bordure, pas de fond solide
- [ ] Logo `[▁▃▅] TypeWav█` — SVG barres en teal, Police Cormorant Garamond 300
- [ ] Animation barres logo : se déclenche une seule fois au chargement
- [ ] Curseur `█` clignote
- [ ] Lien actif : `--color-accent`
- [ ] Utilisateur non connecté → "Connexion"
- [ ] Utilisateur connecté → lien profil icône ○
- [ ] Sticky — reste visible au scroll
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` : 0 erreur

---

## Commit

```
feat(nav): floating GlobalNav with SVG logo [▁▃▅] TypeWav█

- NavLogo: SVG equalizer bars (teal, load-once animation) + Cormorant Garamond
  weight 300 + blinking cursor — visible on all auth pages too
- GlobalNav: floating nav (backdrop-blur) with icon-only links
  (home ⌨, leaderboard ◎, premium ★, profile ○)
- Integrate into [locale]/layout.tsx — visible on all routes
- i18n aria-labels added (fr + en)
- CSS: barRise animation (one-shot) + cursorBlink keyframes

Replaces spec-15 v1 (text labels) with FORGE [1.2] icon-only floating design.
```
