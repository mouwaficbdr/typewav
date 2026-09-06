import { ImageResponse } from 'next/og';

import { routing } from '@/i18n/routing';

// Pas de `runtime = 'edge'` : `next/og` tourne sur le runtime Node par défaut,
// et le runtime edge est incompatible avec le `generateStaticParams` du segment
// `[locale]` (les deux images sont pré-générées au build).
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Locale = (typeof routing.locales)[number];

const COPY: Record<Locale, { alt: string; tagline: string; footer: string }> = {
  fr: {
    alt: 'TypeWav : un test de frappe musical et personnalisable',
    tagline: 'Chaque frappe juste joue une note.',
    footer: 'Gratuit • Open source • Test de frappe musical et personnalisable',
  },
  en: {
    alt: 'TypeWav: a musical, customizable typing test',
    tagline: 'Every keystroke plays a note.',
    footer: 'Free • Open source • A musical, customizable typing test',
  },
};

function resolveLocale(raw: string): Locale {
  return routing.locales.includes(raw as Locale)
    ? (raw as Locale)
    : routing.defaultLocale;
}

// Next.js 16 : `generateImageMetadata` reçoit `params` de façon synchrone...
export function generateImageMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { alt } = COPY[resolveLocale(params.locale)];
  return [{ id: 'default', alt, size, contentType }];
}

// ...alors que la fonction d'image, elle, reçoit `params` en promesse.
export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { tagline, footer } = COPY[resolveLocale(locale)];

  return new ImageResponse(
    (
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
        <div style={{ fontSize: 28, color: '#00D4AA' }}>{tagline}</div>
        <div style={{ fontSize: 18, color: '#888888', marginTop: 8 }}>
          {footer}
        </div>
      </div>
    ),
    { ...size },
  );
}
