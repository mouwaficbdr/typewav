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
