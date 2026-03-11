# Spec 23 — Sweep i18n complet : élimination de toutes les strings hardcodées

> **Créé le : 10 Mars 2026**
> **Sévérité : HAUTE**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #20**
> **Dépendance : spec-22 (AuthForm) peut être faite avant ou après, indépendant**

---

## Problème

Malgré une architecture i18n complète (next-intl, fr.json + en.json), ~20 strings UI
visibles sont hardcodées en français dans les composants. Les utilisateurs anglophones
voient du contenu français. Regel de guardrail violée :
`❌ Texte UI visible hardcodé dans un composant (doit passer par next-intl)`

---

## Inventaire exhaustif des strings à corriger

### `MilestoneToast.tsx`

| Ligne | String hardcodée      | Clé i18n à utiliser                        |
| ----- | --------------------- | ------------------------------------------ |
| ~60   | `"Jalon débloqué !"`  | `t('progression.milestoneUnlocked')`       |
| ~68   | `{milestone.labelFr}` | Voir section "Sélection locale" ci-dessous |

**Sélection locale pour le label Milestone :**

Le type `Milestone` (dans `packages/types/src/progression.ts`) possède déjà `labelFr` ET
`labelEn`. Il suffit d'utiliser `useLocale()` pour choisir le bon champ :

```tsx
const locale = useLocale();
// ...
{
  locale === 'fr' ? milestone.labelFr : milestone.labelEn;
}
```

Ne PAS modifier le type `Milestone` — `labelEn` existe déjà.

### `LeaderboardTable.tsx`

| String hardcodée                                                      | Clé i18n à utiliser               |
| --------------------------------------------------------------------- | --------------------------------- |
| Header `"#"`                                                          | `t('leaderboard.rankHeader')`     |
| Header `"Pseudo"`                                                     | `t('leaderboard.pseudoHeader')`   |
| Header `"WPM"`                                                        | `t('leaderboard.wpmHeader')`      |
| Header `"Précision"`                                                  | `t('leaderboard.accuracyHeader')` |
| Header `"Mode"`                                                       | `t('leaderboard.modeHeader')`     |
| `"vous"` (badge joueur courant)                                       | `t('leaderboard.you')`            |
| `"Aucun score cette semaine. Complétez un test pour apparaître ici."` | `t('leaderboard.noData')`         |

`LeaderboardTable` est un Client Component (`'use client'`), donc `useTranslations()` fonctionne.

### `ProfilClient.tsx`

| String hardcodée                | Clé i18n à utiliser                                    |
| ------------------------------- | ------------------------------------------------------ |
| `"Profil"` (titre h1)           | `t('profile.title')`                                   |
| `"{n} session(s) complétée(s)"` | `t('profile.sessionCount', { count: n })` avec pluriel |
| `"WPM moyen"`                   | `t('profile.avgWpm')`                                  |
| `"Précision moy."`              | `t('profile.avgAccuracy')`                             |
| `"Record WPM"`                  | `t('profile.recordWpm')`                               |
| `"Record précision"`            | `t('profile.recordAccuracy')`                          |
| `"Progression WPM"`             | `t('profile.wpmProgress')`                             |
| `"Activité — 90 jours"`         | `t('profile.activity90Days')`                          |
| `"← Retour au test"`            | `t('common.backToTyping')`                             |
| `"{n}j"` (filtre jours)         | `t('profile.daysFilter', { count: n })`                |
| `"Chargement…"` (loading)       | `t('common.loading')`                                  |

### `PremiumPageClient.tsx`

