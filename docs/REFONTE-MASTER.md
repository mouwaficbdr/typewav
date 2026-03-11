# REFONTE-MASTER — TypeWav Plan d'Implémentation 2026

> **Créé le : 11 Mars 2026**
> **Source : FORGE_NOTES.md [0]–[8] + audit spec-11**
> **Ce fichier est le backlog vivant de la refonte.**
> **Mettre à jour les statuts après chaque commit.**

---

## Comment utiliser ce fichier

**Avant chaque spec :**

1. Vérifier toutes les dépendances ✅
2. Lire la spec en entier (pas de résumé — lire le fichier concerné dans le dossier docs/specs)
3. Lire les fichiers concernés dans le code (ne jamais supposer)
4. Écrire les tests RED

**Pendant l'implémentation :**

1. Implémenter (GREEN)
2. Refactorer si nécessaire
3. Mettre à jour le statut ici : ⬜ → 🔄 → ✅

**Après chaque spec :**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Cette commande DOIT passer à 0 erreur avant le commit. Bloquant sans exception.

**Non-négociables sur chaque fichier modifié :**

- [ ] Aucun `rgba(0,212,170,...)` — utiliser `color-mix(in srgb, var(--color-accent) X%, transparent)`
- [ ] Aucun `outline: none` sans remplacement par `box-shadow: 0 0 0 2px var(--color-accent)`
- [ ] Imports motion depuis `motion/react` (PAS `framer-motion`)
- [ ] Border-radius via tokens `--radius-sm / --radius-md / --radius-lg` (PAS valeurs hardcodées)
- [ ] Fonts : `--font-display` (Cormorant), `--font-ui` (Sora), `--font-mono` (JetBrains)
- [ ] i18n : aucune string UI hardcodée en dehors des namespaces messages/
- [ ] `useReducedMotion()` : transitions désactivées si activé

---

## Statut global

```
Wave 0  [Quick fixes]      ✅✅✅✅⬜⬜⬜  4/7
Wave 1  [Foundation]       ⬜⬜⬜              0/3
Wave 2  [Navigation]       ⬜                  0/1
Wave 3  [Core UI]          ⬜⬜                0/2
Wave 4  [Other pages]      ⬜                  0/1
Wave 5  [Audio/Music]      ⬜⬜                0/2
Wave 6  [Collections]      ⬜⬜                0/2
Wave 7  [Polish/Vision]    ⬜⬜⬜⬜            0/4
────────────────────────────────────────
Total                                          0/22
```

---

## Wave 0 — Quick Fixes (Aucune dépendance — commencer ici)

> Ces specs sont toutes indépendantes entre elles. Ordre recommandé : 0.1 → 0.7.
> Mais elles peuvent être faites dans n'importe quel ordre.

### 0.1 — spec-22 : AuthForm Accessibilité

| Champ            | Valeur                                                     |
| ---------------- | ---------------------------------------------------------- |
| **Spec**         | `docs/specs/22-authform-a11y.md`                           |
| **Statut**       | ✅ Implémenté (déjà dans le code + tests 10/10)            |
| **Sévérité**     | 🔴 CRITIQUE                                                |
| **Effort**       | 2 fichiers, ~30 lignes                                     |
| **Fichiers**     | `AuthForm.tsx`, `globals.css`                              |
| **Dépendances**  | Aucune                                                     |
| **Commit cible** | `fix(a11y): add labels and restore focus ring in AuthForm` |

**Résumé** : Ajouter `<label>` sur les inputs, supprimer `outline: none`, corriger contraste
border (1.3:1 → ≥3:1). RGAA obligatoire.

---

### 0.2 — spec-12 : Fix wpmNet

| Champ            | Valeur                                               |
| ---------------- | ---------------------------------------------------- |
| **Spec**         | `docs/specs/12-fix-wpmnet.md`                        |
| **Statut**       | ✅ Implémenté (wpmNet dans URL params + tests 3/3)   |
| **Sévérité**     | 🔴 CRITIQUE                                          |
| **Effort**       | 2 fichiers, ~10 lignes                               |
| **Fichiers**     | `ResultsPageClient.tsx`, params URL                  |
| **Dépendances**  | Aucune                                               |
| **Commit cible** | `fix(diagnostic): pass wpmNet to results URL params` |

