import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';

const BRAND = 'typewav';

/** Titre de marque complet : repli du layout racine et titre des cartes de partage. */
export const DEFAULT_TITLE = `${BRAND} | Musical typing test`;
/**
 * Accroche courte, façon Monkeytype (« A minimalistic, customizable typing
 * test ») : mène par la fonction (un test de frappe), la musique est
 * l'adjectif. Sert de meta description par défaut sur les pages en anglais.
 */
export const DEFAULT_DESCRIPTION = 'A musical, customizable typing test.';
/** Même accroche, pour les pages en français. */
export const DEFAULT_DESCRIPTION_FR =
  'Un test de frappe musical et personnalisable.';
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://typewav.mouwaficbdr.me';

type Locale = (typeof routing.locales)[number];

type BuildMetadataOptions = {
  /** Langue de la page. Défaut : la locale par défaut du routing (fr). */
  locale?: Locale;
  /** Titre propre à la page ; sinon le titre par défaut de la locale. */
  title?: string;
  /** Description propre à la page ; sinon la description par défaut. */
  description?: string;
};

/**
 * Titres de page courts, sans la marque, par locale. Le gabarit `title.template`
 * ajoute « typewav | » ; le mettre ici aussi donnerait « typewav | typewav | ... ».
 */
const DEFAULT_PAGE_TITLE: Record<Locale, string> = {
  fr: 'Test de frappe musical',
  en: 'Musical typing test',
};

const TITLE_TEMPLATE = `${BRAND} | %s`;

const OG_LOCALE: Record<Locale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
};

/** Préfixe la marque, sauf si le titre la porte déjà (cas de `DEFAULT_TITLE`). */
function brand(title: string): string {
  return title.startsWith(BRAND) ? title : `${BRAND} | ${title}`;
}

/**
 * Métadonnées d'une page, cousues à sa langue.
 *
 * - `alternates.canonical` pointe toujours vers l'URL préfixée par la locale
 *   (`/fr` ou `/en`), jamais la racine nue qui redirige.
 * - `alternates.languages` déclare les hreflang fr / en / x-default.
 * - Les aperçus Open Graph et Twitter reprennent le titre et la description de
 *   la page : ils suivent donc sa langue au lieu de rester en anglais.
 * - Aucune image déclarée ici : la convention `opengraph-image` du dossier
 *   `[locale]` fournit un PNG généré, toujours présent et localisé.
 */
export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const locale = options.locale ?? routing.defaultLocale;
  const pageTitle =
    options.title ??
    (options.locale ? DEFAULT_PAGE_TITLE[locale] : DEFAULT_TITLE);
  const shareTitle = brand(pageTitle);
  const description =
    options.description ??
    (locale === 'fr' ? DEFAULT_DESCRIPTION_FR : DEFAULT_DESCRIPTION);
  const localeUrl = `${APP_URL}/${locale}`;

  return {
    // `absolute` quand le titre est la marque nue (accueil) : sinon le gabarit
    // du layout la préfixe une seconde fois (« typewav | typewav »). Le
    // gabarit reste déclaré pour les sous-pages qui, elles, portent un titre.
    title:
      pageTitle === BRAND
        ? { absolute: pageTitle, template: TITLE_TEMPLATE }
        : { default: pageTitle, template: TITLE_TEMPLATE },
    description,
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
      locale: OG_LOCALE[locale],
      title: shareTitle,
      description,
      url: localeUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
    },
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: localeUrl,
      languages: {
        fr: `${APP_URL}/fr`,
        en: `${APP_URL}/en`,
        'x-default': `${APP_URL}/${routing.defaultLocale}`,
      },
    },
  };
}
