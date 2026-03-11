# FORGE NOTES — TypeWav Refonte 2026

> Base de référence pour la refonte et les corrections.
> Chaque point est conclu et validé avant d'être noté ici.
> Format : décision retenue + contexte + action concrète si applicable.

---

## Points retenus

---

### [0] CORRECTION FONDAMENTALE — Vision produit

**Décision :**
TypeWav est un outil de typing first — l'objectif est identique à MonkeyType : apprendre à taper plus vite, avec moins d'erreurs, pour toutes les cibles (développeurs, rédacteurs, utilisateurs quotidiens).

La musique est un **mécanisme de différenciation, de rétention et de gamification** — pas une proposition de valeur primaire. Elle est la carotte qui pousse l'utilisateur à pratiquer plus longtemps, plus régulièrement, sans s'en rendre compte. Le but reste de faire progresser l'utilisateur, vite et efficacement. TypeWav n'est pas un outil musical — c'est un outil de typing qui utilise la musique pour maximiser l'engagement et la progression.

**Impact :** Toutes les décisions produit, UI et UX doivent prioriser l'efficacité du typing. La musique enrichit l'expérience, elle ne la remplace jamais.

---

### [1] UI/UX — Layout, espace, structure de la home

#### 1.1 Base de référence layout

**Décision :** Prendre le layout de MonkeyType comme base exacte (spacing, positionnement, principes de hiérarchie) et l'adapter aux dimensions de TypeWav. Ne pas réinventer ce qui fonctionne — l'habiter.

Structure générale de la page home :
```
[Zone 1] — Navigation bar (top, floating)
[Zone 2] — Config bar adaptive (centré, ~40px, 2 rows)
[Zone 3] — Espace vide respirant + indicateur contextuel
[Zone 4] — Texte de frappe (pleine largeur, no box, no border)
[Zone 5] — WaveformBars + bouton restart + hint raccourci
[Zone 6] — Footer minimal
```

Tout ce qui ne fait pas partie de cette structure est **supprimé de la home** : tagline "IMMERSIVE MUSICAL TYPING", badge rang en page principale, bouton aperçu sonore standalone, CTAs bas de page.

---

#### 1.2 Zone 1 — Navbar

**Décision :**
- Navigation **flottante** — aucune bordure, aucun fond solide.
- Style : `backdrop-filter: blur(8px)` + `background: color-mix(in srgb, var(--color-bg) 70%, transparent)`. Elle flotte au-dessus du contenu.
- Navigation **par icônes** uniquement, pas de texte (comme MonkeyType).
- Structure :
  ```
  [Logo]    [⌨ home]  [⌃ classement]  [★ premium]       [🔔 notif]  [○ profil/connexion]
  ```

**Logo — Option B enrichie :**
- Composition : `[▁▃▅]  TypeWav█`
- `[▁▃▅]` : icône SVG custom — 3 barres verticales (égaliseur audio), en `--color-accent` (teal), 12×14px. Représente la couche musicale du produit. Symbole universel "audio" — propre, non cliché, scalable.
- Animation des barres : légère animation au **chargement de la page uniquement** (les barres "montent" une fois, puis se figent). **Pas d'animation pendant que l'utilisateur tape.**
- `TypeWav` : Cormorant Garamond, font-weight 300.
- `█` : curseur clignotant en `--color-accent`, animation CSS simple `cursor-blink`.
- Ensemble : `[▁▃▅] TypeWav█` — se lit comme un produit qui est à la fois typing et audio, sans forcer le message.

---

#### 1.3 Zone 2 — Config bar adaptive

**Décision :** Config bar sur 2 lignes contextuelles, inspirée directement du comportement de MonkeyType.

**Ligne 1 (toujours visible) — Modificateurs + Modes :**
```
[@ ponctuation]  [# chiffres]   |   [● Temps] [A Mots] ["" Citation] [△ Zen] [⌨ Code] [🎓 Apprentissage] [👻 Fantôme] [♪ Classiques] [✏ Libre] [🏆 Challenge]
```
- `@ ponctuation` et `# chiffres` sont des **modificateurs toggle** (actifs/inactifs). Visibles uniquement sur les modes qui les supportent (Temps, Mots, Zen, Citation).
- Les modes sont **mutuellement exclusifs**. L'item actif est mis en valeur via `--color-accent`.

**Ligne 2 (contextuelle) — Options secondaires selon le mode actif :**

| Mode actif | Options secondaires affichées |
|---|---|
| `● Temps` | `[collection: Littérature · Poésie · Philosophie · Gaming]` · `[15s · 30s · 60s · 120s · ×]` |
| `A Mots` | `[collection: Littérature · Poésie · Philosophie · Gaming]` · `[10 · 25 · 50 · 100 · ×]` |
| `"" Citation` | `[longueur: court · moyen · long]` · `[collection]` |
| `△ Zen` | `[collection uniquement]` |
| `⌨ Code` | `[JS · TS · Python · Rust · Go · SQL]` · `[durée]` |
| `🎓 Apprentissage` | `[Niveau 1 · 2 · 3 · 4 · 5]` |
| `👻 Fantôme` | aucune option secondaire — utilise la session record automatiquement |
| `♪ Classiques` | `[Für Elise · Gymnopédie · Moonlight Sonata · ...]` |
| `✏ Libre` | `[champ texte libre ________________]` `[→]` |
| `🏆 Challenge` | `[URL du challenge _______________]` `[→]` |

