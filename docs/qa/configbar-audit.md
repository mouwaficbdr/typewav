# Audit QA : config bar de TypeWav

Date : 2026-09-04. Branche : `qa/configbar-audit` (depuis `origin/main` `d7767d9`).
Auteur de l'audit : passe QA follower (round parallèle avec la refonte UI menée par le lead).

## Méthode

Lecture de tout le périmètre config bar (composants, `useConfigStore`, `text-filters`,
`words`, `music-catalog`, `adaptive`, la chaîne de sélection de `HomeClient`, les 5
`collection.config.ts`, `selectFromTexts` de `@typewav/collections`, `LearningMode`),
puis reproduction manuelle dans Chromium sur `http://localhost:3001`, avec
`monkeytype.com` ouvert en parallèle pour comparer option par option. Les chiffres
de diversité sont extraits des fichiers de collections (voir Annexe).

MonkeyType observé : version `v26.32.0`.

## Verdict en une ligne

La config bar est riche en boutons mais plusieurs options ne font pas ce que leur
libellé promet. Trois modes sur quatre de la base MonkeyType (Temps, Mots, Zen) ont
une logique différente de leur équivalent MonkeyType, souvent à leur désavantage.
La diversité de textes est très faible dès qu'on cible une longueur ou une langue :
un tir sur "Mots 100 / français" renvoie toujours le même texte.

## Légende de sévérité

- **Critique** : l'option ment sur son résultat, ou un état courant casse l'usage.
- **Majeur** : la feature ne tient pas l'objectif qu'elle vend, ou écart net avec MonkeyType au détriment de l'utilisateur.
- **Mineur** : incohérence, finition, cas limite peu fréquent.

---

## Volet A : base inspirée de MonkeyType

### Tableau de correspondance

| Option | MonkeyType (observé) | TypeWav (observé) | Écart |
|---|---|---|---|
| Toggle ponctuation | Ajoute de la ponctuation à un flux de mots propres | Retire la ponctuation d'un extrait littéraire | Sens inversé ; produit des fragments abîmés (voir A2) |
| Toggle chiffres | Injecte des groupes de chiffres dans le flux | Préfère un texte qui contient déjà un chiffre, jamais injecté ; relâché si le pool est vide | Beaucoup plus faible : sur `both`, "chiffres" ne garantit rien |
| Filtre langue | Sélecteur 150+ langues, change tout le pool | `fr` / `en` / `both` ; filtre les textes de collection | Fonctionne, mais divise par ~2 un pool déjà petit (voir C) |
| Mode Temps | Flux de mots infini, gros compte à rebours, la session dure exactement la durée choisie | Un extrait fixe calibré ~42 wpm ; aucun compte à rebours ; la session finit au premier de : fin du texte OU deadline | Majeur : au-dessus de ~45 wpm la durée choisie est ignorée (voir A3) |
| Valeurs 15 / 30 / 60 / 120 | Durée réelle du test | Cible de longueur de texte (`charCount ≈ durée × 3.5`), pas une durée garantie | Voir A3, A4 |
| Mode Mots | N mots aléatoires d'un pool de langue | Les N premiers mots d'un extrait littéraire, coupés au milieu de la phrase | Majeur : ce n'est pas un flux de mots (voir A5) |
| Valeurs 10 / 25 / 50 / 100 | Nombre de mots réel | Minimum de mots requis du texte source ; si aucun texte assez long, moins de N mots | Voir A5, C2 |
| Mode Citation | ~2000+ citations, sous-filtre longueur `all / short / medium / long / thicc`, recherche | Choix de collection (`Littérature / Poésie / Philosophie`), Code et Gaming masqués ; pas de filtre longueur, pas de recherche | La longueur devient une collection ; pool par collection très petit (voir C) |
| Mode Zen | Écran vide, on tape ce qu'on veut, sans texte, sans timer, sans écran de score | Un extrait borné à suivre, overlay wpm masqué, puis navigation vers `/results` avec note et verdict | Majeur : ce n'est pas le Zen de MonkeyType et ça contredit sa propre promesse (voir B1) |

