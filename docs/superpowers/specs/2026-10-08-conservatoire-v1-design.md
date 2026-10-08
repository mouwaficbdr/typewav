# Le Conservatoire v1 : design

> Ticket parapluie : #120. Vision produit : artifact « Conservatoire TypeWav ». Prototype validé des premières secondes : artifact « Premières secondes TypeWav ». Recherche : `docs/RESEARCH.md`, section 1.
> Cette spec couvre les chantiers 1 à 4. Chaque partie aura son propre plan d'implémentation (superpowers:writing-plans), dans l'ordre des parties.

**But.** Le mode Apprentissage devient le Conservatoire : un module à part entière, le plus important de TypeWav. La v1 amène un débutant total de zéro à tout l'alphabet sans regarder, en musique, avec une raison de revenir chaque jour. Elle remplace l'onboarding actuel par les premières secondes musicales du prototype.

**Portée v1.**

1. Le moteur de maîtrise (états de touche, fenêtre récente, fluidité, révision espacée, erreurs corrigées comptées).
2. L'onboarding de TypeWav : les premières secondes, le clavier vivant, l'instrument, la règle vécue, l'écran des données, deux questions, la détection de disposition, le test de placement.
3. Le cycle 1 : onze leçons courtes et un récital de cycle.
4. Le Conservatoire comme espace : accueil, séance du jour, bilan, parcours, carte du clavier, semaine et agenda.

**Hors portée v1.** Cycles 2 à 5, l'aide qui s'efface selon la maîtrise (chantier 5, sauf l'aide sur hésitation, incluse ici), le tempo imposé (chantier 7), les enchaînements de lettres (chantier 7), le répertoire, le carnet et les diplômes (chantier 8), le parcours QWERTY anglais (chantier 9), la virtuosité (chantier 10), l'installation comme application, toute télémétrie.

## Décisions (prises le 8 octobre 2026, à ne pas rouvrir)

| # | Décision |
|---|---|
| D1 | Un espace à part, « le Conservatoire », avec sa propre entrée de navigation. Les titres de leçon restent en clair (« E et A »), la musique habille sans remplacer. |
| D2 | La PR #112 est le socle (mergée, `bfeb0c4`). |
| D3 | Ordre des touches : les repères de la rangée du milieu, puis les lettres les plus fréquentes du français ; de vrais mots dès la leçon 2 ; le é dans le cycle 1. |
| D4 | Des leçons courtes : 2 à 4 nouvelles touches, environ 4 minutes. |
| D5 | Maîtrise = justesse sur les 30 dernières frappes de la touche, fluidité, révision espacée ; quatre états de touche. |
| D6 | Une note par doigt, l'octave par rangée : la rangée du milieu joue do ré mi fa sol la si do sous les huit doigts. |
| D7 | Tempo imposé aux cycles 4 et 5 (hors v1). |
| D8 | Objectif de la semaine (3, 4 ou 5 jours), aucun jour manqué ne casse rien, ajout à l'agenda. |
| D9 | Entrée : les premières secondes musicales, puis deux questions, puis un test de 30 secondes pour qui tape déjà. |
| D10 | AZERTY français d'abord, moteur indépendant de la disposition, disposition détectée aux premières frappes. |
| D11 | Une erreur corrigée par Retour arrière compte dans la maîtrise de la touche. |

## La philosophie d'interaction (s'applique à tout)

Exigence de Mouwafic, validée sur le prototype : l'onde « goutte d'eau » n'est qu'un exemple d'une philosophie qui vaut pour chaque écran, chaque transition et chaque retour du module.

- **R1. Un écran, une seule chose.** Un écran enseigne, demande ou informe d'une seule chose : une phrase principale, une ligne d'appui au plus. Le détail s'ouvre à la demande.
- **R2. Chaque action a une réponse.** Toute frappe et tout clic produisent un résultat immédiat, visible et audible, en moins de 100 ms. Rien ne se passe sans réponse, sauf l'erreur.
- **R3. Juste : une note et une onde. Raté : rien.** Une goutte d'eau de la couleur du doigt part de la touche et effleure le reste du clavier. Une erreur ne produit ni son, ni flash rouge (règle produit : jamais de fausse note).
- **R4. Seul ce qui compte maintenant est en couleur.** Le clavier reste neutre ; seule la touche attendue prend la couleur de son doigt, et le nom du doigt s'écrit dessous (l'information ne passe jamais par la seule couleur).
- **R5. Tout change par transition.** Le texte glisse, le clavier se met en retrait quand il ne sert pas, la progression se remplit sous les yeux. Aucune coupure sèche, aucun flash entre deux exercices.
- **R6. Le mouvement s'efface pour qui le demande.** Sous `prefers-reduced-motion`, l'onde disparaît et la touche se contente de s'enfoncer ; les transitions deviennent quasi instantanées.

