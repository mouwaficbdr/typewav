import type { CollectionId } from '@typewav/collections';

// Collections dont le champ `source` de chaque texte n'est pas une vraie
// citation (attribution auteur/œuvre/année, voir litterature/poesie/
// philosophie) mais un simple label technique ou interne ('TypeScript —
// exemple original', 'TypeWav — Texte original'...). Le mode Citation
// affiche `source` comme une attribution : lui présenter un texte de l'une
// de ces collections mentirait sur ce que c'est. Source unique pour
// CollectionSelector (filtrage du menu) et HomeClient (auto-correction à
// l'entrée en mode Citation) : ne pas dupliquer cette liste ailleurs.
export const NON_CITABLE_COLLECTIONS: readonly CollectionId[] = [
  'code',
  'gaming',
];
