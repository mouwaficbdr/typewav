/**
 * Modèle de données déclaratif du parcours Apprentissage AZERTY.
 * Spec : docs/superpowers/specs/2026-09-07-learning-mode-curriculum-design.md
 *
 * L'unité pédagogique est le GESTE, pas le caractère : appuyer sur une touche,
 * tenir Maj puis une lettre, taper une touche morte puis une voyelle. Chaque
 * geste a un `id` unique et stable (`'e'`, `'E'`, `'é'`, `'^e'`, `'1'`, `'.'`).
 * Un niveau introduit un petit lot de nouveaux gestes (`newKeys`), les drille,
 * les valide strictement, célèbre, passe au suivant.
 *
 * Ce module est data-only : aucune logique de progression ici (voir
 * `apps/web/lib/learning-progress.ts` et `learning-content.ts`).
 */

// ─── Doigts ────────────────────────────────────────────────────────────────────

/**
 * Doigt de frappe. `L`/`R` = main gauche/droite ; `P`/`R`/`M`/`I` = auriculaire
 * (pinky), annulaire (ring), majeur (middle), index. `T` = pouce (thumb), pour
 * la barre d'espace.
 */
export type FingerId =
  | 'LP'
  | 'LR'
  | 'LM'
  | 'LI'
  | 'RI'
  | 'RM'
  | 'RR'
  | 'RP'
  | 'LT'
  | 'RT';

/**
 * Couche clavier sollicitée par le geste :
 * - `base` : la touche seule.
 * - `shift` : Maj tenu par l'auriculaire opposé + la touche.
 * - `deadkey` : une touche morte (`^` ou `¨`) puis la voyelle.
 */
export type KeyLayer = 'base' | 'shift' | 'deadkey';

/** Un geste de frappe unique enseigné puis validé par le curriculum. */
export interface CurriculumKey {
  /** Geste unique : `'e'`, `'E'`, `'é'`, `'^e'`, `'1'`, `'.'`, `'?'`. */
  id: string;
  /** Caractère produit à l'écran. */
  char: string;
  /** Doigt de la partie « cible » du geste (la voyelle pour une touche morte). */
  finger: FingerId;
  layer: KeyLayer;
  /** `layer: 'deadkey'` uniquement : la touche morte utilisée, `'^'` ou `'¨'`. */
  deadKey?: string;
  /** Caractère de base à la position physique AZERTY (pour le schéma clavier). */
  physical: string;
}

/**
 * Nature d'un niveau :
 * - `anchors` : niveau 1 seul, l'étape d'enseignement EST le niveau (repères).
 * - `drill` : suites de lettres isolées, pondération adaptative.
 * - `words` : mots réels du vocabulaire acquis.
 * - `text` : paragraphe français réel, validé aussi sur une précision globale.
 */
export type LevelKind = 'anchors' | 'drill' | 'words' | 'text';

export interface CurriculumLevel {
  id: number;
  slug: string;
  kind: LevelKind;
  /** Gestes introduits à ce niveau (vide pour les niveaux de consolidation). */
  newKeys: CurriculumKey[];
  /** Ids de geste autorisés dans le contenu généré : `newKeys` ∪ tout l'acquis. */
  poolKeys: string[];
  /** Précision minimale par touche cible (%). Niveau 1 excepté : `0`. */
  minAccuracyPerKey: number;
  /** Frappes minimales par touche cible. Niveau 1 excepté : `1` (touché une fois). */
  minSamplesPerKey: number;
  /** `kind: 'text'` uniquement : précision globale exigée en plus du par-touche. */
  minOverallAccuracy?: number;
  /** `kind: 'text'` uniquement : total de frappes exigé sur le paragraphe. */
  minSamplesTotal?: number;
  /** `simple` : note isolée par frappe correcte. `piece` : morceau MIDI réel. */
  audio: 'simple' | 'piece';
}

/**
 * Version du schéma du curriculum. À incrémenter quand la table change de forme
 * de manière incompatible (ids de geste, découpage des niveaux, barres). Sert à
 * invalider `learning_key_mastery` persisté (voir `ensureCurriculumVersion`).
 */
export const CURRICULUM_VERSION = 1;

/**
 * Les deux touches mortes AZERTY, décrites comme des gestes à part entière : la
 * première moitié d'un geste `layer: 'deadkey'` (accent circonflexe direct, tréma
 * via Maj). L'auriculaire droit dans les deux cas.
 */