| String hardcodée                                                    | Clé i18n à utiliser                          |
| ------------------------------------------------------------------- | -------------------------------------------- |
| `"✦ Vous êtes Premium"`                                             | `t('premium.alreadyPremium')`                |
| `"Tous les packs sonores et fonctionnalités cloud sont débloqués."` | `t('premium.alreadyPremiumDesc')`            |
| `"← Retour au typing"`                                              | `t('common.backToTyping')`                   |
| `"TypeWav Premium"` (titre h1)                                      | `t('premium.title')`                         |
| `"Des sons cinématiques. Votre musique, votre rythme."`             | `t('premium.subtitle')`                      |
| `"Mensuel"`                                                         | `t('premium.monthly')`                       |
| `"par mois · sans engagement"`                                      | `t('premium.monthlyDesc')`                   |
| `"Annuel"`                                                          | `t('premium.annual')`                        |
| `"par an · 3,33 €/mois"`                                            | `t('premium.annualDesc')`                    |
| `"MEILLEUR PRIX · −33 %"`                                           | `t('premium.bestPrice')`                     |
| `"Souscrire"` / `"Se connecter"` (CTA)                              | `t('premium.subscribe')` / `t('auth.login')` |
| `"Transparence financière →"`                                       | `t('premium.financialTransparency')`         |
| `"← Retour"`                                                        | `t('common.back')`                           |
| `"Chargement…"`                                                     | `t('common.loading')`                        |

---

## Clés à ajouter dans `fr.json` et `en.json`

### Namespace `"common"` — nouvelles clés

```json
// fr.json
"common": {
  "loading": "Chargement…",
  "back": "← Retour",
  "backToTyping": "← Retour au test",
  "daysShort": "j"
}

// en.json
"common": {
  "loading": "Loading…",
  "back": "← Back",
  "backToTyping": "← Back to typing",
  "daysShort": "d"
}
```

### Namespace `"progression"` — nouvelle clé

```json
// fr.json
"progression": {
  "milestoneUnlocked": "Jalon débloqué !"
  // + existantes
}

// en.json
"progression": {
  "milestoneUnlocked": "Milestone unlocked!"
  // + existantes
}
```

### Namespace `"profile"` — nouvelles clés

```json
// fr.json
"profile": {
  "title": "Profil",
  "sessionCount_one": "{count} session complétée",
  "sessionCount_other": "{count} sessions complétées",
  "avgWpm": "WPM moyen",
  "avgAccuracy": "Précision moy.",
  "recordWpm": "Record WPM",
  "recordAccuracy": "Record précision",
  "wpmProgress": "Progression WPM",
  "activity90Days": "Activité — 90 jours",
  "daysFilter": "{count}j"
}

// en.json
"profile": {
  "title": "Profile",
  "sessionCount_one": "{count} session completed",
  "sessionCount_other": "{count} sessions completed",
  "avgWpm": "Avg. WPM",
  "avgAccuracy": "Avg. accuracy",
  "recordWpm": "WPM record",
  "recordAccuracy": "Accuracy record",
  "wpmProgress": "WPM progress",
  "activity90Days": "Activity — 90 days",
  "daysFilter": "{count}d"
}
```

### Namespace `"leaderboard"` — clés à vérifier/ajouter

```json
// fr.json
"leaderboard": {
  "rankHeader": "#",
  "pseudoHeader": "Pseudo",
  "wpmHeader": "WPM",
  "accuracyHeader": "Précision",
  "modeHeader": "Mode",
  "you": "vous",
  "noData": "Aucun score cette semaine. Complétez un test pour apparaître ici."
  // + existantes
}

// en.json
"leaderboard": {
  "rankHeader": "#",
  "pseudoHeader": "Pseudo",
  "wpmHeader": "WPM",
  "accuracyHeader": "Accuracy",
  "modeHeader": "Mode",
  "you": "you",
  "noData": "No scores this week. Complete a session to appear here."
  // + existantes
}
```

### Namespace `"premium"` — nouvelles clés

```json
// fr.json
"premium": {
  "alreadyPremium": "✦ Vous êtes Premium",
  "alreadyPremiumDesc": "Tous les packs sonores et fonctionnalités cloud sont débloqués.",
  "title": "TypeWav Premium",
  "subtitle": "Des sons cinématiques. Votre musique, votre rythme.",
  "monthly": "Mensuel",
  "monthlyDesc": "par mois · sans engagement",
  "annual": "Annuel",
  "annualDesc": "par an · 3,33 €/mois",
  "bestPrice": "MEILLEUR PRIX · −33 %",
  "subscribe": "Souscrire",
  "financialTransparency": "Transparence financière →"
  // + existantes (comingSoon, etc.)
}

// en.json
"premium": {
  "alreadyPremium": "✦ You are Premium",
  "alreadyPremiumDesc": "All sound packs and cloud features are unlocked.",
  "title": "TypeWav Premium",
  "subtitle": "Cinematic sounds. Your music, your rhythm.",
  "monthly": "Monthly",
  "monthlyDesc": "per month · no commitment",
  "annual": "Annual",
  "annualDesc": "per year · €3.33/month",
  "bestPrice": "BEST PRICE · −33 %",
  "subscribe": "Subscribe",
  "financialTransparency": "Financial transparency →"
}
```