---

### 0.3 — spec-13 : Fix Backspace

| Champ            | Valeur                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/13-fix-backspace.md`                                                |
| **Statut**       | ✅ Implémenté (moveBack store + handleBackspace hook + tests 10/10)             |
| **Sévérité**     | 🔴 CRITIQUE                                                                     |
| **Effort**       | 3 fichiers                                                                      |
| **Fichiers**     | `useSessionStore.ts`, `useSession.ts`, `TypingArea.tsx`                         |
| **Dépendances**  | Aucune                                                                          |
| **Commit cible** | `fix(typing): implement backspace correction in TypingArea and useSessionStore` |

---

### 0.4 — spec-14 : Fix Auth locale + Reset password

| Champ            | Valeur                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/14-fix-auth-locale.md`                                                             |
| **Statut**       | ✅ Implémenté (redirect locale + reset-password page + tests 5/5)              |
| **Sévérité**     | 🔴 CRITIQUE                                                                                    |
| **Effort**       | 2–3 fichiers                                                                                   |
| **Fichiers**     | `AuthForm.tsx`, nouvelle page `reset-password/`                                                |
| **Dépendances**  | Aucune                                                                                         |
| **Commit cible** | `fix(auth): use current locale in post-login redirect` + `feat(auth): add password reset page` |

---

### 0.5 — spec-16 : Gate Cloud Sync

| Champ            | Valeur                                                                |
| ---------------- | --------------------------------------------------------------------- |
| **Spec**         | `docs/specs/16-cloud-sync-gate.md`                                    |
| **Statut**       | ⬜ À faire                                                            |
| **Sévérité**     | 🔴 CRITIQUE                                                           |
| **Effort**       | 1–2 fichiers                                                          |
| **Fichiers**     | `PremiumPageClient` (ou similaire)                                    |
| **Dépendances**  | Aucune                                                                |
| **Commit cible** | `fix(sync): display coming-soon state for cloud sync on premium page` |

---

### 0.6 — spec-35 : Fix ChallengeClient autoNavigate (F-2)

| Champ            | Valeur                                                                      |
| ---------------- | --------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/35-challenge-autonavigate-fix.md`                               |
| **Statut**       | ⬜ À faire                                                                  |
| **Sévérité**     | 🔴 CRITIQUE                                                                 |
| **Effort**       | 1 ligne                                                                     |
| **Fichiers**     | `apps/web/app/[locale]/challenge/ChallengeClient.tsx:126`                   |
| **Dépendances**  | Aucune                                                                      |
| **Commit cible** | `fix(challenge): add autoNavigate={false} to TypingArea in ChallengeClient` |

---

### 0.7 — spec-28 : Soundpack Cleanup + Fix InstrumentType (F-1)

| Champ            | Valeur                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/28-soundpack-cleanup.md`                                                                      |
| **Statut**       | ⬜ À faire                                                                                                |
| **Sévérité**     | 🔴 F-1 TypeScript + 🟠 cleanup                                                                            |
| **Effort**       | 7+ fichiers, git rm 3 fichiers                                                                            |
| **Fichiers**     | `packages/types/src/soundpack.ts`, `packages/soundpacks/src/index.ts`, configs packs, `useAudioEngine.ts` |
| **Dépendances**  | Aucune (mais Wave 1 bénéficie des types propres)                                                          |
| **Commit cible** | `fix(soundpacks): remove deprecated packs, fix InstrumentType, clean dead code`                           |

---

## Wave 1 — Foundation (Avant toute refonte UI)

> Faire Wave 0 entièrement avant de commencer Wave 1.

### 1.1 — spec-23 : i18n Complete Sweep

