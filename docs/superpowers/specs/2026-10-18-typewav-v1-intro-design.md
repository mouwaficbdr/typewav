# TypeWav v1 : retrait du Conservatoire, l'Ouverture, la page « à venir », les étoiles GitHub

> Tickets : #124 (retrait et page « à venir »), #129 (l'écho de la faute dans les textes), #125 (l'Ouverture, onboarding provisoire), #126 (étoiles GitHub), #127 (CONTRIBUTING). Recherche : `docs/RESEARCH.md`, sections 2 et 3. Décisions prises avec Mouwafic le 18 octobre 2026, à ne pas rouvrir.

**But.** Le Conservatoire et son onboarding quittent `main` pour la branche `feat/conservatoire-v2`, où ils mûriront jusqu'à la v2. `main` doit être parfait pour ce qui existe aujourd'hui. Il reçoit une intro provisoire, « l'Ouverture », qui fait sentir TypeWav en moins de 90 secondes, une page « à venir » pour le Conservatoire, et le nombre d'étoiles GitHub dans le pied de page.

**Niveau d'exigence.** Mouwafic n'a pas validé de maquette : il a délégué l'apparence en demandant la perfection. Chaque écran doit passer le test des trois secondes, être impossible à confondre avec un gabarit, et être vérifié à l'œil dans le rendu réel (1280x650, 1024x600, 390x844, mouvement réduit, au moins trois thèmes dont `cyprus-sand`, `terminal-amber` et un thème clair s'il en existe un) avant d'être présenté.

## Décisions (18 octobre 2026)

| # | Décision |
|---|---|
| 1 | Pas de question de disposition du clavier : sur `main`, elle ne sert qu'au mode Apprentissage, retiré. Le réglage quitte aussi les Paramètres. |
| 2 | Ordre des écrans : Langue, Joue, Pourquoi, Ce qui t'attend, Données, À toi. |
| 3 | Écran 2 : la Lettre à Élise. Consigne « Tape la bonne lettre, la musique suit. » ; texte à taper « les notes » (fr) / « the notes » (en), 9 caractères. |
| 4 | Écran 2 : on fait rater exprès une touche, pour vivre la règle de la faute (aucune fausse note, l'écho de la dernière). |
| 5 | Fin : un vrai test de 30 secondes en musique, tout de suite. |
| 6 | Téléphone et tablette : démonstration au toucher à l'écran 2 ; fin : s'envoyer le lien, ou explorer quand même. |
| 7 | La progression : six notes sur une portée, qui forment une phrase jouée en entier à la fin. |
| 8 | Revoir l'intro : depuis À propos uniquement. |
| 9 | Les cinq envies : les modes, les morceaux, les résultats et le replay, ta progression, le défi. |
| 10 | Rien sur Safari ni sur l'effacement automatique des navigateurs. |
| 11 | Branche v2 : `feat/conservatoire-v2` (fait). |
| 12 | Synchronisation de la v2 : fusion de `main` dans la branche, en gardant ses fichiers quand `main` les supprime ; une seule PR écrasée vers `main` au lancement. |
| 13 | PR #123 fermée sans merge (fait). |
| 14 | #120, #111, #118 rattachés au jalon « v2 : Conservatoire » (fait). |
| 15 | Page « à venir » : ce que sera le Conservatoire, un avant-goût jouable (les huit touches de repos jouent une gamme au piano), aucune date, aucune inscription, une seule action. |
| 16 | Les données locales de l'ancien mode ne sont pas touchées. |
| 17 | Étoiles : lues côté serveur, rafraîchies toutes les 10 minutes, clé GitHub optionnelle, rien d'affiché en cas d'échec, seulement dans le pied de page de l'accueil. |
| 18 | Livraison : #124, puis #129, puis #125, puis #126, puis #127, une PR chacune. |
| 19 | Une faute ne joue jamais de fausse note : la musique s'arrête et la dernière bonne note résonne tout bas (l'écho, `triggerSilence`, vélocité 0,18, 1,6 s). L'écho reste ; tout texte qui parle de « silence » ou de « rien » est faux et se corrige (#129). |
| 20 | La langue de l'Ouverture règle aussi la langue des textes (`textLanguage` de la barre de configuration) : quelqu'un qui choisit l'anglais n'a jamais des textes en français, et inversement. |
| P | Le piano est et restera le seul instrument de TypeWav. |

## Contraintes globales

- Persistance IndexedDB seulement (`apps/web/lib/db.ts`, store `user_preferences`), jamais `localStorage` ni `sessionStorage`. Lecture qui échoue : on ne piège jamais (fail open).
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. TDD : chaque fonction pure et chaque composant ont un test qui échoue d'abord.
- Couleurs : uniquement les variables du thème actif (`--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, `--color-text-primary`, `--color-text-muted`). Aucune couleur en dur : tout doit tenir sur les 26 thèmes.
- Polices de la DA : `--font-display` (Cormorant Garamond) pour les phrases principales, `--font-ui` (Sora) pour les lignes d'appui, `--font-mono` (JetBrains Mono) pour les touches et les indications, le wordmark de `NavLogo` pour le titre.
- Mouvement : `motion/react`. Deux courbes : `cubic-bezier(0.16, 1, 0.3, 1)` pour les moments forts, `cubic-bezier(0.25, 0.46, 0.45, 0.94)` pour le reste. Changement de texte : 240 ms, fondu et 8 px. Sous `prefers-reduced-motion` : aucun déplacement, fondus de 120 ms au plus.
- Son : piano seulement, via `useAudioEngine` (`initialize`, `playNote`, `playNoteName`, `triggerResume`, `loadMidiPiece`, et l'écho de la faute). Jamais de son avant un geste. Sur une erreur : jamais de note nouvelle, seulement l'écho de la dernière bonne note, comme dans l'app ; aucune onde, aucun rouge.
- Textes : `next-intl`, namespace `intro` pour l'Ouverture, `comingSoon` pour la page « à venir », dans `fr.json` et `en.json`. Tutoiement en français. Aucun tiret cadratin ni demi-cadratin, nulle part. Aucun emoji.
- Philosophie d'interaction de Mouwafic (mémoire `feedback_interaction_principles`), partout : un écran, une seule chose ; chaque action a une réponse visible et audible en moins de 100 ms ; seul ce qui compte maintenant est en couleur ; une erreur ne fait qu'un écho discret, jamais de fausse note ; tout change par transition ; le mouvement s'efface pour qui le demande.
- Accessibilité : tout se pilote au clavier ; focus visible ; chaque changement d'écran est annoncé dans une région `aria-live="polite"` ; aucune information portée par la seule couleur ; chaque son a un équivalent visuel.
- Gate avant chaque PR : `pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build`, puis `(cd apps/web && pnpm test:e2e)`. Zéro attribution IA dans les commits et les PR.

---

## Partie A : le retrait (#124)

### Ce qui part de `main`

- Mode Apprentissage : `apps/web/components/modes/LearningMode.tsx`, `CurriculumLearningMode.tsx`, `LegacyLearningMode.tsx`, `LearningWelcome.tsx`, `LevelTeachStep.tsx`, `LevelClearedMoment.tsx`, `LevelRailSpotlight.tsx`, `KeyboardDiagram.tsx`, `KeyboardDiagramAzerty.tsx`, `finger-colors.ts`, et leurs tests ; `apps/web/lib/learning-content.ts`, `learning-progress.ts`, `learning-texts.ts`, `generateLearningText` et ce qui ne sert qu'à lui dans `lib/words.ts` ; `packages/types/src/learning.ts` ; `apps/web/e2e/learning-layout.spec.ts` ; les tests `learning-*`.
- Moteur de maîtrise (partie 1) : `apps/web/lib/conservatoire/mastery.ts`, `storage.ts`, `packages/types/src/conservatoire.ts`, leurs tests, et la prop `onAttempt` de `TypingArea` (avec son test).
- Onboarding actuel : `apps/web/lib/onboarding.ts` (sauf ce que l'Ouverture réutilise, voir partie B), son déclenchement dans `HomeClient.tsx` (`isOnboarding`, `onboardingResolved`, le passage forcé en mode `learning`), la route `app/[locale]/dev-onboarding/`.
- Disposition du clavier : le groupe « langue et clavier » des Paramètres devient « langue » ; `useKeyboardLayoutPreference` et `lib/keyboardLayouts.ts` partent s'ils n'ont plus d'utilisateur.
- Le mode `learning` de `ConfigBar`, du type de mode, de `useConfigStore`, de `HomeClient` (`isLearningMode` et ses ajustements de mise en page), de `globals.css` ; sa ligne « Apprentissage » dans À propos ; les clés de traduction devenues orphelines (`learning`, `hint` si orphelin, `settings.keyboardLayout*`, `about.modes.learning*`, `config.modes.learning`).
- `sitemap.ts` et `robots.ts` : retirer ce qui pointe vers l'onboarding de dev.

Avant de supprimer un fichier, vérifier qu'il n'a plus d'utilisateur (`git grep`). `useHiddenCapture.ts` est gardé et déplacé dans `apps/web/hooks/` : l'Ouverture en a besoin.

### Garde-fou sur les préférences

Une préférence persistée `activeMode: 'learning'` (la tienne) doit retomber sur le mode par défaut (`classic`) à la lecture, sans erreur. Test unitaire dédié. Les autres données `learning_*` et `conservatoire_*` restent en place, non lues.

### La page « à venir » (`/[locale]/conservatoire`)

Sur `feat/conservatoire-v2`, `app/[locale]/conservatoire/page.tsx` existe aussi : à la fusion future, c'est la version de la v2 qui gagne. L'entrée piano de `GlobalNav` revient sur `main`, en première position, exactement comme sur `feat/conservatoire-v2` (`key: 'conservatoire'`, icône `Piano`, `path: 'conservatoire'`, libellé `nav.conservatoire`), pour que la fusion future soit triviale.

Direction : une page éditoriale, pas une bannière « coming soon ». Elle parle comme la page À propos (kicker, phrase de tête en display, corps court).

- **Kicker** (mono, petites capitales, `--color-text-muted`) : « Le Conservatoire · bientôt » / « The Conservatory · soon ».
- **Phrase de tête** (display, light, très grande, alignée à gauche sur une colonne de 60 % au plus, jamais centrée) : « Apprendre à taper à dix doigts, en musique. » / « Learn to touch type, in music. »
- **Trois promesses**, en liste typographique numérotée en mono (01, 02, 03), sans carte, sans icône, une ligne chacune :
  1. « Des leçons d'une minute, une touche après l'autre. »
  2. « Chaque bonne touche joue sa note au piano. Une faute ne joue jamais de fausse note. »
  3. « Tes touches faibles reviennent jusqu'à devenir sûres. »
- **L'avant-goût** : les huit touches de repos, seules, en une rangée de touches dessinées (radius `--radius-md`, bordure `--color-border`, libellé mono). Consigne au-dessus : « Pose tes doigts, joue la gamme. » Chaque appui sur une de ces huit touches physiques (lues par `KeyboardEvent.code` : `KeyA KeyS KeyD KeyF KeyJ KeyK KeyL Semicolon`, exception documentée à la règle `commitChar` car rien n'est composé) joue sa note au piano (do4, ré4, mi4, fa4 sous la main gauche, de l'auriculaire à l'index ; sol4, la4, si4, do5 sous la main droite, de l'index à l'auriculaire) et lance une onde « goutte d'eau » de la couleur `--color-accent` qui part de la touche et s'éteint en 600 ms. Une autre touche : pas d'onde, seulement l'écho tout bas de la dernière note jouée, comme une faute dans l'app. Les libellés suivent la langue (AZERTY `q s d f j k l m` en français, QWERTY `a s d f j k l ;` en anglais) et se corrigent dès la première frappe à partir de `KeyboardEvent.key`. Sur un écran tactile, les touches se touchent. Sous mouvement réduit, pas d'onde : la touche s'enfonce. L'approche de l'onde peut s'inspirer de `apps/web/components/conservatoire/LivingKeyboard.tsx` sur `feat/conservatoire-v2` (`git show feat/conservatoire-v2:apps/web/components/conservatoire/LivingKeyboard.tsx`), mais le composant de `main` reste petit et dédié (`HomeRowTeaser`).
- **Une seule action** : « En attendant, joue » (Entrée), qui mène à l'accueil.
- Aucune date, aucun formulaire, aucune collecte.

---

## Partie B : l'Ouverture (#125)

L'onboarding provisoire s'appelle l'Ouverture : au théâtre lyrique, l'ouverture présente les thèmes de l'œuvre avant le lever de rideau. C'est le premier morceau qu'on joue.

### Entrée, sortie, mémoire

- **Un rideau sur l'accueil, pas une route.** L'Ouverture est un composant (`components/intro/Ouverture.tsx`) monté par `HomeClient` en plein écran par-dessus tout (`position: fixed; inset: 0`, fond `--color-bg`, au-dessus de la navigation globale) : c'est une cinématique. Raison (relecture du 18 octobre) : `useAudioEngine` libère tout le moteur quand son dernier utilisateur se démonte ; une route dédiée le détruirait en sortant vers l'accueil, et un changement de `[locale]` en cours de route le détruirait aussi. Monté dans `HomeClient`, le moteur survit à la sortie : le piano déjà accordé sert au premier test. À la fin, le rideau se lève (fondu et légère montée, 600 ms, courbe forte) sur l'accueil, zone de frappe focalisée.
- **Première visite** : `HomeClient` lit le drapeau `has_seen_intro_v1` (store `user_preferences`, nouveau drapeau : l'ancien `has_completed_onboarding` est déjà posé chez Mouwafic). S'il manque, l'Ouverture s'affiche. Même comportement en développement et en production, sur ordinateur comme sur téléphone. Lecture en échec : pas d'Ouverture. L'Ouverture ne se déclenche que sur l'accueil.
- **La langue change sur place.** L'Ouverture charge les textes de son namespace `intro` dans les deux langues (import des deux fichiers de messages, namespace `intro` seulement) et les affiche sous un `NextIntlClientProvider` imbriqué réglé sur la langue choisie. L'URL ne change qu'à la sortie : si la langue choisie diffère de celle de l'URL, `router.replace('/{choisie}')` à la fermeture (next-intl mémorise alors le choix). Aucun remontage pendant l'Ouverture.
- Le drapeau est posé quand on termine l'écran 6 ou quand on passe l'intro.
- **La langue s'applique partout, à toute sortie** (fin ou Échap) : interface (URL) et langue des textes (`useConfigStore.setTextLanguage`, `fr` ou `en`, jamais `both`). À la première visite, c'est la langue de l'Ouverture même si on passe dès l'écran 1 (la langue présélectionnée) ; quand on la rejoue depuis À propos, seulement si l'on a choisi une langue à l'écran 1.
- **Revoir** : un lien « Revoir l'introduction » dans À propos, section Liens, vers `/{locale}?intro=1`, que `HomeClient` lit pour ouvrir l'Ouverture. Rejouer ne change ni le drapeau ni le mode (voir écran 6).
- Échap à tout moment : « Passer l'intro ». On pose le drapeau et on lève le rideau. L'indication « Passer · Échap » reste visible en haut à droite (mono, petite, `--color-text-muted`) ; sur écran tactile, c'est un bouton « Passer ».
- Les autres tests e2e posent `has_seen_intro_v1` avant de charger l'accueil (helper commun), sinon l'Ouverture les recouvre.

### La portée, fil conducteur

Une portée de cinq lignes très fines (1 px, `--color-text-muted` à faible opacité) traverse tout l'écran à hauteur fixe, du premier au dernier écran. Elle se dessine de gauche à droite à l'ouverture (900 ms, courbe forte). Elle porte la progression : six notes, une par écran. Les notes passées sont pleines, la note courante est pleine et en `--color-accent`, les notes à venir sont creuses. Changer d'écran fait glisser la portée vers la mesure suivante (520 ms, courbe forte), pendant que le texte change (240 ms, fondu et 8 px). Valider un écran joue sa note au piano. Les six notes forment une phrase en do majeur qui se résout : do4, mi4, sol4, la4, sol4, do5. À l'écran 6, la phrase se rejoue en entier, au tempo, et se conclut sur un accord de do.

La portée n'est pas un décor : elle sert aussi de surface à l'écran 2 (les notes y tombent) et de rail à l'écran 4 (les envies s'y posent).

### Chrome commun

- En bas à gauche, l'indication de l'action (mono, petites capitales) avec la touche dessinée : « Espace pour continuer ». Sur écran tactile : « Touche pour continuer », et toute la surface est cliquable.
- Une région `aria-live="polite"` annonce chaque écran.
- Navigation : Espace ou Entrée pour continuer ; Retour arrière n'est jamais « écran précédent » (il sert à l'écran 2) ; Flèche gauche revient à l'écran précédent, Flèche droite avance quand l'écran le permet.
- Détection du clavier physique : on part de `isNonDesktopDevice()` ; une seule frappe réelle (`keydown` avec un `code` de lettre) bascule en mode clavier pour toute la suite. Les textes « tactiles » ne s'affichent qu'en mode tactile.

### Écran 1 : le titre et la langue

- Le wordmark TypeWav, très grand (clamp de 64 à 140 px), à gauche de l'axe, posé juste au-dessus de la portée comme un titre de partition.
- Sous la portée, deux choix typographiques côte à côte, chacun écrit dans sa propre langue : « Français » et « English », en display, avec leur touche (F, E) dessinée en mono. La langue courante (déjà détectée par `next-intl` depuis le navigateur) est présélectionnée et porte un caret qui clignote, comme un curseur de frappe.
- Au-dessus des choix, en Sora : « Choisis ta langue · Choose your language ».
- En bas : un petit égaliseur de quatre barres en CSS, immobile tant qu'aucun son n'a joué, et « Monte le son · Turn up the sound ».
- Gestes : F ou E (ou Flèches puis Entrée, ou un clic) choisit. Ce premier geste démarre l'audio (`initialize`) ; les textes basculent sur place dans la langue choisie.
- **Le piano s'accorde.** Le premier chargement du piano (les échantillons) prend du temps. Tant que `useAudioStore.isSamplerLoaded` est faux, l'égaliseur bat doucement comme un accordage et la ligne devient « Le piano s'accorde… · Tuning the piano… ». Dès que le piano est prêt, la note de l'écran joue et on passe à l'écran 2. Au-delà de 8 secondes, ou si `samplerLoadError` est posé : une ligne « Le son n'a pas pu démarrer. S pour réessayer. » et on peut continuer sans son ; tout le visuel reste.
- **Jamais un autre son que le piano** : `playNoteName` retombe sur un synthé si le piano n'est pas prêt ; l'Ouverture ne joue donc une note que si `isSamplerLoaded` est vrai.

### Écran 2 : joue

Le moment où la valeur se prouve, en moins de 15 secondes.

- **Consigne** (Sora) : « Tape la bonne lettre, la musique suit. »
- **Texte à taper**, en display, très grand, au centre optique au-dessus de la portée : « les notes » (fr) / « the notes » (en). Lettres à venir en `--color-text-muted`, lettres jouées en `--color-text-primary`, caret sur la lettre attendue. Capture par `useHiddenCapture` (déplacé dans `hooks/`), jamais par un listener de texte sur `keydown`.
- **Bonne lettre** : la note suivante de la mélodie, et une tête de note apparaît sur la portée à la hauteur de la note jouée, puis dérive vers la gauche et s'efface (la note « tombe », écho de « Tape juste. La note tombe. »).
- **Mauvaise lettre** : aucune note nouvelle, aucun rouge, aucune tête de note ; seulement l'écho tout bas de la dernière note jouée, exactement comme dans l'app. Le caret ne bouge pas : la musique attend la bonne lettre. Pour obtenir le même écho, la note jouée par l'Ouverture doit compter comme dernière note jouée par le moteur (aujourd'hui seul `playNote` renseigne `lastPlayedNote`, ligne 613 de `useAudioEngine.ts`) : étendre `playNoteName` pour la renseigner aussi, puis appeler la même fonction d'écho que `TypingArea`.
- Les neuf caractères joués, la portée garde ses neuf têtes de note un instant, puis la consigne change : « Maintenant, rate une touche. » À la première touche fausse : la dernière note résonne tout bas (l'écho), le texte s'efface, la tête de note du la4 pâlit sur la portée, et il ne reste que « La musique attend. » en display. Ligne d'appui : « Une faute ne joue jamais de fausse note : seule la dernière note résonne, tout bas. Retour arrière pour reprendre. » Retour arrière : `triggerResume` (la réverbe), une tête de note revient sur la portée, et « Espace pour continuer » apparaît.
- **La mélodie est écrite, pas lue par le séquenceur.** La relecture du 18 octobre a montré que le séquenceur ne rend pas cette ouverture fidèlement : il trie les notes simultanées par hauteur croissante (le la2 de la basse sort avant le la4 de la mélodie, `lib/midi-asset-loader.ts` ligne 131), et `playNote` applique l'expression de frappe (`note-expression.ts` : les consonnes du premier mot descendent d'une octave). L'Ouverture joue donc une suite fixe, sur le piano, par `playNoteName` : mi5, ré dièse 5, mi5, ré dièse 5, mi5, si4, ré5, do5, puis la4 avec le la2 en dessous (les notes du fichier `fur_Elise_WoO59.mid`, vérifiées). Elle ne touche ni la position du séquenceur ni l'expression de frappe. La phrase « chaque bonne lettre joue la note suivante » reste vraie.
- **Retour arrière après la faute** : `triggerResume` ne fait qu'ouvrir la réverbe, presque inaudible une fois l'écho éteint. L'Ouverture rejoue donc le dernier accord (la4 et la2) au moment où la réverbe s'ouvre : on entend la musique repartir sous la réverbe. Depuis la partie E, l'écho s'appelle `triggerErrorEcho`.
- **Mode tactile** : la consigne devient « TypeWav se joue au clavier d'un ordinateur. Touche l'écran pour l'entendre. » Chaque toucher tape la lettre suivante toute seule, avec sa note et sa tête de note. L'étape « rate une touche » est remplacée par une ligne : « Une faute ne joue jamais de fausse note : seule la dernière note résonne, tout bas. »

### Écran 3 : pourquoi

- Phrase de tête (display, light, grande, colonne de gauche) : « Ton oreille entend la faute avant tes yeux. »
- Ligne d'appui (Sora, `--color-text-muted`) : « Pour qui veut taper plus vite et plus juste, sans fixer un chronomètre : du curieux au dactylo confirmé. »
- Sur la portée, un seul signe : un point d'orgue sur la dernière note, celle qui a résonné quand la faute est arrivée.

### Écran 4 : ce qui t'attend

- Les cinq envies se posent sur la portée comme cinq notes, chacune avec le vrai signe qu'on retrouve dans l'app (icônes `lucide-react` déjà utilisées : `Keyboard` pour les modes, le signe ♪ de la puce de morceau, l'icône du replay, `UserCircle` pour la progression, l'icône du lien de défi). L'envie active est en `--color-accent` avec son titre et une ligne ; les autres restent en `--color-text-muted`.
  1. **Les modes** : « Temps, Mots, Citation, Zen, Code, ou tes propres textes. »
  2. **Les morceaux** : « Choisis la musique que ta frappe dévoile. »
  3. **Les résultats et le replay** : « Ta séance rejouée note par note. »
  4. **Ta progression** : « Records, rang, classement : tout se garde. »
  5. **Le défi** : « Un lien, le même texte, ton score à battre. Et le Fantôme rejoue ton record. »
- Touches 1 à 5 ou Flèches ; sans geste, elles défilent seules (2,8 s chacune). Chaque envie qui s'allume joue une note douce. Après la cinquième : « Le reste se découvre en jouant. »
- Ce sont des envies, pas un mode d'emploi : aucune instruction du type « clique ici ».

### Écran 5 : tes données

- Phrase de tête : « Tout reste dans ce navigateur. »
- Ligne d'appui : « Pas de compte, rien n'est envoyé, aucun pistage. I pour en savoir plus. » (tactile : un bouton « En savoir plus »).
- Le détail, qui s'ouvre à la demande, en lignes terme et définition (terme en mono petites capitales, définition en Sora), sans carte :
  - **Navigation privée** : rien n'est gardé.
  - **Effacer les données du site** : tout disparaît.
  - **Autre navigateur, autre appareil** : on repart de zéro.
  - **Ta sauvegarde** : « Télécharger mes données », dans les Paramètres, puis « Importer un fichier » pour tout retrouver.

### Écran 6 : à toi

- Phrase de tête : « Ton premier morceau t'attend. »
- Ligne d'appui, avec la petite icône `Piano` : « Bientôt : le Conservatoire, pour apprendre à taper à dix doigts. »
- La phrase des six notes se rejoue et s'achève sur l'accord. Puis « Espace pour commencer ».
- Espace : on pose le drapeau ; la langue s'applique (voir « Entrée, sortie, mémoire ») ; **à la première visite seulement**, on règle le mode Temps 30 secondes (`useConfigStore`) ; on lève le rideau sur l'accueil, zone de frappe focalisée. Le test démarre à la première frappe, avec la musique. Rejouée depuis À propos, l'Ouverture ne touche à aucun autre réglage que la langue choisie.
- **Mode tactile** : deux actions. « Envoie-toi le lien » (`navigator.share` avec l'URL de l'app si disponible, sinon copie dans le presse-papiers et « Lien copié. ») ; « Explorer quand même » (accueil). Les deux posent le drapeau.

### Mise en page et tailles

- Une grille à deux colonnes asymétriques sur ordinateur (le texte dans les 7 premières colonnes sur 12), la portée pleine largeur à 58 % de la hauteur. Jamais de bloc centré titre, sous-titre, bouton.
- Jusqu'à 600 px de large : une colonne, la portée à 62 % de la hauteur, les tailles de texte réduites par `clamp()`, les touches dessinées masquées si aucun clavier n'est détecté.
- Rien ne se chevauche et tout reste dans la fenêtre à 1280x650, 1024x600 et 390x844.

---

## Partie C : les étoiles GitHub (#126)

- `apps/web/lib/github-stars.ts` : `fetchGithubStars(): Promise<number | null>`. `fetch('https://api.github.com/repos/mouwaficbdr/typewav', { next: { revalidate: 600 }, headers, signal: AbortSignal.timeout(3000) })`. En-tête `Authorization: Bearer ${process.env.GITHUB_TOKEN}` seulement si la variable existe (serveur uniquement, jamais `NEXT_PUBLIC_`). Retourne `stargazers_count` si c'est un entier positif ou nul, sinon `null`. Toute erreur : `null`, sans journal bruyant.
- `app/[locale]/page.tsx` (composant serveur) l'appelle et passe `githubStars` à `HomeClient`.
- Pied de page de l'accueil, juste après « </> github », dans le même lien : une icône `Star` de 12 px et le nombre en mono, formaté par `Intl.NumberFormat(locale, { notation: 'compact' })`, `aria-label` « 10 étoiles sur GitHub » / « 10 stars on GitHub ». `null` : rien du tout, sans trou ni décalage.
- Documenter `GITHUB_TOKEN` (optionnelle, jeton sans permission) dans le README ou `.env.example` s'il existe. Vérifier que les en-têtes de sécurité (`lib/security-headers.ts`) ne gênent rien : l'appel est côté serveur.

---

## Partie E : l'écho de la faute, dans tous les textes (#129)

Livrée juste après la partie A. Réécrire chaque texte qui dit qu'une faute « ne joue rien » ou produit « le silence », pour dire vrai sans jargon : une faute ne joue jamais de fausse note, la musique s'arrête et la dernière note résonne tout bas, Retour arrière pour reprendre.

- `apps/web/messages/fr.json` et `en.json` : `typing.ariaTypingInstructions`, `about.metaDescription`, `about.lead` (à relire), `about.manifesto.wrongDesc`.
- `README.md` (lignes 23 et 43-44 sur `main` au 18 octobre).
- Renommer `triggerSilence` en `triggerErrorEcho` (définition, retour du hook, `TypingArea`, tests) et corriger ses commentaires (`useAudioEngine.ts` lignes 8 et 662-663, `TypingArea.tsx` ligne 176).
- Les specs et plans datés de `docs/superpowers/` sont des archives : on n'y touche pas.
- Vérification : `git grep -n -i -E "silence|silent|ne joue rien|plays nothing"` ne laisse plus que des archives, des mots de texte (« silence » dans une liste de mots) ou des commentaires qui parlent vraiment d'absence de son (moteur pas prêt).

---

## Partie D : CONTRIBUTING (#127)

Réécrire `CONTRIBUTING.md` en anglais, aligné sur le dépôt réel. Il doit :
- donner l'URL de clonage réelle et les vraies commandes, e2e comprises ;
- décrire la structure du monorepo et les conventions (Conventional Commits, squash merge, TypeScript strict, IndexedDB seulement) ;
- présenter la CI ;
- garder les critères de contenu : textes du domaine public avec source vérifiable ; morceaux MIDI, en disant que le piano est le seul instrument et qu'une faute fait résonner la dernière note sans jamais jouer de fausse note ; thèmes, avec le contraste AA.

Il doit aussi retirer les packs sonores et les guides qui n'existent pas, et vérifier le CLI `create-typewav` avant d'en parler. Aucun tiret cadratin.

---

## Tests

- **Unitaires** :
  - drapeau `has_seen_intro_v1` (lu, posé, lecture en échec) ;
  - lecture de `?intro=1` (ouvre l'Ouverture sans toucher au drapeau) ;
  - retombée de `activeMode: 'learning'` sur `classic` ;
  - `fetchGithubStars` (succès, réponse invalide, erreur réseau, délai dépassé, avec et sans jeton) ;
  - correspondance code physique vers note de `HomeRowTeaser`.
- **Composants** :
  - chaque écran de l'Ouverture affiche une seule phrase de tête et son action ;
  - l'écran 2 ne joue aucune note nouvelle sur une lettre fausse mais déclenche l'écho, et appelle `triggerResume` sur Retour arrière ;
  - Échap pose le drapeau ;
  - l'écran 6 règle le mode Temps 30 s à la première visite seulement ;
  - la langue choisie règle `textLanguage` (fin et Échap, première visite et replay) ;
  - le pied de page n'affiche rien quand `githubStars` vaut `null` ;
  - la page « à venir » n'a qu'une action principale.
- **Rendu (Playwright, `apps/web/e2e/`)**, aux trois tailles :
  - l'Ouverture jouée de bout en bout au clavier, avec à chaque écran zéro chevauchement, tout visible, une seule touche colorée quand il y en a, et le décompte des têtes de note exposé par un attribut `data-*` ;
  - le chemin tactile ;
  - le changement de langue à l'écran 1 (textes basculés sur place, URL changée à la sortie seulement) ;
  - la page « à venir » et son avant-goût (une onde par touche juste, aucune sur une autre touche) ;
  - le mouvement réduit.
  - Les e2e existants qui supposaient le mode Apprentissage sont retirés ou adaptés.

## Vérification avant chaque merge

Gate complet vert. Puis inspection du rendu réel dans Chrome, aux trois tailles et sur trois thèmes, au son, par l'implémenteur. Revue en deux temps : obsession-architect en mode revue (code, puis écrans), puis web-design-guidelines pour l'accessibilité. Enfin, vérification par Mouwafic. Aucun merge sans son feu vert explicite.