En fin de ligne 2 (toujours visible) : `[♪ Piano ▾]` — chip son cliquable qui ouvre un micro-panel flottant pour sélectionner le sound pack. C'est le différenciateur TypeWav intégré discrètement dans la config.

**Statut de construction des modes :**
- `● Temps` / `"" Citation` / `⌨ Code` / `👻 Fantôme` / `♪ Classiques` / `🎓 Apprentissage` → ✅ Implémentés (à rebrancher sur la nouvelle config bar)
- `A Mots` (`sprint`) / `△ Zen` / `✏ Libre` (`custom`) / `🏆 Challenge` / `@ ponctuation` / `# chiffres` → 🔴 À construire (types déclarés, UI absente)
- `endurance` / `bigrams` → 🟡 Éventuellement, pas prioritaires

---

#### 1.4 Zone 3 — Espace et indicateur contextuel

**Décision :**
- Grand espace vide respirant entre la config bar et le texte (identical à MonkeyType).
- Indicateur contextuel centré, petit, au-dessus du texte — remplace le `⊕ french` de MonkeyType par l'**attribution de la source** :
  ```
  Herman Melville — Moby-Dick (1851)
  ```
  Petit texte, `--color-text-muted`, `--font-ui`. Ton littéraire, pas utilitaire.

---

#### 1.5 Zone 4 — Zone de frappe

**Décision :**
- Texte **pleine largeur** avec marges latérales généreuses (~15% viewport de chaque côté).
- **Zéro boîte, zéro bordure.** Le texte flotte sur le fond — même principe que MonkeyType.
- **3 lignes visibles** en permanence. Ligne courante au centre.
- Taille de police significativement augmentée par rapport à l'actuel (~24px).
- Curseur `|` en `--color-accent`, animation blink.
- La ligne courante dispose d'un **fond aura ultra-subtil** : `color-mix(in srgb, var(--color-accent) 3%, transparent)`. Imperceptible consciemment, perçu subconsciemment comme "je suis là".

---

#### 1.6 Zone 5 — Sous le texte

**Décision :**
- **WaveformBars** : 12 à 16 barres teal, hauteur max 10px, centrées, animées en temps réel sur chaque note correcte. Quand silence : barres au minimum, légèrement pulsantes. Visuellement subtil — preuve de la couche musicale sans dominer.
- **Bouton restart / nouveau texte** : icône type `ᴄ` de MonkeyType, centré, cliquable. Harmonieux avec les WaveformBars (positionnement à décider : sous les barres ou intégré entre elles).
- **Hint raccourci** discret en dessous :
  ```
  tab + enter — nouveau texte
  ```
  Même style que MonkeyType — petit, `--color-text-muted`, centré.

---

#### 1.7 Zone 6 — Footer

**Décision :**
- Liens : `github` · `terms` · `privacy` uniquement (côté gauche).
- Côté droit : `♪ [pack actif]` + `v[version]`.
- Minimaliste. Même échelle que MonkeyType.

---

*Point [1] conclu et validé — 11 Mars 2026*

---

### [2] UI/UX — Page Résultats `/results`

**Base de référence :** Layout MonkeyType Results, adapté aux dimensions TypeWav.

#### 2.1 Structure générale

```
[colonne gauche : stats primaires]  [graphique WPM + SessionWaveform overlay — pleine largeur]
                                    [stats secondaires — ligne horizontale]
                                    [barre d'actions — 3 icônes]
                                    [recommandation personnalisée]
                                    [CTA connexion si non connecté]
```

#### 2.2 Colonne gauche — Stats primaires

```
wpm
87
wpm net
82
précision
96%
mode
classic · Littérature
```

- Labels : petit, `--color-text-muted`, `--font-ui`
- Valeurs : grand, `--color-accent`
- **Record personnel** : ligne fine accent `▔` sous le chiffre concerné + label `record` en `--color-text-muted` ultra-petit. Sobre, discret. Pas de badge, pas de fanfare.

#### 2.3 Zone centrale — Graphique WPM + SessionWaveform

- Graphique WPM identique à MonkeyType :
  - Courbe raw (gris)
  - Courbe net (teal `--color-accent`)
  - Courbe tendance (teal pointillé)
  - Points erreurs (`--color-error`)
  - Axe Y gauche : WPM, axe Y droit : erreurs, axe X : numéro de mot