### A1. Le compte à rebours du mode Temps n'existe pas (Majeur)

MonkeyType : le compte à rebours est l'élément dominant de l'écran en mode time.

TypeWav : `useSession` pose un `setTimeout(endSession, durationSeconds*1000)` pour
`mode === 'classic'`, mais rien n'affiche le temps restant. `TypingArea` ne montre
qu'un overlay `wpm · acc`. L'utilisateur n'a aucun repère de fin.

Repro : Temps, n'importe quelle durée, taper. Aucun chiffre de temps à l'écran.
Reco : afficher un compte à rebours pendant les modes chronométrés.

### A2. Ponctuation OFF abîme le texte littéraire (Mineur)

`removePunctuation` fait `text.replace(/[\p{P}\p{S}]/gu, ' ')`. Sur une citation,
ça retire aussi les apostrophes et tirets internes :

- "L'histoire n'est que le tableau..." devient "L histoire n est que le tableau..."
- "Call me Ishmael. Some years ago, never mind..." devient "Call me Ishmael Some years ago never mind..."
- "C'était le meilleur des temps" devient "C etait le meilleur des temps"

MonkeyType n'a pas ce problème : sans ponctuation, il part d'un flux de mots qui
n'en a jamais eu. Reco : en mode sans ponctuation, préférer des textes courts
naturellement sans ponctuation interne, ou passer à une vraie liste de mots.

### A3. La durée choisie est ignorée pour tout typeur au-dessus de ~45 wpm (Majeur)

`selectFromTexts` cible `targetChars = durationSeconds × 3.5` (± 40 %). 3.5 c/s vaut
environ 42 wpm. `useSessionStore.recordKeystroke` termine la session dès que
`position >= text.length`. Donc un typeur à 80 wpm finit le texte à ~50 % de la
durée, un typeur à 120 wpm à ~35 %, et la session s'arrête là.

Repro live : Temps 15 s sélectionné, texte "Art is not what you see but what you make
others see" (~50 caractères), frappe rapide. Écran de résultats :
`mode=classic&duration=3136` (3,1 secondes). Le "15 s" n'a rien produit.

Reco : soit un vrai mode temps (flux de texte qui se recharge jusqu'à la deadline),
soit renommer en un mode "extrait" honnête sans promesse de durée.

### A4. Le libellé de durée n'a parfois aucun rapport avec le texte (Majeur)

Quand le pool ciblé par la fenêtre de longueur est vide, `selectFromTexts` relâche
tous les filtres et renvoie un texte quelconque. La fenêtre `15 s` vaut
`[32, 74]` caractères : la collection Gaming n'a **aucun** texte dans cette fenêtre
(charCount minimum 82). Donc "Temps 15 s + Gaming" affiche un texte gaming de
longueur arbitraire, coupé à 15 s. Le chip "15" ne décrit alors plus rien.

### A5. Le mode Mots n'est pas un flux de mots (Majeur)

`generateWordList` et les pools `WORDS_EASY/NORMAL/HARD/EXPERT` de `lib/words.ts`
**ne sont importés nulle part** dans l'app (vérifié : seul `generateLearningText`
sert, pour le mode Apprentissage). En mode Mots, `HomeClient` appelle
`selectFromTexts` puis `applyTextFilters` avec `mode: 'sprint'`, ce qui tronque
l'extrait à N mots via `truncateToWords`.

Repro live : Mots 25, collection Littérature. Texte obtenu :
"Call me Ishmael Some years ago never mind how long precisely having little money in
my purse I thought I would sail about a little" (exactement 25 mots, ouverture de
Moby Dick coupée en plein milieu de "... sail about a little [and see the watery
part of the world]").

