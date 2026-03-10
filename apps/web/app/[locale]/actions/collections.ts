'use server';

/**
 * Server Actions pour le chargement lazy des collections.
 * Appelées depuis HomeClient lors du changement d'onglet.
 * Spec : docs/specs/18-performance.md
 */

import {
  codeCollection,
  gamingCollection,
  litteratureCollection,
  philosophieCollection,
  poesieCollection,
} from '@typewav/collections';
import type { CollectionConfig } from '@typewav/types';

export type CollectionId =
  | 'litterature'
  | 'poesie'
  | 'code'
  | 'philosophie'
  | 'gaming';

const COLLECTIONS: Record<CollectionId, CollectionConfig> = {
  litterature: litteratureCollection,
  poesie: poesieCollection,
  code: codeCollection,
  philosophie: philosophieCollection,
  gaming: gamingCollection,
};

export async function fetchCollection(
  id: CollectionId,
): Promise<CollectionConfig> {
  const collection = COLLECTIONS[id];
  if (!collection) throw new Error(`Collection inconnue : ${id}`);
  return collection;
}
