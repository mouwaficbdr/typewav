# Spec 17 — SEO / OG / Structured Data

> **Priorité : 🔵 VISION**
> **Effort estimé : 3-4 fichiers**
> **Commit cible : `feat(seo): add OG tags, Twitter cards and structured data`**

---

## Contexte et problème

TypeWav n'a actuellement :

- Aucune balise OG (`og:title`, `og:description`, `og:image`)
- Aucune Twitter card
- Aucune `og:image` dynamique (crucial pour les partages de replay/challenge)
- Aucun schéma JSON-LD (WebApplication, FAQPage)
- Un seul viewport `<meta>` dans le root layout
- Des URLs de partage avec locale (`/fr/challenge?c=...`) — non canoniques pour l'international

TypeWav a un angle **unique** ("musical typing trainer") qui est un zéro-compétition en SEO long-tail.

---

## Objectif

1. Métadonnées statiques correctes sur toutes les pages publiques
2. `og:image` dynamique via Next.js `opengraph-image.tsx` sur les pages clés
3. Schéma JSON-LD `WebApplication` sur la home
4. `canonical` URL pointing to sans-locale version

---

## Fichiers à modifier / créer

```
# Modifier
apps/web/app/layout.tsx                     ← metadata root + viewport
apps/web/app/[locale]/layout.tsx            ← metadata locale avec OG

# Créer (OG images dynamiques)
apps/web/app/[locale]/opengraph-image.tsx   ← OG image home (ImageResponse)
apps/web/app/[locale]/twitter-image.tsx     ← Twitter card home

# Créer (JSON-LD)
apps/web/components/ui/JsonLd.tsx           ← composant Server pour JSON-LD

# Créer (SEO helpers)
apps/web/lib/seo.ts                         ← helpers buildMetadata(), buildOgImage()
```

---

## Implémentation

### `apps/web/lib/seo.ts`

```typescript
import type { Metadata } from 'next';

export const DEFAULT_TITLE = 'TypeWav — Musical Typing Trainer';
export const DEFAULT_DESCRIPTION =
  'Type in rhythm. Every correct keystroke plays a musical note. ' +
  'Improve your typing speed with an immersive audio experience. Free, open source.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://typewav.app';

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    title: {
      default: DEFAULT_TITLE,
      template: '%s — TypeWav',
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
      'typing trainer',
      'musical typing',
      'typing speed',
      'WPM test',
      'monkeytype alternative',
      'audio typing',
      'immersive typing',
      'open source',
    ],
    authors: [{ name: 'TypeWav contributors' }],
    creator: 'TypeWav',
    openGraph: {
      type: 'website',
      siteName: 'TypeWav',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: APP_URL,
      images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [`${APP_URL}/og-image.png`],
    },
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: APP_URL,
    },
    ...overrides,
  };
}
```

### `apps/web/app/layout.tsx` — root layout metadata

```tsx
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata();
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};
```

### `apps/web/app/[locale]/layout.tsx` — locale layout

Utiliser `buildMetadata()` avec override par locale :

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  // Simplification : utiliser les descriptions hardcodées par locale
  if (locale === 'en') {
    return buildMetadata({
      alternates: { canonical: `${APP_URL}/en` },
    });
  }
  return buildMetadata({
    title: 'TypeWav — Musicothérapie du clavier',
    description:
      'Tapez en musique. Chaque frappe correcte produit une note. Entraînement au typing avec une expérience audio immersive.',
    alternates: { canonical: APP_URL },
  });
}
```

### `apps/web/components/ui/JsonLd.tsx`

```tsx
/**
 * JsonLd — injecte un bloc JSON-LD structuré dans le <head>.
 * Server Component — pas de JavaScript côté client.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

**Utilisation dans `[locale]/page.tsx`** :

```tsx
import { JsonLd } from '@/components/ui/JsonLd';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TypeWav',
    description: 'Immersive musical typing trainer',
    url: 'https://typewav.app',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free forever for all typing features',
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeClient ... />
    </>
  );
}
```

### `opengraph-image.tsx` — Image dynamique Next.js

```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TypeWav — Musical Typing Trainer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#000000',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 300,
          color: '#E8E8E8',
          letterSpacing: '0.05em',
        }}
      >
        TypeWav
      </div>
      <div style={{ fontSize: 28, color: '#00D4AA' }}>
        Every keystroke plays a note.
      </div>
      <div style={{ fontSize: 18, color: '#888888', marginTop: 8 }}>
        Free • Open Source • Musical Typing Trainer
      </div>
    </div>,
    { ...size },
  );
}
```

---

## URLs canoniques sans locale

Modifier le middleware next-intl (`apps/web/middleware.ts` ou `i18n/routing.ts`) pour accepter les routes sans locale et rediriger vers `/[detected-locale]/...`.

Les URLs `/challenge?c=...` et `/replay?d=...` doivent être partageables sans locale, avec redirect automatique vers la locale détectée (Accept-Language ou locale par défaut `fr`).

Vérifier la config `routing` dans `apps/web/i18n/routing.ts` :

```typescript
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // s'assurer que localePrefix: 'as-needed' est actif (fr sans préfixe, en avec /en/)
  // OU localePrefix: 'always' (les deux avec préfixe)
});
```

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm build` : 0 erreur
- [ ] Partage sur Twitter : OG image TypeWav visible (tester via opengraph.xyz)
- [ ] Partage sur Slack : titre et description corrects
- [ ] `<script type="application/ld+json">` présent sur la home
- [ ] Meta `description` unique par page (home ≠ profil ≠ premium)
- [ ] URL canonique correcte dans les balises `<link rel="canonical">`

---

## Commit

```
feat(seo): add OG tags, Twitter cards, JSON-LD and viewport metadata

Adds buildMetadata() helper in lib/seo.ts.
Adds openGraph and twitter metadata to root and locale layouts.
Adds WebApplication JSON-LD schema to home page.
Adds opengraph-image.tsx dynamic OG image (Next.js ImageResponse).
```