- **Différenciateur TypeWav :** `SessionWaveform` en **overlay fond du graphique**, très basse opacité. Les barres SVG s'alignent sur l'axe X du graphique (même timeline). Le graphique WPM au premier plan, la signature sonore en fond. Les deux dans le même espace sans se concurrencer.
- Aucun autre outil de typing n'a ça.

#### 2.4 Stats secondaires — Ligne horizontale sous le graphique

```
raw      characters       consistance      durée
72       272/9/1/0        63%              51s
```

Même disposition en colonnes que MonkeyType. Labels en `--color-text-muted`, valeurs en `--color-accent`.

#### 2.5 Barre d'actions — 4 icônes

```
[  >  ]  [  ↺  ]  [  ♪  ]  [  |◄  ]
```

| Icône | Action |
|---|---|
| `>` | Prochain test |
| `↺` | Répéter ce test |
| `♪` | **Réécouter la session** — rejoue les `NoteEvent[]` via Tone.js. La performance musicale exacte de l'utilisateur dans son rythme exact. |
| `|◄` | **Partager ce replay** — génère un lien `/{locale}/replay?d=...` via `encodeReplay()`. Copie l'URL dans le presse-papier. Icône sobre, même rang que les autres. |

Pas d'autres icônes. Pas de practice words, pas de screenshot.

#### 2.6 Recommandation personnalisée

Texte centré, `--font-ui`, `--color-text-muted`. Pas de boîte. Contenu qui respire.
Exemple : *"Tes bigrams les plus lents : "th" (180ms), "en" (165ms). Concentre-toi sur ces enchaînements."*
À extraire de `lib/stats.ts` vers `messages/fr.json` + `messages/en.json` (i18n obligatoire).

#### 2.7 CTA connexion (si non connecté)

```
Se connecter pour sauvegarder ce résultat
```
Texte discret, centré, lien cliquable. Pas de banner, pas de modal.

---

*Point [2] conclu et validé — 11 Mars 2026*

---

### [3] UI/UX — Autres interfaces (décisions retenues, à affiner plus tard)

#### 3.1 Page Profil `/profil`

- Rang : ligne d'intro en haut de page. `APPRENTI · 69 WPM médian` en grand, Cormorant Garamond, font-weight 300. Pseudo en dessous, plus petit.
- Stats cards : supprimer les bordures — 4 chiffres flottants dans une grille 2×2, même traitement typographique que la page résultats.
- Chart WPM : pleine largeur, axes minimalistes, `--color-accent` pour la courbe, `--color-text-muted` pour les axes. Aucun arrière-plan de panel.
- Heatmap 90 jours : pleine largeur. Gestion explicite état vide : *"Jour 1 de 90 — commence à construire ton historique"*.
- **Section Replays récents** : 5 derniers replays uniquement, conservés dans IndexedDB. Chaque entrée : `WPM · précision · mode · date` sur une ligne + icône `|◄` cliquable qui ouvre le lien replay. Titre de section : `"Replays récents"` en `--color-text-muted`. Pas de bordures — même traitement liste que le reste du profil. Au-delà de 5, les plus anciens sont supprimés automatiquement.
- Sections séparées par de l'espace, jamais par des bordures ou des cards.

#### 3.2 Page Classement `/classement`

- Banner honnête en haut : *"Classement mondial disponible dès la synchronisation cloud"* + badge `BIENTÔT` en `--color-accent`. Affiché, assumé.
- En dessous : tableau labellisé clairement **"Mes meilleures sessions"** jusqu'à la livraison du leaderboard global.
- Barre de filtres : même style chips que la config bar home (`Tous · Classique · Code · Sprint · ...`).
- Tableau minimaliste : colonnes `# · Mode · WPM · Précision · Date`. Lignes horizontales fines en `--color-border`, pas de bordures de cellules.

#### 3.3 Page Premium `/premium`

- Retirer les faux badges premium sur les features gratuites (Ghost, Replay, Challenge sont gratuits — à lister comme tels).
- Pricing cards : traitement floating, pas de bordure épaisse. Aura `color-mix(in srgb, var(--color-accent) 8%, transparent)` sur la card recommandée.
- CTA cloud sync : badge `BIENTÔT` visible et explicite. Bouton de checkout masqué si `SYNC_IS_COMING_SOON = true`.
- Ton factuel et honnête : ce que l'argent finance, ce qui est exactement débloqué.

#### 3.4 Pages Auth `/auth/login`, `/auth/signup`, `/auth/reset-password`

- Layout centré verticalement et horizontalement. Formulaire seul sur la page — pas de panel, pas de card avec bordure. Formulaire flottant sur fond noir.
- Logo `[▁▃▅] TypeWav█` en haut, lien cliquable vers la home.
- Inputs : `--color-border` en état normal, `box-shadow: 0 0 0 2px var(--color-accent)` au focus. Zéro `outline: none` sans remplacement.
- Submit button : pleine largeur du formulaire, `--color-accent` background, texte noir.
- Liens inter-auth (`Pas de compte ? S'inscrire`, `Mot de passe oublié ?`) en `--color-text-muted`, sous le bouton.
- Aucun autre contenu sur ces pages.

