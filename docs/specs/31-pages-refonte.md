# Spec 31 — Refonte Autres Pages (Profil, Classement, Premium, Auth, Challenge, Replay, Transparence)

> **Créé le : 11 Mars 2026**
> **Sévérité : 🟠 HAUTE**
> **Source : FORGE_NOTES.md — Point [3]**
> **Dépendances :**
>
> - spec-15 v2 (GlobalNav) doit être terminé (présent sur toutes ces pages)
> - spec-14 (fix auth locale) doit être terminé avant les pages /auth
> - spec-35 (challenge autoNavigate) peut être fait en même temps

---

## Principes non-négociables (FORGE [3.8])

Appliqués sur toutes les pages :

| Principe                   | Application concrète                                    |
| -------------------------- | ------------------------------------------------------- |
| Pas de bordures-containers | Contenu flottant sur fond, espacement pour hiérarchie   |
| Un seul accent             | `--color-accent` teal — actifs, records, CTAs primaires |
| Cormorant pour identité    | Rang, pseudo, nom du produit                            |
| Sora/font-ui pour UI       | Labels, descriptions, copy                              |
| JetBrains Mono/font-mono   | WPM, précision, timestamps, code                        |
| Espace = hiérarchie        | Sections séparées par espace, jamais par bordures       |
| Footer identique partout   | `github · terms · privacy \| ♪ pack v[version]`         |
| Navbar floatante identique | Même GlobalNav (spec-15 v2)                             |

---

## 3.1 — Page Profil `/profil`

### Fichier à modifier

```
apps/web/app/[locale]/profil/ProfilClient.tsx
```

### Layout cible

```
[Navbar — spec-15]

APPRENTI · 69 WPM MÉDIAN          ← Rank + stats en grand, Cormorant 300
pseudo_utilisateur                 ← petit, font-ui

[  72   ][  96%  ][  88%  ][  142  ]    ← grille 2×2 flottante, valeurs en teal
[ sesses][précis ][ const ][  jours]    ← labels en --color-text-muted

[Courbe WPM — pleine largeur, axes minimalistes] ←─ WpmChart réutilisé

[Heatmap 90 jours — pleine largeur]

Replays récents
replay-id-01   87 WPM · 96% · classic · Littérature   11 Mar   |◄
replay-id-02   75 WPM · 93% · sprint                  10 Mar   |◄
replay-id-03   92 WPM · 98% · code                    09 Mar   |◄
[max 5 entrées — le 6ème écrase le plus ancien dans IndexedDB]

[Footer — spec-15]
```

### Changements concrets

```typescript
// ProfilClient.tsx

// 1. Rank line — Cormorant Garamond 300
<p style={{
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
  fontSize: '2rem',
  color: 'var(--color-text-primary)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}}>
  {t(`ranks.${userProfile.rank}`)} · {userProfile.averageWpm} WPM MÉDIAN
</p>

// 2. Pseudo — sous le rank
<p style={{
  fontFamily: 'var(--font-ui)',
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  marginTop: 4,
}}>
  {userProfile.pseudo}
</p>

// 3. Stat cards — flottantes, zéro bordure, grille 2×2
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px' }}>
  {STATS.map(({ label, value, unit }) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--color-accent)', fontSize: '2rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: '0.875rem', marginLeft: 4 }}>{unit}</span>}
      </span>
    </div>
  ))}
</div>

// 4. Section replays récents
<section>
  <h2 style={{
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 12,
  }}>
    {t('profile.recentReplays')}
  </h2>
  {recentReplays.map((replay) => (
    <div key={replay.id} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-accent)' }}>
        {replay.wpm} WPM
      </span>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {replay.accuracy}% · {replay.mode} · {formatDate(replay.timestamp)}
      </span>
      <Link href={`/${locale}/replay?id=${replay.id}`} aria-label={t('profile.openReplay')}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>|◄</span>
      </Link>
    </div>
  ))}
  {recentReplays.length === 0 && (
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
      {t('profile.noReplays')}
    </p>
  )}
</section>

// 5. Chart & Heatmap — garder l'existant, retirer les bordures de panel
//    chart : background: 'transparent', border: 'none'
//    heatmap : idem + état vide explicite (FORGE [3.1])
```

---

## 3.2 — Page Classement `/classement`

### Fichier à modifier

```
apps/web/app/[locale]/classement/ClassementClient.tsx (ou équivalent)
```

### Layout cible

```
[Navbar]

Banner honnête :
  Classement mondial disponible dès la synchronisation cloud   BIENTÔT

Mes meilleures sessions
[Tous] [Classic] [Code] [Sprint] ...

#   Mode               WPM   Précision   Date
1   classic · Litté    92    98%         11 mar
2   sprint             87    96%         10 mar
─────────────────────
[Footer]
```

### Changements concrets

