# Spec 11 — Refonte Audit 2026 — Backlog Complet et Ordonné

> **Créé le : 10 Mars 2026**
> Source : audit APEX produit sur la base de l'analyse complète du codebase.
> Ce document est le **backlog unique de référence** pour la phase Refonte.
> Chaque item a sa propre spec détaillée dans `docs/specs/12-21-*.md`.

---

## Contexte

TypeWav a été entièrement vibe-codé par GitHub Copilot (Claude) en Phase 0-4.
Le codebase est architecturalement solide : TypeScript strict, TDD, monorepo propre, design system cohérent.
L'audit a identifié **18 axes d'amélioration**, dont 4 critiques qui bloquent le déploiement public.

---

## Tableau de bord — statut global

| #   | Titre                             | Spec     | Sévérité    | Statut                       |
| --- | --------------------------------- | -------- | ----------- | ---------------------------- |
| 1   | Fix wpmNet dans les résultats     | spec-12  | 🔴 CRITIQUE | ⬜ À faire                   |
| 2   | Implémenter backspace             | spec-13  | 🔴 CRITIQUE | ⬜ À faire                   |
| 3   | Fix redirect post-login locale    | spec-14  | 🔴 CRITIQUE | ⬜ À faire                   |
| 4   | Gate sync cloud (pas encore prod) | spec-16  | 🔴 CRITIQUE | ⬜ À faire                   |
| 5   | Navigation globale persistante    | spec-15  | 🟠 HAUTE    | ⬜ À faire                   |
| 6   | Ajout reset password              | spec-14  | 🟠 HAUTE    | ⬜ À faire                   |
| 7   | Lazy loading des collections      | spec-18  | 🟡 MOYEN    | ⬜ À faire                   |
| 8   | Fix i18n hint text TypingArea     | spec-19  | 🟡 MOYEN    | ⬜ À faire                   |
| 9   | Focus indicator WCAG AA           | spec-19  | 🟡 MOYEN    | ⬜ À faire                   |
| 10  | Ghost mode discoverability        | spec-20  | 🟡 MOYEN    | ⬜ À faire                   |
| 11  | Indicateur mode/collection typing | spec-20  | 🟡 MOYEN    | ⬜ À faire                   |
| 12  | Transparence : date dynamique     | spec-19  | 🟡 MOYEN    | ⬜ À faire                   |
| 13  | SEO / OG / structured data        | spec-17  | 🔵 VISION   | ⬜ À faire                   |
| 14  | Preview sonore sur landing        | spec-21  | 🔵 VISION   | ⬜ À faire                   |
| 15  | Rang en contexte home page        | spec-21  | 🔵 VISION   | ⬜ À faire                   |
| 16  | URLs canoniques sans locale       | spec-17  | 🔵 VISION   | ⬜ À faire                   |
| 17  | Supabase client memoization audit | spec-14  | 🟠 HAUTE    | ✅ Déjà correct              |
| 18  | Classes CSS .char-\* vérification | (inline) | 🟠 HAUTE    | ✅ Définies dans globals.css |

---

## 🔴 CRITIQUE — Détail des 4 items bloquants

### Item 1 — Fix wpmNet dans les résultats

**Problème** : `ResultsPageClient.tsx` passe `wpmNet={wpm}` au lieu de lire `wpmNet` depuis les URL params. La métrique nette est identique à la métrique brute. Un utilisateur avec 20 erreurs voit le même score net que brut.

**Impact** : Integrity systémique compromise. La différenciation principale par rapport à MonkeyType (scoring honnête) est silencieusement cassée.

**Fix** : 2 fichiers, ~10 lignes de changement. Voir `docs/specs/12-fix-wpmnet.md`.

**Commit** : `fix(diagnostic): pass wpmNet to results URL params`

---

### Item 2 — Implémenter backspace

**Problème** : `TypingArea.tsx` retourne silencieusement sur `Backspace`. `useSession.ts` expose `handleBackspace` mais c'est un stub vide. `useSessionStore` n'a pas d'action `moveBack`.

**Impact** : Premier bloquant de rétention. Tout utilisateur faisant une faute est bloqué. Incomparable avec MonkeyType, 10fastfingers, Keybr, tous supportant backspace.

**Fix** : 3 fichiers (store + hook + composant). Voir `docs/specs/13-fix-backspace.md`.

**Commit** : `fix(typing): implement backspace correction in TypingArea and useSessionStore`