| Champ            | Valeur                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/23-i18n-complete-sweep.md`                                    |
| **Statut**       | ⬜ À faire                                                                |
| **Sévérité**     | 🟠 HAUTE                                                                  |
| **Effort**       | ~20 strings à connecter dans 4 composants                                 |
| **Fichiers**     | `MilestoneToast`, `LeaderboardTable`, `ProfilClient`, `PremiumPageClient` |
| **Dépendances**  | Wave 0 complète                                                           |
| **Commit cible** | `fix(i18n): connect all hardcoded FR strings to i18n keys`                |

---

### 1.2 — spec-24 : Design Token Enforcement

| Champ            | Valeur                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/24-design-token-enforcement.md`                                            |
| **Statut**       | ⬜ À faire                                                                             |
| **Sévérité**     | 🟠 HAUTE                                                                               |
| **Effort**       | ~7 fichiers, remplacement mécanique                                                    |
| **Fichiers**     | Tous fichiers avec `rgba(0,212,170,...)`, `borderRadius` hardcodé, logo GlobalNav      |
| **Dépendances**  | Wave 0 (après soundpack cleanup pour cohérence)                                        |
| **Commit cible** | `fix(design): enforce radius tokens, replace rgba accent with color-mix, fix nav font` |

---

### 1.3 — spec-19 : i18n-A11y Sweep

| Champ            | Valeur                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/19-i18n-a11y.md`                                                                       |
| **Statut**       | ⬜ À faire                                                                                         |
| **Sévérité**     | 🟡 MOYEN                                                                                           |
| **Effort**       | Petits fichiers, modifications légères                                                             |
| **Fichiers**     | `TypingArea.tsx` (hint text), `globals.css` (focus ring), `transparence/page.tsx` (date dynamique) |
| **Dépendances**  | 1.1 (i18n sweep) recommandé avant                                                                  |
| **Commit cible** | `fix(a11y): i18n hint text, focus ring, dynamic date in transparence`                              |

---

## Wave 2 — Navigation (Avant les refontes de pages)

> Wave 1 doit être complète.

### 2.1 — spec-15 v2 : GlobalNav Floating + Logo SVG

| Champ            | Valeur                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/15-global-navigation.md` (v2 — mis à jour 11 mars)                           |
| **Statut**       | ⬜ À faire                                                                               |
| **Sévérité**     | 🟠 HAUTE                                                                                 |
| **Effort**       | 2 nouveaux composants + 1 fichier CSS + intégration layout                               |
| **Fichiers**     | `GlobalNav.tsx` (nouveau), `NavLogo.tsx` (nouveau), `[locale]/layout.tsx`, `globals.css` |
| **Dépendances**  | Wave 1 (design tokens, i18n)                                                             |
| **Commit cible** | `feat(nav): floating GlobalNav with SVG logo [▁▃▅] TypeWav█`                             |

---

## Wave 3 — Core UI Refontes

> Wave 2 doit être complète. spec-12 (wpmNet fix, Wave 0) doit être fait avant spec-30.

### 3.1 — spec-29 : Home Layout Refonte (Zones 1–6)

| Champ            | Valeur                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **Spec**         | `docs/specs/29-home-layout.md`                                                                               |
| **Statut**       | ⬜ À faire                                                                                                   |
| **Sévérité**     | 🔵 VISION                                                                                                    |
| **Effort**       | Refonte massive HomeClient + nouveau ConfigBar + nouveau useConfigStore                                      |
| **Fichiers**     | `HomeClient.tsx`, `ConfigBar.tsx` (nouveau), `useConfigStore.ts` (nouveau), `WaveformBars.tsx` (ajout props) |
| **Dépendances**  | spec-15 v2 + spec-28 + spec-23 + spec-24                                                                     |
| **Commit cible** | `feat(home): 6-zone layout refonte — MonkeyType-inspired, TypeWav-flavored`                                  |

**Note** : Contient aussi les ajustements `WaveformBars` (props barCount, maxHeightPx, idlePulse)
prévus dans spec-27. Ne pas rouvrir spec-27 séparément.

---

### 3.2 — spec-30 : Results Page Refonte Complète

