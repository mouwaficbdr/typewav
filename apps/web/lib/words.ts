/**
 * Listes de mots pour le mode classique, apprentissage et niveaux adaptatifs.
 * Tous les mots sont en domaine public.
 *
 * Organisés par longueur pour la difficulté adaptative.
 */

import {
  HOME_ROW_AZERTY,
  mapKeyForLayout,
  type KeyboardLayout,
} from '@/lib/keyboardLayouts';
import { LEARNING_LEVELS } from '@typewav/types';

/** Niveau facile : mots courts et tres frequents (2 a 4 lettres). */
export const WORDS_EASY = [
  // Français : outils grammaticaux et mots du quotidien
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'en', 'et', 'ou', 'est',
  'son', 'sur', 'par', 'pas', 'que', 'qui', 'se', 'si', 'au', 'aux', 'ce',
  'il', 'elle', 'on', 'je', 'tu', 'nous', 'vous', 'ma', 'ta', 'sa', 'mes',
  'tes', 'ses', 'nos', 'vos', 'ni', 'or', 'car', 'dans', 'avec', 'sans',
  'sous', 'pour', 'vers', 'chez', 'lui', 'eux', 'moi', 'toi', 'ton', 'leur',
  'bien', 'mal', 'peu', 'trop', 'fort', 'haut', 'bas', 'loin', 'vite', 'jour',
  'nuit', 'mois', 'ans', 'eau', 'air', 'feu', 'vent', 'mer', 'ciel', 'sol',
  'nom', 'mot', 'vie', 'main', 'pied', 'dos', 'bras', 'peau', 'cri', 'voix',
  'don', 'loi', 'roi', 'paix', 'joie', 'peur', 'faim', 'rire', 'mur', 'toit',
  'lit', 'pain', 'vin', 'sel', 'rue', 'pays', 'fin', 'ile', 'lac', 'pont',
  'ami', 'port', 'banc', 'tas', 'sac', 'clef', 'oie', 'roc', 'val', 'pre',
  // Anglais : mots les plus fréquents
  'the', 'of', 'to', 'and', 'in', 'is', 'it', 'be', 'as', 'at', 'so', 'we',
  'he', 'by', 'do', 'if', 'me', 'my', 'up', 'an', 'they', 'all', 'any', 'can',
  'far', 'few', 'had', 'has', 'her', 'him', 'his', 'how', 'its', 'let', 'may',
  'men', 'off', 'one', 'out', 'put', 'run', 'saw', 'see', 'too', 'two', 'use',
  'war', 'was', 'way', 'who', 'why', 'win', 'yes', 'yet', 'big', 'boy', 'cap',
  'cup', 'day', 'dog', 'ear', 'eat', 'end', 'eye', 'fun', 'job', 'key', 'kid',
  'leg', 'lot', 'low', 'map', 'net', 'new', 'now', 'old', 'own', 'pay', 'pen',
  'pet', 'pot', 'row', 'sad', 'sea', 'set', 'sit', 'sky', 'sun', 'ten', 'tie',
  'top', 'toy', 'wet', 'arm', 'bag', 'bed', 'bus', 'cat', 'cut', 'age', 'ago',
  'act', 'aim', 'bad', 'bit', 'buy', 'cry', 'did', 'die', 'dry', 'due', 'fly',
];

/** Niveau normal : mots courants de longueur moyenne (5 a 7 lettres). */
export const WORDS_NORMAL = [
  // Français
  'monde', 'temps', 'place', 'homme', 'femme', 'faire', 'grand', 'entre',
  'aussi', 'après', 'avant', 'toute', 'comme', 'autre', 'selon', 'jamais',
  'encore', 'depuis', 'chaque', 'quelle', 'premier', 'dernier', 'certain',
  'nouveau', 'ancien', 'jeune', 'vieux', 'petite', 'longue', 'court', 'lourd',
  'leger', 'chaud', 'froid', 'clair', 'sombre', 'calme', 'vivant', 'ouvert',
  'plein', 'seul', 'route', 'chemin', 'ville', 'champ', 'foret', 'jardin',
  'maison', 'fenetre', 'lumiere', 'ombre', 'matin', 'soir', 'saison', 'annee',
  'heure', 'minute', 'siecle', 'parole', 'musique', 'couleur', 'image',
  'papier', 'livre', 'lettre', 'nombre', 'effort', 'repos', 'voyage', 'depart',
  'retour', 'nuage', 'orage', 'pierre', 'sable', 'herbe', 'racine', 'branche',
  // Anglais
  'while', 'every', 'first', 'could', 'their', 'found', 'watch', 'night',
  'write', 'under', 'never', 'times', 'those', 'light', 'about', 'heart',
  'think', 'bring', 'house', 'learn', 'music', 'today', 'below', 'order',
  'power', 'point', 'world', 'water', 'earth', 'field', 'river', 'ocean',
  'cloud', 'storm', 'green', 'white', 'black', 'brown', 'small', 'large',
  'quick', 'quiet', 'sharp', 'sweet', 'plain', 'proud', 'brave', 'clean',
  'clear', 'close', 'early', 'happy', 'young', 'other', 'still', 'again',
  'often', 'since', 'until', 'after', 'above', 'along', 'among', 'front',
  'right', 'sound', 'voice', 'story', 'paper', 'floor', 'table', 'chair',
  'money', 'price', 'value', 'trade', 'skill', 'trust', 'sense', 'truth',
  'dream', 'sleep', 'peace', 'grace', 'faith', 'blood', 'stone', 'metal',
  'glass', 'wheel', 'engine', 'signal', 'system', 'circle', 'square', 'planet',
];