MonkeyType Mots 25 : 25 mots courants aléatoires, sans contexte, sensation de pool
infini. Reco : soit brancher un vrai générateur de flux de mots (les pools existent
déjà, non câblés), soit renommer.

### A6. Deux chips paraissent sélectionnés en même temps (Mineur)

Le chip "Zen" a un traitement `variant: 'signature'` qui le rend toujours de la
couleur d'accent, avec fond teinté, même non sélectionné (`chipStyle`, branche
`isSignature || active`). Résultat : en mode Temps ou Code, "Zen" reste visuellement
allumé comme s'il était actif. `aria-pressed` reste correct (seul le vrai mode actif
est `true`), donc c'est purement visuel. À vérifier après la refonte : garder le Zen
"signature" distinct de l'état sélectionné.

### A7. Changer un modificateur en pleine frappe relance la session en silence (Mineur)

La config bar reste interactive pendant une session. `text` est recalculé dans un
`useMemo` qui dépend de `punctuationEnabled` / `numbersEnabled`. Toggler l'un des
deux après avoir tapé quelques caractères change `text`, ce qui fait repartir
`useSession` de zéro (position et keystrokes remis à 0) sans aucun avertissement.
MonkeyType redémarre aussi le test dans ce cas, mais l'affiche clairement.

---

## Volet B : la touche TypeWav

### B1. Zen ne tient pas sa promesse de calme (Majeur)

Le code dit lui-même l'intention : commentaire de `ConfigBar`
("Zen promet le calme"), commentaire de `TypingArea` ("sans pression, sans timer...
sinon zen == quote avec juste un timer en moins").

Ce que Zen fait réellement :

- `zen` est dans `MODES_WITH_TEXT_CONFIG` : il affiche un extrait borné de la
  collection active, qu'il faut suivre caractère par caractère.
- Toute frappe fausse produit un silence (règle produit), donc chaque faute crée un
  trou dans la musique, pendant le mode censé être apaisant.
- L'overlay wpm/acc est bien masqué (`mode !== 'zen'`), ça c'est tenu.
- Mais à la fin du texte, `endedAt` est posé, `autoNavigate` vaut `true`, et on est
  redirigé vers `/results`.

Repro live : Zen, taper l'extrait jusqu'au bout. Résultat :
`/results?...&mode=zen&duration=6994`, écran affichant "177 WPM NET / 95 % PRÉCISION
/ 100 % RÉGULARITÉ" et le verdict "La fin t'a coûté 32 % de vitesse.", plus une
recommandation sur la baisse de régularité.

Être noté, jugé sur sa vitesse et sa précision, et recevoir un verdict, c'est
l'inverse du calme. Reco : un vrai Zen (pas de texte imposé, ou texte défilant sans
faute possible, pas de navigation vers `/results`, pas de verdict).

### B2. Difficulté adaptative : entièrement morte (Majeur)

`hooks/useAdaptive.ts` (spec 07, "l'adaptation ne s'annonce jamais") n'est appelé
**nulle part**. `lib/adaptive.ts` (`evaluateAdaptation`, `filterWordsByComplexity`)
n'est utilisé que par ce hook mort. Donc :

- La difficulté ne s'adapte jamais à la performance.
- Le `tempoMultiplier` d'adaptation (0.9 à 1.1) n'est pas branché.
- Le spread de difficulté des collections (`difficulty: 1..5`) n'est jamais lu par la
  sélection de texte principale (`HomeClient` ne passe ni `difficulty` ni
  `difficultyMin` à `selectFromTexts`).

Reco : soit câbler l'adaptatif, soit le retirer du code et de la spec pour ne pas
laisser croire qu'il existe.

### B3. Réactivité tempo : réelle. Réactivité octave : cosmétique (Mineur)

