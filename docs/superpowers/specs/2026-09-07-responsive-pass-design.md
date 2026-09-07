# Passe responsive complète (#71) — design + catalogue d'audit

Statut : audit en cours. Plan validé par Mouwafic le 2026-09-07.

## Contexte

`WS-1` du plan de lancement était marqué « Accessibilité et responsive : livré
(8 / 8) », mais chaque entrée du journal porte la même réserve : « QA responsive
en navigateur réel encore à faire (jsdom sans moteur de layout) ». #71 **est**
cette QA différée, plus tout ce qui a été construit depuis (ConfigBar redesign
PR #70, mode Apprentissage PR #91, thème cyprus-sand, capture `<input>` PR #102,
boutons Partager/Défier PR #103, cartes OG…).

L'app est stylée presque entièrement en `style={{}}` inline + un peu de Tailwind.
Très peu de points de rupture explicites : le layout repose sur `clamp()`, `%`,
`flex-wrap`, `dvh`. `LeaderboardTable` est le seul composant avec un usage
`sm:`/`md:` conséquent.

## Périmètre

Audit + correction responsive de **toute** l'app à chaque point de rupture réel.
Pas de refonte visuelle. Corrections = valeurs fluides (`clamp`, `%`, `minmax`),
`@media` / container queries ciblées, reflow de grilles. Le style inline en place
est conservé (l'harmonisation inline ↔ tokens est une dette `WS-6` distincte).

### Hors périmètre
- Harmonisation styles inline ↔ tokens de thème (dette `WS-6`).
- Tout redesign ou refonte d'un écran.
- Rendre la frappe au clavier logiciel mobile agréable (posture desktop-first).
- `/dev-onboarding` : écran dev-only, on vérifie juste qu'il ne casse pas.

## Méthode

Audit d'abord, correction ensuite. Pour chaque zone :

1. Ouvrir dans Chrome réel (extension Claude in Chrome).
2. Passer les 6 largeurs de certification : **360, 390, 768, 1024, 1440, 2560**.
   Plus une hauteur courte (~680px, laptop 13") sur l'écran de frappe à cause du
   `calc(100dvh - var(--nav-height))` + `overflow: hidden`.
3. Cataloguer **chaque** défaut dans ce document (section « Catalogue ») avant de
   toucher une ligne de code.
4. Corriger, re-vérifier aux mêmes largeurs, screenshot avant / après.
5. Gate `web-design-guidelines` sur le diff : cibles tactiles ≥ 44px, zéro scroll
   horizontal, texte ≥ 16px sur les contrôles, focus visible, contenu jamais
   tronqué ni superposé.

## Posture mobile

- **Écran de frappe** : desktop-first (clavier physique). Sous ~600px de large,
  un bandeau discret non bloquant « TypeWav se pratique au clavier physique,
  meilleure expérience sur ordinateur ». ConfigBar, sélecteur de morceau et zone
  de frappe restent en place. Comportement exact du bandeau (rejetable ?
  mémorisé ? via quelle persistance, IndexedDB étant la seule autorisée) : à
  confirmer avec Mouwafic au moment de la PR A.
- **Pages consultables** (`/classement`, `/profil`, `/results`, `/replay`,
  `/about`, `/challenge`) : pleinement propres de 360px à 2560px. L'essentiel de
  l'effort va là.
- **Ultra-wide (2560)** : plafonner + centrer partout. Compléter les conteneurs
  sans `max-width`. Aucune zone ne doit s'étirer sur toute la largeur ni laisser
  un vide absurde.

## Découpage en PR

4 PR, branches successives depuis `origin/main` frais, rebase avant d'ouvrir,
conventional commit, squash merge, CI verte (`gh run watch`) avant merge, zéro
attribution IA. **#71 se ferme à la PR D.** Le découpage peut bouger selon le
volume de défauts par zone.

| PR | Zone | Composants |
| --- | --- | --- |
| **A** | Chrome + écran de frappe | `GlobalNav`, `HomeClient`, `ConfigBar`, `TypingArea`, `ContextSelectors`, `CollectionSelector`, `ActiveSessionHeader`, `AmbientAura`, `GhostCursor`, `PersonalTextsPanel` + bandeau mobile |
| **B** | Résultats + replay | `ResultsPage`, `ResultsPageClient`, `ReplayClient`, `WpmChart`, `SessionWaveform`, `WaveformBars` |
| **C** | Profil + classement | `ProfilClient`, `ProfileSpotlight`, `RankLadder`, `PracticeRoll`, `RankBadge`, `ClassementClient`, `LeaderboardTable`, `WpmProgressChart`, `ConsistencyChart`, `ContributionHeatmap`, `KeyboardHeatmap` |
| **D** | Apprentissage + paramètres + about + challenge | `LearningMode` (+ repli du rail de niveaux vertical, dû à #71), `KeyboardDiagram`, `LevelClearedMoment`, `LevelRailSpotlight`, `ParametresClient`, `DataManagement`, `AboutSection`, `DefinitionList`, `ShortcutRow`, `ChallengeClient`, `SharedLinkFallback` |

## Suivi

- Ce document : plan + catalogue d'audit. Commité avant la 1re PR.
- `docs/LAUNCH_PLAN.md` + artifact `Route de lancement TypeWav` : mis à jour à
  chaque PR mergée (claude = lead).
- `HANDOFF.md` : tenu à jour (tâche en vol, pour claude2).

---

## Catalogue d'audit

Passe navigateur faite le 2026-09-07 via Chromium réel piloté (viewport exact
à chaque largeur ; `resize_window` de l'extension est ignoré par le compositeur
Wayland de la machine, d'où le pilotage headless). Données réelles seedées pour
résultats / profil / classement / replay / challenge (4 séances jouées). Rail de
niveaux du mode Apprentissage capturé après complétion de l'intro. Hauteur courte
testée à 620-680px.

`overflowX = 0` partout : aucune page ne scrolle horizontalement au niveau
document. Les « débordements » listés sont des éléments rognés par l'`overflow:
hidden` d'un ancêtre (contenu masqué, pas de scrollbar).

Sévérité : **casse** = contenu inatteignable, tronqué, superposé, illisible.
**inconfort** = tient techniquement mais serré / incohérent / vide absurde.

### PR A — Chrome global + écran de frappe

| # | Fichier / zone | Largeurs | Sév | Défaut | Correctif |
| --- | --- | --- | --- | --- | --- |
| A1 | `ConfigBar.tsx` — toolbar `flex-wrap:nowrap` + `overflow-x:auto`, contenu ~1089px | ≤ ~1320px (360→1024 **et** 768 tablette) | **casse** | La barre déborde et scrolle en interne ; chips de droite (Fantôme, Libre, 60/120…) hors champ, invisibles ; sur mobile les deux bouts sont rognés. Impossible d'atteindre tous les modes. | `flex-wrap: wrap` + `justify-content: center` + `row-gap` ; `width:100%` + `max-width` au lieu de `width:fit-content`. Passe à 2-3 rangées sous ~1300px, ordre des groupes conservé, zéro scroll horizontal. |
| A2 | `HomeClient.tsx:652` `<main>` `padding:'32px 32px 16px'` | 360, 390 | inconfort→casse | Padding horizontal fixe 32px : 64px mangés à 360, contenu à l'étroit. | `padding-inline: clamp(16px, 4vw, 32px)`. |
| A3 | `TypingArea.tsx:786` `fontSize:'2.25rem'` fixe | 360, 390 | **casse** | 36px fixe : un mot long (« Neuve-Sainte-Geneviève », 484px) dépasse le viewport 360 et est rogné ; lignes de 2-3 mots, très serrées. | `fontSize: clamp(1.35rem, 5.2vw, 2.25rem)` (valeur exacte à caler en implé). |
| A4 | `TypingArea.tsx:78` `<Word>` `display:flex` — jamais de retour à la ligne dans un mot | 360, 390 | **casse** | Un token plus large que le viewport est coupé net. | `flexWrap:'wrap'` sur le Word + `overflow-wrap:anywhere` en filet. |
| A5 | `TypingArea.tsx` — `.content-typing` / conteneur `role=application` : aucun padding horizontal | toutes | casse-mineure | Caret `.char-current::after` (`left:-0.05em`) du 1er caractère rogné à x≈0 ; bloc de mots dépasse le viewport de ~16-32px. | `padding-inline: clamp(12px, 3vw, 32px)` sur `.content-typing`. |
| A6 | `ActiveSessionHeader.tsx` (bloc `minHeight:130px` dans HomeClient ~ligne 690) | ≤ ~430px | **casse** | Chips (titre morceau, reco, langue, collection) wrappent en 4-5 rangées, dépassent les 130px réservés et **chevauchent le texte de frappe**. | Bloc adaptatif : pile compacte contenue (chip morceau + « changer »), ou `flex-wrap` avec hauteur qui s'ajuste **et** texte poussé dessous (pas de chevauchement). Décision fine en implé. |
| A7 | `GlobalNav.tsx` — `padding: clamp(16px,4vw,36px)`, logo + 5 icônes sur 1 rangée | ≤ ~380px | inconfort→casse | À 360 : ~14px de marge, icônes collées au bord droit, waveform du logo rognée à gauche. | Réduire le logo sous ~400px et/ou laisser les icônes wrapper sous le logo (`rowGap` déjà 8) ; marge latérale minimale garantie. |
| A8 | `GlobalNav.tsx` — liens `<Link>` : zone de clic **20×20px** (taille icône, zéro padding) | toutes (nav globale) | casse (WIG) | Cible tactile très en dessous du raisonnable, sur toutes les pages. | `padding` sur le `<Link>` → zone ≥ 44×44 (visuel inchangé) + `touch-action: manipulation`. |
| A9 | `HomeClient.tsx` footer (~ligne 1146) — hint « Tab + Entrée pour recommencer » | 360 | inconfort | « pour recommencer » wrappe et se désaligne des keycaps. | `flex-wrap` + alignement, ou masquer le hint sous ~380px. |
| A10 | `HomeClient.tsx` `<main>` — `gap:36/40` fixe + `height: calc(100dvh - var(--nav-height))` + `overflow:hidden` | hauteur ≤ ~680px | casse | Sur viewport court, le bas (footer / sélecteur de morceau) est rogné sans scroll. | `gap: clamp(16px, 3vh, 36px)` ; vérifier qu'à 640px de haut rien d'essentiel n'est coupé ; `min-height` de secours si besoin. |
| A11 | Écran de frappe plein cadre (`100dvh`) | mobile à encoche | casse-latente (WIG safe areas) | Pas de `env(safe-area-inset-*)`. | Ajouter les insets safe-area au padding de `<main>`. |
| A12 | **Bandeau « meilleure expérience sur ordinateur »** | < ~600px | nouveau | Posture validée : la frappe vise le clavier physique. | **Tranché (2026-09-07) :** bandeau discret non bloquant au-dessus de la zone de frappe. ConfigBar, sélecteur de morceau et zone de frappe restent en place, la frappe reste possible. Croix pour fermer, choix mémorisé dans IndexedDB (`user_preferences`, nouvelle clé dédiée) → ne revient plus sur l'appareil. |
| A13 | Espace vertical mort sur l'écran de frappe | hauteur ≥ 768, surtout 1440 / 2560 | inconfort-bas | Contenu aggloméré en haut, grand vide en bas. | Optionnel : plafonner l'étalement vertical / recentrer. Peut rester si le rythme actuel type Monkeytype est voulu. |

Hors #71, repéré au passage : **erreur console d'hydratation sur `/`** (« some
attributes of the server rendered HTML didn't match the client properties »). À
investiguer hors ce ticket.

#### PR A — état d'implémentation (branche `fix/responsive-typing-screen`)

- **A1 fait.** `ConfigBar` : toolbar `flex-wrap: wrap` + `width:100%` + `minHeight`
  (plus `height` figé). Le groupe « modes » (7 chips, ~630px) wrappe aussi en
  interne (`flexShrink: 1` + `maxWidth: 100%` + `flex-wrap`). Vérifié 360→2560 :
  0 débordement réel, tout atteignable, aucun scroll horizontal.
- **A2 fait.** `<main>` : `paddingLeft/Right: max(clamp(16px,4vw,32px),
  env(safe-area-inset-*))` (couvre aussi A11), `paddingBlock` fluide.
- **A3 non retenu.** A4 traite la casse (rognage). La densité à 360px reste
  acceptable (parité Monkeytype) et toucher `fontSize` sans toucher
  `LINE_HEIGHT_PX` (constante du scroll ligne-à-ligne) déséquilibrerait
  l'interligne ; risque > bénéfice, d'autant que la frappe mobile est en retrait
  assumé (A12).
- **A4 fait.** `<Word>` : `flexWrap: 'wrap'` — un mot plus large que le viewport
  wrappe au lieu d'être rogné.
- **A5 : faux positif.** Le « bloc de mots 16-48px hors viewport » = le calque de
  bleed du flou (`margin: -48 / padding: 48`, intentionnel, rogné par
  l'`overflow:hidden` de la zone, commenté dans le code). Le caret du 1er
  caractère n'est plus au ras du viewport grâce au padding de `<main>` (A2). Rien
  à faire.
- **A6 fait.** Le conteneur `config-header-hover-zone` gagne `flexShrink: 0` :
  il gardait sa hauteur réelle au lieu de se comprimer vers `minHeight:130px` et
  de laisser son contenu (ConfigBar + sélecteur wrappés) déborder **par-dessus**
  la zone de frappe (`zIndex:10`). Plus de chevauchement 360→768.
- **A7 : résolu par effet de bord.** Les icônes nav plus grandes (A8) + `gap`
  resserré font wrapper la nav proprement sur 2 rangées sous ~400px (déjà prévu
  par `--nav-height:104px`). Logo non touché (maths de baseline délicates).
- **A8 fait.** Liens `GlobalNav` : `padding:12` + `minWidth/minHeight:44` +
  `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent`.
  `transition:'all'` → propriétés explicites (anti-pattern WIG au passage).
- **A9 fait.** Bouton hint restart : `flexWrap:'wrap'` + `justify-content:center`
  + `rowGap`.
- **A10 fait.** `<main>` : `gap` fluide (`clamp`, plancher 32px en
  Apprentissage pour le compteur en `position:absolute`). Sous 600px,
  `.home-main { overflow-y: auto !important }` (media query, borné) : l'écran de
  frappe **défile** dans `<main>` au lieu de rogner du contenu (le body reste
  verrouillé). Desktop inchangé (ne scrolle jamais).
- **A11 fait.** Voir A2 (`env(safe-area-inset-*)` dans le `max()` du padding
  latéral).
- **A12 fait.** Nouveau composant `MobileTypingHint.tsx` : bandeau `role="note"`
  au-dessus de la ConfigBar, visible < 601px (classe `.mobile-typing-hint` +
  media query, pas de listener JS), rejetable, rejet persisté IndexedDB
  (`user_preferences` clé `mobile_typing_hint_dismissed`). Chaînes fr/en
  (`typing.desktopHint` / `typing.desktopHintDismiss`). Tests unitaires (5) sur
  la logique de rejet + persistance.
- **A13 non retenu** dans cette PR : le rythme vertical type Monkeytype est
  conservé (inconfort-bas, pas de casse).
- **Cibles tactiles secondaires** (chips ConfigBar 32px, chips
  `CollectionSelector` / `ContextSelectors` ~20px de haut, bouton shuffle
  ~20px) : laissées telles quelles. Chrome de config dense, desktop-first
  (A12). La nav primaire, elle, est passée à 44px. À revoir si besoin en
  follow-up ; hors casse.
- **AmbientAura** (`<div>` décoratif `z-index` négatif qui déborde largement,
  clippé par l'`overflow:hidden`) : inchangé, pré-existant, sans impact visuel.
  Confirmation « clip voulu » reversée à la PR B (point B3).
- Gate : `pnpm typecheck` + `pnpm lint` (racine + `@typewav/web`) verts ; suite
  complète `pnpm vitest run` verte (1278 tests, 98 fichiers) dont 5 nouveaux
  `MobileTypingHint`. Vérif navigateur : `home` et `learn-intro` = 0 débordement
  réel de 360 à 2560 + hauteurs courtes (620-680) ; les autres routes
  re-vérifiées, aucune régression de la nav globalisée.

### PR B — Résultats + replay

| # | Fichier / zone | Largeurs | Sév | Défaut | Correctif |
| --- | --- | --- | --- | --- | --- |
| B1 | `ResultsPage.tsx` — bloc stats (grade + WPM + précision + régularité) | 360, 390 | inconfort | 3 colonnes serrées ; « 89 WPM brut » frôle la colonne précision. | 1-2 colonnes sous ~420px (`flex-wrap` / grid `minmax`). |
| B2 | `ResultsPage.tsx` — actions (Encore / Partager / Défier) | 360 | inconfort | Disposition en ligne un peu ragged ; « Partager » proche du bord. | `flex-wrap` propre, ou pile sous ~400px. |
| B3 | `AmbientAura.tsx` — `<div>` w≤640 qui dépasse à droite | toutes | à vérifier | Débordement clippé (`overflowX=0`), probablement décoratif et voulu. | Confirmer que le clip de l'aura est intentionnel ; sinon la contraindre. |
| B4 | `SessionWaveform` / `WpmChart` sur résultats | — | OK | Rendu propre 360→2560 avec vraies données. | RAS a priori. |
| B5 | Replay landing (`ReplayClient`) | — | OK | Centré, propre, pas de débordement. | RAS. Le replay en cours hérite des fixes TypingArea (PR A). |

### PR C — Profil + classement

| # | Fichier / zone | Largeurs | Sév | Défaut | Correctif |
| --- | --- | --- | --- | --- | --- |
| C1 | `ProfilClient.tsx` — grille mono-colonne entre ~700 et ~1050px | 768, 1024 | inconfort | Le graphe « LE ROULEAU » (`PracticeRoll`) part pleine largeur (~680px) alors que les sections texte / RANG dessous sont capées à ~440px : largeurs incohérentes. | Aligner `PracticeRoll` sur la même `max-width` que les sections en mono-colonne, ou descendre le point de bascule 2 colonnes, ou élargir les sections texte. |
| C2 | `PracticeRoll.tsx` — bouton point de données au bord gauche du graphe | 390-1024 | casse-mineure | Hit-box du point déborde de quelques px à gauche (L=-6 à -40), clippée. | Inset gauche/droit sur la piste du graphe. |
| C3 | `LeaderboardTable.tsx` | toutes | OK | Bascule carte↔ligne propre, aucun débordement 360→2560. | RAS (composant déjà construit responsive). |
| C4 | `classement` / `profil` — empty states | toutes | OK | Propres. | RAS. |
| C5 | Charts profil (`WpmProgressChart`, `ContributionHeatmap`, `ConsistencyChart`) | à re-vérifier | — | Peu de données seedées (4 séances, 1 jour) : heatmap / plots pas stressés. | Vérifier avec un historique plus large en implé PR C. |

### PR D — Apprentissage + paramètres + about + challenge

| # | Fichier / zone | Largeurs | Sév | Défaut | Correctif |
| --- | --- | --- | --- | --- | --- |
| D1 | `LearningMode.tsx` — **rail de niveaux vertical + layout horizontal** (rail \| infos \| texte \| notes latérales) | ≤ ~700px | **casse majeure** | Aucun repli responsive (assumé, c'est #71). À 390 : texte de frappe écrasé dans une bande droite qui rogne (« sms » coupé), colonne d'explication à 1 mot / ligne illisible, hint « Annulaire gauche » chevauche le footer, contenu sous la ligne de flottaison rogné. | Concevoir le repli : rail vertical → stepper **horizontal** compact en haut (ou « Niveau 1/5 »), colonne principale pleine largeur, notes latérales repositionnées, sous un breakpoint. Le gros morceau de la PR D. |
| D2 | `KeyboardDiagram.tsx` — taille intrinsèque non fluide | 360-430 (trop petit, ~55-190px) **et** ≥ 1600 (îlot ~400px) | casse (mobile) + inconfort (ultra-wide) | En mode Apprentissage il se rétrécit à ~190px (illisible), à ~55px en `1366×680` ; ne grandit jamais. En dev-onboarding (conteneur `width:100%`) il est correct. | `width: min(92vw, 520px)` + SVG `viewBox` qui scale ; plancher lisible garanti ; respire jusqu'à ~560px max. |
| D3 | Écran intro « Où poser tes doigts » (`LearningMode` étape 0) | ≤ ~430px | casse | ConfigBar déborde (même cause qu'A1) ; diagramme trop petit (D2). | Réglé par A1 + D2. |
| D4 | `ChallengeClient` landing (réutilise TypingArea) | 360, 390 | casse | « Objectif : battre 89 WPM » chevauche le compteur « 0 / 10 » (overlays `position:absolute` `top:-3.6rem` superposés) ; caret 1er char rogné (hérite A5). | Repositionner le bandeau Objectif (flux normal ou décalé) ; le reste vient des fixes TypingArea PR A. |
| D5 | `ParametresClient.tsx` — grille de thèmes, labels sur 2 lignes | toutes | inconfort-bas | Pills de hauteurs inégales quand le nom wrappe (« cuivre et anthracite »). | `min-height` sur la pill ou `text-wrap: balance` ; cosmétique. |
| D6 | `about/page.tsx` | toutes | OK | `max-width:1200 + margin auto` : cap + centre correctement en ultra-wide ; propre à 360. | RAS. |
| D7 | `ChallengeClient` / `SharedLinkFallback` — fallback lien illisible | à vérifier | — | Pas re-testé responsive. | Vérif rapide en implé PR D. |

Hors #71 : `/dev-onboarding` vérifié 360→2560, ne casse pas (diagramme même
correct grâce à son conteneur `width:100%`).

#### PR D — état d'implémentation (branche `fix/responsive-learning-challenge`, stack sur A)

- **D1 fait.** `LearningMode` : nouveau hook `useMediaQuery` ; `isRailCompact =
  useMediaQuery('(max-width: 900px)')`. Sous 900px, la grille 3 colonnes
  (`1fr minmax(0,920) 1fr`) devient un `flex column` et le rail vertical de
  264px (qui débordait à gauche et écrasait la colonne de contenu) est remplacé
  par une **ligne d'état compacte** au-dessus du contenu : « Niveau N / total —
  nom », stats de progression, piste de progression, boutons « ‹ Niveau
  précédent » / « Niveau suivant › ». Le stepper à points cliquables reste
  desktop (≥ 900px), strictement inchangé (vérifié à 1024 / 1440). Le
  `#level-rail-next-dot` (cible du spotlight de relais) est porté par le bouton
  « Niveau suivant » compact, donc le spotlight marche aussi sur mobile.
- **D2 fait.** `KeyboardDiagram` : `minHeight: 0` de la `<svg>` →
  `clamp(150px, 46vw, 280px)` (intro doigts) / `clamp(120px, 34vw, 220px)`
  (leçon). `flex: 1 1 0%` le fait toujours grandir sur desktop ; le plancher
  garantit un clavier lisible sur écran court / mobile (avant : réduit à
  ~55-190px). Le trop-plein éventuel est absorbé par le scroll de `.home-main`
  (mobile, PR A).
- **D3 fait.** Écran intro « Où poser tes doigts » : sous 900px, racine en
  hauteur naturelle (`minHeight: 100%` + `justify-content: flex-start`) et
  wrapper du diagramme en `flex: 0 0 auto` au lieu de `1 1 0%` +
  `justify-content: center` qui empilait le clavier et le texte l'un sur
  l'autre. Le contenu (titre + long paragraphe + clavier + légende 8 doigts +
  bouton) défile via `.home-main`. Desktop inchangé.
- **D4 fait.** `ChallengeClient` : bandeau « Objectif : battre X WPM »
  `marginBottom: 8` → `3.5rem` — réserve la place des calques `position:absolute`
  de TypingArea (`top:-3.6rem`), plus de chevauchement avec « 0 / N ». `<main>` :
  `p-8` → padding fluide + safe-area (`sm:px-8`) ; `min-h-dvh` →
  `min-h-[calc(100dvh-var(--nav-height))]`.
- **D5 fait.** `ParametresClient` : `min-h-[46px]` sur les pills de thème →
  rangées de grille uniformes même quand un nom wrappe sur 2 lignes.
- **D6 / D7 confirmés OK.** `about` (cap + centre correct 360→2560),
  `SharedLinkFallback` (centré, propre, aucun débordement à 360) : aucune
  retouche.
- Chaînes fr/en : `learning.nextLevelCta` / `prevLevelCta` / `levelCounter`.
- Tests : `useMediaQuery` (2) ; `modes` (46), `about`, `social`, `settings`,
  `challenge` verts. Vérif navigateur : rail compact 360/390/768/900,
  desktop 1024/1440 inchangé ; intro doigts 360/390 ; challenge 360→2560 ;
  parametres 360→2560 ; `overflowX = 0` partout.

### Bilan par PR

- **PR A** : lourde. 12 corrections + 1 décision (A12). Cœur = ConfigBar (A1),
  texte de frappe (A3/A4/A5), sélecteur de morceau (A6), cibles nav (A8).
- **PR B** : légère. 2 inconforts + 1 vérif (aura). Charts et replay OK.
- **PR C** : légère. 1 inconfort mid-width (C1) + 1 casse-mineure (C2).
  `LeaderboardTable` déjà bon.
- **PR D** : moyenne-lourde. Le repli du rail (D1) et `KeyboardDiagram` (D2)
  sont le vrai travail ; le reste est petit.