/** Niveau difficile : mots plus longs ou moins frequents (7 a 10 lettres). */
export const WORDS_HARD = [
  // Français
  'formation', 'possible', 'prochaine', 'politique', 'question', 'distance',
  'ensemble', 'plusieurs', 'longtemps', 'autrefois', 'lentement', 'rapidement',
  'silencieux', 'lumineuse', 'nombreuse', 'profonde', 'lointaine', 'nouvelle',
  'ancienne', 'ordinaire', 'veritable', 'invisible', 'immobile', 'fabuleux',
  'histoire', 'mystere', 'memoire', 'presence', 'frontiere', 'campagne',
  'quartier', 'batiment', 'escalier', 'peinture', 'sculpture', 'chapitre',
  'exercice', 'methode', 'reussite', 'sagesse', 'patience', 'confiance',
  'attention', 'direction', 'situation', 'condition', 'expression', 'evolution',
  // Anglais
  'beautiful', 'together', 'standard', 'function', 'keyboard', 'practice',
  'accuracy', 'language', 'thousand', 'sentence', 'children', 'complete',
  'mountain', 'progress', 'learning', 'software', 'position', 'personal',
  'building', 'sunlight', 'daylight', 'midnight', 'lightning', 'thunder',
  'weather', 'harbour', 'village', 'kitchen', 'ceiling', 'circuit', 'battery',
  'network', 'channel', 'pattern', 'texture', 'balance', 'measure', 'quality',
  'quantity', 'purpose', 'meaning', 'library', 'grammar', 'lecture', 'student',
  'teacher', 'science', 'history', 'freedom', 'justice', 'courage', 'silence',
  'crystal', 'horizon', 'gravity', 'pressure', 'friction', 'momentum',
];

/** Niveau expert : mots longs et rares (11 lettres et plus). */
export const WORDS_EXPERT = [
  // Français
  'développement', 'organisation', 'performance', 'apprentissage',
  'programmation', 'environnement', 'communication', 'technologie',
  'information', 'architecture', 'intelligence', 'connaissance',
  'compréhension', 'représentation', 'expérimentation', 'considération',
  'responsabilité', 'personnalité', 'possibilité', 'gouvernement',
  'établissement', 'raisonnement', 'enseignement', 'bibliothèque',
  'mathématiques', 'philosophique', 'psychologique', 'extraordinaire',
  'incontournable', 'imperceptible', 'indispensable', 'immédiatement',
  'progressivement', 'silencieusement', 'particularité', 'reconnaissance',
  // Anglais
  'understanding', 'development', 'relationship', 'professional',
  'productivity', 'independently', 'concentration', 'approximately',
  'deliberately', 'configuration', 'investigation', 'consideration',
  'representation', 'transformation', 'implementation', 'infrastructure',
  'responsibility', 'accountability', 'accessibility', 'sustainability',
  'international', 'environmental', 'philosophical', 'psychological',
  'extraordinary', 'unpredictable', 'irreplaceable', 'uncomfortable',
  'automatically', 'consequently', 'nevertheless', 'simultaneously',
  'characteristic', 'documentation', 'collaboration', 'determination',
];

/**
 * Mots Home Row : lettres tirées uniquement des touches a s d f j k l.
 * generateLearningText(1) refiltre par les touches réelles du niveau, donc
 * un mot avec une lettre hors home row (jade, flash, balls...) n'y arrivait
 * jamais : c'était du poids mort. Retiré aussi 'jall', qui passait le filtre
 * sans être un mot. Tout ce qui reste est un vrai mot 100 % home row.
 */
export const WORDS_HOME_ROW = [
  'ad',
  'as',
  'add',
  'ads',
  'ala',
  'all',
  'ask',
  'dad',
  'fad',
  'lad',
  'sad',
  'ska',
  'adds',
  'alas',
  'alfa',
  'asks',
  'dads',
  'fads',
  'fall',
  'flak',
  'lads',
  'lass',
  'sass',
  'flask',
  'salad',
  'salsa',
  'falls',
  'flasks',
  'salads',
  'salsas',
  'alfalfa',
];

/** Sélectionne des mots aléatoires d'une liste */
export function pickRandomWords(words: string[], count: number): string[] {
  const result: string[] = [];
  const available = [...words];

  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx] as string);
    available.splice(idx, 1);

    // Recycler si on n'a pas assez de mots uniques
    if (available.length === 0) available.push(...words);
  }

  return result;
}

/**
 * Génère un texte de test avec N mots selon le niveau de complexité.
 * complexity: 1 (très simple) → 5 (expert)
 */