Conséquences concrètes, communes à tous les écrans :

- **Clavier d'abord.** Tout se pilote sans souris : Espace ou Entrée pour continuer, 1, 2, 3 pour choisir, I pour ouvrir un détail. La touche est rappelée en pied d'écran.
- **Mouvement.** Deux courbes seulement : `cubic-bezier(0.16, 1, 0.3, 1)` pour les moments forts (onde, apparition d'un écran), `cubic-bezier(0.25, 0.46, 0.45, 0.94)` pour le reste. Changement de texte : 240 ms, fondu et 8 px.
- **Son.** Trois niveaux : la note d'une frappe juste ; une cadence courte quand quelque chose est validé (reprise de `LevelClearedMoment`) ; un son doux et bref pour un choix. Aucun son sur une erreur.
- **Toujours une sortie.** « Passer » reste accessible pendant l'onboarding ; aucun écran ne piège.
- **Lecteurs d'écran.** Chaque changement d'écran est annoncé dans une région `aria-live="polite"`, avec la touche et le doigt attendus.

## Contraintes globales

- Persistance IndexedDB seulement, dans le store `user_preferences` existant (`apps/web/lib/db.ts`), sans changement de version de la base. Jamais `localStorage`.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (props optionnelles par spread conditionnel).
- TDD : chaque fonction pure a un test qui échoue d'abord. Les tests de rendu Playwright (`apps/web/e2e/`) couvrent chaque nouvel écran à 1280x650 et 1024x600 et tournent dans la CI.
- Fail open : une lecture IndexedDB qui échoue ne piège jamais l'utilisateur.
- La frappe des exercices passe par le champ de capture caché et `commitChar` (`TypingArea`, `useHiddenCapture`), jamais par un listener `keydown` de texte. **Seule exception documentée :** l'onboarding cible des touches physiques et ne compose aucun texte ; il lit `KeyboardEvent.code` sur `keydown`.
- Contenu original ou du domaine public (CONTRIBUTING). Tutoiement partout. Aucun tiret cadratin ni demi-cadratin dans les textes.
- Desktop seulement pour la pratique (décision #110). Sur mobile, `/conservatoire` affiche un seul écran : « Le Conservatoire se joue avec un clavier d'ordinateur. »
- Zéro attribution IA dans les commits, PR et tickets.

## Architecture d'ensemble

```
apps/web/app/[locale]/conservatoire/page.tsx      coquille serveur
apps/web/components/conservatoire/
  ConservatoireClient.tsx    aiguillage : onboarding, accueil, séance, écrans
  Stage.tsx                  primitive « un écran, une chose » (texte, slot, transitions, aria-live)
  LivingKeyboard.tsx         clavier vivant (cible seule en couleur, onde, aide sur hésitation, carte)
  onboarding/OnboardingFlow.tsx
  lesson/LessonPlayer.tsx    les cinq mouvements d'une leçon
  session/SessionPlayer.tsx  la séance du jour (échauffement, leçon, morceau, bilan)
  screens/ Home, Parcours, KeyboardMap, Week
apps/web/lib/conservatoire/  logique pure, testée en web-lib
  mastery.ts  instrument.ts  physical-keys.ts  layout-detection.ts
  cycle1-content.ts  session-plan.ts  week.ts  ics.ts  storage.ts
packages/types/src/conservatoire.ts   types + table des leçons du cycle 1
```

Flux d'une frappe dans un exercice : `TypingArea` (capture cachée) émet `onAttempt` (nouveau, voir partie 1) et `onNoteChange` (avec le caractère, depuis #117). Le lecteur d'exercice enregistre la tentative dans le moteur de maîtrise, joue la note (instrument ou morceau selon le mouvement) et demande l'onde au `LivingKeyboard`.

Coexistence : `CurriculumLearningMode` (niveaux 6 à 11 : majuscules, accents, ponctuation, chiffres) et `LegacyLearningMode` (QWERTY) restent accessibles depuis Paramètres jusqu'aux chantiers 6 et 9, puis sont retirés. La première visite ne les force plus.

---

## Partie 1 : le moteur de maîtrise

### Le journal des tentatives (D11)

Aujourd'hui `useSessionStore.moveBack` retire la dernière frappe de `keystrokes` : une erreur corrigée disparaît de `keystrokeData`. Le moteur a besoin des frappes brutes.

- `TypingArea` gagne une prop optionnelle `onAttempt?: (a: { index: number; expected: string; typed: string; correct: boolean; at: number }) => void`, appelée dans `commitChar` pour chaque caractère validé, avant toute correction. Le Retour arrière n'émet rien.
- Aucun autre comportement de `TypingArea` ne change (le score affiché de la séance reste celui d'aujourd'hui).

### Le modèle

```ts
// packages/types/src/conservatoire.ts
export interface Attempt { correct: boolean; latencyMs: number | null; at: number }
export interface GestureRecord { attempts: Attempt[]; lastSeenAt: number; reviewStep: number }
export type KeyState = 'new' | 'learned' | 'sure' | 'automatic';
export type Mastery = Record<string, GestureRecord>; // clé = id de geste (« e », « é », « A »…)
```

Constantes (`apps/web/lib/conservatoire/mastery.ts`) : `WINDOW = 30`, `MIN_ATTEMPTS = 20`, `SURE_ACCURACY = 0.95`, `AUTOMATIC_MEDIAN_MS = 450` (cycle 1), `PAUSE_MS = 3000`, `REVIEW_DAYS = [1, 3, 7, 14, 30]`.

- **Enregistrer** (`recordAttempt`) : la tentative est attribuée au geste du caractère attendu (`mapCharToGestureId`), y compris quand elle est fausse. `latencyMs` = temps depuis la tentative précédente, ou `null` au-delà de `PAUSE_MS` ou en début d'exercice. On garde les `WINDOW` dernières tentatives.
- **État** (`keyState`), calculé, jamais stocké :
  - `new` : aucune tentative juste.
  - `learned` : au moins une tentative juste.
  - `sure` : au moins `MIN_ATTEMPTS` tentatives et une justesse d'au moins `SURE_ACCURACY` sur la fenêtre.
  - `automatic` : `sure` et une médiane des latences des tentatives justes de la fenêtre inférieure ou égale à `AUTOMATIC_MEDIAN_MS`.
  - Une touche qui retombe sous 95 % redevient `learned` d'elle-même.
- **Validation d'une leçon** (`lessonValidated`) : toutes ses nouvelles touches sont `sure` ou `automatic` au même moment. Une leçon validée le reste, même si une touche faiblit ensuite (la révision s'en charge).
- **Révision espacée** (`dueForReview`) : une touche `sure` est due quand `now - lastSeenAt` dépasse `REVIEW_DAYS[reviewStep]` jours. `reviewStep` avance quand la touche est pratiquée un autre jour en restant `sure`, revient à 0 quand elle retombe à `learned`.
- **Touche faible** (`weakestKeys`) : tri par justesse récente, puis par latence médiane. Remplace l'ancienne « touche qui coince » (constat de #118 : elle choisissait la touche la moins pratiquée).

### Persistance

Clés dans `user_preferences` : `conservatoire_mastery` (`Mastery`), écrite à la fin de chaque mouvement et à `visibilitychange` vers `hidden`. Lecture qui échoue : maîtrise vide en mémoire et une ligne discrète « Tes progrès ne peuvent pas être enregistrés dans ce navigateur ». Les anciennes clés `learning_*` ne sont ni lues ni migrées : l'app n'a pas d'utilisateurs, le Conservatoire démarre à neuf.

### Tests

États et seuils (fenêtre glissante, rechute, automatique), séquence « faux, Retour arrière, juste » comptée deux fois (D11), latences nulles après une pause, révision due selon `REVIEW_DAYS`, `weakestKeys`, lecture en échec. Test de `TypingArea` : `onAttempt` émis pour une frappe fausse corrigée ensuite.

---

## Partie 2 : l'onboarding de TypeWav

### Entrée

- Première visite sur ordinateur (`has_completed_onboarding` absent, `isNonDesktopDevice()` faux) : `HomeClient` redirige vers `/{locale}/conservatoire` au lieu de forcer le mode Apprentissage.
- `/conservatoire` lit le drapeau : absent, l'onboarding ; présent, l'accueil du Conservatoire.
- Mobile : inchangé, aucun onboarding forcé.
- Retirés à la fin de cette partie : `LearningWelcome.tsx` et la porte d'accueil qui l'affiche dans `CurriculumLearningMode` (état `welcomed`, clé `learning_welcomed`), le forçage du mode Apprentissage dans `HomeClient`, la route `dev-onboarding` (devenue inutile, voir le TODO de la mémoire projet).

### Les écrans

Calqués sur le prototype validé. Chaque écran montre une seule chose.

| # | Écran | Ce que fait l'utilisateur | Réponse |
|---|---|---|---|
| 0 | « Ton clavier est un instrument. » | Espace | Le son s'active, l'écran glisse vers le suivant. |
| 1 | « Pose ton index gauche sur F. » Seul F est en couleur, sa bosse est dessinée. | F | Fa, onde bleu ciel ; écran suivant après 650 ms. |
| 2 | « Et ton index droit sur J. » | J | Sol, onde de l'index droit. |
| 3 | « Pose les six autres doigts. Joue de gauche à droite. » Huit barres de progression. | Les 8 repères, l'un après l'autre | Do ré mi fa sol la si do, une onde par note ; à la fin, une cadence et une vague sur toute la rangée. « Tu viens de jouer ta première gamme. » |
| 4 | « Rejoue-la sans regarder tes mains. » Aucune touche en couleur. | La gamme | Même réponse ; la touche attendue réapparaît en contour après 1,6 s d'hésitation. |
| 5 | « Appuie sur K. » | K, puis une autre touche | Une note, puis le silence : « Silence. Une erreur ne joue rien. » |
| 6 | « Tes progrès restent dans ce navigateur. » | I pour le détail, Espace | Le détail s'ouvre en trois lignes : effacer les données du navigateur efface les progrès ; la navigation privée ne garde rien ; on peut tout sauvegarder dans un fichier depuis Paramètres. |
| 7 | « Tu tapes déjà un peu ? » | 1 Je débute, 2 Avec quelques doigts, 3 Sans regarder | Le choix se remplit, son doux, écran suivant. |
| 8 | « Combien de minutes par jour ? » | 1 cinq, 2 dix, 3 quinze | Idem. |
| 9 | Test de placement (si 2 ou 3) | 30 secondes de mots fréquents, morceau en mode attente | Un seul résultat à l'écran : « 34 mots par minute, 96 % de notes justes. » |
| 10 | « Ta première leçon dure 4 minutes. » | Espace | La leçon 1 commence aussitôt, dans la foulée de l'effet « waouh ». |

- **Passer** (coin haut droit, écrans 0 à 8) : mène à l'écran 6 s'il n'a pas été vu (l'information sur les données est due à tous), puis marque l'onboarding comme fait et ouvre l'accueil de TypeWav, où une pastille « Le Conservatoire t'attend » reste visible.
- `has_completed_onboarding` passe à vrai à la fin de l'écran 10 ou après « Passer ».
- L'écran 6 est montré tant que les données sont locales uniquement (aujourd'hui toujours) ; ensuite une mention discrète « Sauvegardé dans ce navigateur » reste dans l'accueil du Conservatoire, et l'export est proposé une fois, après la première leçon validée.