#### 3.5 Page Challenge `/challenge`

**État actuel :** Fonctionnellement complet. 3 états gérés : chargement, frappe active, post-complétion.

**Bug à corriger :** `autoNavigate` non forcé à `false` dans `<TypingArea>` — à la fin de la session, l'app navigue vers `/results` au lieu d'afficher l'écran post-complétion challenge (win/loss + contre-défier). L'état post-complétion ne s'affiche jamais en pratique.

**Design direction (= MonkeyType home structure adaptée) :**
- Pas de page séparée visuellement — la config bar est remplacée par un **banner contextuel slim** : `"Challenge de [pseudo] — objectif : battre X WPM"` en `--color-accent`.
- Le reste : même zone de frappe, même waveform, même footer.
- Post-complétion : résultat centré (gagné/perdu), bouton "Contre-défier" en `--color-accent`, lien retour discret.
- L'entrée principale vers le challenge est désormais le mode `🏆 Challenge` dans la config bar de la home (génère et partage l'URL).

#### 3.6 Page Replay `/replay`

**État actuel :** Propre et fonctionnel. 2 phases : écran pré-lancement → frappe avec ghost cursor.

**Design direction :**
- Banner slim en haut : `"Replay — X WPM · Y% · thème Z"`.
- Même zone de frappe que la home. Ghost cursor actif.
- Pas de config bar — c'est une lecture, pas une session configurable.

**Points d'entrée (2) :**
1. **Page résultats** — icône `|◄` dans la barre d'actions (4ème icône). Génère le lien replay de la session courante, copie dans le presse-papier.
2. **Page profil** — section "Replays récents" : 5 derniers replays listés, chacun avec son icône `|◄` cliquable.

**Limite de stockage :** 5 replays maximum dans IndexedDB. Le 6ème écrase le plus ancien.

#### 3.7 Page Transparence `/transparence`

- Texte long, typographie propre : `--font-ui`, line-height généreux.
- Titres en Cormorant Garamond, body en Sora.
- Aucun widget, aucune card. Contenu qui respire sur fond noir.
- Même navbar, même footer.

---

#### 3.8 Fil conducteur entre toutes les pages (non-négociables)

| Principe | Application |
|---|---|
| Pas de bordures-containers | Contenu flottant sur fond, séparé par de l'espace |
| Un seul accent | `--color-accent` teal — éléments actifs, records, CTAs primaires uniquement |
| Cormorant pour les titres d'identité | Rang, pseudo, nom du produit |
| Sora pour le contenu UI | Labels, descriptions, copy |
| JetBrains Mono pour les données | WPM, précision, timestamps, code |
| Espace = hiérarchie | Pas de bordures pour séparer — l'espace fait le travail |
| Footer identique partout | `github · terms · privacy` + `♪ pack actif` + `v[version]` |
| Navbar flottante identique partout | Même composant GlobalNav, même traitement |

---

*Point [3] conclu et validé — 11 Mars 2026*

---

### [4] Audio — Sound Packs

#### 4.1 Packs retenus

**3 packs supprimés définitivement :** Marimba, Chiptune, Phonk.
À retirer de `packages/soundpacks/src/index.ts`, des configs, de l'UI (sélecteur), des tests, et de la page Premium.

**4 packs conservés :**

| # | ID | Nom | Statut | Caractère |
|---|-----|-----|--------|-----------|
| 1 | `piano` | Grand Piano | 🆓 Gratuit | Acoustique, chaud — le défaut |
| 2 | `synth-lofi` | Synth Lo-Fi | 🆓 Gratuit | Lo-fi hip-hop, reverb 0.4 |
| 3 | `cinematic` | Cinematic | 💎 Premium | Cordes orchestrales, immersif, reverb 0.45 |
| 4 | `jazz-piano` | Jazz Piano | 💎 Premium | Piano acoustique chaud, release long |

#### 4.2 Fonctionnement réel du moteur audio

**Le moteur audio est 100% synthétisé. Aucun fichier .mp3 n'est chargé.**

Tone.js crée un `Synth` (oscillateur + enveloppe ADSR + reverb) en mémoire. Chaque pack est une combinaison de paramètres, pas un ensemble de fichiers audio.

| Pack | Oscillateur | Attack | Release | Reverb | Caractère |
|---|---|---|---|---|---|
| `piano` | `triangle` | 0.005s | 1.2s | 0.25 | Rond, chaud |
| `synth-lofi` | `sawtooth` | 0.05s | 0.8s | 0.35 | Lo-fi, dentelé |
| `cinematic` | `sawtooth` | 0.08s | 2.0s | 0.45 | Lent, spatial, immersif |
| `jazz-piano` | `sine` | 0.01s | 1.5s | 0.28 | Pur, chaud, long |

