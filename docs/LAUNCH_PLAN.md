# Route de lancement TypeWav

Source machine du plan de lancement : ce qui reste entre l'état actuel et un lancement propre, dans l'ordre, et qui le porte.

- **Vue de lecture (artifact, tenue par le lead) :** https://claude.ai/code/artifact/72a3dfc5-2943-4ef6-84c6-567487387ded
- **Baton entre instances :** `~/.claude/projects/-home-mouwaficbdr-Code-Typewav/HANDOFF.md`
- **Sources du plan :** `TypeWav-Etat-des-lieux.docx`, plan `giggly-drifting-hopper.md`, mémoires persistantes du projet.
- **Dernière revue :** 2026-09-02 · branche active `feat/redesign-ux-ui`

Les identifiants `WS-N` sont la référence dans les messages de commit et dans `HANDOFF.md`. Ils ne dictent pas l'ordre : voir « Séquencement ».

## Avancement

`0 / 7` chantiers livrés · `3 / 39` tâches · Vague 1 en cours (WS-1 ∥ WS-4).

## Déjà sécurisé (hors périmètre restant)

- Audit §7, le filet : intégration continue GitHub Actions, 510 tests, planchers de couverture appliqués.
- Audit §4, la caisse : webhook Stripe qui échoue en fermé, déduplication des événements rejoués, prix annuel aligné.
- Audit §5, redirection : open redirect fermé dans le retour de connexion OAuth.
- Audit §1 et §2, les deux cœurs : moteur audio en singleton, écho sur vraie correction, position MIDI remise à zéro chaque tentative ; formule WPM nette corrigée, clôture de séance idempotente, modes détente hors classement.

## Chantiers

### WS-1 · Accessibilité et responsive — en cours (3 / 8)

Objectif : le produit utilisable au clavier seul, au lecteur d'écran, au zoom et sur mobile. Obligation légale en Europe. Audit §6.
Périmètre : `apps/web/components/typing/*`, `app/[locale]/layout.tsx`, `components/nav/*`, `AmbientAura.tsx`, `WaveformBars.tsx`, variables CSS, formulaires.

