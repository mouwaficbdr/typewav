# TypeWav v1 : retrait, écho, Ouverture, étoiles, CONTRIBUTING. Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sortir le Conservatoire de `main`, faire dire vrai aux textes sur la faute, offrir l'Ouverture (intro de six écrans), une page « à venir », le nombre d'étoiles GitHub, et un CONTRIBUTING en anglais.

**Architecture:** Cinq PR successives, une par ticket : #124 (retrait et page « à venir »), #129 (écho de la faute), #125 (l'Ouverture), #126 (étoiles), #127 (CONTRIBUTING). L'Ouverture est un rideau monté par `HomeClient` (pas une route), avec ses textes chargés dans les deux langues pour changer de langue sans remontage. La musique de l'Ouverture est une suite de notes écrite, jouée au piano par `playNoteName`, sans toucher au séquenceur.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, `motion/react`, `next-intl`, Tone.js via `useAudioEngine`, IndexedDB via `lib/db.ts`, Vitest (3 projets), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-typewav-v1-intro-design.md`. Lire la spec en entier avant la première tâche : elle porte la direction de design, que ce plan ne répète pas.

## Global Constraints

- Aucun tiret cadratin ni demi-cadratin, nulle part (code, commentaires, textes, commits, PR). Vérifier avec `git grep -nP '\xE2\x80[\x93\x94]'` avant chaque commit.
- Zéro attribution IA dans les commits et les PR. Conventional commits en français. Une PR par ticket, squash merge, **aucun merge sans le feu vert explicite de Mouwafic**.
- Persistance IndexedDB seulement (`getPreference` / `setPreference` de `apps/web/lib/db.ts`), jamais `localStorage` ni `sessionStorage`. Lecture en échec : on ne piège jamais.
- TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (props optionnelles par spread conditionnel). Aucun `any`.
- TDD : test qui échoue d'abord, puis le code minimal.
- Couleurs : uniquement les variables du thème (`--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, `--color-text-primary`, `--color-text-muted`). Polices : `--font-display`, `--font-ui`, `--font-mono`.
- Mouvement : `motion/react` ; courbes `cubic-bezier(0.16, 1, 0.3, 1)` (moments forts) et `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (le reste) ; texte qui change : 240 ms, fondu et 8 px ; sous `prefers-reduced-motion`, aucun déplacement, fondus de 120 ms au plus.
- Son : piano seulement. Jamais de son avant un geste. Une faute ne joue jamais de note nouvelle : seulement l'écho de la dernière note. Ne jouer une note dans l'Ouverture que si `useAudioStore.getState().isSamplerLoaded` est vrai.
- Le piano est le seul instrument de TypeWav : ne jamais proposer ni écrire autre chose.
- Gate avant chaque PR : `pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test && pnpm build`, puis `(cd apps/web && pnpm test:e2e)`. Le build échoue parfois sur un fetch Google Fonts transitoire : relancer.
- Avant d'ouvrir chaque PR : inspection du rendu réel dans Google Chrome (`google-chrome "<url>" &`, jamais `xdg-open`), à 1280x650, 1024x600, 390x844, avec le son, sur `cyprus-sand`, `terminal-amber` et un troisième thème au choix, et sous mouvement réduit.
- Branches : chaque PR part de `origin/main` à jour. Si la PR précédente n'est pas encore mergée, brancher depuis la branche précédente et rebaser sur `origin/main` dès qu'elle l'est (`--force-with-lease` seulement).

## Review Focus

- **Préférence persistée `activeMode: 'learning'`** (Mouwafic en a une) : l'accueil doit s'ouvrir en mode Temps, sans erreur ni écran vide. Testé en tâche 1.
- **Frappes très rapides ou répétées à l'écran 2** (une lettre juste puis fausse dans la même milliseconde, Retour arrière en pleine saisie, touches après la fin du texte) : jamais deux notes pour une lettre, jamais de note sur une faute, jamais d'index hors du texte. Testé en tâches 11 et 14.
- **Piano lent ou en échec** (premier chargement à froid, réseau coupé) : l'écran 1 attend avec « Le piano s'accorde… », puis continue sans son au-delà de 8 s ; aucun son de synthé. Testé en tâches 10 et 13.
- **Échap à n'importe quel écran**, y compris en pleine saisie à l'écran 2 ou avant tout choix à l'écran 1 : drapeau posé, langue appliquée selon la règle, rideau levé, focus sur la frappe. Testé en tâches 9, 13 et 15.
- **API GitHub lente, en erreur, ou réponse inattendue** (champ manquant, négatif, chaîne) : la page d'accueil se rend quand même, sans chiffre et sans trou. Testé en tâches 17 et 18.

---

## Tâche 0 : les documents

- [ ] **Step 1: Committer la recherche, la spec et ce plan comme premier commit de `feat/retrait-conservatoire`**

```bash
git switch feat/retrait-conservatoire
git add docs/RESEARCH.md docs/superpowers/specs/2026-10-18-typewav-v1-intro-design.md docs/superpowers/plans/2026-10-18-typewav-v1-intro.md
git commit -m "docs: spec et plan de l'Ouverture, du retrait du Conservatoire et des étoiles GitHub"
```

---

# PR 1 : retrait du Conservatoire et page « à venir » (#124)

### Tâche 1 : une préférence `learning` retombe sur le mode Temps

**Files:**
- Modify: `apps/web/stores/useConfigStore.ts`
- Modify: `packages/types/src/session.ts` (commentaire seulement)
- Test: `apps/web/stores/__tests__/useConfigStore.test.ts` (créer s'il n'existe pas)

**Interfaces:**
- Produces: `normalizeActiveMode(mode: TypingMode): TypingMode`, exportée de `useConfigStore.ts`.

`'learning'` **reste** dans l'union `TypingMode` : l'historique de Mouwafic contient des séances `learning`, et `lib/progression.ts` les exclut du rang (`NON_COMPETITIVE_MODES`), ce qui doit continuer. Remplacer son commentaire par `// Historique seulement : ancien mode Apprentissage, plus jamais sélectionnable`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
it("normalizeActiveMode remplace l'ancien mode Apprentissage par le mode Temps", () => {
  expect(normalizeActiveMode('learning')).toBe('classic');
});
it('normalizeActiveMode laisse les autres modes intacts', () => {
  expect(normalizeActiveMode('zen')).toBe('zen');
  expect(normalizeActiveMode('code')).toBe('code');
});
it("une config persistée avec activeMode 'learning' se réhydrate en 'classic'", async () => {
  // écrire { state: { activeMode: 'learning' }, version } sous la clé 'typewav-config'
  // via setPreference (fake-indexeddb), puis useConfigStore.persist.rehydrate()
  expect(useConfigStore.getState().activeMode).toBe('classic');
});
```

- [ ] **Step 2: Lancer et voir échouer**

Run: `pnpm vitest run --project web-components apps/web/stores/__tests__/useConfigStore.test.ts`
Expected: FAIL, `normalizeActiveMode` n'existe pas.

- [ ] **Step 3: Implémenter `normalizeActiveMode` et l'appliquer dans l'option `merge` de `persist`** (fusion par défaut, puis `activeMode` passé dans `normalizeActiveMode`).

- [ ] **Step 4: Relancer**, attendu PASS.

- [ ] **Step 5: Commit** `fix(config): une préférence de mode Apprentissage retombe sur le mode Temps`

### Tâche 2 : retirer le moteur de maîtrise (partie 1 du Conservatoire)

**Files:**
- Delete: `apps/web/lib/conservatoire/mastery.ts`, `apps/web/lib/conservatoire/storage.ts`, `packages/types/src/conservatoire.ts`, `apps/web/lib/__tests__/conservatoire-mastery.test.ts`, `conservatoire-storage.test.ts`, `conservatoire-storage-failure.test.ts`
- Modify: `packages/types/src/index.ts` (export retiré), `apps/web/components/typing/TypingArea.tsx` (prop `onAttempt`, son appel dans `commitChar`, son type), le test de `TypingArea` qui couvre `onAttempt`

- [ ] **Step 1: Supprimer les fichiers et le test `onAttempt`** ; `git grep -n -E "onAttempt|conservatoire/mastery|conservatoire/storage|from '@typewav/types'.*Mastery"` ne doit plus rien renvoyer hors archives `docs/`.
- [ ] **Step 2: Vérifier** : `pnpm typecheck && pnpm test`, attendu vert.
- [ ] **Step 3: Commit** `refactor(conservatoire): retire le moteur de maîtrise de main (vit sur feat/conservatoire-v2)`

### Tâche 3 : retirer le mode Apprentissage, l'ancien onboarding et le choix de disposition

**Files:**
- Delete: dans `apps/web/components/modes/` : `LearningMode.tsx`, `CurriculumLearningMode.tsx`, `LegacyLearningMode.tsx`, `LearningWelcome.tsx`, `LevelTeachStep.tsx`, `LevelClearedMoment.tsx`, `LevelRailSpotlight.tsx`, `KeyboardDiagram.tsx`, `KeyboardDiagramAzerty.tsx`, `finger-colors.ts` et leurs tests ; `apps/web/lib/learning-content.ts`, `learning-progress.ts`, `learning-texts.ts`, `apps/web/lib/onboarding.ts` et leurs tests (`learning-*.test.ts`, `onboarding.test.ts`) ; `packages/types/src/learning.ts` et son test ; `apps/web/app/[locale]/dev-onboarding/` ; `apps/web/e2e/learning-layout.spec.ts`.
- Move: `apps/web/components/modes/useHiddenCapture.ts` vers `apps/web/hooks/useHiddenCapture.ts` (l'Ouverture s'en sert ; mettre à jour son commentaire qui cite `LevelTeachStep`).
- Modify:
  - `HomeClient.tsx` : retirer `isLearningMode` et ses ajustements, le déclenchement de l'onboarding (`isOnboarding`, `onboardingResolved`, `setActiveMode('learning')`), le garde-fou mobile du mode `learning`, le rendu de `LearningMode`, les imports de `lib/onboarding`.
  - `TypingArea.tsx` : les branches `mode === 'learning'`, l'aria et le clic pour focaliser.
  - `ParametresClient.tsx` : `handleReviewFingerPositioning`, le groupe « langue et clavier » qui devient « langue », le choix de disposition.
  - `app/[locale]/about/page.tsx` : `'learning'` de la liste des modes.
  - `lib/words.ts` : `generateLearningText` et les imports qui ne servent qu'à lui.
  - `packages/types/src/index.ts`.
  - `sitemap.ts`, `robots.ts` : ce qui vise `dev-onboarding`.
  - `styles/globals.css` : les règles propres au mode Apprentissage.
  - `messages/fr.json` et `en.json` : toutes les clés devenues orphelines, dont `learning`, `hint` si orphelin, `typing.ariaTypingInstructionsLearning`, `typing.clickToFocusLearning`, `settings.keyboardLayout*`, `settings.layout*`, `settings.selectLayout`, `about.modes.learning*`, `config.modes.learning`.
- Delete si plus aucun utilisateur après ce qui précède (`git grep`) : `apps/web/hooks/useKeyboardLayoutPreference.ts` et son test, `apps/web/lib/keyboardLayouts.ts`.

- [ ] **Step 1: Écrire le test qui échoue** dans le test existant de `ParametresClient` (ou le créer) :

```ts
it("les Paramètres n'offrent plus de choix de disposition du clavier", () => {
  render(<ParametresClient />);
  expect(screen.queryByText(/AZERTY|QWERTY/)).toBeNull();
  expect(screen.getByText(fr.settings.languageTitle)).toBeInTheDocument();
});
```

- [ ] **Step 2: Lancer**, attendu FAIL (les boutons AZERTY et QWERTY existent).
- [ ] **Step 3: Faire les suppressions et modifications listées.** Pour chaque fichier supprimé, `git grep` d'abord pour retrouver ses utilisateurs.
- [ ] **Step 4: Vérifier.**
  - `pnpm typecheck && (cd apps/web && pnpm lint) && pnpm test` : attendu vert.
  - `git grep -n -E "LearningMode|learning-progress|learning-content|learning-texts|lib/onboarding|KeyboardDiagram|dev-onboarding"` ne renvoie que des archives `docs/`.
  - Chaque clé de `fr.json` a sa jumelle dans `en.json`.
- [ ] **Step 5: Commit** `refactor(apprentissage): retire le mode Apprentissage, l'ancien onboarding et le choix de disposition de main`

### Tâche 4 : l'entrée piano et la page « à venir »

**Files:**
- Modify: `apps/web/components/ui/GlobalNav.tsx` (+ son test) : entrée `{ key: 'conservatoire', label: t('conservatoire'), Icon: Piano, path: 'conservatoire' }` en première position, identique à `git show feat/conservatoire-v2:apps/web/components/ui/GlobalNav.tsx`.
- Create: `apps/web/app/[locale]/conservatoire/page.tsx` (serveur : `generateMetadata` depuis `comingSoon.metaTitle` / `metaDescription`, rend `ComingSoonClient`), `apps/web/components/conservatoire/ComingSoonClient.tsx`
- Modify: `messages/fr.json`, `messages/en.json` (`nav.conservatoire`, namespace `comingSoon`)
- Test: `apps/web/components/conservatoire/__tests__/ComingSoonClient.test.tsx`, test de `GlobalNav`

Textes exacts :

| Clé | fr | en |
|---|---|---|
| `nav.conservatoire` | Conservatoire | Conservatory |
| `comingSoon.metaTitle` | Le Conservatoire | The Conservatory |
| `comingSoon.metaDescription` | Bientôt dans TypeWav : apprendre à taper à dix doigts, en musique. | Coming to TypeWav: learn to touch type, in music. |
| `comingSoon.kicker` | Le Conservatoire · bientôt | The Conservatory · soon |
| `comingSoon.title` | Apprendre à taper à dix doigts, en musique. | Learn to touch type, in music. |
| `comingSoon.promise1` | Des leçons d'une minute, une touche après l'autre. | One-minute lessons, one key at a time. |
| `comingSoon.promise2` | Chaque bonne touche joue sa note au piano. Une faute ne joue jamais de fausse note. | Every right key plays its note on the piano. A mistake never plays a wrong note. |
| `comingSoon.promise3` | Tes touches faibles reviennent jusqu'à devenir sûres. | Your weak keys come back until they're sure. |
| `comingSoon.teaser` | Pose tes doigts, joue la gamme. | Rest your fingers, play the scale. |
| `comingSoon.cta` | En attendant, joue | Meanwhile, play |

- [ ] **Step 1: Écrire les tests qui échouent.**
  - `GlobalNav` : premier lien `href="/fr/conservatoire"`, `aria-label` « Conservatoire ».
  - `ComingSoonClient` :
    - une seule action principale, le lien « En attendant, joue » vers `/fr` ;
    - le titre est la phrase de tête ;
    - les trois promesses sont dans une liste ordonnée ;
    - Entrée suit le lien.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** selon la spec, partie A, « La page à venir ». Mise en page éditoriale alignée à gauche ; aucun bloc centré titre, sous-titre et bouton ; aucune carte ; numéros 01, 02, 03 en mono. L'avant-goût est rendu par `HomeRowTeaser` (tâche 5) ; laisser son emplacement pour l'instant.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(conservatoire): page « à venir » et entrée de navigation`

### Tâche 5 : l'avant-goût jouable, `HomeRowTeaser`

**Files:**
- Create: `apps/web/components/conservatoire/HomeRowTeaser.tsx`, `apps/web/components/conservatoire/home-row.ts`
- Test: `apps/web/components/conservatoire/__tests__/home-row.test.ts` (projet `web-components`), `__tests__/HomeRowTeaser.test.tsx`

**Interfaces:**
- Produces:
  - `HOME_ROW_CODES: readonly ['KeyA','KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL','Semicolon']` ;
  - `HOME_ROW_NOTES: Record<HomeRowCode, string>` ;
  - `homeRowLabel(code: HomeRowCode, layout: 'azerty' | 'qwerty'): string` ;
  - `<HomeRowTeaser />`, exposant `data-ripple-count` sur sa racine.

- [ ] **Step 1: Tests qui échouent**

```ts
expect(HOME_ROW_NOTES).toEqual({ KeyA: 'C4', KeyS: 'D4', KeyD: 'E4', KeyF: 'F4', KeyJ: 'G4', KeyK: 'A4', KeyL: 'B4', Semicolon: 'C5' });
expect(HOME_ROW_CODES.map((c) => homeRowLabel(c, 'azerty')).join(' ')).toBe('q s d f j k l m');
expect(HOME_ROW_CODES.map((c) => homeRowLabel(c, 'qwerty')).join(' ')).toBe('a s d f j k l ;');
```

Composant, avec `useAudioEngine` simulé :
- `keydown` `code: 'KeyF'` : `playNoteName('F4')` est appelé et `data-ripple-count` passe à 1.
- `keydown` `code: 'KeyZ'` : aucune note nouvelle, `data-ripple-count` inchangé, et l'écho est déclenché.
- Le libellé AZERTY se corrige en QWERTY après un `keydown` `{ code: 'KeyA', key: 'a' }`, et inversement après `{ code: 'KeyA', key: 'q' }`.
- Sous `prefers-reduced-motion: reduce` : aucun canvas ni élément d'onde ; la touche porte `data-pressed="true"`.

- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter.**
  - Lecture de `KeyboardEvent.code` sur `keydown` : exception documentée en commentaire, rien n'est composé.
  - Disposition initiale selon la langue (`fr` donne `azerty`).
  - Onde `--color-accent` partant de la touche, 600 ms ; on peut s'inspirer de `git show feat/conservatoire-v2:apps/web/components/conservatoire/LivingKeyboard.tsx`, en restant petit.
  - Touches cliquables au toucher.
  - L'écho d'une autre touche passe par la fonction d'écho du moteur. Elle s'appelle `triggerSilence` jusqu'à la PR 2 ; `playNoteName` ne renseigne `lastPlayedNote` qu'après la tâche 10. Jusque-là, ce test d'écho reste `it.todo`, réactivé en tâche 10.
- [ ] **Step 4: Relancer**, attendu PASS (hors `todo`).
- [ ] **Step 5: Commit** `feat(conservatoire): avant-goût jouable de la rangée de repos`

### Tâche 6 : e2e de la page « à venir » et ouverture de la PR 1

**Files:**
- Create: `apps/web/e2e/helpers.ts`, copie exacte de `git show feat/conservatoire-v2:apps/web/e2e/helpers.ts` (même chemin : la fusion future sera triviale)
- Create: `apps/web/e2e/coming-soon.spec.ts`

- [ ] **Step 1: Écrire l'e2e**, aux trois tailles 1280x650, 1024x600, 390x844 :
  - kicker, titre, liste, avant-goût et action sans chevauchement (`expectNoOverlap`) et entièrement visibles ;
  - un appui sur `KeyF` fait passer `data-ripple-count` à 1 ;
  - un appui sur `KeyZ` ne le change pas ;
  - Entrée mène à `/fr`.
- [ ] **Step 2: Gate complet** (voir Global Constraints), e2e compris, attendu vert. Puis inspection visuelle réelle (Global Constraints).
- [ ] **Step 3: Revue** : obsession-architect en mode revue (code, puis rendu), web-design-guidelines. Corriger ce qui est critique ou majeur.
- [ ] **Step 4: Push et PR** vers `main`, titre `refactor: sortir le Conservatoire de main et l'annoncer comme à venir`, corps avec `Closes #124`, sans attribution IA. `gh pr checks --watch` jusqu'au vert. **Ne pas merger** : prévenir Mouwafic.

---

# PR 2 : l'écho de la faute dans tous les textes (#129)

Branche `fix/echo-faute-textes`.

### Tâche 7 : renommer `triggerSilence` en `triggerErrorEcho`

**Files:**
- Modify: `apps/web/hooks/useAudioEngine.ts` (définition, retour du hook, commentaire d'en-tête ligne 8 et docstring 662-663), `apps/web/components/typing/TypingArea.tsx` (appels, commentaire ligne 176), `apps/web/hooks/__tests__/useAudioEngine.test.ts`, tout autre utilisateur trouvé par `git grep -n triggerSilence`
- Si la PR 1 est mergée : `HomeRowTeaser`.

- [ ] **Step 1: Renommer dans les tests d'abord** (`describe('useAudioEngine : triggerErrorEcho')`, mêmes assertions : écho doux de la dernière note, rien si aucune note n'a sonné). Lancer : FAIL (fonction absente).
- [ ] **Step 2: Renommer dans le code, réécrire les commentaires.** Ils disent maintenant : une faute ne joue jamais de note nouvelle, elle fait résonner la dernière note jouée, vélocité 0,18, tenue 1,6 s.
- [ ] **Step 3: Relancer**, attendu PASS ; `git grep -n triggerSilence` ne renvoie que des archives `docs/`.
- [ ] **Step 4: Commit** `refactor(audio): triggerSilence devient triggerErrorEcho, le nom dit ce qu'il fait`

### Tâche 8 : les textes disent vrai

**Files:**
- Modify: `apps/web/messages/fr.json`, `en.json`, `README.md`

Textes exacts :

| Clé | fr | en |
|---|---|---|
| `typing.ariaTypingInstructions` | Tape le texte affiché. Une frappe juste joue la note suivante ; une faute ne joue jamais de fausse note, la dernière note résonne tout bas. Retour arrière pour corriger. | Type the text shown. A correct keystroke plays the next note; a mistake never plays a wrong note, the last note rings softly. Press Backspace to correct. |
| `about.manifesto.wrongDesc` | jamais de fausse note : la musique s'arrête, la dernière note résonne tout bas. | never a wrong note: the music stops, the last note rings softly. |
| `about.metaDescription` | remplacer « une faute ne joue rien » par « une faute ne joue jamais de fausse note » | replace "a mistake plays nothing" with "a mistake never plays a wrong note" |

- `about.lead` : réécrire la phrase « une faute ne joue rien, jamais une fausse note » (et son équivalent anglais) en « une faute ne joue jamais de fausse note ».
- `README.md` lignes 23 et 43-44 : même correction, en anglais. Ligne 43-44 : « A **wrong** keystroke never plays a wrong note: the music does not advance and the last note rings softly. »

- [ ] **Step 1: Test qui échoue** (projet `web-lib`, `apps/web/lib/__tests__/error-echo-copy.test.ts`) :

```ts
for (const [lang, msgs] of [['fr', fr], ['en', en]] as const) {
  it(`${lang} : aucun texte ne décrit une faute comme silencieuse`, () => {
    const all = JSON.stringify(msgs);
    expect(all).not.toMatch(/reste silencieuse|ne joue rien|seulement du silence|stays silent|plays nothing|only silence/i);
  });
}
```

- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Réécrire les textes.**
- [ ] **Step 4: Relancer**, attendu PASS. `git grep -n -i -E "silence|silent|ne joue rien|plays nothing"` ne laisse que des archives `docs/superpowers/`, le mot « silence » de `lib/words.ts` et `fr.json` (« Nuances et silences »), et des commentaires du moteur qui parlent du son absent quand l'audio n'est pas prêt.
- [ ] **Step 5: Commit** `fix(textes): une faute fait résonner la dernière note, les textes le disent`
- [ ] **Step 6: Gate, push, PR** `Closes #129`, `gh pr checks --watch`, ne pas merger.

---

# PR 3 : l'Ouverture (#125)

Branche `feat/ouverture`. Fichiers neufs sous `apps/web/components/intro/` (projet Vitest `web-components`) et `apps/web/lib/intro.ts` (projet `web-lib`).

### Tâche 9 : le drapeau et la sortie de l'Ouverture

**Files:**
- Create: `apps/web/lib/intro.ts`, `apps/web/lib/__tests__/intro.test.ts`, `apps/web/components/intro/apply-exit.ts`, `apps/web/components/intro/__tests__/apply-exit.test.ts`

**Interfaces:**
- Produces:
  - `INTRO_FLAG_KEY = 'has_seen_intro_v1'` ;
  - `hasSeenIntro(): Promise<boolean>` (renvoie `true` si la lecture échoue : pas d'Ouverture) ;
  - `markIntroSeen(): Promise<void>` (n'échoue jamais) ;
  - `type IntroLanguage = 'fr' | 'en'` ;
  - `interface IntroExit { chosenLanguage: IntroLanguage | null; introLanguage: IntroLanguage; firstRun: boolean }` ;
  - `exitSettings(exit: IntroExit): { textLanguage: IntroLanguage | null; setTimedMode30: boolean; localeTarget: IntroLanguage | null }`.

- [ ] **Step 1: Tests qui échouent**

```ts
// lib/intro.test.ts (fake-indexeddb)
it('hasSeenIntro vaut false tant que le drapeau manque, true après markIntroSeen', ...);
it("hasSeenIntro vaut true si la lecture échoue (on ne piège jamais)", ...); // getPreference simulé qui rejette
it('markIntroSeen ne rejette pas si l’écriture échoue', ...);

// apply-exit.test.ts
expect(exitSettings({ chosenLanguage: null, introLanguage: 'fr', firstRun: true }))
  .toEqual({ textLanguage: 'fr', setTimedMode30: true, localeTarget: 'fr' });
expect(exitSettings({ chosenLanguage: 'en', introLanguage: 'en', firstRun: true }))
  .toEqual({ textLanguage: 'en', setTimedMode30: true, localeTarget: 'en' });
expect(exitSettings({ chosenLanguage: null, introLanguage: 'fr', firstRun: false }))
  .toEqual({ textLanguage: null, setTimedMode30: false, localeTarget: null });
expect(exitSettings({ chosenLanguage: 'en', introLanguage: 'en', firstRun: false }))
  .toEqual({ textLanguage: 'en', setTimedMode30: false, localeTarget: 'en' });
```

`localeTarget` est la langue que l'interface doit prendre ; `HomeClient` ne fait `router.replace` que si elle diffère de la langue de l'URL.

- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** avec `getPreference` et `setPreference`.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): drapeau de l'Ouverture et réglages appliqués à la sortie`

### Tâche 10 : le moteur audio au service de l'Ouverture

**Files:**
- Modify: `apps/web/hooks/useAudioEngine.ts` (`playNoteName` renseigne `engine.lastPlayedNote`)
- Test: `apps/web/hooks/__tests__/useAudioEngine.test.ts` ; réactiver le `it.todo` d'écho de `HomeRowTeaser` (tâche 5)
- Create: `apps/web/components/intro/intro-music.ts`, `apps/web/components/intro/__tests__/intro-music.test.ts`

**Interfaces:**
- Produces:
  - `INTRO_MELODY: readonly (readonly string[])[]` ;
  - `STAFF_PHRASE: readonly string[]` ;
  - `FINAL_CHORD: readonly string[]` ;
  - `SAMPLER_WAIT_MS = 8000` ;
  - `playChord(notes: readonly string[], play: (n: string) => Promise<void>, isReady: () => boolean): Promise<boolean>` (ne joue rien et renvoie `false` si `isReady()` est faux).

- [ ] **Step 1: Tests qui échouent**

```ts
expect(INTRO_MELODY).toEqual([['E5'], ['D#5'], ['E5'], ['D#5'], ['E5'], ['B4'], ['D5'], ['C5'], ['A4', 'A2']]);
expect(STAFF_PHRASE).toEqual(['C4', 'E4', 'G4', 'A4', 'G4', 'C5']);
expect(FINAL_CHORD).toEqual(['C4', 'E4', 'G4', 'C5']);
it('playChord ne joue rien quand le piano n’est pas prêt (jamais de synthé)', async () => {
  const play = vi.fn(); expect(await playChord(['C4'], play, () => false)).toBe(false); expect(play).not.toHaveBeenCalled();
});
// useAudioEngine.test.ts
it("après playNoteName('E5'), triggerErrorEcho rejoue E5 tout bas", ...); // vélocité 0.18, tenue 1.6
```

- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer**, attendu PASS. `pnpm vitest run --project web-components apps/web/hooks` reste entièrement vert : aucun comportement de `playNote` ne change.
- [ ] **Step 5: Commit** `feat(intro): mélodie de l'Ouverture, écho après playNoteName, piano seulement`

### Tâche 11 : la logique de l'écran 2

**Files:**
- Create: `apps/web/components/intro/play-reducer.ts`, `__tests__/play-reducer.test.ts`

**Interfaces:**
- Produces:
  - `type PlayPhase = 'typing' | 'askMiss' | 'waiting' | 'resumed'` ;
  - `interface PlayState { phase: PlayPhase; typed: number }` ;
  - `type PlayInput = { kind: 'char'; char: string } | { kind: 'backspace' }` ;
  - `type PlayEffect = { kind: 'note'; index: number } | { kind: 'echo' } | { kind: 'resume' } | null` ;
  - `playStep(state: PlayState, input: PlayInput, text: string): { state: PlayState; effect: PlayEffect }` ;
  - `INITIAL_PLAY: PlayState = { phase: 'typing', typed: 0 }`.

Table de vérité (texte `les notes`) :

| État | Entrée | État suivant | Effet |
|---|---|---|---|
| typing, typed < 9 | char égal à `text[typed]` | typed + 1 (askMiss si typed + 1 === 9) | note, index = typed |
| typing | autre char | inchangé | echo si typed > 0, sinon null |
| typing | backspace | inchangé | null |
| askMiss | n'importe quel char | waiting | echo |
| askMiss | backspace | inchangé | null |
| waiting | backspace | resumed | resume |
| waiting | char | inchangé | echo |
| resumed | tout | inchangé | null |

- [ ] **Step 1: Un test par ligne de la table**, plus :
  - les 9 caractères de « the notes » mènent à `askMiss` ;
  - une majuscule « L » n'est pas égale à « l » ;
  - `typed` ne dépasse jamais `text.length`.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** (fonction pure, aucune dépendance).
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): logique de l'écran « joue »`

### Tâche 12 : les textes et la portée

**Files:**
- Modify: `apps/web/messages/fr.json`, `en.json` (namespace `intro`, `about.links.replayIntro`)
- Create: `apps/web/components/intro/Staff.tsx`, `__tests__/Staff.test.tsx`

**Interfaces:**
- Produces : `<Staff step={1..6} heads={StaffHead[]} />`, avec `type StaffHead = { id: string; note: string; faded?: boolean }`. La racine expose `data-staff-step` et `data-note-heads` (nombre de têtes affichées). Les notes de progression exposent `data-progress-state="done" | "current" | "todo"`.

Textes exacts du namespace `intro` :

| Clé | fr | en |
|---|---|---|
| `skip` | Passer · Échap | Skip · Esc |
| `skipTouch` | Passer | Skip |
| `continue` | Espace pour continuer | Space to continue |
| `continueTouch` | Touche pour continuer | Tap to continue |
| `announce` | Écran {n} sur 6 : {title} | Screen {n} of 6: {title} |
| `language.prompt` | Choisis ta langue · Choose your language | Choisis ta langue · Choose your language |
| `language.sound` | Monte le son · Turn up the sound | Monte le son · Turn up the sound |
| `language.tuning` | Le piano s'accorde… · Tuning the piano… | Le piano s'accorde… · Tuning the piano… |
| `language.soundFailed` | Le son n'a pas pu démarrer. S pour réessayer. | Sound couldn't start. Press S to try again. |
| `play.instruction` | Tape la bonne lettre, la musique suit. | Type the right letter, the music follows. |
| `play.text` | les notes | the notes |
| `play.askMiss` | Maintenant, rate une touche. | Now, miss a key. |
| `play.waiting` | La musique attend. | The music waits. |
| `play.missLine` | Une faute ne joue jamais de fausse note : seule la dernière note résonne, tout bas. Retour arrière pour reprendre. | A mistake never plays a wrong note: only the last note rings, softly. Backspace to resume. |
| `play.touchInstruction` | TypeWav se joue au clavier d'un ordinateur. Touche l'écran pour l'entendre. | TypeWav is played on a computer keyboard. Tap the screen to hear it. |
| `play.touchMissLine` | Une faute ne joue jamais de fausse note : seule la dernière note résonne, tout bas. | A mistake never plays a wrong note: only the last note rings, softly. |
| `why.title` | Ton oreille entend la faute avant tes yeux. | Your ear hears the mistake before your eyes do. |
| `why.line` | Pour qui veut taper plus vite et plus juste, sans fixer un chronomètre : du curieux au dactylo confirmé. | For anyone who wants to type faster and cleaner without staring at a timer: from the curious to the seasoned typist. |
| `features.modes.title` / `.line` | Les modes / Temps, Mots, Citation, Zen, Code, ou tes propres textes. | The modes / Time, Words, Quote, Zen, Code, or your own texts. |
| `features.pieces.title` / `.line` | Les morceaux / Choisis la musique que ta frappe dévoile. | The pieces / Pick the music your typing reveals. |
| `features.replay.title` / `.line` | Les résultats et le replay / Ta séance rejouée note par note. | Results and replay / Your session replayed note by note. |
| `features.progress.title` / `.line` | Ta progression / Records, rang, classement : tout se garde. | Your progress / Records, rank, leaderboard: it's all kept. |
| `features.challenge.title` / `.line` | Le défi / Un lien, le même texte, ton score à battre. Et le Fantôme rejoue ton record. | The challenge / One link, the same text, your score to beat. And the Ghost replays your record. |
| `features.rest` | Le reste se découvre en jouant. | The rest you'll find by playing. |
| `data.title` | Tout reste dans ce navigateur. | Everything stays in this browser. |
| `data.line` | Pas de compte, rien n'est envoyé, aucun pistage. I pour en savoir plus. | No account, nothing is sent, no tracking. Press I to learn more. |
| `data.more` | En savoir plus | Learn more |
| `data.private.term` / `.def` | Navigation privée / rien n'est gardé. | Private browsing / nothing is kept. |
| `data.clear.term` / `.def` | Effacer les données du site / tout disparaît. | Clearing site data / everything is gone. |
| `data.other.term` / `.def` | Autre navigateur, autre appareil / on repart de zéro. | Another browser, another device / you start from scratch. |
| `data.backup.term` / `.def` | Ta sauvegarde / « Télécharger mes données », dans les Paramètres, puis « Importer un fichier » pour tout retrouver. | Your backup / “Download my data” in Settings, then “Import a file” to get everything back. |
| `start.title` | Ton premier morceau t'attend. | Your first piece awaits. |
| `start.future` | Bientôt : le Conservatoire, pour apprendre à taper à dix doigts. | Soon: the Conservatory, to learn touch typing with all ten fingers. |
| `start.go` | Espace pour commencer | Space to begin |
| `start.share` | Envoie-toi le lien | Send yourself the link |
| `start.copied` | Lien copié. | Link copied. |
| `start.explore` | Explorer quand même | Explore anyway |
| `about.links.replayIntro` (hors namespace) | Revoir l'introduction | Replay the intro |

- [ ] **Step 1: Tests qui échouent.**
  - Clés : le namespace `intro` a exactement les mêmes clés en `fr` et en `en`.
  - `Staff` à `step=3` : 2 notes `done`, 1 `current`, 3 `todo`.
  - `heads` de longueur 9 donne `data-note-heads="9"`.
  - Sous mouvement réduit, aucune animation de translation (`style.transform` absent après rendu).
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** les messages et `Staff`, selon la spec, partie B, « La portée, fil conducteur » : cinq lignes de 1 px, dessin initial 900 ms, glissement de mesure 520 ms, têtes de note qui dérivent et s'effacent.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): textes de l'Ouverture et portée`

### Tâche 13 : le rideau, la navigation et les écrans 1, 3, 4, 5, 6

**Files:**
- Create: `apps/web/components/intro/Ouverture.tsx`, `apps/web/components/intro/screens/LanguageScreen.tsx`, `WhyScreen.tsx`, `FeaturesScreen.tsx`, `DataScreen.tsx`, `StartScreen.tsx`, `__tests__/Ouverture.test.tsx`

**Interfaces:**
- Consumes: `exitSettings`, `IntroExit` (tâche 9), `Staff` (tâche 12), `playChord`, `STAFF_PHRASE`, `FINAL_CHORD`, `SAMPLER_WAIT_MS` (tâche 10).
- Produces: `<Ouverture urlLocale={'fr' | 'en'} firstRun={boolean} onClose={(exit: IntroExit) => void} />`.
- Messages : importer `messages/fr.json` et `messages/en.json`, n'en garder que le namespace `intro`, les fournir à un `NextIntlClientProvider` imbriqué réglé sur la langue courante de l'Ouverture.

- [ ] **Step 1: Tests qui échouent** (moteur audio simulé, `isSamplerLoaded` piloté par le test).
  - Écran 1 : la langue de `urlLocale` est présélectionnée. `E` bascule les textes en anglais sans appeler de navigation. Tant que `isSamplerLoaded` est faux, on reste sur l'écran 1 avec `language.tuning`. Dès qu'il passe à vrai, l'écran 2 s'affiche. Après `SAMPLER_WAIT_MS` sans piano (faux minuteurs), `language.soundFailed` s'affiche et Espace avance quand même.
  - Échap à l'écran 1 avant tout choix : `onClose({ chosenLanguage: null, introLanguage: urlLocale, firstRun })`.
  - Échap à l'écran 4 après le choix de `en` : `onClose({ chosenLanguage: 'en', introLanguage: 'en', firstRun })`.
  - Flèche gauche revient d'un écran, Retour arrière ne recule jamais d'écran.
  - Écran 4 : les touches 1 à 5 activent l'envie correspondante ; sans geste, elles défilent (2 800 ms chacune, faux minuteurs) ; après la cinquième, `features.rest` s'affiche.
  - Écran 5 : `I` ouvre les quatre lignes terme et définition.
  - Écran 6 : Espace appelle `onClose` avec la langue choisie.
  - Chaque changement d'écran met à jour la région `aria-live="polite"` avec `announce`.
  - En mode tactile (`isNonDesktopDevice` simulé à vrai, aucune frappe), on voit `skipTouch` et `continueTouch` ; l'écran 6 montre `start.share` et `start.explore`.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** selon la spec, partie B, en entier : chrome commun, écrans 1, 3, 4, 5, 6, détection du clavier physique (première frappe de lettre), mise en page asymétrique, tailles de 1280x650 à 390x844. Écran 6 en mode tactile : `navigator.share({ url })` si présent, sinon `navigator.clipboard.writeText(url)` puis `start.copied`. L'écran 2 est un emplacement vide jusqu'à la tâche 14.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): rideau de l'Ouverture, navigation et écrans`

### Tâche 14 : l'écran 2, joue

**Files:**
- Create: `apps/web/components/intro/screens/PlayScreen.tsx`, `__tests__/PlayScreen.test.tsx`

**Interfaces:**
- Consumes: `playStep`, `INITIAL_PLAY` (tâche 11), `INTRO_MELODY`, `playChord` (tâche 10), `useHiddenCapture` (déplacé en tâche 3), `Staff` (tâche 12).
- Produces: `<PlayScreen onDone={() => void} touch={boolean} />`, plus `data-play-phase` sur sa racine.

- [ ] **Step 1: Tests qui échouent** (moteur simulé, piano prêt).
  - Taper `les notes` appelle `playNoteName` neuf fois. Les notes suivent `INTRO_MELODY`, et le neuvième geste joue `A4` et `A2`. `data-play-phase` passe à `askMiss`.
  - Une lettre fausse en cours de saisie : aucun `playNoteName`, `triggerErrorEcho` est appelé une fois, le caret ne bouge pas.
  - En `askMiss`, une touche fausse : `triggerErrorEcho`, phase `waiting`, texte `play.waiting`.
  - Retour arrière : `triggerResume`, puis `playNoteName('A4')` et `playNoteName('A2')`, phase `resumed`, `continue` visible.
  - Deux caractères dans la même tâche (frappe très rapide) donnent deux notes au plus, jamais plus de neuf au total.
  - Mode tactile : chaque toucher joue la note suivante. Après neuf touchers, `play.touchMissLine` s'affiche, puis `continueTouch`.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter.** Capture par `useHiddenCapture`, jamais de listener de texte sur `keydown`. Retour arrière lu sur `keydown` (`key === 'Backspace'`), comme `TypingArea`. Têtes de note posées sur la portée à la hauteur de la note, qui dérivent puis s'effacent. Rendu selon la spec, partie B, « Écran 2 ».
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): écran « joue », la Lettre à Élise sous les doigts`

### Tâche 15 : branchement dans l'accueil et dans À propos

**Files:**
- Modify: `apps/web/components/typing/HomeClient.tsx`, `apps/web/app/[locale]/about/page.tsx`
- Test: test de `HomeClient` (ou un test d'intégration dédié `apps/web/components/typing/__tests__/HomeClient.intro.test.tsx`)

- [ ] **Step 1: Tests qui échouent.**
  - Drapeau absent : l'Ouverture s'affiche avec `firstRun = true`.
  - Drapeau présent : pas d'Ouverture.
  - `?intro=1` avec le drapeau présent : l'Ouverture s'affiche avec `firstRun = false`.
  - `onClose({ chosenLanguage: 'en', introLanguage: 'en', firstRun: true })` sur `/fr` :
    - `markIntroSeen` est appelé ;
    - `setTextLanguage('en')` ;
    - mode `classic` avec `durationSeconds` à 30 ;
    - `router.replace('/en')`.
  - `onClose` sans changement de langue : aucun `router.replace`, et la zone de frappe reçoit le focus.
  - Rejouée (`firstRun = false`, aucune langue choisie) : ni le mode ni la durée ne changent.
  - À propos contient le lien `about.links.replayIntro` vers `/fr?intro=1`.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter.**
  - `HomeClient` lit `hasSeenIntro()` au montage, et `?intro=1` dans un effet via `new URLSearchParams(window.location.search)`. Pas `useSearchParams` : en Next 16, il exige une frontière `Suspense` et rendrait l'accueil dynamique.
  - Il monte `Ouverture` par-dessus tout.
  - À la fermeture, il applique `exitSettings`, retire `?intro=1` de l'URL et lève le rideau : fondu et légère montée, 600 ms, courbe forte.
  - Rien ne s'affiche avant que le drapeau soit lu, pour éviter un éclair de l'accueil.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(intro): l'Ouverture à la première visite et depuis À propos`