---

### Item 3 — Fix redirect post-login

**Problème** : `AuthForm.tsx` fait `router.push('/')` après login. L'application route sous `/[locale]/`. Rediriger vers `/` bypasse `NextIntlClientProvider` et casse toutes les traductions.

**Impact** : Authentification fonctionnellement cassée pour les utilisateurs en locale `en` ou si la locale par défaut n'est pas interceptée correctement par le middleware.

**Fix** : 1 fichier (`AuthForm.tsx`), `useLocale()` de next-intl. Voir `docs/specs/14-fix-auth-locale.md`.

**Commit** : `fix(auth): use current locale in post-login redirect`

---

### Item 4 — Gate cloud sync

**Problème** : Stripe checkout est live. `sync.ts` est écrit et testé mais la synchronisation n'est pas wired en production (Supabase schema + tables `user_sessions` non confirmées opérationnelles). Un utilisateur peut payer €4.99/mois pour une feature qui ne fonctionne pas.

**Impact** : Trust violation. Exposé légalement (pratique commerciale trompeuse). Risque de chargebacks.

**Fix** : Badge "Bientôt disponible" sur la feature sync dans la page premium + banner d'information. Voir `docs/specs/16-cloud-sync-gate.md`.

**Commit** : `fix(sync): display coming-soon state for cloud sync on premium page`

---

## 🟠 HAUTE PRIORITÉ — Sprint suivant

### Item 5 — Navigation globale persistante

**Problème** : Aucun composant de navigation global n'existe. Les pages `profil`, `classement`, `premium`, `replay` sont invisibles sans connaître les URLs.

**Impact** : Zero discoverability. Le Skeptic fait un test, voit les résultats, a nulle part où aller.

**Fix** : Créer `GlobalNav.tsx`, l'intégrer dans `[locale]/layout.tsx`. Voir `docs/specs/15-global-navigation.md`.

**Commit** : `feat(nav): add persistent GlobalNav component`

---

### Item 6 — Reset password

**Problème** : `AuthForm` a login + signup. Aucun lien "Mot de passe oublié ?". Pour un produit monetisé, les utilisateurs qui oublient leur mot de passe après paiement sont bloqués définitivement.

**Fix** : Page `auth/reset-password/` + lien depuis login. Voir `docs/specs/14-fix-auth-locale.md`.

**Commit** : `feat(auth): add password reset page and forgot-password link`

---

## 🟡 MOYEN TERME — Ce trimestre

### Items 7-12 résumés

| Item                        | Fix                                                                                  | Effort  |
| --------------------------- | ------------------------------------------------------------------------------------ | ------- |
| Lazy loading collections    | Charger seulement la collection active, lazy les autres                              | Moyen   |
| i18n hint text TypingArea   | `useTranslations('typing')` + clé `typing.hint` dans messages/                       | Petit   |
| Focus indicator WCAG        | Remplacer `focus:outline-none` par `focus-visible:ring-2` avec `var(--color-accent)` | Petit   |
| Ghost discoverability       | Locked state avec explication au lieu d'absence du bouton                            | Moyen   |
| Mode/collection indicator   | Ligne de contexte au-dessus de la zone de frappe                                     | Petit   |
| Transparence date dynamique | `export const dynamic = 'force-dynamic'`                                             | Trivial |

---

## 🔵 VISION — Post-refonte critique

### Items 13-16 résumés

| Item                        | Valeur                                     | Effort |
| --------------------------- | ------------------------------------------ | ------ |
| SEO / OG / structured data  | Capture traffic organique "musical typing" | Moyen  |
| Preview sonore landing      | Proof-of-value avant première frappe       | Élevé  |
| Rang en contexte home       | Boucle de partage organic                  | Petit  |
| URLs canoniques sans locale | Virality tax elimination                   | Moyen  |

---

## Métriques de succès de la Refonte

Après completion des items CRITIQUES et HAUTE PRIORITÉ :

- [ ] `wpmNet` affiché correctement dans les résultats (valeur différente de `wpm` si erreurs)
- [ ] Backspace fonctionnel : position recule, keystroke précédent retiré
- [ ] Login en locale `en` redirige vers `/en/` et non `/`
- [ ] Page premium affiche clairement que la sync cloud est "Bientôt disponible"
- [ ] Navigation persistante visible sur toutes les pages
- [ ] Lien "Mot de passe oublié" présent sur la page login
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` : 0 erreur
