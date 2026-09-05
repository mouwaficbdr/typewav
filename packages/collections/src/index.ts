/**
 * @typewav/collections : re-export de toutes les collections officielles.
 */

export { codeCollection } from './code/collection.config';
export { gamingCollection } from './gaming/collection.config';
export { litteratureCollection } from './litterature/collection.config';
export { philosophieCollection } from './philosophie/collection.config';
export { poesieCollection } from './poesie/collection.config';

export const ALL_COLLECTIONS = [
  'litterature',
  'poesie',
  'code',
  'philosophie',
  'gaming',
] as const;
export type CollectionId = (typeof ALL_COLLECTIONS)[number];

export type { FetchOptions } from './fetch';
export { fetchCollection, fetchPool, selectFromTexts } from './fetch';