Tranche 1 (PR #4, en revue) : la zone de frappe elle-même.

- [x] Zone de frappe : retirer le faux rôle de champ texte, annoncer sa vraie nature (`role="application"`, `aria-describedby`)
- [x] Exposer texte, progression et stats vivantes via des régions live dédiées (texte cible sr-only, région live polite aux paliers de 25 %)
- [x] Restaurer un indicateur de focus visible (`outline: none` retiré, anneau accent au focus clavier)
- [ ] Respecter `prefers-reduced-motion` sur toutes les animations en boucle (zen-breathe, AmbientAura, WaveformBars, glow de l'onglet niveau)
- [ ] Layout fluide avec points de rupture ; ne plus figer la hauteur sur une nav supposée ; nav repliable
- [ ] Remonter les contrastes de couleur sous le seuil lisible
- [ ] Erreurs de formulaire annoncées vocalement
- [ ] Sélecteur de morceau entièrement manipulable au clavier

### WS-2 · i18n complet et porte d'entrée — à faire (0 / 5)

Objectif : dé-murer l'adresse nue, rendre le site présentable en recherche et en partage, tenir la promesse bilingue. Audit §3.
Périmètre : middleware / `i18n/*`, metadata de `[locale]/layout.tsx`, `messages/{fr,en}.json`, formulaire d'auth, sélecteur de langue, `app/sitemap.ts`. Note : le namespace `learning` est déjà largement extrait.

- [ ] Adresse nue `/` : détection de langue et redirection (aujourd'hui une page 404)
- [ ] Déclarer les alternates hreflang ; corriger le canonical FR qui pointe vers le 404
- [ ] Générer une image de partage existante et des aperçus cohérents avec la langue de la page
- [ ] Sortir vers next-intl : messages d'état audio, sélecteur de langue lui-même, messages du formulaire de connexion
- [ ] Remplacer les dates FR codées en dur par le formateur localisé

### WS-3 · Music sells, ce qui reste — à faire (0 / 3)

Objectif : faire grandir la richesse sonore avec le rang, et offrir un vrai moment Peak-End en fin de séance. Plan `giggly-drifting-hopper`, phases 4 et 5.
Périmètre : `hooks/useAudioEngine.ts`, `lib/warp-engine.ts`, `lib/note-expression.ts`, `stores/useProgressionStore.ts`, `components/results/ResultsPage.tsx`.

- [ ] Décider comment le rang enrichit le son en piano seul (profondeur de réverbe, plage de vélocité, étalement d'octave) puis le câbler
- [ ] Rebrancher le mécanisme sans le bourdon, retiré : la proposition d'origine s'appuyait sur `harmonic-drone.ts`
- [ ] Porter le langage visuel AmbientAura / WaveformBars sur `ResultsPage` (badge record et `SessionWaveform` déjà en place)

### WS-4 · Sécurité et données — bloqué (0 / 6)

Objectif : fermer les fuites de données discrètes que l'audit signale une fois l'urgent traité. Audit §5 et §8.
Périmètre : `supabase/migrations/*`, `apps/web/lib/db.ts`, couche sync, `apps/web/next.config.ts`, Supabase MCP.
Bloqué : lier le vrai projet Supabase (action Mouwafic). Les cinq autres tâches avancent sans lui.

- [ ] Lier le vrai projet Supabase, appliquer `20260713000001_rls_user_premium_and_sessions.sql`
- [ ] Tester automatiquement les policies RLS (chaque ligne liée à son propriétaire)
- [ ] Couper réellement la sync cloud tant que `SYNC_IS_COMING_SOON` (elle s'exécute en silence vers une table peut-être absente)
- [ ] Versionner correctement les évolutions de la base locale IndexedDB (`lib/db.ts`)
- [ ] Sérialiser les mises à jour de stats concurrentes qui peuvent se perdre
- [ ] Compléter les en-têtes de sécurité

### WS-5 · La somme des petites choses — à faire (0 / 8)

Objectif : retirer l'impression de produit pas tout à fait fini, une fois l'essentiel sécurisé. Audit §8 plus la dette des thèmes de jalons.
Périmètre : dispersé : ResultsPage / replay, générateur de lien de défi, `HomeClient.tsx`, CSS de thème, `packages/types/src/progression.ts`. Collision : touche `HomeClient` et `ResultsPage`, ne pas paralléliser à l'aveugle.

- [ ] Bouton Réécouter qui ne fait rien
- [ ] Icônes d'action cryptiques : libellés et infobulles
- [ ] Texte du jour qui diffère serveur / navigateur : clignotement au chargement
- [ ] Générateur de lien de défi qui peut boucler à l'infini dans un cas extrême
- [ ] Couleurs codées en dur qui cassent le thème clair
- [ ] `MILESTONES` récompense des thèmes `noir` et `midnight-sun` absents de `APP_THEMES`
- [ ] `sitemap.xml` absent pour les moteurs de recherche
- [ ] Cohérence entre styles écrits à la main et système de style

### WS-6 · Dettes connues — à faire (0 / 6)

Objectif : les chantiers identifiés mais explicitement mis de côté, chacun à reprendre pour soi. Source : mémoires persistantes du projet.
Périmètre : isolé par item.

- [ ] Collection `litterature` : auteurs vivants ou morts depuis moins de 70 ans, plus des paroles de chanson ; re-vérifier chaque entrée contre les dates de décès, spot-check poesie / philosophie / gaming
- [ ] Latence de la première note (~350 à 650 ms) : trouver pourquoi le tout premier `Tone.start()` se bloque (APIs d'activation utilisateur Chrome, autres navigateurs et OS) ; reconstruire le pipe dlog pour de vraies données
- [ ] Réconcilier `feat/redesign-ux-ui` avec `main` (ascendance cassée par le squash-merge de la PR #1)
- [ ] Retirer le garde `if (IS_DEV_MODE) return;` de `HomeClient.tsx` et supprimer `app/[locale]/dev-onboarding/` une fois l'onboarding validé
- [ ] Revoir les listes de mots type `WORDS_HOME_ROW` (mineur, différé par le plan lui-même)
- [ ] `KeyboardDiagram` par défaut en AZERTY plus abstraction de disposition (ne pas démarrer sans demande explicite)

### WS-7 · Premium — bloqué (0 / 3)

Objectif : redécider le contenu et la logique premium une fois le MVP complet et fonctionnel. Décision Mouwafic : ne pas proposer de features premium avant cette conversation.
Périmètre : `apps/web/lib/featureFlags.ts`, `app/api/stripe/*`, tables premium et RLS.
Bloqué : décision « MVP complet » non prise.

- [ ] Attendre la conversation MVP complet
- [ ] Switch premium dev-only marche / arrêt, à côté de `featureFlags.ts`, inerte en build de production
- [ ] Reprendre webhook Stripe, frontière serveur-client, RLS des tables premium (partiellement fait en Phase 1)

## Séquencement

Quatre vagues. À l'intérieur d'une vague, deux chantiers aux arbres de fichiers disjoints peuvent tourner en parallèle, un par instance (voir la section « Parallèle claude / claude2 » du `CLAUDE.md`).

- **Vague 1 :** WS-1 (accessibilité et responsive) ∥ WS-4 (sécurité et données). Disjoints : composants et CSS d'un côté, `supabase/` plus `db.ts` plus `next.config.ts` de l'autre. WS-4 démarre bloqué sur le lien Supabase ; ses tâches non-RLS avancent en attendant.
- **Vague 2 :** WS-2 (i18n et porte d'entrée) ∥ WS-3 (richesse sonore et Peak-End). Disjoints : `messages/*` plus metadata plus middleware d'un côté, couche audio plus `warp-engine` de l'autre. Point d'attention : `ResultsPage` est touché par WS-3 et par WS-5, ne pas mener WS-3 et WS-5 en même temps.
- **Vague 3 :** WS-5 (polissage) en solo ou finement découpé, il touche `HomeClient`, `ResultsPage`, le thème et `progression.ts` ; plus les items isolés de WS-6 intercalés.
- **Vague 4 :** WS-7 (premium), après le feu vert explicite de Mouwafic sur le périmètre premium.

## Journal

- **2026-09-03** : WS-1 tranche 1 (zone de frappe accessible) codée en TDD, PR #4. `role="application"` au lieu du faux `textbox`, instructions `aria-describedby`, texte cible sr-only, région live polite aux paliers de 25 %, anneau de focus clavier restauré. Gate vert (typecheck, lint, 530 tests, build). En parallèle, claude2 sur WS-4 tâche 3.
- **2026-09-02** : nettoyage de branches (ancienne `feat/redesign-ux-ui` supprimée, delta AmbientAura sur PR #3 mergée, `main` recalé), Vague 1 ouverte, assignation parallèle écrite dans `HANDOFF.md`.
- **2026-09-02** : plan de lancement créé à partir de l'audit et des mémoires. Protocole parallèle claude / claude2 écrit dans le `CLAUDE.md` local et `HANDOFF.md`.
