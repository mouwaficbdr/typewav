import { HomeClient } from '@/components/typing/HomeClient';
import { litteratureCollection } from '@typewav/collections';

/**
 * Page d'accueil — Server Component.
 * Seule la collection initiale (littérature) est passée au Client Component.
 * Les autres collections sont chargées à la demande via Server Action.
 *
 * Spec : docs/specs/18-performance.md — Lazy loading collections
 */
export default function HomePage() {
  return <HomeClient initialCollection={litteratureCollection} />;
}