### Détecter la disposition (D10)

- Au démarrage : `navigator.keyboard.getLayoutMap()` si disponible (Chromium), dans un `try` ; `KeyQ` donne « a » : AZERTY.
- Sinon, à la première touche discriminante pendant la gamme : `KeyA` qui produit « q », `KeyQ` qui produit « a », `KeyW` qui produit « z », `Semicolon` qui produit « m » : AZERTY ; les produits inverses : QWERTY.
- Le résultat est enregistré dans la préférence existante `keyboardLayout` ; le clavier vivant change ses libellés par une transition douce.
- Toutes les cibles de l'onboarding sont des positions physiques (`code`), donc l'onboarding fonctionne sur les deux dispositions. En v1, un utilisateur QWERTY termine l'onboarding puis trouve dans l'accueil : « Le parcours QWERTY arrive bientôt », avec un accès à l'ancien mode Apprentissage QWERTY.

### Le test de placement

- 30 secondes sur des mots fréquents en minuscules. Les tentatives alimentent le moteur de maîtrise.
- « Je débute » : leçon 1.
- « Avec quelques doigts » : leçon 1 en parcours accéléré (Découverte réduite à produire chaque nouvelle touche, Gamme divisée par deux ; la validation reste celle de la partie 1).
- « Sans regarder » avec au moins 30 mots par minute et 95 % de justesse : les leçons du cycle 1 sont marquées « validées par le test » et l'utilisateur arrive sur l'accueil, où la séance fait réviser ses touches les plus faibles. En dessous de ces seuils, il est traité comme « Avec quelques doigts ».