Quand l'utilisateur change de pack, Tone.js reconstruit l'oscillateur avec les nouveaux paramètres. Zéro réseau, zéro fichier, fonctionne hors ligne.

**Note :** Les fichiers `soundpack.config.ts` qui référencent `/audio/piano/A2.mp3` etc. sont du **code mort** — jamais importés, jamais utilisés par le moteur audio. C'était une intention architecturale pour de futurs samples réels, jamais branchée. Ces configs peuvent être nettoyées ou conservées pour une V2 avec vrais samples.

#### 4.3 Mode MIDI Classiques

Fonctionne de la même façon — 100% en mémoire. Chaque pièce est un tableau de notes Tone.js hardcodé (ex: `['E5', 'Eb5', 'E5', ...]`). Chaque keystroke correct avance d'une note dans la séquence. Pas de fichiers .mid, pas de parsing. 8 pièces disponibles : Für Elise, Bach BWV 846, Gymnopédie, Tetris, Ode to Joy, Nocturne Chopin, Rondo alla Turca, Canon in D.

#### 4.4 Nettoyage — Code mort à supprimer

Les fichiers `soundpack.config.ts` de chaque pack (piano, marimba, synth-lofi, chiptune, cinematic, phonk, jazz-piano) définissent un `baseUrl`, une `fileExtension` et un mapping de notes .mp3. Ces propriétés ne sont importées nulle part dans le moteur audio — elles n'ont jamais été branchées.

**Actions :**
- Supprimer les propriétés `baseUrl`, `fileExtension`, `notes` des configs des 4 packs conservés, ou supprimer entièrement les configs des 3 packs supprimés.
- Supprimer les types correspondants dans `packages/types/src/soundpack.ts` si plus utilisés.
- Garder uniquement ce que le moteur audio consomme réellement : `id`, `name`, `isPremium`, `instrumentType`, `attackTime`, `releaseTime`, `reverbWet`.

#### 4.5 Bug de type à corriger

Le pack `cinematic` utilise `instrumentType: 'strings'` — valeur absente du type union `InstrumentType` dans `packages/types/src/soundpack.ts`. Corrige avant la prochaine transpilation stricte.

---

*Point [4] conclu et validé — 11 Mars 2026*

---

### [5] Audio — Bibliothèque musicale

#### 5.1 Vision

Supprimer la séparation entre le mode "génératif pentatonique" et le mode "Classiques". **Chaque session joue une vraie composition musicale**, note par note, en avançant dans la mélodie à chaque keystroke correct. C'est l'architecture du mode Classiques actuel — appliquée à tout le système musical.

Le pentatonique génératif est supprimé ou rétrogradé en option "Libre" pour ceux qui le préfèrent. Il ne doit plus être le comportement par défaut.

**Par défaut :** sélection aléatoire dans la bibliothèque à chaque session.
**Manuel :** l'utilisateur épingle une pièce via la config bar (ligne 2 du mode ♪).

#### 5.2 Config bar — Sélection musicale

Le mode `♪ Classiques` de la config bar devient le sélecteur de la bibliothèque musicale unifiée :
```
[Aléatoire ✦]  [Für Elise]  [Clair de Lune]  [Gymnopédie No.1]  [Canon in D]  [▾ Voir tout]
```
`[Aléatoire ✦]` est l'item actif par défaut. `[▾ Voir tout]` ouvre un panel scrollable avec les 58 pièces, filtrables par registre émotionnel (Énergique / Contemplatif / Dramatique / Romantique / Folk).

#### 5.3 Pièces existantes (8 — déjà dans le code)

| # | Titre | Compositeur |
|---|---|---|
| 1 | Für Elise | Beethoven |
| 2 | Prélude BWV 846 | Bach |
| 3 | Gymnopédie No.1 | Satie |
| 4 | Korobeiniki (Tetris) | Traditionnel russe |
| 5 | Ode to Joy | Beethoven |
| 6 | Nocturne Op.9 No.2 | Chopin |
| 7 | Rondo alla Turca | Mozart |
| 8 | Canon in D | Pachelbel |

#### 5.4 Nouvelles pièces à encoder (50) — Toutes domaine public

##### ⚡ Énergique / Vif

| # | Titre | Compositeur (†) | Flag |
|---|---|---|---|
| 9 | Eine kleine Nachtmusik (1er mvt) | Mozart (†1791) | |
| 10 | Symphony No.40 (1er mvt, thème) | Mozart (†1791) | |
| 11 | Toccata & Fugue en Ré mineur (ouverture) | Bach (†1750) | |
| 12 | Hungarian Dance No.5 | Brahms (†1897) | |
| 13 | In the Hall of the Mountain King | Grieg (†1907) | ⚠️ tempo évolutif |
| 14 | Maple Leaf Rag | Scott Joplin (†1917) | |
| 15 | The Entertainer | Scott Joplin (†1917) | |
| 16 | Flight of the Bumblebee | Rimsky-Korsakov (†1908) | 💀 niveau extrême |
| 17 | Danse Macabre | Saint-Saëns (†1921) | |
| 18 | Can-Can (galopfinal) | Offenbach (†1880) | |
| 19 | Night on Bald Mountain | Moussorgski (†1881) | |
| 20 | Kalinka | Ivan Larionov (†1889) | ⚠️ tempo évolutif |
| 21 | When the Saints Go Marching In | Traditionnel Gospel | |