export function generateWordList(complexity: number, wordCount = 30): string {
  const level = Math.max(1, Math.min(5, complexity));

  let pool: string[];
  if (level === 1) pool = WORDS_EASY;
  else if (level === 2) pool = [...WORDS_EASY, ...WORDS_NORMAL];
  else if (level === 3) pool = WORDS_NORMAL;
  else if (level === 4) pool = [...WORDS_NORMAL, ...WORDS_HARD];
  else pool = [...WORDS_HARD, ...WORDS_EXPERT];

  return pickRandomWords(pool, wordCount).join(' ');
}

/** Ne garde que les mots dont toutes les lettres sont dans `allowedKeys`. */
function filterWordsByKeys(words: string[], allowedKeys: string[]): string[] {
  if (allowedKeys.length === 0) return words;
  const allowed = new Set(allowedKeys.map((k) => k.toLowerCase()));
  return words.filter((word) =>
    word
      .toLowerCase()
      .split('')
      .every((ch) => allowed.has(ch)),
  );
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0]!.toUpperCase() + word.slice(1);
}

const SENTENCE_TERMINATORS = ['.', '!', '?'];
const SENTENCE_LENGTH = 5;

/**
 * Génère un texte avec majuscules de début de phrase et ponctuation
 * (niveau 5 "Shift & Punctuation"). Le thème du niveau est justement
 * d'introduire Shift et la ponctuation, donc leur présence est garantie
 * plutôt que laissée au hasard.
 */
function generatePunctuatedText(wordCount: number): string {
  const words = pickRandomWords([...WORDS_NORMAL, ...WORDS_HARD], wordCount);

  const sentences: string[] = [];
  for (let start = 0; start < words.length; start += SENTENCE_LENGTH) {
    const sentenceWords = words.slice(start, start + SENTENCE_LENGTH);
    if (sentenceWords.length === 0) continue;

    const [first, ...rest] = sentenceWords;
    const capitalized = capitalize(first!);
    // Virgule après le deuxième mot pour les phrases assez longues.
    const withComma =
      rest.length >= 2 ? [`${rest[0]},`, ...rest.slice(1)] : rest;
    const terminator =
      SENTENCE_TERMINATORS[sentences.length % SENTENCE_TERMINATORS.length]!;

    sentences.push(`${[capitalized, ...withComma].join(' ')}${terminator}`);
  }

  return sentences.join(' ');
}

/**
 * Génère un texte pour le mode Apprentissage selon le niveau.
 * Les mots n'utilisent que les touches autorisées au niveau courant.
 */
// Longueurs qui imitent la variété naturelle de WORDS_HOME_ROW (2 à 7
// lettres). Aucun vrai mot ne tient sur les 8 lettres de HOME_ROW_AZERTY
// (aucune voyelle) : on tire donc des suites de lettres façon exercice
// plutôt que des mots, uniquement pour ce cas.
const AZERTY_DRILL_LENGTHS = [2, 3, 3, 4, 4, 5];

function generateAzertyHomeRowDrill(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const length =
      AZERTY_DRILL_LENGTHS[
        Math.floor(Math.random() * AZERTY_DRILL_LENGTHS.length)
      ]!;
    let word = '';
    for (let j = 0; j < length; j++) {
      word +=
        HOME_ROW_AZERTY[Math.floor(Math.random() * HOME_ROW_AZERTY.length)];
    }
    words.push(word);
  }
  return words.join(' ');
}

export function generateLearningText(
  levelId: number,
  wordCount = 20,
  layout: KeyboardLayout = 'qwerty',
): string {
  if (levelId === 1 && layout === 'azerty') {
    return generateAzertyHomeRowDrill(wordCount);
  }

  if (levelId === 5) {
    return generatePunctuatedText(wordCount);
  }

  // Les positions physiques des niveaux (LEARNING_LEVELS[n].keys) sont
  // toujours exprimées en labels QWERTY ; en AZERTY, le caractère réellement
  // tapé à chaque position diffère pour 4 touches (voir mapKeyForLayout).
  // Le filtrage de mots doit porter sur les vrais caractères tapés, pas sur
  // les labels internes.
  const qwertyKeys = LEARNING_LEVELS.find((l) => l.id === levelId)?.keys ?? [];
  const allowedKeys = qwertyKeys.map((k) => mapKeyForLayout(k, layout));

  if (levelId === 1) {
    const filtered = filterWordsByKeys(WORDS_HOME_ROW, allowedKeys);
    const pool = filtered.length > 0 ? filtered : WORDS_HOME_ROW;
    return pickRandomWords(pool, wordCount).join(' ');
  }

  // Pour les niveaux 2-4, utiliser des mots de difficulté croissante
  const basePool =
    levelId === 2
      ? WORDS_EASY
      : levelId === 3
        ? [...WORDS_EASY, ...WORDS_NORMAL]
        : WORDS_NORMAL;

  const filtered = filterWordsByKeys(basePool, allowedKeys);
  const pool = filtered.length > 0 ? filtered : basePool;

  return pickRandomWords(pool, wordCount).join(' ');
}