### Tâche 16 : e2e et PR 3

**Files:**
- Modify: `apps/web/e2e/helpers.ts` (ajouter `skipIntro(page)` : `seedPreferences(page, { has_seen_intro_v1: true })` puis rechargement), `apps/web/e2e/coming-soon.spec.ts` (appeler `skipIntro`)
- Create: `apps/web/e2e/ouverture.spec.ts`

- [ ] **Step 1: Écrire l'e2e.**
  - **Au clavier**, à 1280x650 et 1024x600, sur `/fr` neuf :
    - à chaque écran, aucun chevauchement entre les éléments `[data-part]` et tous sont visibles ;
    - écran 2 : `les notes` fait passer `data-note-heads` à 9 et `data-play-phase` à `askMiss` ; `z` donne `waiting` ; Retour arrière donne `resumed` ;
    - à la fin, l'URL reste `/fr`, la zone de frappe a le focus, et un rechargement ne remontre pas l'Ouverture.
  - **Langue** : `E` à l'écran 1, puis Échap. L'URL devient `/en`, et la configuration persistée a `textLanguage: 'en'`.
  - **Tactile** à 390x844 (`hasTouch: true`, `isMobile: true`) : l'écran 2 avance au toucher, l'écran 6 montre « Envoie-toi le lien » et « Explorer quand même ».
  - **Mouvement réduit** : le parcours se termine, aucun élément animé en translation.
  - Le moteur audio réel tourne en e2e : attendre l'état du piano sur condition (`language.tuning` disparaît), jamais sur un délai fixe.