##### 🌊 Contemplatif / Lent

| # | Titre | Compositeur (†) | Flag |
|---|---|---|---|
| 22 | Moonlight Sonata (1er mvt, Adagio) | Beethoven (†1827) | |
| 23 | Clair de Lune (thème A) | Debussy (†1918) | |
| 24 | Arabesque No.1 | Debussy (†1918) | |
| 25 | Gymnopédie No.2 | Satie (†1925) | |
| 26 | Pavane pour une infante défunte | Ravel (†1937) | |
| 27 | Träumerei | Schumann (†1856) | |
| 28 | New World Symphony — Largo | Dvořák (†1904) | |
| 29 | Nimrod (Enigma Variations, Var. IX) | Elgar (†1934) | |
| 30 | Air on the G String (BWV 1068) | Bach (†1750) | |
| 31 | Raindrop Prelude (Op.28 No.15) | Chopin (†1849) | |
| 32 | Scarborough Fair | Traditionnel anglais (XVIe s.) | |
| 33 | Sakura Sakura | Traditionnel japonais | |

##### 🎭 Dramatique / Solennel

| # | Titre | Compositeur (†) | Flag |
|---|---|---|---|
| 34 | Lacrimosa (Requiem K.626) | Mozart (†1791) | |
| 35 | Symphony No.5 (1er mvt, 2e thème) | Beethoven (†1827) | |
| 36 | Ballade No.1 en Sol mineur (thème) | Chopin (†1849) | |
| 37 | Sarabande en Ré mineur | Handel (†1759) | |
| 38 | Promenade (Tableaux d'une exposition) | Moussorgski (†1881) | |
| 39 | Scheherazade Op.35 (1er mvt, violon) | Rimsky-Korsakov (†1908) | |
| 40 | Danses Polovtsiennes (thème lyrique) | Borodin (†1887) | |
| 41 | Habanera (Carmen, 1er acte) | Bizet (†1875) | |

##### 🌹 Romantique / Lyrique

| # | Titre | Compositeur (†) | Flag |
|---|---|---|---|
| 42 | Liebestraum No.3 | Liszt (†1886) | |
| 43 | Hungarian Rhapsody No.2 (section Lassan) | Liszt (†1886) | ⚠️ tempo évolutif |
| 44 | La Campanella | Liszt (†1886) | 💀 niveau extrême |
| 45 | Lac des Cygnes — Thème du cygne | Tchaïkovski (†1893) | |
| 46 | Danse de la Fée Dragée | Tchaïkovski (†1893) | |
| 47 | Morning Mood (Peer Gynt, Suite No.1) | Grieg (†1907) | |
| 48 | Sicilienne Op.78 | Fauré (†1924) | |
| 49 | Waltz in A minor (B.150) | Chopin (†1849) | |
| 50 | Ave Maria | Schubert (†1828) | |

##### 🌍 Folk / Traditionnel / World

| # | Titre | Compositeur (†) | Flag |
|---|---|---|---|
| 51 | Greensleeves | Traditionnel anglais (XVIe s.) | |
| 52 | Danny Boy (Londonderry Air) | Traditionnel irlandais | |
| 53 | Bella Ciao | Traditionnel italien | |
| 54 | Drunken Sailor | Traditionnel (shanty) | |
| 55 | La Folia (Op.5 No.12) | Corelli (†1713) | |
| 56 | Simple Gifts | Joseph Brackett (†1882) | |
| 57 | Amazing Grace | Traditionnel (hymne, c.1772) | |
| 58 | Shenandoah | Traditionnel américain | |

**Total bibliothèque : 58 pièces. Toutes domaine public ou traditionnelles. Zéro risque juridique.**

#### 5.5 Flags d'implémentation

- ⚠️ **Tempo évolutif** (3 pièces : Mountain King, Kalinka, Hungarian Rhapsody) — nécessitent un support de tempo variable dans le séquenceur. À implémenter séparément après les pièces à tempo fixe.
- 💀 **Niveau extrême** (2 pièces : Flight of the Bumblebee, La Campanella) — densité de notes très élevée. À indiquer visuellement dans le sélecteur (badge difficulté ou avertissement).

#### 5.6 Note sur la sélection finale

Pièces explicitement **exclues** pour raison de copyright ou qualité :
- Adagio d'Albinoni : composé à 90% par Remo Giazotto (†1992) — **pas encore dans le domaine public**
- Toute œuvre de Stravinsky (†1971) — hors domaine public
- Gymnopédie No.3 : trop proche du No.1 déjà présent (No.2 retenu à la place — couleur harmonique distincte)

---

*Point [5] conclu et validé — 11 Mars 2026*

---

### [6] Audio — Système de recommandation musicale contextuelle

#### 6.1 Vision

Le système de sélection musicale n'est pas aléatoire — il est **contextuellement intelligent**. La pièce jouée est choisie en fonction du mode, de la collection et de la durée de session. La musique renforce l'état émotionnel du contexte de frappe sans que l'utilisateur ait à y penser.

L'utilisateur peut toujours overrider manuellement. La recommandation est un défaut intelligent, pas une contrainte.

#### 6.2 Table de correspondance — Contexte → Registre

| Contexte | Registre suggéré | Raisonnement |
|---|---|---|
| Mode Sprint | ⚡ Énergique | Session courte et intense → musique qui booste |
| Mode Endurance / ∞ | 🌊 Contemplatif | Session longue → musique qui installe la trance, pas la pression |
| Mode Zen | 🌊 Contemplatif | Le mode dit l'intention — la musique confirme |
| Mode Code | 🎭 Dramatique | Concentration technique → tension musicale qui aide à rester focus |
| Mode Ghost | ⚡ Énergique | Compétition → adrénaline |
| Mode Challenge | ⚡ Énergique ou 🎭 Dramatique | Enjeu → drame ou énergie |
| Mode Apprentissage | 🌊 Contemplatif | Apprendre demande de la patience, pas de la pression |
| Collection Poésie | 🌹 Romantique | Registre littéraire et musical partagé |
| Collection Philosophie | 🎭 Dramatique | Pensée profonde → musique grave et dense |
| Collection Gaming | ⚡ Énergique | Le contenu appelle le rythme |
| Collection Littérature (défaut neutre) | 🌹 Romantique | Register universel le plus adapté |
| Durée 15s | ⚡ Énergique | Burst court → énergie maximale |
| Durée 120s+ | 🌊 Contemplatif | Session longue → méditation |

#### 6.3 Logique d'implémentation

Fonction pure `getRecommendedRegister(mode, collection, duration)` → retourne un registre émotionnel → sélection aléatoire d'une pièce dans ce registre.

```ts
// ~20 lignes — lookup table pure, zéro complexité
getRecommendedRegister(mode: TypingMode, collection: string, duration: number)
  → 'energique' | 'contemplatif' | 'dramatique' | 'romantique' | 'folk'
  → pickRandom(LIBRARY.filter(p => p.register === register))
```

#### 6.4 Expression UI dans la config bar

```
[♪ Mountain King  ↺]   ← nom de la pièce recommandée + icône refresh
```

- `↺` : nouvelle suggestion dans le même registre. Pas d'ouverture de panel.
- Clic sur le nom : ouvre `[▾ Voir tout]` avec la pièce courante sélectionnée.
- Le registre actif est affiché en sous-texte discret : `"⚡ Énergique"` sous le chip.

#### 6.5 V2 — Recommandation basée sur la performance récente

Non implémenté maintenant. À envisager ultérieurement :
- Utilisateur en difficulté (WPM en baisse, erreurs élevées sur 3 sessions) → basculer vers 🌊 Contemplatif (moins de pression, plus de flow)
- Utilisateur en streak (WPM en hausse, précision > 95%) → basculer vers ⚡ Énergique (ride the wave)

Nécessite lecture de l'historique IndexedDB au chargement — faisable, à planifier séparément.

---

*Point [6] conclu et validé — 11 Mars 2026*

---

### [7] Collections de textes

#### 7.1 Langue des textes — Option B

**Décision :** La langue des textes est contrôlable via un **modificateur dans la config bar**, indépendamment de la langue de l'interface (next-intl).

```
[FR]  [EN]  [FR+EN]
```

- `FR` : textes en français uniquement
- `EN` : textes en anglais uniquement
- `FR+EN` : sélection mixte (comportement actuel par défaut — aucun filtrage)

Ce modificateur est positionné en **ligne 1 de la config bar**, aux côtés des modificateurs `@ ponctuation` et `# chiffres`. Il est visible sur tous les modes qui utilisent des textes littéraires (Temps, Mots, Citation, Zen, Apprentissage).

**État actuel :** Le champ `language: 'fr' | 'en'` existe déjà sur `TextEntry`. La fonction `fetchCollection()` retourne tous les textes sans filtrage. Il faut brancher le filtre sur ce champ en fonction du modificateur sélectionné.

---

#### 7.2 Enrichissement de la bibliothèque de textes

**Décision :** La bibliothèque de textes doit être **significativement enrichie**. Le critère cible :

> La probabilité de tomber sur le même texte lors de deux sessions aléatoires consécutives doit être **inférieure à 50%**, et idéalement inférieure à 30%.

**État actuel :** Collections existantes :

| Collection | Contenu actuel | Langue |
|---|---|---|
| `litterature` | 10 FR + 10 EN | Bilingual |
| `poesie` | 10 FR + 10 EN | Bilingual |
| `philosophie` | 10 FR + 10 EN | Bilingual |
| `gaming` | 10 FR + 10 EN | Bilingual |
| `code` | 20 EN | EN only |

Avec 10 textes par langue par collection, la probabilité de doublon sur deux sessions consécutives est de 10% — ce qui paraît bon, mais c'est trompeur : le pool effectif est réduit une fois les modes, options et préférences langue appliqués. En pratique, la répétition est très fréquente.

**Objectif d'enrichissement :**

| Collection | Cible minimum | Note |
|---|---|---|
| `litterature` | 50 FR + 50 EN | Collection principale — le plus grand pool |
| `poesie` | 30 FR + 30 EN | Poèmes souvent courts, en requiert plus |
| `philosophie` | 30 FR + 30 EN | Extraits denses, cible raisonnable |
| `gaming` | 30 FR + 30 EN | Culture gaming, facilement enrichissable |
| `code` | 50 EN (+ 20 FR) | Code EN prioritaire ; FR optionnel |

**Règles de sélection des textes :**
- Domaine public ou licence libre (pas de droits d'auteur actuels)
- Extraits de longueur variable pour couvrir les modes 10/25/50/100 mots et les durées 15s/30s/60s/120s
- Qualité littéraire ou clarté technique selon la collection
- Encodés avec le champ `language` renseigné correctement

---

#### 7.3 Sélection adaptative par mode et options

**Décision :** La sélection du texte n'est pas uniforme — elle est **adaptée au mode actif et à ses options**.

| Mode / Option | Comportement de sélection |
|---|---|
| **Mots 10** | Textes courts (1–2 phrases, ~50–80 caractères) |
| **Mots 25** | Textes moyens (~120–200 caractères) |
| **Mots 50** | Textes longs (~250–400 caractères) |
| **Mots 100** | Textes très longs (~500–800 caractères) |
| **Temps 15s** | Extraits courts et denses (~100–150 caractères) |
| **Temps 60s+** | Extraits longs ou enchaînements de paragraphes |
| **Citation** | Textes avec attribution explicite (source connue) — formatés `"Citation" — Auteur` |
| **Apprentissage Niveau 1** | Textes simples, vocabulaire fréquent, phrases courtes |
| **Apprentissage Niveau 5** | Textes complexes, vocabulaire rare, longues dépendances syntaxiques |
| **Code** | Snippets par langage (JS/TS/Python/Rust/Go/SQL), cohérents syntaxiquement |
| **Zen** | Textes longs, fluides, sans ponctuation complexe de préférence |

**Implémentation :** `fetchCollection()` doit accepter des paramètres de filtrage : `{ mode, wordCount?, duration?, language?, difficulty? }` et retourner un pool filtré. La sélection finale dans ce pool est **aléatoire mais sans doublon récent** (éviter de réafficher un texte déjà vu dans les N dernières sessions — N à définir, ~5 minimum).

**Structure `TextEntry` à enrichir :**
```ts
interface TextEntry {
  id: string
  content: string
  language: 'fr' | 'en'
  source?: string        // auteur et/ou œuvre (ex: "Victor Hugo — Les Misérables")
  wordCount: number      // calculé à l'ingestion
  charCount: number      // calculé à l'ingestion
  difficulty?: 1 | 2 | 3 | 4 | 5  // pour le mode Apprentissage
  collection: CollectionId
}
```

---

*Point [7] conclu et validé — 11 Mars 2026*

---

### [8] Bugs identifiés — non couverts par les specs existantes

#### F-1 — Bug TypeScript : pack `cinematic`

**Fichier :** `packages/soundpacks/src/cinematic/` + `packages/types/src/soundpack.ts`

**Problème :** Le pack `cinematic` déclare `instrumentType: 'strings'` — valeur absente du type union `InstrumentType`. Passe inaperçu en mode de compilation laxe, explose à la prochaine compilation TypeScript stricte (`pnpm typecheck`).

**Correction :** Ajouter `'strings'` à l'union `InstrumentType` dans `packages/types/src/soundpack.ts`, ou corriger la valeur dans la config cinematic vers un type existant (`'synth'`). Préférer l'ajout de `'strings'` à l'union — c'est sémantiquement correct pour ce pack.

---

#### F-2 — Bug comportement : `ChallengeClient.tsx`

**Fichier :** `apps/web/app/[locale]/challenge/ChallengeClient.tsx`

**Problème :** `<TypingArea>` ne reçoit pas la prop `autoNavigate={false}`. À la fin d'une session challenge, le composant navigue automatiquement vers `/results` — l'écran post-complétion (résultat gagné/perdu + bouton contre-défier) ne s'affiche donc jamais en pratique.

**Correction :** Passer explicitement `autoNavigate={false}` à `<TypingArea>` dans `ChallengeClient.tsx`. Une ligne.

---

*Point [8] conclu et validé — 11 Mars 2026*

---

_Session ouverte le 11 Mars 2026_