- Tempo : `warpEngine` est bien câblé dans `useAudioEngine`
  (`warpEngine.onKeystroke()`, `getNoteDuration`, `getCurrentBpm` vers
  `useAudioStore.setLiveBpm`). Le tempo suit la vitesse de frappe (EMA sur les 8
  dernières frappes, `WPM_TO_BPM_FACTOR = 2.5`). Promesse tenue.
- Octave : `applyTypingExpression` / `getTypingOctaveShift` applique un motif fixe
  `[-1, 0, 1, 0]` indexé par `wordIndex`, uniquement sur les consonnes. Ce n'est pas
  une réaction à "la vitesse et au rythme de frappe" : c'est une oscillation
  prédéterminée par position de mot. Le discours "l'octave réagit à ton rythme" n'est
  pas soutenu par le code.

### B4. Le chip "Recommandation" affiche un registre mais ne change pas la musique (Mineur)

`ActiveSessionHeader` affiche `Recommandation: <registre>` calculé par
`getRecommendedRegister(mode, collection, 60)`. La durée est **codée en dur à 60**
dans `useMusicRecommendation` (ligne `const durationSeconds = 60`), donc les paliers
durée de `getRecommendedRegister` (`<= 15` energique, `>= 120` contemplatif) sont
morts.

Surtout, la pièce réellement jouée reste `selectedPieceId` (défaut `fur-elise`)
jusqu'à ce qu'on clique le chip. Repro live : passer en mode Code, le chip affiche
"Recommandation: dramatique" mais la pièce active reste "Für Elise" (romantique).
Le chip informe sans agir, ce qui prête à confusion.

### B5. `getRecommendedRegister` référence des modes qui n'existent pas (Mineur)

`modeRules` contient `endurance` et le commentaire mentionne `bigrams` : aucun des
deux n'est dans la liste `MODES` de la config bar. Reliquat à nettoyer.

### B6. Mode Code : pas de sélecteur de langue ni de collection (Mineur)

En mode Code, `ContextSelectors` et `CollectionSelector` renvoient `null` (`code`
absent de `MODES_WITH_TEXT_CONFIG`). On ne peut donc pas cibler le français ou
l'anglais des snippets (la collection Code a 57 entrées `en` et 27 `fr`), ni voir
quelle langue est active. Choix défendable, mais le filtre langue aurait du sens ici.

### B7. Mode et collection sont deux axes indépendants non réconciliés (Mineur)

Changer de mode ne remet pas la collection à une valeur cohérente (sauf Code qui
force `code`, et Citation qui fuit `code`/`gaming`). On peut donc se retrouver en
"Temps" ou "Mots" avec la collection Code active : on tape alors des snippets, avec
ponctuation et chiffres forcés à `true` et les toggles masqués, sous un libellé de
mode qui parle de temps ou de mots. Repro live : cliquer Code (collection forcée sur
`code`), puis cliquer Temps : la collection reste `code`, toggles absents, texte =
snippet.

### B8. Fantôme : aucun repère sur ce qui est rejoué (Mineur)

Dès qu'un record personnel existe, Fantôme devient actif sans bannière et rejoue le
texte exact de la meilleure session (donc parfois dans une autre langue que le filtre
courant). Rien à l'écran n'indique "fantôme de ton record : X wpm" ni de quel texte
il s'agit. Sans donnée, la bannière `ghost.noRecordFallback` et le repli vers
`classic` fonctionnent (vérifié par lecture, non reproductible en l'état : des
records existaient déjà dans le profil de test).

### B9. Mode Libre : correctement géré (bon point)

Sans texte personnel sélectionné : bannière claire "Aucun texte personnel
sélectionné. Ouvrez « Mes textes »..." avec un bouton d'accès. Le texte personnel
n'est jamais filtré (choix assumé et cohérent).

---

## Volet C : richesse et diversité

### Chiffres par collection

