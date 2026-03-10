import { HomeClient } from '@/components/typing/HomeClient';
import {
  codeCollection,
  litteratureCollection,
  poesieCollection,
} from '@typewav/collections';

/**
 * Page d'accueil — Server Component.
 * Les collections sont importées côté serveur et passées au Client Component.
 * La sélection du texte et du mode se fait côté client (HomeClient).
 *
 * Spec : docs/ARCHITECTURE.md — Server vs Client
 */
export default function HomePage() {
  return (
    <HomeClient
      litterature={litteratureCollection}
      poesie={poesieCollection}
      code={codeCollection}
    />
  );
}
