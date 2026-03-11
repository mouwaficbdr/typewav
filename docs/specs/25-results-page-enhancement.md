# Spec 25 — Page de résultats : détection de records, CTAs, ordre StatCard

> **Créé le : 10 Mars 2026**
> **Sévérité : HAUTE**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #22**
> **Dépendance : spec-12 (wpmNet) doit être terminé avant — fournit sessionId correct**

> ## ⚠️ SUPERSÉDÉE PAR SPEC-30
>
> **Mise à jour le : 11 Mars 2026**
>
> Cette spec est entièrement absorbée par **`docs/specs/30-results-refonte.md`** (FORGE [2]).
>
> spec-30 couvre tout ce que spec-25 prévoyait (StatCard order, PB detection, CTAs)
> **plus** un redesign complet du layout (2 colonnes, WpmChart, SessionWaveform overlay,
> barre d'actions 4 icônes, recommandation personnalisée).
>
> **Ne pas implémenter spec-25 séparément.** Utiliser spec-30 directement.
>
> Le contenu ci-dessous est conservé à titre de référence historique.

---

## Problème

La page de résultats est un cul-de-sac :

- Un seul CTA : "Rejouer" → `/`
- `sessionId` reçu en prop mais jamais rendu ni utilisé
- Les clés i18n `results.newRecord`, `results.shareReplay`, `results.challenge`,
  `results.nextText` sont définies dans fr.json et en.json mais aucune n'est rendue
- L'ordre des éléments dans `StatCard` est number → unit → label (contre-intuitif)
- Aucune détection ni célébration des records personnels

---

## Solution

### Fichiers à modifier

- `apps/web/components/typing/ResultsPage.tsx`
- `apps/web/app/[locale]/results/ResultsPageClient.tsx`
- `apps/web/lib/db.ts` (vérifier que `getPersonalRecords()` est accessible)

### Changement 1 — Ordre StatCard : label → number → unit

```tsx
// ACTUEL (contre-intuitif)
function StatCard({ label, value, unit, delay }) {
  return (
    <motion.div ...>
      <span style={{ fontSize: '2.5rem', color: 'var(--color-accent)' }}>
        {Math.round(value)}
      </span>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        {unit}
      </span>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
        {label}
      </span>
    </motion.div>
  )
}

// APRÈS (ordre naturel : label → nombre → unité)
function StatCard({ label, value, unit, delay, isRecord }) {
  return (
    <motion.div ...>
      {/* 1. Label en haut */}
      <span style={{
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </span>
      {/* 2. Valeur principale */}
      <span style={{
        color: isRecord ? 'var(--color-accent)' : 'var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '2.5rem',
        fontWeight: '600',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: '1',
      }}>
        {Math.round(value)}
      </span>
      {/* 3. Unité en bas */}
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        {unit}
      </span>
    </motion.div>
  )
}
```

### Changement 2 — Détection de record personnel

`ResultsPage` doit comparer le `wpm` de la session avec `records.maxWpm.value`.

**Approche** : charger les records depuis IndexedDB dans `ResultsPageClient` et
les passer en props à `ResultsPage`. Ne pas appeler IndexedDB dans un composant qui
peut être rendu en SSR.

```tsx
// ResultsPageClient.tsx — APRÈS (charger les records pour comparaison)
'use client';

import { ResultsPage } from '@/components/typing/ResultsPage';
import { getPersonalRecords } from '@/lib/db';
import type { PersonalRecords } from '@typewav/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ResultsPageClient() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<PersonalRecords | null>(null);

  const wpm = Number(searchParams.get('wpm') ?? '0');
  const wpmNet = Number(searchParams.get('wpmNet') ?? '0');
  const accuracy = Number(searchParams.get('accuracy') ?? '0');
  const consistency = Number(searchParams.get('consistency') ?? '0');
  const recommendation = searchParams.get('recommendation') ?? '';
  const sessionId = searchParams.get('id') ?? undefined;

  useEffect(() => {
    getPersonalRecords().then(setRecords);
  }, []);

  const isNewWpmRecord = records !== null && wpm > records.maxWpm.value;
  const isNewAccuracyRecord =
    records !== null && accuracy > records.maxAccuracy.value;

  return (
    <ResultsPage
      wpm={wpm}
      wpmNet={wpmNet}
      accuracy={accuracy}
      consistency={consistency}
      recommendation={recommendation}
      sessionId={sessionId}
      isNewWpmRecord={isNewWpmRecord}
      isNewAccuracyRecord={isNewAccuracyRecord}
    />
  );
}
```

### Changement 3 — Bannière "Nouveau record" dans ResultsPage

```tsx
// ResultsPage.tsx — AJOUTER dans les props
interface ResultsPageProps {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  recommendation: string;
  sessionId?: string;
  isNewWpmRecord?: boolean;
  isNewAccuracyRecord?: boolean;
}
```

Ajouter avant les StatCards :

```tsx
{
  (isNewWpmRecord || isNewAccuracyRecord) && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : 0.05,
      }}
      style={{
        border: '1px solid var(--color-accent)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 24px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--color-accent)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
      aria-live="polite"
      role="status"
    >
      ✦ {t('results.newRecord')}
    </motion.div>
  );
}
```

### Changement 4 — CTAs additionnels

Utiliser les fonctions déjà existantes :

- `generateReplayLink(data)` depuis `apps/web/lib/replay.ts` — génère le lien replay
- URL challenge depuis `apps/web/lib/challenge.ts`

**Contrainte** : `ResultsPage` reçoit `sessionId`. Pour générer un replay link, il faut
les données complètes de session (keystrokes timings). Ces données ne sont pas dans les
URL params actuellement.

**Approche pragmatique** : Générer les liens directement sans données de replay complètes
si `sessionId` est absent. Ajouter les CTAs "Voir mon profil" et "Partager" même sans
replay full-data.

```tsx
// ResultsPage.tsx — Section actions APRÈS
<motion.div ... className="flex flex-wrap gap-3 justify-center">
  {/* CTA principal — rejouer */}
  <Link
    href="/"
    style={{
      backgroundColor: 'var(--color-accent)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-bg)',
      fontFamily: 'var(--font-ui)',
      fontWeight: '600',
      letterSpacing: '0.05em',
      padding: '10px 24px',
      textDecoration: 'none',
      fontSize: '0.875rem',
    }}
  >
    {t('results.tryAgain')}
  </Link>

  {/* CTA secondaire — profil */}
  <Link
    href={`/${locale}/profil`}
    style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-text-muted)',
      fontFamily: 'var(--font-ui)',
      fontSize: '0.875rem',
      padding: '10px 24px',
      textDecoration: 'none',
      transition: 'color var(--transition-fast), border-color var(--transition-fast)',
    }}
  >
    {t('profile.title')}
  </Link>
</motion.div>
```

**Note** : `t('results.shareReplay')` et `t('results.challenge')` seront ajoutés quand
le replay complet est disponible dans le sessionId (phase future, pas dans cette spec).

---

## Interface TypeScript mise à jour

```typescript
// ResultsPage.tsx — props interface complète
interface ResultsPageProps {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  recommendation: string;
  sessionId?: string;
  isNewWpmRecord?: boolean; // ← NOUVEAU
  isNewAccuracyRecord?: boolean; // ← NOUVEAU
}
```

---

## Tests requis

```typescript
// apps/web/components/__tests__/ResultsPage.test.tsx

describe('ResultsPage — record detection', () => {
  it('affiche la bannière nouveau record quand isNewWpmRecord=true', () => {
    render(<ResultsPage wpm={90} wpmNet={85} accuracy={98} consistency={88}
                        recommendation="" isNewWpmRecord={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    // Le texte "results.newRecord" (clé i18n mockée) est visible
  })

  it("n'affiche pas la bannière record quand isNewWpmRecord=false", () => {
    render(<ResultsPage wpm={50} wpmNet={47} accuracy={95} consistency={80}
                        recommendation="" isNewWpmRecord={false} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('StatCard : ordre label → number → unit correct', () => {
    render(<ResultsPage wpm={75} wpmNet={70} accuracy={97} consistency={85}
                        recommendation="" />)
    // Vérifier que le label "WPM brut" précède la valeur 75 dans le DOM
    const labels = screen.getAllByText(/wpm brut/i)
    expect(labels[0]).toBeInTheDocument()
  })

  it('affiche le lien profil dans les CTAs', () => {
    render(<ResultsPage wpm={75} wpmNet={70} accuracy={97} consistency={85}
                        recommendation="" />)
    expect(screen.getByRole('link', { name: /profil/i })).toBeInTheDocument()
  })
})

// apps/web/app/[locale]/results/__tests__/ResultsPageClient.test.tsx
describe('ResultsPageClient — détection record', () => {
  it('isNewWpmRecord=true quand wpm > records.maxWpm.value', async () => {
    // Mock getPersonalRecords → { maxWpm: { value: 70 } }
    // searchParams: wpm=80
    // Render → ResultsPage doit recevoir isNewWpmRecord=true
  })

  it('isNewWpmRecord=false quand wpm <= records.maxWpm.value', async () => {
    // Mock getPersonalRecords → { maxWpm: { value: 90 } }
    // searchParams: wpm=80
    // → isNewWpmRecord=false
  })
})
```

---

## Workflow

```
1. Modifier l'interface ResultsPageProps (ajouter isNewWpmRecord, isNewAccuracyRecord)
2. Modifier StatCard : changer l'ordre des éléments (label→number→unit)
3. Ajouter la bannière "Nouveau record" dans ResultsPage
4. Ajouter les CTAs profil + replay dans ResultsPage
5. Modifier ResultsPageClient : charger getPersonalRecords, calculer isNewWpmRecord
6. Écrire les tests RED
7. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
8. Commit
```

## Commit

```
feat(results): personal best detection, profile CTA, StatCard order

- ResultsPageClient: load PersonalRecords from IndexedDB post-session
- ResultsPage: show "New record" banner when wpm > records.maxWpm.value
- ResultsPage: add profile link CTA alongside "Try again"
- StatCard: fix element order to label → number → unit (was reversed)
- isNewWpmRecord and isNewAccuracyRecord props control banner visibility

Converts results page from dead-end into retention moment
```
