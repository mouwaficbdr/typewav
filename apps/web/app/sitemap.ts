import { routing } from '@/i18n/routing';
import { APP_URL } from '@/lib/seo';
import type { MetadataRoute } from 'next';

/**
 * Pages publiques indexables. Volontairement absentes : `/auth/*` (noindex),
 * `/profil` (privé), `/results` `/replay` `/challenge` `/dev-onboarding`
 * (états de session, sans valeur d'entrée), `/parametres` (utilitaire).
 */
const PUBLIC_PATHS = ['', '/classement', '/premium', '/transparence'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${APP_URL}/${locale}${path}`,
      lastModified,
      changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : 0.6,
      alternates: {
        languages: {
          fr: `${APP_URL}/fr${path}`,
          en: `${APP_URL}/en${path}`,
        },
      },
    })),
  );
}