| Champ            | Valeur                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/30-results-refonte.md`                                         |
| **Statut**       | ⬜ À faire                                                                 |
| **Sévérité**     | 🔵 VISION (absorbe spec-25 🟠 HAUTE)                                       |
| **Effort**       | Refonte complète ResultsPage + nouveau WpmChart + update ResultsPageClient |
| **Fichiers**     | `ResultsPage.tsx`, `WpmChart.tsx` (nouveau), `ResultsPageClient.tsx`       |
| **Dépendances**  | spec-12 (wpmNet) + spec-27 (SessionWaveform, déjà implémenté) + spec-15 v2 |
| **Commit cible** | `feat(results): complete layout refonte — FORGE [2] + absorbs spec-25`     |

⚠️ **spec-25 est supersédée** — ne pas implémenter spec-25 séparément, tout est dans spec-30.

---

## Wave 4 — Autres Pages

> Wave 3 recommandée avant pour cohérence visuelle. spec-14 (auth fix) obligatoire avant.

### 4.1 — spec-31 : Refonte Autres Pages

| Champ            | Valeur                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/31-pages-refonte.md`                                                                                                                        |
| **Statut**       | ⬜ À faire                                                                                                                                              |
| **Sévérité**     | 🟠 HAUTE                                                                                                                                                |
| **Effort**       | 7 pages, changements légers à modérés par page                                                                                                          |
| **Fichiers**     | `ProfilClient.tsx`, `ClassementClient.tsx`, `PremiumPageClient.tsx`, `AuthForm.tsx`, `ChallengeClient.tsx`, `ReplayClient.tsx`, `transparence/page.tsx` |
| **Dépendances**  | spec-15 v2 + spec-14 + spec-16 (cloud sync gate)                                                                                                        |
| **Commit cible** | `feat(pages): apply FORGE [3] design direction to all secondary pages`                                                                                  |

---

## Wave 5 — Système Audio/Musical

> Peut être fait en parallèle avec Wave 4 (composants indépendants).
> spec-28 (soundpack cleanup) DOIT être terminé avant.

### 5.1 — spec-32 : Bibliothèque Musicale 58 Pièces