- [ ] **Step 2: Gate complet**, e2e compris, attendu vert. Inspection visuelle réelle au son, aux trois tailles, sur trois thèmes, sous mouvement réduit. Chaque écran passe le test des trois secondes. Revue obsession-architect (code puis rendu) et web-design-guidelines. Corriger ce qui est critique ou majeur.
- [ ] **Step 3: Push, PR** `Closes #125`, `gh pr checks --watch`, ne pas merger.

---

# PR 4 : les étoiles GitHub (#126)

Branche `feat/etoiles-github`.

### Tâche 17 : lire les étoiles côté serveur

**Files:**
- Create: `apps/web/lib/github-stars.ts`, `apps/web/lib/__tests__/github-stars.test.ts`

**Interfaces:**
- Produces: `fetchGithubStars(): Promise<number | null>`.

- [ ] **Step 1: Tests qui échouent** (`fetch` simulé avec `vi.stubGlobal`).
  - Réponse `{ stargazers_count: 10 }` : renvoie `10`. L'appel cible `https://api.github.com/repos/mouwaficbdr/typewav` avec `next: { revalidate: 600 }`.
  - `GITHUB_TOKEN` défini : l'en-tête `Authorization: Bearer <jeton>` est présent ; absent sinon.
  - Statut 403 ou 500 : `null`.
  - `stargazers_count` manquant, négatif, non entier ou de type chaîne : `null`.
  - `fetch` qui rejette ou délai dépassé (`AbortSignal.timeout(3000)`) : `null`, sans exception.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter** (en-têtes `Accept: application/vnd.github+json` et `X-GitHub-Api-Version: 2022-11-28`). Vérifier dans la doc Next.js à jour (Context7, `/vercel/next.js`) que `next: { revalidate }` vaut toujours sans Cache Components. C'était le cas le 18 octobre 2026 : `next.config.ts` n'active pas `cacheComponents`.
