/**
 * Disposition clavier physique — QWERTY vs AZERTY.
 *
 * Rien qu'une relation "symétrique à 2" ne suffit pas ici : Q/A et W/Z sont
 * de vrais échanges (2 positions physiques qui échangent leurs 2
 * caractères), mais la position ";" (QWERTY) affiche "m" en AZERTY tandis
 * que la position "m" (QWERTY) affiche "," en AZERTY — 3 caractères
 * distincts sur 2 positions, pas un échange. D'où deux tables séparées
 * plutôt qu'une seule table utilisée dans les deux sens.
 *
 * Ticket #62 : mode Apprentissage, clavier visuel + contenu du niveau 1
 * selon la disposition choisie dans Paramètres.
 */

export type KeyboardLayout = 'qwerty' | 'azerty';

export const KEYBOARD_LAYOUTS: readonly KeyboardLayout[] = [
  'qwerty',
  'azerty',
];

// Position physique (identifiant interne, toujours en label QWERTY) →
// caractère réellement affiché/tapé à cette position en AZERTY.
const QWERTY_ID_TO_AZERTY_CHAR: Record<string, string> = {
  q: 'a',
  w: 'z',
  a: 'q',
  ';': 'm',
  z: 'w',
  m: ',',
};

// Caractère réellement tapé en AZERTY → position physique correspondante
// (identifiant interne, en label QWERTY). Ce n'est PAS l'inverse naïf de la
// table ci-dessus (voir le cas m/,/; en commentaire de tête de fichier).
const AZERTY_CHAR_TO_QWERTY_ID: Record<string, string> = {
  a: 'q',
  z: 'w',
  q: 'a',
  m: ';',
  w: 'z',
  ',': 'm',
};

/** Rendu : quel caractère afficher sur cette position physique. */
export function mapKeyForLayout(key: string, layout: KeyboardLayout): string {
  return layout === 'azerty' ? (QWERTY_ID_TO_AZERTY_CHAR[key] ?? key) : key;
}

/** Lecture : à quelle position physique correspond ce caractère tapé. */
export function resolvePhysicalKey(
  typedChar: string,
  layout: KeyboardLayout,
): string {
  return layout === 'azerty'
    ? (AZERTY_CHAR_TO_QWERTY_ID[typedChar] ?? typedChar)
    : typedChar;
}

/**
 * Rangée du repos réelle en AZERTY : Q S D F J K L M, sans voyelle
 * (contrairement à la QWERTY A S D F J K L ; qui contient le A). Aucun vrai
 * mot français ou anglais ne peut se former avec ces 8 lettres : le niveau 1
 * du mode Apprentissage génère donc des suites de lettres plutôt que des
 * mots réels quand la disposition est AZERTY (voir generateLearningText).
 */
export const HOME_ROW_AZERTY = ['q', 's', 'd', 'f', 'j', 'k', 'l', 'm'];
