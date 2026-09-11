# Mode Apprentissage : vrai curriculum de frappe (AZERTY) — Design

> Ticket GitHub #98. À implémenter via superpowers:writing-plans après validation de cette spec.

**Goal :** remplacer le mode Apprentissage actuel (5 niveaux qui s'arrêtent aux minuscules, niveau 5 fourre-tout qui n'enseigne rien, listes de touches pensées QWERTY alors que le défaut est AZERTY) par un vrai parcours pédagogique AZERTY, disposition-conscient, qui amène un débutant complet de la rangée du repos jusqu'à taper un paragraphe français réel avec majuscules, accents (directs et touches mortes), ponctuation et chiffres, en enseignant le geste à chaque étape (quelle main, quel doigt, quelle touche morte, Maj) et pas seulement en affichant des caractères à reproduire.

**Portée de ce ticket : AZERTY uniquement.** Le curriculum QWERTY fera l'objet d'un ticket dédié (voir « Split QWERTY » et « Livrables »). En attendant, `layout === 'qwerty'` continue de servir le mode Apprentissage actuel, inchangé.

**Cible :** vrai débutant frappe aveugle à 10 doigts (tape aujourd'hui à 2-4 doigts en regardant le clavier). C'est un mini-cours, pas un raffinement pour typist confirmé.

**Ligne d'arrivée :** dernier niveau franchi, précision seule (aucune exigence de vitesse : un débutant ne doit jamais être bloqué par un chrono). Le dernier niveau = taper un vrai paragraphe français (majuscules + accents + ponctuation + chiffres) à ~95 % de précision globale, chaque geste du niveau à ≥ 90 %.

## Tech Stack

Next.js 16 App Router, React 19, Zustand (`useConfigStore`), IndexedDB via `idb` (`apps/web/lib/db.ts`, store générique `user_preferences`), `motion/react`, Vitest 3 (projets `unit`, `web-lib` node + `fake-indexeddb`, `web-components` jsdom), Playwright headless local pour la QA navigateur réel (méthode documentée dans la mémoire persistante `responsive-pass-71` : `resize_window` de l'extension ne marche pas sous Wayland).

## Global Constraints

- **Persistance IndexedDB uniquement**, jamais `localStorage`/`sessionStorage` (règle projet). Nouvelles clés dans le store `user_preferences` existant, aucun bump de version de la base.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` : props optionnelles via le spread `...(x !== undefined ? { x } : {})`, jamais `x: undefined`.
- **Règle produit son, non négociable : une frappe fausse est un silence, jamais une fausse note.** Vraie partout, y compris dans les drills du mode Apprentissage.
- **Toute évolution du mode de frappe passe par `commitChar` et le champ de capture caché** (`apps/web/components/typing/TypingArea.tsx`), jamais un nouveau listener `keydown` de texte (mémoire `project_typing_input_capture`, PR #102). Concerne directement le niveau touches mortes.
- **Fail open, ne jamais piéger l'utilisateur** : toute erreur de lecture d'un flag de progression retombe sur un état dont l'utilisateur peut sortir.
- TDD : chaque fonction pure nouvelle a un test qui échoue d'abord.
- Contenu textuel : original ou domaine public (CONTRIBUTING). Les paragraphes des niveaux `text` sont écrits originaux, didactiques, pas de question de droits.
- **Mode Apprentissage = desktop-only** (décidé avec #110) : le curriculum de placement des doigts sur clavier physique n'a pas de sens sur tactile.
- Zéro attribution IA dans commits / PR / issues (règle Mouwafic). Tickets écrits à la 1re personne comme si c'était Mouwafic.

## Background — décisions prises en brainstorming

1. **Cible** : vrai débutant 10 doigts, mini-cours structuré.
2. **Fin** : dernier niveau franchi, précision seule, ~95 % sur un paragraphe FR réel. Pas de plancher de vitesse.
3. **Dispositions** : AZERTY complet dans ce ticket ; QWERTY = ticket dédié, l'ancien curriculum reste en place pour QWERTY d'ici là.
4. **Forme de l'enseignement** : étape interactive par niveau, à la manière de l'intro doigts #62 généralisée — on ne passe au drill qu'après avoir produit chaque nouveau geste du niveau une fois (effet de génération).
5. **Audio** : retour sonore simplifié sur les drills purs (touches isolées, rangées) ; morceau réel dès les niveaux « vrais mots ». La mélodie devient une récompense qui arrive avec la compétence.
6. **Validation** : stricte, par touche cible — chaque nouvelle touche du niveau à ≥ 90 % de précision sur ≥ 20 frappes de cette touche, aucune soupape. Contrepoids : le drill est adaptatif et concentre les répétitions sur la touche la plus faible.
7. **Contenant visuel** : on garde la refonte #91 (rail de niveaux vertical, `LevelClearedMoment`, `LevelRailSpotlight`, repli compact < 900 px de #71) et on greffe dedans. Pas de refonte du contenant.
8. **AltGr** (`@ # €`) : hors du tronc de base (geste avancé, rare à l'écrit courant). Ira dans le ticket QWERTY ou un niveau bonus ultérieur.
9. **Intro doigts** : devient le **Niveau 1** avec sa propre célébration (première victoire rapide), au lieu de rester un portail séparé. Reste ré-accessible depuis Paramètres.

## Le curriculum AZERTY — 11 niveaux

Chaque niveau introduit un petit ensemble de nouveaux gestes, les drille (pondération adaptative), les valide strictement, célèbre, passe au suivant. Une étape interactive d'enseignement précède la boucle de drill, la première fois que le niveau est atteint.

| # | slug | Nouveaux gestes (`newKeys`) | `kind` | `audio` |
|---|---|---|---|---|
| 1 | `anchors` | repères F et J, poser les 8 doigts (`q s d f j k l m`) | `anchors` | `simple` |
| 2 | `home-row` | `q s d f j k l m` (frappe en séquences) | `drill` | `simple` |
| 3 | `top-row` | `a z e r t y u i o p` | `drill` | `simple` |
| 4 | `bottom-row` | `w x c v b n` + `,` | `drill` | `simple` |
| 5 | `first-words` | aucun nouveau geste — mots FR réels sans accent | `words` | `piece` |
| 6 | `uppercase` | Maj + lettre, tenu par l'auriculaire de la main opposée. `newKeys` = `A Z E R` (Maj auriculaire droit) + `U I O P` (Maj auriculaire gauche) | `words` | `piece` |
| 7 | `direct-accents` | `é è à ç ù` (touches directes AZERTY, aucune touche morte) | `words` | `piece` |
| 8 | `dead-keys` | `^`+voyelle → `â ê î ô û` ; `¨` (Maj+`^`)+voyelle → `ë ï ü` | `words` | `piece` |
| 9 | `punctuation` | `.` (Maj+`;`) · `?` (Maj+`,`) · `;` · `:` · `!` · `'` · `-` | `text` | `piece` |
| 10 | `digits` | Maj + rangée → `1 2 3 4 5 6 7 8 9 0` | `text` | `piece` |
| 11 | `full-score` | aucun nouveau geste — paragraphe FR réel, tout mélangé, ≥ 95 % global | `text` | `piece` |

Décisions de conception à l'intérieur du curriculum :

- **Niveau 1 (`anchors`)** : l'étape d'enseignement EST le niveau. Pas de boucle de drill. Déblocage = les 8 repères touchés une fois (le `fingerAnchorsReady` actuel). Absorbe l'intro doigts #62.
- **Niveau 6 (`uppercase`)** : la compétence enseignée est UN geste moteur (tenir Maj de la main opposée) appliqué à 26 lettres. On ne valide pas 26 majuscules ; les `newKeys` sont 8 majuscules réparties sur les deux mains (donc les deux sens de Maj) et sur plusieurs doigts : `A Z E R` (lettres main gauche → Maj auriculaire droit) et `U I O P` (main droite → Maj auriculaire gauche). Le contenu du niveau utilise toutes les majuscules (phrases capitalisées, noms propres) mais seules ces 8 sont barrées strictement.
- **Niveau 8 (`dead-keys`)** : le plus chargé, 8 gestes. C'est le paiement de PR #102 (les touches mortes étaient intapables avant). Le tréma `ü` est rare (`capharnaüm`, `aiguë`) — trimmable à `¨e ¨i` si on veut alléger, à trancher à l'implémentation.
- **Niveau 10 (`digits`)** : 10 gestes, tous validés (chaque chiffre est une colonne / un doigt distinct, mérite sa maîtrise individuelle).
- **Frontière audio** nette : `simple` pour N1-4 (drills purs), `piece` dès N5. Aucun état intermédiaire.
- **`poolKeys`** de chaque niveau = ses `newKeys` ∪ tout l'acquis des niveaux précédents. C'est le vocabulaire autorisé dans le contenu généré.

Compression possible si Mouwafic veut un parcours plus court : fusionner N2+N3 (les deux « drills de rangée »), ou N9 en moins de gestes. Non retenu par défaut : dilue le « une compétence = un niveau = une célébration ».

## Components

### `packages/types/src/learning.ts` (nouveau)

Le geste, pas le caractère, est l'unité. Un geste a un id unique.

```ts
export type FingerId =
  | 'LP' | 'LR' | 'LM' | 'LI'
  | 'RI' | 'RM' | 'RR' | 'RP'
  | 'LT' | 'RT';

export type KeyLayer = 'base' | 'shift' | 'deadkey';

export interface CurriculumKey {
  /** Id de geste unique : 'e', 'E' (Maj+e), 'é', '^e' (mort ^ puis e), '1' (Maj+&), '.', '?'. */
  id: string;
  /** Le(s) caractère(s) réellement produit(s). */
  char: string;
  /** Doigt qui exécute la partie « cible » du geste (la voyelle pour une touche morte, la lettre pour Maj+lettre). */
  finger: FingerId;
  layer: KeyLayer;
  /** Pour layer:'deadkey' : l'id du geste de touche morte qui précède ('^' ou '¨'). */
  deadKey?: string;
  /** Char de base sur sa position physique AZERTY (rendu du schéma clavier). */
  physical: string;
}

export type LevelKind = 'anchors' | 'drill' | 'words' | 'text';

export interface CurriculumLevel {
  id: number;
  /** Suffixe i18n : learning.level.<slug>.{name,tagline,teach}. */
  slug: string;
  kind: LevelKind;
  /** Gestes introduits ici, validés strictement. */
  newKeys: CurriculumKey[];
  /** Ids de geste autorisés dans le contenu généré (newKeys ∪ tout l'acquis). */
  poolKeys: string[];
  minAccuracyPerKey: number;   // 90
  minSamplesPerKey: number;    // 20
  /** kind:'text' uniquement : précision globale exigée en plus du par-touche. */
  minOverallAccuracy?: number; // 95
  audio: 'simple' | 'piece';
}

export const CURRICULUM_VERSION = 1;
export const LEARNING_CURRICULUM_AZERTY: CurriculumLevel[] = [ /* 11 entrées, table ci-dessus */ ];
```

Réexporté depuis `packages/types/src/index.ts`. L'`LearningLevel` / `LEARNING_LEVELS` actuels de `progression.ts` restent, annotés `@deprecated` (« chemin QWERTY uniquement, voir ticket QWERTY »), supprimés quand ce ticket atterrit.

**Table des doigts AZERTY** (référence pour remplir `finger` / `physical`) :

| Doigt | Touches |
|---|---|
| LP | `a q w ²`, rangée `&`(1) |
| LR | `z s x`, rangée `é`(2) |
| LM | `e d c`, rangée `"`(3) |
| LI | `r f v t g b`, rangée `'`(4) `(`(5) |
| RI | `y h n u j ,`, rangée `-`(6) `è`(7) |
| RM | `i k ;`, rangée `_`(8) |
| RR | `o l :`, rangée `ç`(9) |
| RP | `p m ù ! ^ $ *`, rangée `à`(0) `)` `=` |
| LT/RT | espace |

Maj d'un geste : tenue par l'auriculaire de la **main opposée** à la lettre. Chiffre : `1`=Maj+`&` … `0`=Maj+`à`, doigt = celui de la touche de base, Maj = auriculaire opposé.

### `apps/web/lib/learning-progress.ts` (étendu)

Garde le module (le chemin QWERTY consomme `canUnlockNextLevel` / `applySessionStats` / `LevelProgress` tels quels). Ajoute :

```ts
export type KeyMastery = Record<string, { correct: number; total: number }>;

/** Intègre les frappes d'une série (déjà mappées vers des ids de geste) dans la maîtrise par touche. Pur. */
export function applyLearningKeystrokes(
  mastery: KeyMastery,
  entries: { gestureId: string; correct: boolean }[],
): KeyMastery;

/** Déblocage curriculum : chaque newKey a total ≥ minSamplesPerKey ET correct/total ≥ minAccuracyPerKey/100.
 *  Strict, sans soupape. kind:'text' ajoute précision globale ≥ minOverallAccuracy. */
export function canUnlockCurriculumLevel(
  level: CurriculumLevel,
  mastery: KeyMastery,
  overallAccuracy: number | undefined,
): boolean;

/** Progression = fraction des newKeys ayant atteint leur barre (4/6 → 67). */
export function calculateCurriculumProgress(
  level: CurriculumLevel,
  mastery: KeyMastery,
): { percent: number; weakestKeyId: string | null; weakestKeyAccuracy: number | null };

export async function loadKeyMastery(): Promise<KeyMastery>;          // {} si jamais sauvegardée
export async function saveKeyMastery(m: KeyMastery): Promise<void>;

/** Reset des deux structures + écriture du marqueur si learning_curriculum_version ≠ CURRICULUM_VERSION.
 *  Idempotent, silencieux. */
export async function ensureCurriculumVersion(): Promise<void>;
```

Clés `user_preferences` : `learning_key_mastery`, `learning_curriculum_version`, `learning_taught_levels` (int[]). `learning_level_progress` conservé pour les drapeaux `unlocked` et le total de frappes du niveau (dénominateur de barre, messages « continue »).

### `apps/web/lib/learning-content.ts` (nouveau)

```ts
/** Groupes de lettres pondérés depuis level.poolKeys, longueurs 2-7 façon mots.
 *  Pondération : (a) newKeys > acquis, (b) parmi newKeys, la plus loin de sa barre pèse plus.
 *  Densité newKeys bornée ~40-60 % (le reste = contexte). */
export function generateLearningDrill(level: CurriculumLevel, mastery: KeyMastery, wordCount?: number): string;

/** Mots d'un pool FR curé, filtrés aux poolKeys, selon le niveau (voir learning-texts). */
export function pickLearningWords(level: CurriculumLevel, wordCount?: number): string;

/** Paragraphe FR curé approprié au niveau (ponctuation / chiffres / tout). */
export function pickLearningText(level: CurriculumLevel): string;
```

### `apps/web/lib/learning-texts.ts` (nouveau)

Données seulement : `WORDS_FR_PLAIN` (sans accent), `WORDS_FR_PROPER` (noms propres capitalisés), `WORDS_FR_ACCENTS` (`é è à ç ù`), `WORDS_FR_CIRCUMFLEX` (`être goût hôpital Noël maïs`…), et `LEARNING_PARAGRAPHS` (paragraphes originaux taggés par gestes exercés : `punctuation`, `digits`, `full`). Tout original ou domaine public.

### `apps/web/components/modes/LearningMode.tsx` (devient un dispatcher fin)

```tsx
export function LearningMode(props: LearningModeProps) {
  const { layout } = useKeyboardLayoutPreference();
  return layout === 'azerty'
    ? <CurriculumLearningMode {...props} />
    : <LegacyLearningMode {...props} />;
}
```

`LegacyLearningMode` = le corps actuel extrait tel quel (aucun changement de comportement QWERTY). `LearningModeProps` (`isOnboarding?`, `onExitTutorial`) inchangés.

### `apps/web/components/modes/CurriculumLearningMode.tsx` (nouveau)

Le mode piloté par curriculum, AZERTY. Réutilise les briques #91 : le rail vertical de niveaux (11 pas), `LevelClearedMoment`, `LevelRailSpotlight`, `learning_celebrated_levels`, le repli compact < 900 px de #71.

État / flux :
- Au montage : `ensureCurriculumVersion()` ; charge `learning_level_progress` (ou `createInitialLevelProgress` sur le curriculum), `learning_key_mastery`, `learning_taught_levels`.
- `currentLevel = LEARNING_CURRICULUM_AZERTY[currentLevelId - 1]`.
- Si `currentLevelId ∉ learning_taught_levels` → rend `<LevelTeachStep>` à la place de la boucle de drill. `onDone` → ajoute le niveau à `learning_taught_levels` (persisté), passe au drill.
- `kind:'anchors'` (N1) : `LevelTeachStep` seul, `onDone` = déblocage direct (pas de boucle).
- Boucle de drill : `generateLearningDrill` / `pickLearningWords` / `pickLearningText` selon `kind` → passé comme `text` à `<TypingArea mode="learning" autoNavigate={false}>`. En parallèle, `CurriculumLearningMode` garde localement `targetGestureIds` (chaque position du texte cible → un `CurriculumKey.id`, connu puisque le texte est généré depuis le curriculum) ; ce tableau n'est jamais passé à `TypingArea`.
- `onSessionComplete({ …, keystrokeData })` : zippe `keystrokeData` (par position) ↔ `targetGestureIds` ↔ justesse → `applyLearningKeystrokes(mastery, entries)` → `saveKeyMastery`. Régénère une série sur le même niveau.
  - Correction Backspace : chaque frappe validée compte contre le geste attendu à cette position ; corriger ajoute un échantillon juste pour ce geste.
  - Touche morte : le char validé est `ê`, l'id attendu `^e`, juste = `ê === char attendu`. La pression morte intermédiaire n'est pas un char validé (composition), donc pas de faux échantillon.
- `canUnlockCurriculumLevel(currentLevel, mastery, overallAccuracy)` → quand vrai : `LevelClearedMoment`, déblocage du niveau suivant, spotlight vers son point de rail.
- `isLastLevel` (N11) + déblocage → `tutorialComplete` → bouton `onExitTutorial` (marque l'onboarding terminé + repasse classique, comportement existant).
- **Audio** : selon `currentLevel.audio`. `simple` → `playNoteName(note)` par frappe correcte, hauteur mappée sur la rangée physique de la touche : rangée du repos → `C4`, rangée du haut → `G4`, rangée du bas → `G3`, espace → `C3` (musical, pas une mélodie ; à affiner à l'oreille à l'implémentation). Le séquenceur MIDI n'est ni chargé ni avancé. `piece` → comportement app actuel (`loadMidiPiece` du morceau sélectionné, `playNote` avance). Faute = silence dans les deux cas. `playNoteName` existe déjà (`useAudioEngine`), aucune nouvelle API audio nécessaire.
- Barre de progression : `calculateCurriculumProgress` (fraction des `newKeys` maîtrisées) + ligne « la touche qui coince : `ç` à 78 % ».

### `apps/web/components/modes/LevelTeachStep.tsx` (nouveau)

Généralisation de l'intro doigts #62. Props `{ level: CurriculumLevel, onDone: () => void }`.

- Rend : nom du niveau, la règle du geste en une phrase (`learning.level.<slug>.teach`), le `<KeyboardDiagramAzerty>` avec les `newKeys` du niveau surlignées par doigt, et une barre de pratique active.
- **Barre de pratique** : produire chaque nouveau geste une fois pour activer « Commencer » (effet de génération, comme `fingerAnchorsReady` 8/8 aujourd'hui).
  - `layer:'base'` → presser la touche. `layer:'shift'` → valider le combo Maj+touche (le char produit doit correspondre). `layer:'deadkey'` → la frappe en deux temps qui produit la voyelle accentuée.
  - Passe par un **mini-champ de capture dédié** construit sur le même patron que le `captureRef` de `TypingArea` (`<input>` caché hors écran, focus délégué, lecture des caractères validés sur `compositionend` / `input`, normalisation NFC) — **pas** `TypingArea` lui-même (trop couplé à l'état de session). **Jamais un nouveau listener keydown de texte.**
- `kind:'anchors'` (N1) : la barre = les 8 repères home row touchés, `onDone` conclut le niveau.

### `apps/web/components/modes/KeyboardDiagramAzerty.tsx` (nouveau — le plus gros poste)

Schéma clavier natif AZERTY (positions ET libellés en AZERTY), dédié au parcours. Le `KeyboardDiagram` QWERTY actuel reste pour le chemin QWERTY.

Contenu par rapport à l'actuel (3 rangées de lettres + espace) :
1. **Rangée des chiffres** : 12 touches, libellé = char de base AZERTY (`& é " ' ( - è _ ç à ) =`), + le chiffre en exposant petit quand pertinent (`1..0`). Doigt par colonne.
2. **Couches sur le capuchon** : char de base au centre ; char Maj en petit en haut à gauche (le chiffre pour la rangée des chiffres ; `¨` sur la touche `^`).
3. **Touches Maj (gauche + droite)** + un état « maintien » distinct du pulse de frappe : geste `Maj+e` → surligner `e` ET la touche Maj de la **main opposée**.
4. **Deux-temps touche morte** : geste `^e` → pulse `^` puis `e`, affordance « 1 → 2 ».
5. **`viewBox` + planchers `minHeight`** re-calibrés (une rangée de plus). Contrainte inchangée : tenir dans `calc(100dvh - var(--nav-height))` sans pousser le pied de page (acquis #91/#71). Desktop-only → moins de gymnastique de clamp que #71.
6. Couleurs par doigt conservées (mêmes `FINGER_COLORS`). Props : `newKeys` (surlignées), `activeKey` (geste attendu courant), `expectedShiftHand?`, `deadKeyStep?: 1 | 2`.

AltGr : pas ajouté (hors tronc).

### `apps/web/app/[locale]/parametres/ParametresClient.tsx` (modifié)

`handleReviewFingerPositioning` : l'entrée « revoir le positionnement des doigts » est masquée quand `isNonDesktopDevice()` (helper de #110). Le mode Apprentissage est desktop-only, l'entrée aussi.

### `apps/web/components/typing/HomeClient.tsx` (modifié)

Garde-fou : si `activeMode === 'learning'` et `isNonDesktopDevice()` (config persistée sur un appareil devenu non desktop), repli sur `'classic'`. Petit effet, réutilise le helper de #110. Le déclenchement auto de l'onboarding est déjà gaté (#110).

### `apps/web/components/typing/TypingArea.tsx` (impact minimal)

Une seule évolution : `onSessionComplete` inclut `keystrokeData` (le `KeystrokeEntry[]` déjà collecté en interne : char, correct, position) dans son payload. Aucun changement du chemin chaud `commitChar`, aucun nouveau prop de cible. `targetGestureIds` reste entièrement côté `CurriculumLearningMode` (jamais passé à `TypingArea`) : le mapping frappe → geste se fait à la complétion de série, en zippant `keystrokeData` (par position) avec le tableau `targetGestureIds` local.

## Data Flow — une série de drill au niveau 7 (accents directs)

1. `CurriculumLearningMode` : `currentLevelId = 7`, `7 ∈ learning_taught_levels` (étape d'enseignement déjà vue) → boucle de drill.
2. `pickLearningWords(level7)` → `"été rare voilà café où près"` (mots FR filtrés aux `poolKeys` de N7). `CurriculumLearningMode` construit en parallèle `targetGestureIds` position par position : `é`→`é`, `t`→`t`, `é`→`é`, espace→`space`, … (gardé localement).
3. `<TypingArea mode="learning" text=…>`. L'utilisateur tape. `commitChar` gère chaque caractère (accents directs = touches simples sur AZERTY, aucune composition).
4. `onSessionComplete({ …, keystrokeData })` : `CurriculumLearningMode` zippe `keystrokeData` (par position) avec `targetGestureIds` → `entries = [{gestureId:'é',correct:true}, {gestureId:'t',correct:true}, {gestureId:'é',correct:false}, …]` → `applyLearningKeystrokes` → `mastery['é'] = {correct: 12, total: 14}` … → `saveKeyMastery`.
5. `canUnlockCurriculumLevel(level7, mastery, undefined)` : `é è à ç ù` tous à `total ≥ 20` et `≥ 90 %` ? Non (`ç` à 78 %) → reste au niveau 7. `generate... ` non, `pickLearningWords` régénère une série ; le pool est pondéré pour faire ressortir `ç`.
6. Quelques séries plus tard, `ç` repasse ≥ 90 % → `canUnlockCurriculumLevel` vrai → `LevelClearedMoment` « Niveau 7 validé », déblocage N8, spotlight vers son point de rail.

## Migration

- Au montage de `CurriculumLearningMode` : `ensureCurriculumVersion()` lit `learning_curriculum_version`. Absent ou ≠ `CURRICULUM_VERSION` → `learning_level_progress` et `learning_key_mastery` remis à zéro (`createInitialLevelProgress(LEARNING_CURRICULUM_AZERTY)` / `{}`), `learning_taught_levels` remis à `[]`, marqueur écrit.
- Une seule fois, silencieux, aucune notice. Seul Mouwafic a des données locales (mémoire `no_beta_access_yet`), aucune logique de préservation.
- Les ids de niveau changent de sens (5 → 11, découpage différent) : c'est pourquoi on reset plutôt que de tenter un remapping.

## Split QWERTY

`LearningMode` bifurque sur `layout` :
- `azerty` → `<CurriculumLearningMode>` (ce ticket).
- `qwerty` → `<LegacyLearningMode>` = corps actuel extrait, intact (ancien `LEARNING_LEVELS`, `generateLearningText` chemins QWERTY, `KeyboardDiagram` actuel, `canUnlockNextLevel` / `applySessionStats`).

Aucune régression QWERTY : le code actuel est déplacé, pas modifié.

## Error handling

- Lecture IndexedDB en échec (`loadKeyMastery`, `learning_taught_levels`, `ensureCurriculumVersion`) : `catch` → valeurs par défaut (`{}`, `[]`), le mode reste utilisable, la progression repart de zéro plutôt que de piéger. Même posture que le `fail open` de l'onboarding.
- `pickLearningWords` / `generateLearningDrill` : si un pool filtré aux `poolKeys` est vide (ne devrait pas arriver vu les invariants), repli sur le pool non filtré du niveau, jamais une chaîne vide.
- Audio : `playNoteName` échoue silencieusement (déjà le cas). Faute = silence, toujours.
- `targetGestureIds` désaligné de `text` (bug de génération) : le zip s'arrête au plus court, log dev, la série compte moins de frappes — jamais de crash.

## Testing

### Pur — projet `web-lib` (node)

- **Invariants curriculum** (`LEARNING_CURRICULUM_AZERTY`) : ids uniques sur tous les `newKeys` ; `poolKeys[n] ⊇ poolKeys[n-1] ∪ ids(newKeys[n])` ; chaque `finger ∈ FingerId` ; niveau 11 est `kind:'text'` avec `minOverallAccuracy` ; toute clé `layer:'deadkey'` a un `deadKey` renseigné pointant un geste connu.
- `applyLearningKeystrokes` : accumulation `{correct,total}` par id de geste ; ids Maj (`E`) et touche morte (`^e`) traités comme des gestes distincts de leur base.
- `canUnlockCurriculumLevel` : sémantique ET stricte ; une seule `newKey` sous sa barre → verrouillé (pas de soupape) ; `kind:'text'` exige aussi la précision globale.
- `calculateCurriculumProgress` : fraction correcte, `weakestKeyId` = la plus loin de sa barre.
- `generateLearningDrill` : n'émet que des `poolKeys` ; la pondération concentre démontrablement sur la `newKey` la plus faible ; densité `newKeys` dans la bande 40-60 %.
- `pickLearningWords` / `pickLearningText` : n'émettent que des `poolKeys` ; pool approprié au niveau.
- `ensureCurriculumVersion` : version absente / différente → les deux structures + `learning_taught_levels` reset et marqueur écrit ; version égale → rien touché.

### Composant — projet `web-components` (jsdom)

- `LevelTeachStep` : « Commencer » désactivé tant que chaque nouveau geste n'a pas été produit une fois ; activé après. `kind:'anchors'` → `onDone` conclut le niveau.
- `CurriculumLearningMode` : avance seulement quand toutes les `newKeys` sont maîtrisées ; `LevelClearedMoment` se déclenche ; `learning_taught_levels` persisté ; `learning_key_mastery` persisté après une série.
- Régime audio : `currentLevel.audio` passe de `simple` à `piece` en entrant au niveau 5 (assertion sur le prop / l'appel).
- `LearningMode` dispatcher : `layout === 'qwerty'` rend `LegacyLearningMode` (marqueur / snapshot), aucun changement de comportement.
- `ParametresClient` : l'entrée « revoir le positionnement des doigts » est absente quand le stub `matchMedia` rapporte non-desktop, présente sinon.
- Les tests onboarding existants de `HomeClient.test.tsx` restent verts (stub jsdom `matches:false` → desktop).

### Navigateur réel — Playwright headless, méthode documentée (mémoire `responsive-pass-71`)

- Niveau 8 : `^` puis `e` produit `ê`, `¨` (Maj+`^`) puis `e` produit `ë`, via le champ de capture caché + `commitChar` ; compté comme un échantillon correct pour le geste `^e` / `¨e`.
- Niveau 10 : une frappe de la rangée des chiffres sans Maj produit le char de base (`&`, `é`…) et est scorée fausse contre le geste chiffre attendu ; avec Maj, produit le chiffre et est scorée juste.
- `KeyboardDiagramAzerty` : rend la rangée des chiffres + les touches Maj sans débordement horizontal à 1024 et 1440 px ; tient dans `calc(100dvh - var(--nav-height))` sans pousser le pied de page.
- Régime audio `simple` : une frappe correcte au niveau 2 joue une note, n'avance aucune séquence MIDI (pas de pièce chargée).

## Livrables

1. Le curriculum AZERTY complet (11 niveaux) opérationnel, remplaçant l'ancien pour `layout === 'azerty'`.
2. `LegacyLearningMode` : l'ancien mode extrait intact pour `layout === 'qwerty'`.
3. Gating desktop-only : entrée Paramètres masquée + garde-fou `HomeClient`.
4. **Ouvrir un ticket GitHub « Curriculum apprentissage QWERTY »** (voix Mouwafic, zéro trace IA), référençant #98, avec pour objet : porter le même système de curriculum à QWERTY (ordre d'enseignement propre : accents via compose/dead keys ou hors périmètre, chiffres directs, ponctuation, AltGr), puis supprimer `LegacyLearningMode`, l'ancien `LEARNING_LEVELS` et le `KeyboardDiagram` QWERTY devenu inutile.
5. Décider à l'implémentation : tréma `ü` gardé ou non au niveau 8.

## Hors périmètre

- Curriculum QWERTY (ticket dédié, livrable 4).
- AltGr / symboles (`@ # € { } [ ]`) : ticket QWERTY ou niveau bonus ultérieur.
- Plancher de vitesse (WPM) : explicitement écarté, précision seule.
- Refonte du contenant visuel #91 (rail, célébrations, spotlight) : réutilisé tel quel.
- Suivi par touche hors mode Apprentissage (le store `keystroke_stats` dormant reste dormant ; `learning_key_mastery` est une structure séparée, scoppée à l'apprentissage).