- [ ] **Step 4: Relancer**, attendu PASS.
- [ ] **Step 5: Commit** `feat(accueil): lecture du nombre d'étoiles GitHub côté serveur`

### Tâche 18 : l'afficher dans le pied de page et ouvrir la PR 4

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx` (composant asynchrone : `const githubStars = await fetchGithubStars()`, passé à `HomeClient`), `apps/web/components/typing/HomeClient.tsx` (prop `githubStars: number | null`, lien « </> github » du pied de page), messages `footer.githubStars`, README ou `.env.example` s'il existe (`GITHUB_TOKEN` optionnelle, jeton sans permission)
- Test: test de `HomeClient` sur le pied de page

| Clé | fr | en |
|---|---|---|
| `footer.githubStars` | {count, plural, one {# étoile sur GitHub} other {# étoiles sur GitHub}} | {count, plural, one {# star on GitHub} other {# stars on GitHub}} |

- [ ] **Step 1: Tests qui échouent.**
  - `githubStars={10}` : dans le lien GitHub, l'icône `Star` et « 10 » en mono, avec `aria-label` « 10 étoiles sur GitHub ».
  - `githubStars={1250}` : affichage compact (`Intl.NumberFormat('fr', { notation: 'compact' })`).
  - `githubStars={null}` : aucun chiffre ni icône, et le lien garde exactement son contenu actuel.
- [ ] **Step 2: Lancer**, attendu FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer**, attendu PASS. Gate complet. Inspection visuelle : le pied de page ne bouge pas d'un pixel quand le chiffre manque.
- [ ] **Step 5: Commit** `feat(accueil): nombre d'étoiles GitHub dans le pied de page`
- [ ] **Step 6: Push, PR** `Closes #126`, `gh pr checks --watch`, ne pas merger.

