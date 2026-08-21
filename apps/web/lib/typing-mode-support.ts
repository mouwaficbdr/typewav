import type { TypingMode } from '@typewav/types';

// Modes dont le texte provient du pipeline de sélection partagé de
// HomeClient (collection + langue + ponctuation/chiffres, voir
// selectFromTexts/applyTextFilters) et qui exposent donc les mêmes
// contrôles : ConfigBar (modificateurs), ContextSelectors (langue),
// CollectionSelector (collection). Source unique : les trois composants
// doivent importer cette liste plutôt que la dupliquer, sous peine de
// pouvoir diverger silencieusement (voir l'incohérence Fantôme/Apprentissage
// corrigée dans HomeClient).
export const MODES_WITH_TEXT_CONFIG: readonly TypingMode[] = [
  'classic',
  'sprint',
  'zen',
  'quote',
];
