import { HomeClient } from '@/components/typing/HomeClient';
import { JsonLd } from '@/components/ui/JsonLd';
import { APP_URL } from '@/lib/seo';
import { litteratureCollection } from '@typewav/collections';

const WEB_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TypeWav',
  description: 'Immersive musical typing trainer',
  url: APP_URL,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free forever for all typing features',
  },
};

/**
 * Page d'accueil : Server Component.
 * Seule la collection initiale (littérature) est passée au Client Component.
 * Les autres collections sont chargées à la demande via Server Action.
 *
 * Spec : docs/specs/18-performance.md (Lazy loading collections)
 * Spec : docs/specs/17-seo-og.md (JSON-LD WebApplication)
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={WEB_APP_SCHEMA} />
      <HomeClient initialCollection={litteratureCollection} />
    </>
  );
}