| Collection | Entrées | fr / en | difficulté 1 / 2 / 3 / 4 / 5 | wordCount min / médiane / max | charCount min / médiane / max |
|---|---|---|---|---|---|
| Littérature | 116 | 58 / 58 | 23 / 33 / 35 / 19 / 6 | 5 / 16 / 123 | 30 / 89 / 679 |
| Poésie | 76 | 38 / 38 | 9 / 16 / 32 / 9 / 10 | 6 / 17 / 123 | 35 / 89 / 722 |
| Philosophie | 73 | 36 / 37 | 17 / 15 / 21 / 10 / 10 | 4 / 16 / 124 | 23 / 81 / 673 |
| Gaming | 78 | 39 / 39 | 6 / 12 / 42 / 9 / 9 | 14 / 18 / 102 | 82 / 109 / 659 |
| Code | 84 | 27 / 57 | 21 / 2 / 36 / 5 / 20 | 6 / 19 / 117 | 40 / 130 / 1062 |
| **Total** | **427** | | | | |

Comparatif : la seule base de citations anglaises de MonkeyType compte plus de 2000
entrées ; le mode words tire d'un pool de plusieurs milliers de mots par langue, sur
150+ langues.

### C1. Pool "Temps" par palier (textes dont `charCount` tombe dans la fenêtre `± 40 %`)

| Collection | 15 s (`both` / fr / en) | 30 s | 60 s | 120 s |
|---|---|---|---|---|
| Littérature | 41 / 16 / 25 | 68 / 35 / 33 | 16 / 8 / 8 | 10 / 4 / 6 |
| Poésie | 25 / 15 / 10 | 42 / 21 / 21 | 13 / 4 / 9 | 6 / 4 / 2 |
| Philosophie | 31 / 14 / 17 | 37 / 18 / 19 | 10 / 4 / 6 | 7 / 5 / 2 |
| Gaming | **0 / 0 / 0** | 66 / 33 / 33 | 7 / 5 / 2 | 7 / 3 / 4 |
| Code | 13 / 1 / 12 | 44 / 12 / 32 | 29 / 12 / 17 | 7 / 3 / 4 |

"Temps 120 s / français / poésie" : pool de 4 textes. "Temps 60 s / français /
philosophie" : 4 textes. "Temps 15 s / gaming" : 0 (relâchement total, voir A4).

### C2. Pool "Mots" par palier (textes dont `wordCount >= N`)

| Collection | N=10 (`both` / fr / en) | N=25 | N=50 | N=100 |
|---|---|---|---|---|
| Littérature | 102 / 50 / 52 | 25 / 12 / 13 | 11 / 6 / 5 | **2 / 1 / 1** |
| Poésie | 67 / 32 / 35 | 18 / 7 / 11 | 8 / 5 / 3 | **4 / 2 / 2** |
| Philosophie | 56 / 28 / 28 | 17 / 9 / 8 | 8 / 5 / 3 | **3 / 1 / 2** |
| Gaming | 78 / 39 / 39 | 12 / 6 / 6 | 11 / 5 / 6 | **2 / 1 / 1** |
| Code | 79 / 27 / 52 | 30 / 12 / 18 | 11 / 6 / 5 | **2 / 1 / 1** |

### C3. Anti-répétition = un seul texte exclu, donc alternance figée (Critique)

`HomeClient` passe `excludeIds: [lastEntryIdRef.current]` : uniquement le dernier
texte vu. `_applyFilters` ne l'applique même pas si ça viderait le pool.

- Repro live : Mots 100, Littérature, `français + anglais`. 10 shuffles consécutifs
  donnent une alternance stricte A B A B A B... entre exactement 2 textes ("Christmas
  won t be Christmas..." de Little Women, "Quoique ce détail ne touche..." des
  Misérables).
- Repro live : Mots 100, Littérature, `français`. 9 shuffles donnent **le même texte
  à chaque fois** ("Quoique ce détail ne touche en aucune manière...").