| Champ            | Valeur                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/32-music-library.md`                                                                        |
| **Statut**       | ⬜ À faire                                                                                              |
| **Sévérité**     | 🔵 VISION                                                                                               |
| **Effort**       | Migration 8 pièces + encodage 50 nouvelles (travail volume)                                             |
| **Fichiers**     | `packages/audio-engine/src/library.ts` (nouveau), `packages/audio-engine/src/pieces/*.ts` (50 nouveaux) |
| **Dépendances**  | spec-28 (types propres)                                                                                 |
| **Commit cible** | `feat(audio): unified music library with 58 public-domain pieces`                                       |

**Ordre d'encodage** :

1. Migrer les 8 pièces existantes (Phase A) — débloque les tests
2. Pièces populaires à fort impact : Moonlight, Clair de Lune, Eine Kleine (Phase B)
3. Toutes les pièces à tempo fixe (Phase C)
4. Pièces à tempo évolutif en dernier (Phase D) : Mountain King, Kalinka, Hungarian Rhapsody 2

---

### 5.2 — spec-33 : Système de Recommandation Musicale

| Champ            | Valeur                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/33-music-recommendation.md`                                                                                                                             |
| **Statut**       | ⬜ À faire                                                                                                                                                          |
| **Sévérité**     | 🟠 HAUTE                                                                                                                                                            |
| **Effort**       | Fonction pure + hook + composant MusicChip                                                                                                                          |
| **Fichiers**     | `packages/audio-engine/src/recommendation.ts` (nouveau), `apps/web/hooks/useMusicRecommendation.ts` (nouveau), `apps/web/components/typing/MusicChip.tsx` (nouveau) |
| **Dépendances**  | spec-32 (MUSIC_LIBRARY doit exister)                                                                                                                                |
| **Commit cible** | `feat(music): contextual recommendation system + MusicChip UI`                                                                                                      |

---

## Wave 6 — Collections

> Peut être fait en parallèle avec Wave 5.

### 6.1 — spec-34 : Collections Refonte

| Champ            | Valeur                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/34-collections-refonte.md`                                                                         |
| **Statut**       | ⬜ À faire                                                                                                     |
| **Sévérité**     | 🟠 HAUTE                                                                                                       |
| **Effort**       | Migration types + fetchCollection + enrichissement contenu (volume)                                            |
| **Fichiers**     | `packages/types/src/collection.ts`, `packages/collections/src/fetch.ts` (nouveau), tous `collection.config.ts` |
| **Dépendances**  | spec-23 (i18n) recommandé avant                                                                                |
| **Commit cible** | `feat(collections): adaptive text fetch + enriched TextEntry + content expansion`                              |

**Note** : L'enrichissement du contenu (40 FR + 40 EN pour littérature, etc.) est le
travail le plus volumineux de cette spec. Le faire en plusieurs commits par collection.

---

### 6.2 — spec-18 : Performance — Lazy Loading Collections

| Champ            | Valeur                                                |
| ---------------- | ----------------------------------------------------- |
| **Spec**         | `docs/specs/18-performance.md`                        |
| **Statut**       | ⬜ À faire                                            |
| **Sévérité**     | 🟡 MOYEN                                              |
| **Effort**       | Refactor du chargement des collections                |
| **Dépendances**  | spec-34 (structure collections propre)                |
| **Commit cible** | `perf(collections): lazy load active collection only` |

---

## Wave 7 — Polish, Ghost UX, Vision

> Faire Wave 6 avant. Ordre libre dans cette wave.

### 7.1 — spec-20 : Ghost UX Discoverability

| Champ            | Valeur                                                       |
| ---------------- | ------------------------------------------------------------ |
| **Spec**         | `docs/specs/20-ghost-ux.md`                                  |
| **Statut**       | ⬜ À faire                                                   |
| **Sévérité**     | 🟡 MOYEN                                                     |
| **Dépendances**  | spec-29 (home layout — le mode Ghost est dans la config bar) |
| **Commit cible** | Per spec-20                                                  |

---

### 7.2 — spec-26 : Component Polish

| Champ            | Valeur                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Spec**         | `docs/specs/26-component-polish.md`                                                                     |
| **Statut**       | ⬜ À faire                                                                                              |
| **Sévérité**     | 🟡 MOYEN                                                                                                |
| **Note**         | Certains items peuvent être résolus par spec-29/30/31. Lire spec-26 puis vérifier si encore applicable. |
| **Dépendances**  | Wave 3 + Wave 4 recommandées                                                                            |
| **Commit cible** | Per spec-26                                                                                             |

---

### 7.3 — spec-17 : SEO / OG / Structured Data

| Champ            | Valeur                                               |
| ---------------- | ---------------------------------------------------- |
| **Spec**         | `docs/specs/17-seo-og.md`                            |
| **Statut**       | ⬜ À faire                                           |
| **Sévérité**     | 🔵 VISION                                            |
| **Dépendances**  | Toutes les refontes fixes (SEO après contenu stable) |
| **Commit cible** | Per spec-17                                          |

---

### 7.4 — spec-21 : Audio Value Prop

| Champ           | Valeur                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**        | `docs/specs/21-audio-value-prop.md`                                                                                                                                                                                                                               |
| **Statut**      | ⬜ À réévaluer après spec-29                                                                                                                                                                                                                                      |
| **Sévérité**    | 🔵 VISION                                                                                                                                                                                                                                                         |
| **Note**        | FORGE [1] retire `AudioPreviewButton` standalone et le badge rang de la home. spec-21 est partiellement obsolète. Après spec-29 : évaluer si `AudioPreviewButton` a une autre place (page d'atterrissage, onboarding). Le composant existe — ne pas le supprimer. |
| **Dépendances** | spec-29 (home layout terminé)                                                                                                                                                                                                                                     |

---

## Specs supersédées / Ne plus implémenter séparément

| Spec                    | Raison                                                                        |
| ----------------------- | ----------------------------------------------------------------------------- |
| ~~spec-25~~             | Absorbée par **spec-30** (results refonte). spec-25 est archivée.             |
| ~~spec-27 (partielle)~~ | Composants implémentés (commit b6f7774). Ajustements dans spec-29 et spec-30. |

---

## Référence rapide — Index des specs

| Spec    | Titre                            | Wave | Statut                                      |
| ------- | -------------------------------- | ---- | ------------------------------------------- |
| spec-12 | Fix wpmNet                       | 0    | ⬜                                          |
| spec-13 | Fix backspace                    | 0    | ⬜                                          |
| spec-14 | Fix auth locale + reset password | 0    | ⬜                                          |
| spec-16 | Gate cloud sync                  | 0    | ⬜                                          |
| spec-17 | SEO / OG                         | 7    | ⬜                                          |
| spec-18 | Performance / lazy loading       | 6    | ⬜                                          |
| spec-19 | i18n-a11y sweep                  | 1    | ⬜                                          |
| spec-20 | Ghost UX discoverability         | 7    | ⬜                                          |
| spec-21 | Audio value prop                 | 7    | ⬜ (réévaluer)                              |
| spec-22 | AuthForm a11y                    | 0    | ✅                                          |
| spec-23 | i18n complete sweep              | 1    | ⬜                                          |
| spec-24 | Design token enforcement         | 1    | ⬜                                          |
| spec-25 | Results enhancement              | —    | ⚠️ Supersédée par spec-30                   |
| spec-26 | Component polish                 | 7    | ⬜                                          |
| spec-27 | Waveform visualizer              | —    | ✅ Implémenté (ajustements dans spec-29/30) |
| spec-28 | Soundpack cleanup + F-1          | 0    | ⬜                                          |
| spec-29 | Home layout refonte              | 3    | ⬜                                          |
| spec-30 | Results refonte                  | 3    | ⬜                                          |
| spec-31 | Autres pages refonte             | 4    | ⬜                                          |
| spec-32 | Music library 58 pièces          | 5    | ⬜                                          |
| spec-33 | Music recommendation             | 5    | ⬜                                          |
| spec-34 | Collections refonte              | 6    | ⬜                                          |
| spec-35 | Challenge autoNavigate fix       | 0    | ⬜                                          |

---

## Notes de contexte technique

**Stack (non-négociable) :**

- Next.js 16 App Router + TypeScript 5.8 strict
- pnpm monorepo : `apps/web`, `packages/audio-engine`, `packages/collections`, `packages/soundpacks`, `packages/types`
- Tone.js 15.x — 100% synthèse, zéro fichier .mp3
- Zustand (stores : `useSessionStore`, `useAudioStore`, `useThemeStore`, `useProgressionStore`, `useConfigStore`)
- IndexedDB via `idb` — storage primaire
- `motion/react` — PAS `framer-motion`
- `@supabase/ssr` — PAS `auth-helpers-nextjs`
- next-intl pour l'i18n

**Tokens CSS obligatoires :**

```css
--color-bg, --color-surface, --color-text-primary, --color-text-muted,
--color-accent, --color-error, --color-border
--radius-sm, --radius-md, --radius-lg
--font-display (Cormorant Garamond), --font-ui (Sora), --font-mono (JetBrains Mono)
--transition-fast
```

**Convention commits :**

```
type(scope): description (en minuscules, en anglais)
type : feat | fix | refactor | test | perf | style | docs | chore
scope : audio | nav | home | results | challenge | profil | typing | i18n | a11y | soundpacks | collections | music | design
```

**TDD workflow pour chaque spec :**

```
1. Lire la spec + lire le code existant
2. RED : écrire les tests (ils doivent échouer)
3. GREEN : implémenter jusqu'à ce qu'ils passent
4. REFACTOR si nécessaire
5. pnpm typecheck && pnpm lint && pnpm test && pnpm build
6. Commit
```