```typescript
// Ajouter le banner honnête
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 32,
}}>
  <p style={{
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.875rem',
  }}>
    {t('leaderboard.comingSoonMessage')}
  </p>
  <span style={{
    color: 'var(--color-accent)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    border: '1px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px 8px',
  }}>
    {t('leaderboard.soon')}
  </span>
</div>

// Titre de section — pas de bordure, espace comme séparateur
<h2 style={{
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 16,
  marginTop: 32,
}}>
  {t('leaderboard.myBestSessions')}
</h2>

// Tableau minimaliste — lignes fines, pas de bordures de cellules
<table style={{
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.875rem',
}}>
  <thead>
    <tr>
      {['#', 'Mode', 'WPM', 'Précision', 'Date'].map((h) => (
        <th key={h} style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          fontWeight: 'normal',
          textAlign: 'left',
          padding: '0 0 8px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
  // ... rows avec border-bottom sur chaque tr
</table>
```

---

## 3.3 — Page Premium `/premium`

### Fichier à modifier

```
apps/web/app/[locale]/premium/PremiumPageClient.tsx (ou équivalent)
```

### Changements concrets

```typescript
// 1. Retirer faux badges premium sur features gratuites
// Ghost, Replay, Challenge → listés comme GRATUITS

// 2. CTA cloud sync — cache le bouton checkout, badge BIENTÔT visible
const SYNC_COMING_SOON = true; // feature flag

{SYNC_COMING_SOON ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
      {t('premium.syncComingSoon')}
    </span>
    <span style={{ /* badge BIENTÔT */ }}>
      {t('premium.soon')}
    </span>
  </div>
) : (
  <CheckoutButton />
)}

// 3. Pricing card recommandée — aura color-mix accent 8%, pas de bordure épaisse
<div style={{
  background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))',
  borderRadius: 'var(--radius-lg)',
  padding: '24px 32px',
  // pas de border: '2px solid var(--color-accent)' — juste l'aura
}}>
  ...
</div>
```

---

## 3.4 — Pages Auth `/auth/*`

### Fichiers à modifier

```
apps/web/app/[locale]/auth/login/page.tsx (ou AuthForm.tsx)
apps/web/app/[locale]/auth/signup/page.tsx
apps/web/app/[locale]/auth/reset-password/page.tsx  ← déjà couvert par spec-14
```

### Layout cible

```
[Logo NavLogo — centré en haut, lien vers home]

                username
                ┌────────────────────┐
                │                    │  ← border --color-border, focus: box-shadow accent
                └────────────────────┘
                password
                ┌────────────────────┐
                │                    │
                └────────────────────┘
                ┌────────────────────┐
                │  Se connecter      │  ← pleine largeur, --color-accent bg
                └────────────────────┘
                Pas de compte ? S'inscrire
                Mot de passe oublié ?

[Pas d'autre contenu]
```

### Changements concrets

```typescript
// Formulaire centré — aucun panel, aucune card
<main style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100dvh - 48px)', // tenir compte de la navbar
  padding: '0 24px',
}}>
  {/* Logo en haut */}
  <NavLogo locale={locale} style={{ marginBottom: 48 }} />

  {/* Formulaire — max 360px */}
  <form style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
    {/* Labels explicites (WCAG 1.3.1 — spec-22 déjà corrigé) */}
    <div>
      <label htmlFor="email" style={{ /* petit label visible */ }}>{t('auth.email')}</label>
      <input
        id="email"
        type="email"
        style={{
          width: '100%',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          padding: '10px 12px',
          // Zéro outline: none — remplacé par box-shadow au focus
        }}
      />
    </div>

    <button
      type="submit"
      style={{
        width: '100%',
        background: 'var(--color-accent)',
        color: '#000',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        padding: '12px',
        cursor: 'pointer',
      }}
    >
      {t('auth.signIn')}
    </button>

    {/* Liens inter-auth */}
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <Link href={`/${locale}/auth/signup`} style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        {t('auth.noAccount')}
      </Link>
      <Link href={`/${locale}/auth/reset-password`} style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        {t('auth.forgotPassword')}
      </Link>
    </div>
  </form>
</main>

/* CSS globals.css — focus ring (confirme spec-22) */
input:focus-visible, button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
}
```

---

## 3.5 — Page Challenge `/challenge`

> Note : Bug F-2 (autoNavigate) corrigé dans spec-35. Cette section couvre le redesign.

### Fichier à modifier

```
apps/web/app/[locale]/challenge/ChallengeClient.tsx
```

### Layout cible

```
[Navbar]

Banner slim contextuel (remplace le h1 "Challenge TypeWav") :
Challenge de [pseudo] — objectif : battre X WPM         ← --color-accent, font-ui

[Zone de frappe — identique à la home, même TypingArea]
[WaveformBars — identique Zone 5 home]

[Post-complétion centré :]
  ✓ Gagné — 90 WPM !  (ou  75 WPM — encore 10 WPM à gagner)
  [Contre-défier]   [Retour à l'accueil]

[Footer]
```

### Changements concrets