Un utilisateur qui fait des séances "Mots 100" retape en boucle les 2 mêmes passages,
ou un seul en français. Reco : historique d'exclusion plus long (les 5 à 10 derniers),
et prévenir quand le pool ciblé descend sous un seuil.

### C4. Probabilité de répétition, cas courant

Pour un pool ciblé de taille `P` avec exclusion du seul dernier texte, la proba de
revoir un texte donné au tir suivant est `1 / (P - 1)`, et la séquence A B A B a
proba 1 dès que `P = 2`. Sur les paliers 60 s / 120 s / Mots 50 / Mots 100 filtrés
par langue, `P` est souvent entre 1 et 6 (voir C1, C2). La "découverte continue" ne
tient pas à ces paliers.

### C5. `lib/words.ts` : doublons dans les pools (Mineur, corrigé sur cette branche)

- `WORDS_NORMAL` contient `place` deux fois.
- `WORDS_HARD` contient `question` deux fois.
- `WORDS_HOME_ROW` contient 7 doublons (`flask`, `lads`, `lass`, `fads`, `dads`,
  `adds`, `asks`).

Ces pools alimentent le mode Apprentissage via `generateLearningText` (niveau 1 :
`WORDS_HOME_ROW` filtré ; niveaux 2 à 4 : `WORDS_EASY` / `WORDS_NORMAL`). Un doublon
double la probabilité de tirer ce mot. Doublons retirés sur cette branche, avec test
de non-régression (`words.no-duplicates.test.ts`).

### C6. `WORDS_HOME_ROW` contient des mots hors home row et un non-mot (Mineur, flag)

`jade`, `jades`, `fake`, `faked` (lettre `e`), `sash`, `flash`, `slash`, `halls`
(lettre `h`), `balls`, `calls` (b, c), `flags` (g) ne sont pas des mots home row,
malgré le nom et le commentaire de l'array. Ils sont neutralisés pour le niveau 1
par `filterWordsByKeys`, mais `jall` (j, a, l, l) **passe** ce filtre alors que ce
n'est pas un mot anglais. Un élève niveau 1 peut donc se voir présenter "jall".
Non corrigé ici pour garder le diff minimal (les niveaux 2 à 4 consomment aussi cet
array indirectement) : à traiter à part.

---

## Findings consolidés par sévérité

### Critique

1. **C3** Anti-répétition à un seul texte : alternance A B A B, voire texte unique en français, sur les paliers ciblés.

### Majeur

2. **A3** La durée du mode Temps est ignorée dès ~45 wpm (la session finit à la fin du texte court).
3. **A5** Le mode Mots tronque un extrait littéraire au lieu de générer un flux de mots ; les pools de générateur existent mais ne sont pas câblés.
4. **A1** Aucun compte à rebours affiché en mode chronométré.
5. **A4** Le libellé de durée ne décrit plus rien quand le pool ciblé est vide (Gaming 15 s = 0 texte).
6. **B1** Zen note et délivre un verdict de performance, à l'opposé de sa promesse, et n'est pas le Zen de MonkeyType.
7. **B2** La difficulté adaptative (spec 07) est du code mort, jamais montée.

### Mineur

8. **A2** Ponctuation OFF abîme le texte littéraire ("L histoire n est que").
9. **A6** Le chip Zen "signature" reste visuellement allumé même non sélectionné.
10. **A7** Toggler un modificateur en pleine frappe relance la session sans le dire.
11. **B3** L'octave ne réagit pas au rythme (motif fixe par mot) ; seul le tempo réagit vraiment.
12. **B4** Le chip "Recommandation" affiche un registre mais ne change pas la pièce jouée ; durée codée en dur à 60.
13. **B5** `getRecommendedRegister` référence des modes inexistants (`endurance`, `bigrams`).
14. **B6** Mode Code : pas de filtre langue ni de sélecteur de collection.
15. **B7** Mode et collection non réconciliés : "Temps"/"Mots" + collection Code est un état atteignable et incohérent.
16. **B8** Fantôme ne dit pas quel record ni quel texte il rejoue.
17. **C5** Doublons dans `WORDS_NORMAL` / `WORDS_HARD` / `WORDS_HOME_ROW` (corrigé ici).
18. **C6** `WORDS_HOME_ROW` contient des mots hors home row et le non-mot `jall` (flag).