export const DEAD_KEYS: Record<'^' | '¨', CurriculumKey> = {
  '^': { id: '^', char: '^', finger: 'RP', layer: 'base', physical: '^' },
  '¨': { id: '¨', char: '¨', finger: 'RP', layer: 'shift', physical: '^' },
};

// ─── Construction des poolKeys ─────────────────────────────────────────────────

/**
 * Union dédupliquée de l'acquis précédent, des nouveaux gestes du niveau et d'un
 * éventuel supplément explicite (les 26 majuscules au niveau 6). Interne : les
 * `poolKeys` de la table sont toujours construits par ce helper, jamais recopiés
 * à la main, pour écarter toute dérive de transcription.
 */
function buildPool(
  prev: string[],
  newKeys: CurriculumKey[],
  extra: string[] = [],
): string[] {
  return Array.from(new Set([...prev, ...newKeys.map((k) => k.id), ...extra]));
}

// ─── Table AZERTY : 11 niveaux ────────────────────────────────────────────────

/**
 * Spécification d'un niveau avant calcul de ses `poolKeys` (dérivés de l'acquis
 * cumulé par `buildCurriculum`).
 */
type CurriculumLevelSpec = Omit<CurriculumLevel, 'poolKeys'>;

const LEVEL_SPECS: readonly CurriculumLevelSpec[] = [
  {
    // Niveau 1 : poser les 8 doigts sur la rangée du repos, repères F et J.
    // L'étape d'enseignement EST le niveau : touché une fois suffit.
    id: 1,
    slug: 'anchors',
    kind: 'anchors',
    newKeys: [
      { id: 'q', char: 'q', finger: 'LP', layer: 'base', physical: 'q' },
      { id: 's', char: 's', finger: 'LR', layer: 'base', physical: 's' },
      { id: 'd', char: 'd', finger: 'LM', layer: 'base', physical: 'd' },
      { id: 'f', char: 'f', finger: 'LI', layer: 'base', physical: 'f' },
      { id: 'j', char: 'j', finger: 'RI', layer: 'base', physical: 'j' },
      { id: 'k', char: 'k', finger: 'RM', layer: 'base', physical: 'k' },
      { id: 'l', char: 'l', finger: 'RR', layer: 'base', physical: 'l' },
      { id: 'm', char: 'm', finger: 'RP', layer: 'base', physical: 'm' },
    ],
    minAccuracyPerKey: 0,
    minSamplesPerKey: 1,
    audio: 'simple',
  },
  {
    // Niveau 2 : drille la rangée du repos jusqu'à la maîtrise. L1 (`anchors`)
    // ne demande que « touché une fois » ; c'est ici que les 8 repères
    // `q s d f j k l m` sont validés strictement, avec G et H (étirements
    // d'index) en plus. 10 gestes au total, seul niveau qui les gate.
    id: 2,
    slug: 'home-row',
    kind: 'drill',
    newKeys: [
      { id: 'q', char: 'q', finger: 'LP', layer: 'base', physical: 'q' },
      { id: 's', char: 's', finger: 'LR', layer: 'base', physical: 's' },
      { id: 'd', char: 'd', finger: 'LM', layer: 'base', physical: 'd' },
      { id: 'f', char: 'f', finger: 'LI', layer: 'base', physical: 'f' },
      { id: 'g', char: 'g', finger: 'LI', layer: 'base', physical: 'g' },
      { id: 'h', char: 'h', finger: 'RI', layer: 'base', physical: 'h' },
      { id: 'j', char: 'j', finger: 'RI', layer: 'base', physical: 'j' },
      { id: 'k', char: 'k', finger: 'RM', layer: 'base', physical: 'k' },
      { id: 'l', char: 'l', finger: 'RR', layer: 'base', physical: 'l' },
      { id: 'm', char: 'm', finger: 'RP', layer: 'base', physical: 'm' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'simple',
  },
  {
    // Niveau 3 : la rangée du haut.
    id: 3,
    slug: 'top-row',
    kind: 'drill',
    newKeys: [
      { id: 'a', char: 'a', finger: 'LP', layer: 'base', physical: 'a' },
      { id: 'z', char: 'z', finger: 'LR', layer: 'base', physical: 'z' },
      { id: 'e', char: 'e', finger: 'LM', layer: 'base', physical: 'e' },
      { id: 'r', char: 'r', finger: 'LI', layer: 'base', physical: 'r' },
      { id: 't', char: 't', finger: 'LI', layer: 'base', physical: 't' },
      { id: 'y', char: 'y', finger: 'RI', layer: 'base', physical: 'y' },
      { id: 'u', char: 'u', finger: 'RI', layer: 'base', physical: 'u' },
      { id: 'i', char: 'i', finger: 'RM', layer: 'base', physical: 'i' },
      { id: 'o', char: 'o', finger: 'RR', layer: 'base', physical: 'o' },
      { id: 'p', char: 'p', finger: 'RP', layer: 'base', physical: 'p' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'simple',
  },
  {
    // Niveau 4 : la rangée du bas, plus la virgule.
    id: 4,
    slug: 'bottom-row',
    kind: 'drill',
    newKeys: [
      { id: 'w', char: 'w', finger: 'LP', layer: 'base', physical: 'w' },
      { id: 'x', char: 'x', finger: 'LR', layer: 'base', physical: 'x' },
      { id: 'c', char: 'c', finger: 'LM', layer: 'base', physical: 'c' },
      { id: 'v', char: 'v', finger: 'LI', layer: 'base', physical: 'v' },
      { id: 'b', char: 'b', finger: 'LI', layer: 'base', physical: 'b' },
      { id: 'n', char: 'n', finger: 'RI', layer: 'base', physical: 'n' },
      { id: ',', char: ',', finger: 'RI', layer: 'base', physical: ',' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'simple',
  },
  {
    // Niveau 5 : premiers vrais mots. Aucun nouveau geste, on consolide les
    // minuscules et le morceau MIDI devient la récompense. Les barres 90/20
    // restent posées pour l'invariant « niveaux non-1 = 90/20 ».
    id: 5,
    slug: 'first-words',
    kind: 'words',
    newKeys: [],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'piece',
  },
  {
    // Niveau 6 : Maj + lettre, tenu par l'auriculaire de la main opposée. Un seul
    // geste moteur appliqué à 26 lettres : `poolKeys` porte les 26 majuscules
    // (capitaliser n'importe quel mot), seules ces 8 représentatives — A Z E R
    // (Maj auriculaire droit) et U I O P (Maj auriculaire gauche) — sont barrées.
    id: 6,
    slug: 'uppercase',
    kind: 'words',
    newKeys: [
      { id: 'A', char: 'A', finger: 'LP', layer: 'shift', physical: 'a' },
      { id: 'Z', char: 'Z', finger: 'LR', layer: 'shift', physical: 'z' },
      { id: 'E', char: 'E', finger: 'LM', layer: 'shift', physical: 'e' },
      { id: 'R', char: 'R', finger: 'LI', layer: 'shift', physical: 'r' },
      { id: 'U', char: 'U', finger: 'RI', layer: 'shift', physical: 'u' },
      { id: 'I', char: 'I', finger: 'RM', layer: 'shift', physical: 'i' },
      { id: 'O', char: 'O', finger: 'RR', layer: 'shift', physical: 'o' },
      { id: 'P', char: 'P', finger: 'RP', layer: 'shift', physical: 'p' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'piece',
  },
  {
    // Niveau 7 : accents directs AZERTY (touche dédiée, un seul appui).
    id: 7,
    slug: 'direct-accents',
    kind: 'words',
    newKeys: [
      { id: 'é', char: 'é', finger: 'LR', layer: 'base', physical: 'é' },
      { id: 'è', char: 'è', finger: 'RI', layer: 'base', physical: 'è' },
      { id: 'à', char: 'à', finger: 'RP', layer: 'base', physical: 'à' },
      { id: 'ç', char: 'ç', finger: 'RR', layer: 'base', physical: 'ç' },
      { id: 'ù', char: 'ù', finger: 'RP', layer: 'base', physical: 'ù' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'piece',
  },
  {
    // Niveau 8 : touches mortes. Geste en deux temps : `^` ou `¨` (auriculaire
    // droit) puis la voyelle. `finger` = celui de la voyelle, `deadKey` = la
    // touche morte, `physical` = la voyelle à sa position AZERTY.
    id: 8,
    slug: 'dead-keys',
    kind: 'words',
    newKeys: [
      { id: '^a', char: 'â', finger: 'LP', layer: 'deadkey', deadKey: '^', physical: 'a' },
      { id: '^e', char: 'ê', finger: 'LM', layer: 'deadkey', deadKey: '^', physical: 'e' },
      { id: '^i', char: 'î', finger: 'RM', layer: 'deadkey', deadKey: '^', physical: 'i' },
      { id: '^o', char: 'ô', finger: 'RR', layer: 'deadkey', deadKey: '^', physical: 'o' },
      { id: '^u', char: 'û', finger: 'RI', layer: 'deadkey', deadKey: '^', physical: 'u' },
      { id: '¨e', char: 'ë', finger: 'LM', layer: 'deadkey', deadKey: '¨', physical: 'e' },
      { id: '¨i', char: 'ï', finger: 'RM', layer: 'deadkey', deadKey: '¨', physical: 'i' },
      { id: '¨u', char: 'ü', finger: 'RI', layer: 'deadkey', deadKey: '¨', physical: 'u' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    audio: 'piece',
  },
  {
    // Niveau 9 : ponctuation. `kind: 'text'` — paragraphe réel, validé aussi sur
    // une précision globale (92 % sur 250 frappes) en plus du par-touche.
    id: 9,
    slug: 'punctuation',
    kind: 'text',
    newKeys: [
      { id: '.', char: '.', finger: 'RM', layer: 'shift', physical: ';' },
      { id: '?', char: '?', finger: 'RI', layer: 'shift', physical: ',' },
      { id: ';', char: ';', finger: 'RM', layer: 'base', physical: ';' },
      { id: ':', char: ':', finger: 'RR', layer: 'base', physical: ':' },
      { id: '!', char: '!', finger: 'RP', layer: 'base', physical: '!' },
      { id: "'", char: "'", finger: 'LI', layer: 'base', physical: "'" },
      { id: '-', char: '-', finger: 'RI', layer: 'base', physical: '-' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    minOverallAccuracy: 92,
    minSamplesTotal: 250,
    audio: 'piece',
  },
  {
    // Niveau 10 : chiffres de la rangée numérique (Maj + touche accentuée).
    id: 10,
    slug: 'digits',
    kind: 'text',
    newKeys: [
      { id: '1', char: '1', finger: 'LP', layer: 'shift', physical: '&' },
      { id: '2', char: '2', finger: 'LR', layer: 'shift', physical: 'é' },
      { id: '3', char: '3', finger: 'LM', layer: 'shift', physical: '"' },
      { id: '4', char: '4', finger: 'LI', layer: 'shift', physical: "'" },
      { id: '5', char: '5', finger: 'LI', layer: 'shift', physical: '(' },
      { id: '6', char: '6', finger: 'RI', layer: 'shift', physical: '-' },
      { id: '7', char: '7', finger: 'RI', layer: 'shift', physical: 'è' },
      { id: '8', char: '8', finger: 'RM', layer: 'shift', physical: '_' },
      { id: '9', char: '9', finger: 'RR', layer: 'shift', physical: 'ç' },
      { id: '0', char: '0', finger: 'RP', layer: 'shift', physical: 'à' },
    ],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    minOverallAccuracy: 92,
    minSamplesTotal: 250,
    audio: 'piece',
  },
  {
    // Niveau 11 : partition complète. Aucun nouveau geste : un paragraphe
    // français réel qui mobilise tout l'acquis (majuscules, accents, touches
    // mortes, ponctuation, chiffres), barre la plus haute (95 % sur 400 frappes).
    id: 11,
    slug: 'full-score',
    kind: 'text',
    newKeys: [],
    minAccuracyPerKey: 90,
    minSamplesPerKey: 20,
    minOverallAccuracy: 95,
    minSamplesTotal: 400,
    audio: 'piece',
  },
];

const UPPERCASE_ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

function buildCurriculum(): CurriculumLevel[] {
  const levels: CurriculumLevel[] = [];
  let prevPool: string[] = [];
  for (const spec of LEVEL_SPECS) {
    const extra = spec.id === 6 ? UPPERCASE_ALPHABET : [];
    const poolKeys = buildPool(prevPool, spec.newKeys, extra);
    levels.push({ ...spec, poolKeys });
    prevPool = poolKeys;
  }
  return levels;
}

/**
 * Le parcours Apprentissage AZERTY : 11 niveaux, de la rangée du repos au
 * paragraphe français complet. Chaque `poolKeys` est dérivé par `buildCurriculum`
 * (acquis cumulé, dédupliqué), jamais écrit à la main.
 */
export const LEARNING_CURRICULUM_AZERTY: CurriculumLevel[] = buildCurriculum();