```tsx
// Remplacer le h1 par un banner slim
<div
  style={{
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-accent)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.8125rem',
    letterSpacing: '0.05em',
    marginBottom: 24,
    textAlign: 'center',
  }}
>
  {params.creatorWpm !== undefined
    ? t('challenge.bannerWithTarget', { target: params.creatorWpm })
    : t('challenge.banner')}
</div>

// Retirer le h1, padding excessif — suivre le layout home
// Garder le post-complétion existant (Réessayer + Contre-défier)
// Ajouter autoNavigate={false} sur TypingArea (spec-35)
```

---

## 3.6 — Page Replay `/replay`

### Fichier à modifier

```
apps/web/app/[locale]/replay/ReplayClient.tsx (ou équivalent)
```

### Changements

```tsx
// Banner slim en haut (remplace tout header lourd)
<div
  style={{
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.8125rem',
    textAlign: 'center',
    marginBottom: 24,
  }}
>
  Replay — {replayData.wpm} WPM · {replayData.accuracy}% · {replayData.mode}
</div>

// Zone de frappe identique à la home — TypingArea avec ghostTimings
// Pas de config bar (lecture seule)
```

---

## 3.7 — Page Transparence `/transparence`

### Changements

```tsx
// Retirer tout widget, card avec bordure
// Garder uniquement : texte long sur fond, même navbar, même footer
// Ajouter date dynamique (spec-19 — export const dynamic = 'force-dynamic')
// Typographie :
//   - Titres : Cormorant Garamond
//   - Body : font-ui (Sora), font-size: 1rem, line-height: 1.7
```

---

## Clés i18n à ajouter

**`fr.json`** :

```json
"leaderboard": {
  "comingSoonMessage": "Classement mondial disponible dès la synchronisation cloud",
  "soon": "BIENTÔT",
  "myBestSessions": "Mes meilleures sessions"
},
"premium": {
  "syncComingSoon": "Synchronisation cloud bientôt disponible",
  "soon": "BIENTÔT"
},
"challenge": {
  "banner": "Challenge TypeWav",
  "bannerWithTarget": "Objectif : battre {target} WPM"
},
"profile": {
  "recentReplays": "Replays récents",
  "openReplay": "Voir le replay",
  "noReplays": "Aucun replay sauvegardé"
}
```

**`en.json`** : (traductions correspondantes)

---

## Tests requis

```typescript
// Tests minimalistes — vérifier les invariants clés

describe('ProfilClient — structure', () => {
  it('affiche le rang et le WPM médian en grand', () => {
    /* */
  });
  it('affiche max 5 replays récents', () => {
    /* */
  });
  it('heatmap état vide : message "Jour 1 de 90"', () => {
    /* */
  });
});

describe('ClassementClient — structure', () => {
  it('affiche le banner honnête "BIENTÔT"', () => {
    /* */
  });
  it('titre section "Mes meilleures sessions" visible', () => {
    /* */
  });
});

describe('PremiumPageClient', () => {
  it('Ghost, Replay, Challenge sont listés comme gratuits', () => {
    /* */
  });
  it('bouton checkout caché si SYNC_COMING_SOON=true', () => {
    /* */
  });
  it('badge "BIENTÔT" visible si SYNC_COMING_SOON=true', () => {
    /* */
  });
});

describe('AuthForm layout', () => {
  it('affiche le NavLogo en haut', () => {
    /* */
  });
  it('inputs ont des labels', () => {
    /* */
  }); // spec-22 déjà testé
  it('liens Inscription et Mot de passe oublié présents', () => {
    /* */
  });
});
```

---

## Workflow

```
1. Modifier ProfilClient.tsx (rank line, stat grid, replays)
2. Modifier ClassementClient.tsx (banner honnête, tableau minimal)
3. Modifier PremiumPageClient.tsx (features gratuites, SYNC_COMING_SOON)
4. Modifier AuthForm.tsx (layout centré, NavLogo, focus ring confirmé)
5. Modifier ChallengeClient.tsx (banner slim, retirer h1 lourd)
6. Modifier ReplayClient.tsx (banner slim)
7. Vérifier transparence — date dynamique, retirer cards
8. Ajouter i18n fr.json + en.json
9. Vérifier footer identique sur toutes les pages
10. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
11. Commit
```

---

## Commit

```
feat(pages): apply FORGE [3] design direction to all secondary pages

Profil: rank+WPM in Cormorant 300, borderless stat grid, recent replays section
Leaderboard: honest banner "BIENTÔT" + "Mes meilleures sessions" section
Premium: remove fake premium badges on free features, SYNC_COMING_SOON gate
Auth pages: centered floating form + NavLogo, no panel/card borders
Challenge: slim contextual banner replacing heavy h1
Replay: slim banner, no config bar (read-only session)
Transparence: typography cleanup, dynamic date, no widget borders

Non-negotiable principles applied everywhere: no container-borders,
single accent, Cormorant for identity, space = hierarchy, identical footer.
```