### Bons points

- Mode Libre : bannière claire quand aucun texte n'est sélectionné, texte jamais filtré.
- Mode Code : les toggles ponctuation/chiffres sont bien masqués (ils mentiraient sur l'état réel).
- Réactivité tempo : réellement branchée et fidèle à la promesse.
- `selectFromTexts` : le relâchement progressif garantit qu'on n'a jamais `null` sur une collection non vide.

---

## À replier par le lead (fichiers hors périmètre follower / en refonte)

Ces points touchent des fichiers de la branche de refonte UI (`HomeClient.tsx`,
`ConfigBar.tsx`, `TypingArea.tsx`, `useSession.ts`) ou hors lane, non modifiés ici :

- A1 (compte à rebours) : `TypingArea.tsx` / `useSession.ts`.
- A3, A4, A5, B1, B7 : logique de sélection et de fin de session dans `HomeClient.tsx` + `useSession.ts` + le contrat de `selectFromTexts`.
- A6 (chip signature) : `ConfigBar.tsx` (`chipStyle`).
- A7 : `HomeClient.tsx` (`useMemo` de `text`).
- B4 : `ActiveSessionHeader.tsx` + `useMusicRecommendation.ts` (`durationSeconds` codé en dur).
- `HomeClient.tsx`, rendu Citation (bloc `effectiveMode === 'quote' && source`) : la ligne d'attribution est préfixée d'un tiret cadratin littéral utilisé comme ponctuation dans le JSX, contraire à la règle projet. À remplacer par un deux-points ou à retirer.
- `apps/web/lib/collection-support.ts` : le commentaire d'en-tête contient encore deux tirets cadratins (dans les exemples de label `source` cités). Hors lane, non corrigé ici.
- `apps/web/lib/words.ts` : les commentaires de doc des cinq pools (`Mots courts ... niveau facile`, etc.) utilisent un tiret cadratin. Préexistant, hors du périmètre du fix doublons, laissé intact pour garder le diff minimal.

## Corrigé sur cette branche

- `lib/words.ts` : suppression des doublons dans `WORDS_NORMAL`, `WORDS_HARD`, `WORDS_HOME_ROW` (C5). Test de non-régression ajouté.

## Fichiers de test ajoutés (comportement uniquement, zéro assertion de style)

- `packages/collections/src/__tests__/selection-diversity.test.ts` : taille des pools ciblés, alternance figée avec `excludeIds` d'un seul élément, effet du filtre langue, fenêtre de durée vide pour Gaming 15 s, relâchement progressif.
- `apps/web/lib/__tests__/configbar-text-selection.test.ts` : `applyTextFilters` en mode sprint tronque à N et peut rendre moins de N mots ; ponctuation OFF retire les apostrophes internes ; chiffres OFF ; `mode` non-sprint ne tronque pas.
- `apps/web/lib/__tests__/words.no-duplicates.test.ts` : les pools de mots n'ont pas de doublon ; le pool niveau 1 d'Apprentissage reste non vide après filtrage home row.

## Annexe : méthode de comptage

Extraction par script depuis les 5 `collection.config.ts` (un bloc = `id` +
`content` + `language` + `difficulty` + `wordCount` + `charCount`). Fenêtre de durée :
`targetChars = durationSeconds × 3.5`, bornes `[targetChars × 0.6, targetChars × 1.4]`
(constantes `CHARS_PER_SECOND` et `DURATION_TOLERANCE` de `packages/collections/src/fetch.ts`).
Pool Mots : `wordCount >= N` (filtre minimum de `_applyFilters`).