### L'instrument (D6)

`apps/web/lib/conservatoire/instrument.ts` remplace `pitchForChar` (gamme pentatonique, livrée pour #117).

| Doigt | auriculaire G | annulaire G | majeur G | index G | index D | majeur D | annulaire D | auriculaire D |
|---|---|---|---|---|---|---|---|---|
| Degré | do | ré | mi | fa | sol | la | si | do (octave suivante) |

- Octave par rangée : rangée du milieu 4 (do4 à do5), rangée du haut 5, rangée du bas 3, rangée des chiffres 6.
- Les deux touches d'un même doigt sur une même rangée sonnent pareil (F et G : fa ; H et J : sol) : l'oreille associe le doigt à sa note.
- La barre d'espace ne joue pas de note : c'est le silence entre deux mots. Elle répond quand même par une onde, de la couleur du pouce (R2).
- Le son passe par `useAudioEngine().playNoteName` (le piano échantillonné de l'app), jamais par un oscillateur.

### Le clavier vivant

`apps/web/components/conservatoire/LivingKeyboard.tsx`, qui remplace `KeyboardDiagramAzerty` dans le Conservatoire.

- **Géométrie et libellés** : `apps/web/lib/conservatoire/physical-keys.ts` décrit chaque touche par son `code` physique (position, taille, doigt, rangée) ; les libellés viennent de la disposition. Les doigts dépendent de la position physique, pas de la disposition.
- **Props** : `layout` ; `target?: string` (code) ; `targetStyle: 'full' | 'faint'` ; `hintAfterMs?: number` ; `mapStates?: Record<string, KeyState>` (mode carte) ; une poignée impérative `ripple(code, strength?)`.
- **R4** : seule la cible prend la couleur de son doigt (palette de `finger-colors.ts`), avec une respiration lente ; le nom du doigt s'écrit sous le clavier. Les bosses de F et J sont toujours dessinées.
- **Onde (R3)** : une couche `<canvas>` au-dessus des touches, adaptée au `devicePixelRatio`. Deux anneaux (le second 140 ms après), du quart de la touche jusqu'au coin le plus éloigné du clavier en 1 150 ms, opacité 0,5 puis 0,28 vers 0, trait de 1,5 puis 1 px. Quand le front de l'onde passe sur une touche, son contour se teinte brièvement. Tout est dessiné dans le canvas, sans écriture DOM par touche, et la boucle `requestAnimationFrame` ne tourne que tant qu'un anneau vit : la fluidité tient à 120 mots par minute.
- **Aide sur hésitation** : avec `hintAfterMs`, la cible réapparaît en contour si rien de juste n'arrive dans le délai.
- **Mode carte** : chaque touche montre son état (contour pointillé, contour plein, fond léger, fond plein), avec le nom de l'état au survol et au focus.
- **R6** : sous `prefers-reduced-motion`, pas de canvas ; la touche s'enfonce (`scale(0.94)`, 120 ms).
- **Taille** : le clavier occupe la largeur disponible dans la limite de 42 % de la hauteur de fenêtre ; testé à 1280x650 et 1024x600.

### La primitive d'écran

`Stage.tsx` : une phrase principale (Cormorant), une ligne d'appui (Sora), un emplacement (clavier, choix, détail), un pied d'écran pour la touche à presser, l'action « Passer » optionnelle. Changement de texte en 240 ms. Annonce `aria-live`. Tous les écrans du Conservatoire passent par elle : c'est elle qui garantit R1 et R5.

### Tests

Unitaires : `instrument` (gamme sous les huit doigts, octaves, espace muette), `layout-detection` (paires `code`/caractère, carte de disposition indisponible), règles du placement. Composants : progression des écrans au clavier (`keyDown` avec `code`), écran 6 et son détail, chemin « Passer » qui montre l'écran 6, `LivingKeyboard` (seule la cible porte `data-target`, aide après le délai avec horloge simulée, mode carte). Rendu Playwright : parcours complet de l'onboarding au clavier, aucun chevauchement à chaque écran, pas de canvas sous mouvement réduit.

---

## Partie 3 : le cycle 1

### Les leçons

`packages/types/src/conservatoire.ts` porte la table, dérivée et vérifiée comme `LEARNING_CURRICULUM_AZERTY`.

| # | Titre | Nouvelles touches | Remarque |
|---|---|---|---|
| 1 | Les repères | q s d f j k l m | La gamme du repos. Pas de voyelle : gammes et accords seulement (q d j joue do mi sol). |
| 2 | E et A | e a | Premiers mots : le, la, les, des, elle, salle, dame. |
| 3 | I et N | i n | |
| 4 | T et R | t r | |
| 5 | U et O | u o | |
| 6 | P et C | p c | |
| 7 | É et V | é v | Le é, environ 2 % des lettres d'un texte français. |
| 8 | G et H | g h | Les étirements des index. |
| 9 | B et Y | b y | |
| 10 | X et Z | x z | |
| 11 | W et K | w k | Rares en français : liste de mots dédiée (kilo, wagon, kayak…). |
| 12 | Récital du cycle 1 | aucune | Un texte complet, toutes les lettres, au moins 95 % de justesse. |

Ordre vérifié sur le corpus français du repo (entrées `language: 'fr'` des collections et listes de `learning-texts.ts`) : 32 mots pour la leçon 2, puis 90 à plusieurs centaines.

### Une leçon en cinq mouvements

`LessonPlayer.tsx`, environ 4 minutes, durées ajustées au temps quotidien choisi.

1. **Découverte** (première fois seulement) : un écran par nouvelle touche. « Voici E. Ton majeur gauche monte d'un cran. » Seul E est en couleur ; une frappe juste donne sa note et son onde, puis la touche suivante.
2. **Gamme** : groupes de 2 à 5 touches, au moins la moitié des frappes sur les nouvelles touches, pondérés vers les touches faibles. Chaque touche joue sa note : la suite devient une mélodie, présentée comme une gamme. Leçon 1 : motifs écrits à la main (gammes montantes et descendantes, accords).
3. **Mots** : de vrais mots du vocabulaire acquis, ciblés sur les nouvelles touches (sélecteur ciblé de #113). Chaque mot joue sa mélodie.
4. **Récital** : une phrase complète, écrite pour la leçon, sur le vrai morceau en mode attente. Juste, la phrase musicale se conclut sur une cadence. Leçon 2 : une suite de mots, faute de vocabulaire pour une phrase.
5. **Bilan** : une seule information, sur le clavier en mode carte : « E est sûre. A est apprise : on la retravaille demain. »

Pas d'échec, pas de répétition imposée. Si les nouvelles touches sont toutes sûres, la leçon est validée : célébration (`LevelClearedMoment` avec le titre de la leçon), et la leçon suivante s'ouvre. Sinon : « Cette leçon continue à ta prochaine séance. » On peut toujours rejouer une leçon validée.

### Le contenu

`apps/web/lib/conservatoire/cycle1-content.ts`, construit sur `learning-content.ts` :

- **Banque de mots** : mots du corpus français du repo et listes curées, filtrés par les touches acquises, avec une liste d'exclusion de mots inappropriés.
- **Phrases de récital** : écrites à la main, trois par leçon au moins, uniquement avec les touches acquises.
- **Texte du récital de cycle** : original, toutes les lettres du cycle.

### Tests

Intégrité de la table (2 à 4 nouvelles touches hors leçon 1, aucun doublon, union = a à z et é). Au moins 25 mots français par leçon à partir de la leçon 2. Phrases de récital limitées aux touches acquises. Simulation d'un joueur parfait : chaque leçon se valide en au plus trois séances. Composant : ordre des mouvements, Découverte jouée une seule fois, validation suivie de la célébration.

---

## Partie 4 : le Conservatoire comme espace

### Entrée et navigation

- Route `/{locale}/conservatoire` ; nouvelle entrée dans `GlobalNav`, en première position.
- Sur l'accueil de TypeWav, une seule pastille discrète pour qui a commencé : « Ta leçon 4 t'attend ». Elle disparaît pendant la frappe.

### L'accueil : une seule chose

Un seul geste principal : « Ma séance, 10 minutes » (Espace). Une ligne d'appui : la semaine (« 3 jours sur 4 cette semaine »). Trois accès discrets en bas d'écran, chacun ouvrant son propre écran : Parcours, Clavier, Semaine.

### La séance du jour

`session-plan.ts` compose la séance selon le temps choisi et la vitesse récente :

| Temps | Échauffement | Leçon ou travail ciblé | Morceau | Bilan |
|---|---|---|---|---|
| 5 min | 30 s | 3 min | 1 min 30 | 3 écrans courts |
| 10 min | 1 min | 6 min | 3 min | 3 écrans courts |
| 15 min | 1 min 30 | 9 min | 4 min 30 | 3 écrans courts |

- **Échauffement** : la gamme du repos et les touches dues en révision (trois au plus).
- **Leçon** : la leçon en cours, sinon la suivante, sinon un travail ciblé sur les touches les plus faibles.
- **Morceau** : un texte fait du vocabulaire acquis, sur le morceau par défaut (`fur-elise`) en mode attente. Le choix du morceau arrive avec le répertoire (chantier 8).
- **Bilan**, trois écrans d'une seule information chacun : ce qui a été gagné (les touches devenues sûres s'allument sur la carte) ; la semaine ; « Demain : leçon 5, U et O. C'est assez pour aujourd'hui. »
- Continuer reste possible (« Encore 5 minutes »), sans jamais y pousser.

### Parcours, clavier, semaine

- **Parcours** : les onze leçons et le récital, l'une sous l'autre, chacune avec son état (validée, en cours, à venir). Une leçon validée se rejoue d'un geste.
- **Clavier** : la carte du clavier en mode carte, et rien d'autre.
- **Semaine** : sept marques du lundi au dimanche, l'objectif (3, 4 ou 5 jours, 4 par défaut, modifiable), le nombre de semaines tenues. Jamais de série qui se casse. Un jour de pratique = au moins une séance terminée ce jour-là, en date locale.
- **Agenda** (depuis Semaine) : trois écrans, un par question (les jours, l'heure, la confirmation), puis le téléchargement de `typewav-seance.ics` : `RRULE` hebdomadaire sur les jours choisis, durée = temps quotidien, lien vers `/conservatoire`.

### Persistance

`conservatoire_profile` (version, date de début, réponse à « Tu tapes déjà un peu ? », minutes par jour, jours par semaine, résultat du placement), `conservatoire_progress` (par leçon : enseignée, validée et quand, leçon en cours), `conservatoire_days` (dates locales de pratique, 120 jours au plus).

### Tests

`session-plan` (répartition par durée, priorité leçon puis travail ciblé), `week` (semaine du lundi, dates locales, passage à l'heure d'été), `ics` (champs RFC 5545, fins de ligne CRLF). Composants : l'accueil n'a qu'une action principale, la séance enchaîne ses quatre temps, le bilan montre trois écrans. Rendu Playwright : accueil, séance et bilan sans chevauchement aux deux tailles.

---

## Gestion des erreurs

- IndexedDB indisponible : jamais d'onboarding forcé, le Conservatoire fonctionne en mémoire avec une ligne honnête sur l'enregistrement impossible.
- Son bloqué ou en échec : tout le visuel continue (onde comprise) ; une ligne « Le son n'a pas pu démarrer » avec un geste pour réessayer.
- Disposition inconnue : libellés AZERTY par défaut, réétiquetés à la détection.
- Morceau MIDI introuvable : le récital et le morceau passent en mode instrument, sans erreur visible.

## Vérification avant chaque merge

Gate complet (`pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build`, tests de rendu dans la CI). Puis revue en deux temps sur le rendu réel : obsession-architect en mode revue (code, puis écrans), elite-ui-designer et web-design-guidelines pour l'accessibilité. Enfin, vérification à la main par Mouwafic, au son, sur son clavier.

## Après la v1

Chantier 5 (l'aide qui s'efface selon la maîtrise, sans filet, posture, coaching au lecteur d'écran), 6 (cycle 2 en leçons courtes, retrait de `CurriculumLearningMode`), 7 (fluidité, enchaînements, pulsation, l'orchestre avance, grades), 8 (répertoire, carnet, diplômes), 9 (QWERTY anglais, retrait de `LegacyLearningMode`), 10 (virtuosité). Détail dans #120.
