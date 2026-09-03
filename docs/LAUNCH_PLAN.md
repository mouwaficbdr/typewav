# Route de lancement TypeWav

Source machine du plan de lancement : ce qui reste entre l'état actuel et un lancement propre, dans l'ordre, et qui le porte.

- **Vue de lecture (artifact, tenue par le lead) :** https://claude.ai/code/artifact/72a3dfc5-2943-4ef6-84c6-567487387ded
- **Baton entre instances :** `~/.claude/projects/-home-mouwaficbdr-Code-Typewav/HANDOFF.md`
- **Sources du plan :** `TypeWav-Etat-des-lieux.docx`, plan `giggly-drifting-hopper.md`, mémoires persistantes du projet.
- **Dernière revue :** 2026-09-03 · WS-1 clos (8 / 8) ; trois chantiers livrés

Les identifiants `WS-N` sont la référence dans les messages de commit et dans `HANDOFF.md`. Ils ne dictent pas l'ordre : voir « Séquencement ».

## Avancement

`3 / 7` chantiers livrés · `22 / 40` tâches · WS-1, WS-2 et WS-3 clos (WS-4 4/6, les 2 RLS bloquées Supabase ; WS-5 1/8 ; WS-6/7 à faire ou bloqués).

> Vercel bloque tous les déploiements (plan Hobby, projet signalé usage commercial). `main` n'est plus déployé depuis ~2026-08-21. Action Mouwafic : dashboard Vercel. N'affecte pas la CI GitHub Actions.

## Déjà sécurisé (hors périmètre restant)

- Audit §7, le filet : intégration continue GitHub Actions, 713 tests, planchers de couverture appliqués.
- Audit §4, la caisse : webhook Stripe qui échoue en fermé, déduplication des événements rejoués, prix annuel aligné.
- Audit §5, redirection : open redirect fermé dans le retour de connexion OAuth.
- Audit §1 et §2, les deux cœurs : moteur audio en singleton, écho sur vraie correction, position MIDI remise à zéro chaque tentative ; formule WPM nette corrigée, clôture de séance idempotente, modes détente hors classement.

## Chantiers

### WS-1 · Accessibilité et responsive : livré (8 / 8)

Objectif : le produit utilisable au clavier seul, au lecteur d'écran, au zoom et sur mobile. Obligation légale en Europe. Audit §6.
Périmètre : `apps/web/components/typing/*`, `components/ui/GlobalNav.tsx`, `components/ui/AuthForm.tsx`, `lib/theme/*`, `packages/themes/*`, `styles/globals.css`, formulaires.

PR #4, #5 (tranches 1-2, zone de frappe + reduced-motion). PR #17 (contrastes, claude2). PR #20 (erreurs de formulaire annoncées). PR #21 (sélecteur de morceau au clavier). PR #23 (layout fluide, token `--nav-height`).