---

## Contraintes d'implémentation

- `MilestoneToast` : ajouter `const locale = useLocale()` — ne pas créer un nouveau
  namespace, utiliser `useTranslations('progression')`
- `LeaderboardTable` : déjà un Client Component — ajouter `const t = useTranslations('leaderboard')`
- `ProfilClient` : already a Client Component — utiliser `useTranslations('profile')` +
  `useTranslations('common')`
- **Pluriels next-intl** : utiliser `t('profile.sessionCount', { count: n })` avec
  les suffixes `_one` / `_other` pour le pluriel ICU. Vérifier la doc next-intl 4.x.
- Ne pas casser les clés existantes — ajouter seulement, ne jamais renommer/supprimer une clé existante

---

## Tests requis

Fichier : `apps/web/components/__tests__/MilestoneToast.test.tsx`

```typescript
describe('MilestoneToast — i18n', () => {
  it('affiche le label EN pour locale en', () => {
    // mock useLocale → 'en'
    // render SingleToast avec milestone { labelFr: 'Test FR', labelEn: 'Test EN' }
    // expect screen.getByText('Test EN')
    // expect screen.queryByText('Test FR').not.toBeInTheDocument()
  });

  it('affiche le label FR pour locale fr', () => {
    // mock useLocale → 'fr'
    // expect screen.getByText('Test FR')
  });

  it('title utilise la clé i18n, pas du texte hardcodé', () => {
    // Le composant doit appeler t('progression.milestoneUnlocked')
    // Mocker useTranslations → vérifier que la clé est appelée
  });
});
```

Fichier : `apps/web/components/__tests__/LeaderboardTable.test.tsx`

```typescript
describe('LeaderboardTable — i18n', () => {
  it('état vide affiche t(leaderboard.noData)', () => {
    render(<LeaderboardTable entries={[]} />)
    // le mock useTranslations retourne la clé : 'leaderboard.noData'
    expect(screen.getByText('leaderboard.noData')).toBeInTheDocument()
  })

  it('badge "vous" utilise t(leaderboard.you)', () => {
    render(<LeaderboardTable entries={[mockEntry]} currentUserPseudo="alice" />)
    expect(screen.getByText('leaderboard.you')).toBeInTheDocument()
  })
})
```

---

## Workflow

```
1. Mettre à jour fr.json et en.json avec toutes les nouvelles clés
2. Modifier MilestoneToast.tsx : useLocale + t('progression.milestoneUnlocked')
3. Modifier LeaderboardTable.tsx : useTranslations + toutes les 7 strings
4. Modifier ProfilClient.tsx : useTranslations + toutes les 11 strings
5. Modifier PremiumPageClient.tsx : useTranslations + toutes les 13 strings
6. Écrire les tests
7. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
8. Commit atomique
```

## Commit

```
fix(i18n): replace all hardcoded FR strings with useTranslations

- MilestoneToast: use t(progression.milestoneUnlocked) + locale-aware label
- LeaderboardTable: use t() for all 7 hardcoded strings
- ProfilClient: use t(profile.*) for all 11 hardcoded strings
- PremiumPageClient: use t(premium.*) for all 13 hardcoded strings
- Add common.loading, common.back, common.backToTyping keys (fr + en)
- Add profile.* namespace with pluralized sessionCount (fr + en)
- Add leaderboard.* header keys (fr + en)
- Add premium.* keys (fr + en)

Zero hardcoded French strings remain in rendered components
```
