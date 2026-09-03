import { APP_URL } from '@/lib/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*/auth/',
        '/*/profil',
        '/*/results',
        '/*/replay',
        '/*/dev-onboarding',
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