- [x] Zone de frappe : retirer le faux rôle de champ texte, annoncer sa vraie nature (`role="application"`, `aria-describedby`)
- [x] Exposer texte, progression et stats vivantes via des régions live dédiées (texte cible sr-only, région live polite aux paliers de 25 %)
- [x] Restaurer un indicateur de focus visible (`outline: none` retiré, anneau accent au focus clavier)
- [x] Respecter `prefers-reduced-motion` : les animations pilotées par composant l'étaient déjà (`useReducedMotion`) ; ajout d'un bloc `@media` pour les keyframes CSS (caret, curseur, skeleton, logo nav)
- [x] Layout fluide ; ne plus figer la hauteur sur une nav supposée ; nav repliable (PR #23) : token CSS `--nav-height` (88px desktop / 56px sous 640px), source unique remplaçant huit `calc(100dvh - {48,100}px)` en dur ; padding et gaps de `GlobalNav` en `clamp()`, la barre wrappe au lieu de déborder. Décision design : pas de hamburger pour une nav de 5 icônes. Garde `nav-height-token.test.ts`. QA responsive navigateur réel encore à faire
- [x] Remonter les contrastes de couleur sous le seuil lisible (PR #17, claude2, revue lead) : `textMuted` / `error` (et les `char*` miroirs) remontés à WCAG 2.2 AA sur `bg` et `surface`, éclaircissement multiplicatif minimal, teinte préservée. Garde de non-régression `apps/web/lib/__tests__/theme-contrast.test.ts` (calc WCAG autonome, itère les deux sources de thèmes). `--color-border` hors périmètre (filet décoratif). **Finding :** seul **Cyprus Sand** était un thème *livré* qui échouait (`textMuted` 4.22, `error` 3.87) ; `@typewav/themes` (noir / arcade / midnight-sun) est une dépendance déclarée de `apps/web` mais jamais importée (données mortes), corrigée quand même
- [x] Erreurs de formulaire annoncées vocalement (PR #20) : `AuthForm` gagne `role="alert"` sur l'erreur et `role="status"` sur le succès. `ResetPasswordClient` et les bannières audio de `HomeClient` portaient déjà ces rôles
- [x] Sélecteur de morceau entièrement manipulable au clavier (PR #21) : `ActiveSessionHeader` (le vrai sélecteur) gagne `aria-haspopup` + `aria-expanded`, `aria-label` sur le `role="dialog"`, Échap qui ferme et rend le focus au déclencheur, focus déplacé dans le menu à l'ouverture. `components/typing/MusicChip.tsx` est une version orpheline sans import (code mort, à nettoyer en WS-5/6)

### WS-2 · i18n complet et porte d'entrée : livré (6 / 6)

Objectif : dé-murer l'adresse nue, rendre le site présentable en recherche et en partage, tenir la promesse bilingue. Audit §3.
Périmètre : `proxy.ts` / `i18n/*`, `app/layout.tsx` + `[locale]/layout.tsx` (métadonnées + shell HTML), `lib/seo.ts`, `[locale]/opengraph-image.tsx`, `messages/{fr,en}.json`, formulaire d'auth, sélecteur de langue, graphiques profil (`components/charts/*`, `lib/weekly.ts`).

Tranche 1 (PR #8) : porte d'entrée + SEO tête de page. Tranche 2 (PR #10) : extraction i18n. Tranche 3 (PR #12) : dates des graphiques profil. Tranche 4 (PR #14) : `<html lang>`.

Carve-out livrés à part (PR #16) : `transparence/page.tsx` entièrement localisée (namespace `transparence`, `generateMetadata` locale-aware, mois localisé, `t.rich`) ; `MilestoneToast` affiche une invitation à l'écoute quand le jalon débloqué est un jalon de rang (`progression.rankSoundHint`, le rang façonne le son depuis WS-3).

- [x] Adresse nue `/` : détection de langue et redirection. En fait déjà en place via `proxy.ts` (Next 16 a renommé `middleware.ts` → `proxy.ts`) ; vérifié : `/` → 307 `/fr`, `Accept-Language: en` → 307 `/en`
- [x] Déclarer les alternates hreflang (`<link rel="alternate" hreflang>` fr / en / x-default en tête de page) ; canonical par locale (`/fr`, `/en`) au lieu de la racine nue qui redirige
- [x] Aperçus de partage cohérents avec la langue : retrait de la référence morte `/og-image.png`, la convention `opengraph-image` fournit un PNG généré et localisé (texte + `alt` FR/EN), titres OG / Twitter dans la langue de la page
- [x] Sortir vers next-intl : labels des bannières d'état audio (`audio.samplerFallbackLabel` / `audio.midiErrorLabel`), sélecteur de langue lui-même (`typing.langFr` / `langEn` / `langBoth`, désormais localisé au lieu d'un libellé anglais figé), messages propres au formulaire de connexion (`auth.notConfigured` / `signupSuccess` / `genericError`) ; au passage le repli Fantôme sans record (`ghost.noRecordFallback`)
- [x] Remplacer les dates FR codées en dur par le formateur localisé (PR #12) : graphiques du dashboard profil (`WpmProgressChart`, `ContributionHeatmap`) via `useFormatter` de next-intl, chaînes des graphiques sorties vers `messages/{fr,en}.json` (namespace `profile`) ; `weekly.ts` `bestDay` → `bestDayIndex` locale-agnostique. Reste carve-out : `transparence/page.tsx` (toute la page est en FR dur, pas juste la date : tranche propre) et la chaîne rang-up de `MilestoneToast.tsx` (nouvelle UX, pas de la date)
- [x] `<html lang>` posé depuis la locale de route (PR #14) : `<html>` / `<body>` descendus dans `app/[locale]/layout.tsx`, `app/layout.tsx` devient un pass-through. `/fr` sert `<html lang="fr">`, `/en` sert `<html lang="en">`. Structure next-intl pour Next < 16.3 (`next/root-params` indisponible en 16.1.6). Check de locale via `hasLocale()`

### WS-3 · Music sells, ce qui reste : livré (3 / 3)

Objectif : faire grandir la richesse sonore avec le rang, et offrir un vrai moment Peak-End en fin de séance. Plan `giggly-drifting-hopper`, phases 4 et 5.
Périmètre : `hooks/useAudioEngine.ts`, `lib/rank-sound.ts` (nouveau), `components/typing/AmbientAura.tsx`, `components/typing/ResultsPage.tsx`.
Fait par claude2 (PR #9, mergée après revue lead). Décision : le rang façonne l'instrument, pas la partition. Zéro note ajoutée, zéro voix (pas de retour du bourdon), zéro mécanique de streak.

- [x] Le rang façonne l'instrument en piano seul : réverbe (`wet` 0.25→0.49, `decay` 0.30→2.55s), plancher de vélocité (0.20→0.10, la dynamique se rouvre), release des voix (1.8→2.55s). `novice` calé sur `PACK_CONFIGS.piano` : zéro régression nouvel utilisateur. `lib/rank-sound.ts`, fonctions pures
- [x] Rebranché sans le bourdon : trois leviers piano-only sur le graphe existant, pas de `harmonic-drone.ts`. Rang lu une fois à la construction du graphe, réaligné au 1er keydown si pas encore hydraté ; `triggerResume` revient au `wet` de base du rang, pic de correction au-dessus
- [x] Langage visuel AmbientAura sur `ResultsPage` : aura respirante en `--color-accent` derrière le contenu, bande `WaveformBars` au repos, courbe signature sur les reveals, un gonflement unique sur nouveau record (aucune boucle, rien sous `prefers-reduced-motion`)

### WS-4 · Sécurité et données : 4 / 6 (les 2 restantes bloquées)

Objectif : fermer les fuites de données discrètes que l'audit signale une fois l'urgent traité. Audit §5 et §8.
Périmètre : `supabase/migrations/*`, `apps/web/lib/db.ts`, couche sync, `apps/web/next.config.ts`, Supabase MCP.
Fait par claude2 (PR #6, mergée). Bloqué : les 2 tâches RLS attendent que le vrai projet Supabase soit lié (action Mouwafic).

- [ ] Lier le vrai projet Supabase, appliquer `20260713000001_rls_user_premium_and_sessions.sql`
- [ ] Tester automatiquement les policies RLS (chaque ligne liée à son propriétaire)
- [x] Couper réellement la sync cloud tant que `SYNC_IS_COMING_SOON` (gardes au point d'entrée `syncAll`/`pushSession` + hook)
- [x] Versionner correctement les évolutions de la base locale IndexedDB (`migrate(db, oldVersion)`, échelle par version, `blocking`/`terminated`)
- [x] Sérialiser les mises à jour de stats concurrentes qui peuvent se perdre (transaction readwrite + file de promesses par store)
- [x] Compléter les en-têtes de sécurité (`lib/security-headers.ts` : CSP taillée pour Tone.js/Supabase, HSTS, Permissions-Policy)

### WS-5 · La somme des petites choses : en cours (1 / 8)

Objectif : retirer l'impression de produit pas tout à fait fini, une fois l'essentiel sécurisé. Audit §8 plus la dette des thèmes de jalons.
Périmètre : dispersé : ResultsPage / replay, générateur de lien de défi, `HomeClient.tsx`, CSS de thème, `packages/types/src/progression.ts`. Collision : touche `HomeClient` et `ResultsPage`, ne pas paralléliser à l'aveugle.

PR #25 (sitemap et robots).

- [ ] Bouton Réécouter qui ne fait rien
- [ ] Icônes d'action cryptiques : libellés et infobulles
- [ ] Texte du jour qui diffère serveur / navigateur : clignotement au chargement
- [ ] Générateur de lien de défi qui peut boucler à l'infini dans un cas extrême
- [ ] Couleurs codées en dur qui cassent le thème clair
- [ ] `MILESTONES` récompense des thèmes `noir` et `midnight-sun` absents de `APP_THEMES`
- [x] `sitemap.xml` absent pour les moteurs de recherche (PR #25) : `app/sitemap.ts` liste les pages publiques (accueil, classement, premium, transparence) dans les deux locales avec alternates hreflang fr/en ; `app/robots.ts` autorise le crawl, `Disallow` sur `/api/` et les zones privées par locale (auth, profil, results, replay, dev-onboarding), pointe vers le sitemap. Auth, profil et pages de session volontairement absents. Tests : couverture publique complète, aucune privée, robots nomme le sitemap. Généré en statique au build
- [ ] Cohérence entre styles écrits à la main et système de style

### WS-6 · Dettes connues : à faire (0 / 6)

Objectif : les chantiers identifiés mais explicitement mis de côté, chacun à reprendre pour soi. Source : mémoires persistantes du projet.
Périmètre : isolé par item.

- [ ] Collection `litterature` : auteurs vivants ou morts depuis moins de 70 ans, plus des paroles de chanson ; re-vérifier chaque entrée contre les dates de décès, spot-check poesie / philosophie / gaming
- [ ] Latence de la première note (~350 à 650 ms) : trouver pourquoi le tout premier `Tone.start()` se bloque (APIs d'activation utilisateur Chrome, autres navigateurs et OS) ; reconstruire le pipe dlog pour de vraies données
- [ ] Réconcilier `feat/redesign-ux-ui` avec `main` (ascendance cassée par le squash-merge de la PR #1)
- [ ] Retirer le garde `if (IS_DEV_MODE) return;` de `HomeClient.tsx` et supprimer `app/[locale]/dev-onboarding/` une fois l'onboarding validé
- [ ] Revoir les listes de mots type `WORDS_HOME_ROW` (mineur, différé par le plan lui-même)
- [ ] `KeyboardDiagram` par défaut en AZERTY plus abstraction de disposition (ne pas démarrer sans demande explicite)

### WS-7 · Premium : bloqué (0 / 3)

Objectif : redécider le contenu et la logique premium une fois le MVP complet et fonctionnel. Décision Mouwafic : ne pas proposer de features premium avant cette conversation.
Périmètre : `apps/web/lib/featureFlags.ts`, `app/api/stripe/*`, tables premium et RLS.
Bloqué : décision « MVP complet » non prise.

- [ ] Attendre la conversation MVP complet
- [ ] Switch premium dev-only marche / arrêt, à côté de `featureFlags.ts`, inerte en build de production
- [ ] Reprendre webhook Stripe, frontière serveur-client, RLS des tables premium (partiellement fait en Phase 1)

## Séquencement

Quatre vagues. À l'intérieur d'une vague, deux chantiers aux arbres de fichiers disjoints peuvent tourner en parallèle, un par instance (voir la section « Parallèle claude / claude2 » du `CLAUDE.md`).

- **Vague 1 :** WS-1 (accessibilité et responsive) ∥ WS-4 (sécurité et données). Disjoints : composants et CSS d'un côté, `supabase/` plus `db.ts` plus `next.config.ts` de l'autre. WS-4 démarre bloqué sur le lien Supabase ; ses tâches non-RLS avancent en attendant.
- **Vague 2 :** WS-2 (i18n et porte d'entrée) ∥ WS-3 (richesse sonore et Peak-End). Disjoints : `messages/*` plus metadata plus `proxy.ts` d'un côté, couche audio plus `warp-engine` de l'autre. Point d'attention : `ResultsPage` est touché par WS-3 et par WS-5, ne pas mener WS-3 et WS-5 en même temps.
- **Vague 3 :** WS-5 (polissage) en solo ou finement découpé, il touche `HomeClient`, `ResultsPage`, le thème et `progression.ts` ; plus les items isolés de WS-6 intercalés.
- **Vague 4 :** WS-7 (premium), après le feu vert explicite de Mouwafic sur le périmètre premium.

## Journal

- **2026-09-03** : WS-5 démarré (`1 / 8`). **PR #25** : `sitemap.xml` et `robots.txt`, jusque-là absents. `app/sitemap.ts` génère les pages publiques (accueil, classement, premium, transparence) dans les deux locales, chacune avec ses alternates hreflang fr/en, à partir de `routing.locales` et `APP_URL` (pas de duplication). `app/robots.ts` autorise le crawl, `Disallow` sur `/api/` et les zones privées glob-préfixées par locale (`/*/auth/`, `/*/profil`, `/*/results`, `/*/replay`, `/*/dev-onboarding`), déclare le sitemap. Auth / profil / états de session délibérément hors index. Vérifié en curl, généré en statique au build. Tests : couverture publique complète dans les deux locales, aucune route privée, robots nomme le sitemap et interdit les chemins privés. Gate complet vert (718 tests).
- **2026-09-03** : WS-1 clos (`8 / 8`, `3 / 7` chantiers). Trois PRs séquentielles pour les tâches restantes :
  - **PR #20** : erreurs de formulaire annoncées. `AuthForm` gagne `role="alert"` (erreur) et `role="status"` (succès). Les autres formulaires (`ResetPasswordClient`, bannières audio `HomeClient`) portaient déjà ces rôles.
  - **PR #21** : sélecteur de morceau au clavier. `ActiveSessionHeader` gagne `aria-haspopup`/`aria-expanded`, un nom accessible sur le `role="dialog"`, Échap qui ferme et rend le focus, focus déplacé dans le menu à l'ouverture. `components/typing/MusicChip.tsx` identifié comme code mort orphelin (nettoyage WS-5/6).
  - **PR #23** : layout fluide. Token CSS `--nav-height` unique (88px / 56px mobile) remplaçant huit `calc(100dvh - {48,100}px)` en dur incohérents ; padding et gaps de `GlobalNav` en `clamp()`, la barre wrappe. Décision design : pas de hamburger pour 5 icônes. Garde `nav-height-token.test.ts`.
  - **PR #22** (chore) : `.claude/` et le `.docx` de travail ajoutés au `.gitignore` (un `git add -A` les avait aspirés dans une PR, retirés avant merge).
  - QA responsive en navigateur réel encore à faire (jsdom sans moteur de layout).
- **2026-09-03** : round parallèle carve-outs WS-2 (lead) ∥ WS-1 contrastes (follower). Les deux mergés, round refermé.
  - **Carve-outs WS-2 (PR #16, mergée)** : `transparence/page.tsx` entièrement localisée (toute la copie FR sort vers un namespace `transparence`, `metadata` statique devient `generateMetadata` locale-aware, le mois « Mise à jour » et le `<title>` suivent la locale, `<strong>` via `t.rich`, deux tirets cadratins retirés du texte source) ; `MilestoneToast` gagne `progression.rankSoundHint`, une ligne d'invitation à l'écoute affichée uniquement pour un jalon de rang (le rang façonne le son du piano depuis WS-3). Chaînes EN validées par Mouwafic. TDD : MilestoneToast +2, `transparence` `generateMetadata` +3.
  - **WS-1 contrastes (PR #17, claude2, revue lead + 1 retouche)** : `textMuted` / `error` (et `char*` miroirs) remontés à WCAG 2.2 AA sur `bg` et `surface`, éclaircissement multiplicatif minimal. Garde `theme-contrast.test.ts` (calc WCAG autonome, 112 assertions). Retouche de revue : 12 tirets cadratins retirés du code de claude2. Finding : `@typewav/themes` (noir / arcade / midnight-sun) est une dépendance déclarée de `apps/web` mais jamais importée (données mortes) ; seul **Cyprus Sand** (`APP_THEMES` dans `defaultThemes.ts`) est un thème livré qui échouait. À décider (Mouwafic) : retirer la dépendance morte ou câbler ces thèmes.
  - WS-1 passe à `5 / 8`. Gate complet vert sur `main` (705 tests, 74 fichiers).
- **2026-09-03** : WS-2 clos (`6 / 6`, `2 / 7` chantiers). Dernière tâche, `<html lang>` (PR #14, mergée) : le layout racine rendait `<html>` au-dessus du segment `[locale]`, donc sans attribut `lang` du tout. `<html>` / `<body>` (className des polices, `ThemeScript`, `body`) descendent dans `app/[locale]/layout.tsx`, seul niveau qui connaît la locale, qui rend `<html lang={locale}>` ; `app/layout.tsx` devient un pass-through portant encore `metadata` / `viewport` par défaut. Structure documentée par next-intl pour Next < 16.3 (`next/root-params` indisponible, repo en 16.1.6). Check de locale via `hasLocale()` (retrait du cast `as`). Vérifié en curl (RSC async retournant `<html>` non testable en testing-library) : `/fr` sert `<html lang="fr">`, `/en` sert `<html lang="en">`, build vert, les 404 sous `[locale]` gardent le shell.
- **2026-09-03** : WS-2 tranche 3 (dates localisées, PR #12, mergée). Les graphiques du dashboard profil suivaient un `'fr-FR'` codé en dur : `WpmProgressChart` et `ContributionHeatmap` mettent en forme leurs dates via `useFormatter` de next-intl (helpers purs `groupByDay` / `buildHeatmapData` avec formateur injecté, testable sans mock d'horloge). Chaînes des graphiques sorties vers `messages/{fr,en}.json` namespace `profile` (`chartMedian`, `chartTrend`, `chartEmpty`, `heatmapAria`, `heatmapLess`/`heatmapMore`, `heatmapSessions` en pluriel ICU ; au passage un tiret cadratin retiré du texte de tooltip). `lib/weekly.ts` : `bestDay` (nom de jour `fr-FR` déjà mis en forme) devient `bestDayIndex` (`Date.getDay()`, `-1` si vide), `calculateWeeklySummary` n'ayant aucun consommateur c'est une correction de forme. Carve-out assumé : `transparence/page.tsx` (page entièrement en FR dur, pas juste la date) et la chaîne rang-up de `MilestoneToast.tsx` (nouvelle UX) partent en suivis propres. TDD : +2 cas `weekly.test.ts`, 2 fichiers de test graphiques neufs. Gate complet vert (588 tests).
- **2026-09-03** : Vague 2 close. WS-3 (PR #9, claude2) mergée après revue lead : le rang façonne l'instrument piano (réverbe, plancher de vélocité, release), sans note ni voix ajoutée ; `lib/rank-sound.ts` fonctions pures ; aura ambiante `AmbientAura` portée sur `ResultsPage` avec un gonflement unique sur nouveau record. Revue lead : frontière disjointe de WS-2 vérifiée, règle produit intacte (chemin d'erreur non touché), pas de crash avant hydratation du rang. 3 nits non bloquants laissés à claude2 (doc « médiane », `config` partiellement mort, vérif manuelle du fond transparent de `ResultsPage`). WS-2 : tranches 1-2 livrées (PR #8 et #10), restent tranche 3 (dates localisées) et `<html lang>`.
- **2026-09-03** : WS-2 tranche 2 (extraction i18n). Neuf chaînes sorties vers `messages/{fr,en}.json` : sélecteur de langue (`typing.langFr`/`langEn`/`langBoth`, qui affichait un libellé anglais figé même en FR), labels des bannières d'état audio (`audio.samplerFallbackLabel`/`midiErrorLabel`, en dur `Sampler fallback:` / `MIDI error:`), messages propres au formulaire de connexion (`auth.notConfigured`/`signupSuccess`/`genericError`), et le repli Fantôme sans record (`ghost.noRecordFallback`). Parité fr/en vérifiée (321 clés chacune). 3 assertions de test recâblées sur les clés. Nits de doc repliés : « PR à venir » → PR #8 mergée, `510` → `562 tests`, « middleware » → `proxy.ts` dans Séquencement.
- **2026-09-03** : Vague 2 ouverte, WS-2 tranche 1 (porte d'entrée + SEO tête de page) mergée (PR #8). Constat en démarrant : la redirection de l'adresse nue `/` marche déjà (`proxy.ts`, renommé depuis `middleware.ts` par Next 16) ; le finding « `/` renvoie une 404 » de l'audit était périmé. Livré : canonical par locale (`/fr`, `/en`) au lieu de la racine, `<link hreflang>` fr / en / x-default en tête de page, retrait de la référence morte `/og-image.png` (la convention `opengraph-image` fournit le PNG), image et aperçus OG / Twitter localisés. Bug trouvé au passage et corrigé : `<title>` doublé sur `/en` (`TypeWav | TypeWav | ...`), le gabarit racine enrobait un titre déjà marqué.
- **2026-09-03** : Vague 1 terminée. WS-4 (PR #6, claude2) mergée après revue lead : sync silencieuse coupée, migrations IndexedDB explicites (`migrate(db, oldVersion)`), mutations profil/records sérialisées (transaction + file de promesses), en-têtes de sécurité (CSP/HSTS/Permissions-Policy). 2 retouches de revue appliquées (commentaire CSP exact, HSTS sans `preload`). WS-1 tranche 2 (reduced-motion CSS) mergée (PR #5).
- **2026-09-03** : WS-1 tranche 1 (zone de frappe accessible) mergée (PR #4, `06feb8b`). `role="application"` au lieu du faux `textbox`, instructions `aria-describedby`, texte cible sr-only, région live polite aux paliers de 25 %, anneau de focus clavier restauré.
- **2026-09-02** : nettoyage de branches (ancienne `feat/redesign-ux-ui` supprimée, delta AmbientAura sur PR #3 mergée, `main` recalé), Vague 1 ouverte, assignation parallèle écrite dans `HANDOFF.md`.
- **2026-09-02** : plan de lancement créé à partir de l'audit et des mémoires. Protocole parallèle claude / claude2 écrit dans le `CLAUDE.md` local et `HANDOFF.md`.
