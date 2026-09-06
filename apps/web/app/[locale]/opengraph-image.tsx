import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { routing } from '@/i18n/routing';

// Pas de `runtime = 'edge'` : `next/og` tourne sur le runtime Node par défaut,
// et le runtime edge est incompatible avec le `generateStaticParams` du segment
// `[locale]` (les deux images sont pré-générées au build).
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// La carte reprend le vrai wordmark (`components/ui/NavLogo.tsx`) : cinq barres
// de waveform, puis "type" en Courier Prime bold (texture machine à écrire) et
// "wav" en Fraunces italic (l'inflexion musicale). Satori ne voit pas
// `next/font` : les deux fichiers sont vendorés dans `assets/fonts/` et passés
// à `ImageResponse`. Les barres sont des `<div>` (le support SVG multi-`rect`
// de Satori est partiel).
//
// Alignement : Satori ne pose pas proprement `alignItems: 'baseline'` entre
// deux fontes différentes ni pour un `<div>` non textuel. On aligne donc par
// le bas (`flex-end`, déterministe : bord bas des boîtes) et on relève chaque
// bloc de la profondeur de jambage qui le sépare de sa ligne de base, via
// `marginBottom`. Valeurs mesurées au pixel sur le rendu réel (même démarche
// que le `CAP_HEIGHT` de `NavLogo`) : les retoucher sans re-vérifier le rendu
// réintroduit le décalage.
//
// Palette : thème par défaut `cyprus-sand` (`lib/theme/defaultThemes.ts`).
const BG = '#004643';
const INK = '#F0EDE5';

// Lecture au niveau module : la donnée ne dépend pas de la requête.
const courierPrimeBold = await readFile(
  join(process.cwd(), 'assets/fonts/CourierPrime-Bold.ttf'),
);
const frauncesItalic = await readFile(
  join(process.cwd(), 'assets/fonts/Fraunces-Italic-500.ttf'),
);

type Locale = (typeof routing.locales)[number];

const COPY: Record<Locale, { alt: string; tagline: string }> = {
  fr: {
    alt: 'TypeWav : un test de frappe musical et personnalisable',
    tagline: 'Chaque frappe juste joue une note.',
  },
  en: {
    alt: 'TypeWav: a musical, customizable typing test',
    tagline: 'Every keystroke plays a note.',
  },
};

// "type" et "wav" à la même taille : deux fontes, un seul corps.
const WORDMARK_SIZE = 132;

// Rangée alignée par le bas (`flex-end`). `marginBottom` relève chaque bloc de
// la profondeur qui sépare le bas de sa boîte de la baseline commune. Mesuré
// au pixel sur le rendu réel (cf. commentaire d'en-tête).
const TYPE_LIFT = 0; // "type" est la référence
const WAV_LIFT = 18; // Fraunces italic tombe plus bas que Courier
const BARS_LIFT = 23; // pose le bas des barres sur la baseline, hors jambage

// Barres de waveform : proportions de `NavLogo` (`24 17 21 17 24` de haut,
// largeur 4, pas 7, dans une boîte de 28) remises à l'échelle d'une hauteur
// de capitale (~0,63 × la taille du wordmark) : "type" dépasse d'un cheveu.
const MARK_HEIGHT = 84;
const BAR_HEIGHTS = [72, 50, 62, 50, 72];
const BAR_WIDTH = 12;
const BAR_GAP = 9;
const BAR_RADIUS = 5;

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
  const { tagline } = COPY[resolveLocale(locale)];

  return new ImageResponse(
    (
      <div
        style={{
          background: BG,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          fontFamily: 'Courier Prime',
        }}
      >
        {/* Wordmark : la pile de barres, puis "type" + "wav" en une seule unité.
            Tout aligné par le bas (`flex-end`), chaque bloc relevé jusqu'à la
            baseline commune (voir constantes *_LIFT). */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: BAR_GAP,
              height: MARK_HEIGHT,
              marginBottom: BARS_LIFT,
            }}
          >
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                style={{
                  width: BAR_WIDTH,
                  height: h,
                  borderRadius: BAR_RADIUS,
                  backgroundColor: INK,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'Courier Prime',
                fontWeight: 700,
                fontSize: WORDMARK_SIZE,
                letterSpacing: -2,
                lineHeight: 1,
                color: INK,
                marginBottom: TYPE_LIFT,
              }}
            >
              type
            </span>
            <span
              style={{
                fontFamily: 'Fraunces',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: WORDMARK_SIZE,
                marginLeft: 1,
                lineHeight: 1,
                color: INK,
                marginBottom: WAV_LIFT,
              }}
            >
              wav
            </span>
          </div>
        </div>

        <div
          style={{
            fontFamily: 'Fraunces',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: 0.5,
            color: 'rgba(240, 237, 229, 0.72)',
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Courier Prime',
          data: courierPrimeBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Fraunces',
          data: frauncesItalic,
          style: 'italic',
          weight: 500,
        },
      ],
    },
  );
}