---

# PR 5 : CONTRIBUTING en anglais (#127)

Branche `docs/contributing-anglais`.

### Tâche 19 : réécrire CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Vérifier les faits avant d'écrire.**
  - `ls tools/cli` et `pnpm --filter create-typewav ...` : le CLI marche-t-il encore ? Ne le décrire que s'il marche.
  - Commandes réelles du `package.json` racine et de `apps/web`.
  - Workflow CI dans `.github/workflows/`.
- [ ] **Step 2: Réécrire en anglais**, selon la spec, partie D :
  - clone réel `https://github.com/mouwaficbdr/typewav.git` ;
  - prérequis (Node ≥ 20.19.0, pnpm 9+) ;
  - commandes, e2e compris (`pnpm build` puis `pnpm --filter @typewav/web test:e2e`) ;
  - structure du monorepo ;
  - conventions : Conventional Commits, squash merge, TypeScript strict, IndexedDB seulement, TDD ;
  - la CI.

  Critères de contenu :
  - textes du domaine public avec source vérifiable ;
  - morceaux MIDI : le piano est le seul instrument, et une faute fait résonner la dernière note sans jamais jouer de fausse note ;
  - thèmes avec contraste AA.

  Retirer les packs sonores et les guides inexistants. Aucun tiret cadratin.
- [ ] **Step 3: Vérifier** : `git grep -nP '\xE2\x80[\x93\x94]' CONTRIBUTING.md` ne renvoie rien ; chaque commande citée a été lancée une fois.
- [ ] **Step 4: Commit** `docs: CONTRIBUTING réécrit en anglais et aligné sur le dépôt`
- [ ] **Step 5: Push, PR** `Closes #127`, ne pas merger.
