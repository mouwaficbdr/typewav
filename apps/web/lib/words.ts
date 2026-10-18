/**
 * Listes de mots pour le mode classique et les niveaux adaptatifs.
 * Tous les mots sont en domaine public.
 *
 * Organisés par longueur pour la difficulté adaptative.
 */

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
