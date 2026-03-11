# Spec 30 — Page Résultats : Refonte Complète (FORGE [2])

> **Créé le : 11 Mars 2026**
> **Sévérité : 🔵 VISION (+ absorbe spec-25 🟠 HAUTE)**
> **Source : FORGE_NOTES.md — Point [2]**
> **Dépendances :**
>
> - spec-12 (fix wpmNet) DOIT être terminé avant (fournit les données correctes)
> - spec-25 (record detection, StatCard order) : **absorbée par cette spec**
> - spec-27 (waveform) doit être terminé — SessionWaveform est utilisé ici
> - spec-15 v2 (GlobalNav) doit être terminé (présence de la nav)

> ⚠️ **Note** : spec-25 est entièrement couverte par cette spec.
> Toutes les améliorations spec-25 (StatCard order, bannière record, CTAs)
> sont incluses ici dans un redesign complet. Ne pas implémenter spec-25 séparément.

---

## Vision

Layout MonkeyType Results, adapté aux dimensions et différenciateurs TypeWav.
Deux colonnes, graphique WPM avec SessionWaveform en overlay, barre d'actions 4 icônes.

---

## Structure

```
┌───────────────────────────────┬────────────────────────────────────────┐
│  Colonne gauche                │  Zone centrale — graphique WPM          │
│                                │  + SessionWaveform overlay              │
│  wpm                           │                                         │
│  87                            │  [courbe raw (gris)]                    │
│                                │  [courbe net (teal) ──────────────────] │
│  wpm net                       │  [SessionWaveform (overlay, opacité 15%)]│
│  82                            │                                         │
│                                │  Stats secondaires (ligne horizontale)  │
│  précision                     │  raw  |  characters  |  consist  | durée│
│  96%                           │  72      272/9/1/0      63%       51s   │
│                                │                                         │
│  mode                          │  Barre d'actions — 4 icônes             │
│  classic · Littérature         │  [>]    [↺]    [♪]    [|◄]             │
│                                │                                         │
│  ▔ record  (si record)         │  Recommandation personnalisée           │
│                                │  "Tes bigrams les plus lents..."        │
│                                │                                         │
│                                │  CTA connexion (si non connecté)        │
│                                │  Se connecter pour sauvegarder          │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## Fichiers à modifier / créer

```
# Modifier significativement
apps/web/components/typing/ResultsPage.tsx        ← refonte complète du layout
apps/web/app/[locale]/results/ResultsPageClient.tsx ← passer noteEvents, durationMs, records

# Créer
apps/web/components/typing/WpmChart.tsx           ← NOUVEAU : graphique WPM (recharts ou SVG)
```

---

## Colonne gauche — Stats primaires

### Props interface mise à jour

```typescript
// ResultsPage.tsx — interface complète

import type { NoteEvent } from '@typewav/types';

interface ResultsPageProps {
  // ── Métriques core ────────────────────────────────────────────────────
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  /** Durée totale en ms */
  durationMs: number;
  /** WPM brut (avant pénalités) — pour le graphique */
  wpmRaw?: number;
  /** Nombre d'erreurs */
  errorCount?: number;
  /** Données de frappe pour le graphique WPM */
  keystrokeData?: Array<{
    wpmAtWord: number;
    errorCount: number;
    wordIndex: number;
  }>;
  // ── Session metadata ──────────────────────────────────────────────────
  mode: TypingMode;
  collectionId?: string;
  sessionId?: string;
  // ── Waveform ──────────────────────────────────────────────────────────
  noteEvents?: NoteEvent[];
  // ── Records ───────────────────────────────────────────────────────────
  isNewWpmRecord?: boolean;
  isNewAccuracyRecord?: boolean;
}
```

### Rendu colonne gauche

```tsx
// ResultsPage.tsx — colonne gauche

const LEFT_STATS = [
  {
    label: t('results.wpm'),
    value: wpm,
    unit: 'wpm',
    isRecord: isNewWpmRecord,
  },
  { label: t('results.wpmNet'), value: wpmNet, unit: 'wpm net' },
  {
    label: t('results.accuracy'),
    value: accuracy,
    unit: '%',
    isRecord: isNewAccuracyRecord,
  },
  { label: `${mode} · ${collectionId ?? ''}`, value: null, unit: '' },
];

function StatPrimary({
  label,
  value,
  isRecord,
}: {
  label: string;
  value: number | null;
  isRecord?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1. Label */}
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      {/* 2. Valeur */}
      {value !== null && (
        <span
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '2.5rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            position: 'relative',
          }}
        >
          {Math.round(value)}
          {/* Record : ligne fine sous le chiffre */}
          {isRecord && (
            <span
              role="status"
              aria-label={t('results.newRecord')}
              style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                width: '100%',
                height: 1,
                backgroundColor: 'var(--color-accent)',
              }}
            />
          )}
        </span>
      )}
      {/* Label "record" si record — subtil, sous le chiffre */}
      {isRecord && (
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {t('results.record')}
        </span>
      )}
    </div>
  );
}
```

---

## Zone centrale — Graphique WPM + SessionWaveform overlay

```tsx
// WpmChart.tsx — composant graphique WPM
'use client';

/**
 * WpmChart — graphique WPM de la session.
 *
 * Courbes : raw (gris) + net (teal) + tendance (teal pointillé).
 * Points erreurs : var(--color-error).
 * SessionWaveform en overlay fond (opacité 0.15).
 *
 * Utilise SVG natif (pas de lib externe pour garder le bundle léger).
 * Client Component justifié : dimensions dynamiques (ResizeObserver).
 */

import type { NoteEvent } from '@typewav/types';
import { SessionWaveform } from './SessionWaveform';
import { useRef, useState, useEffect } from 'react';

interface WpmPoint {
  wordIndex: number;
  wpmRaw: number;
  wpmNet: number;
  hasError: boolean;
}

interface WpmChartProps {
  points: WpmPoint[];
  noteEvents?: NoteEvent[];
  durationMs: number;
  width?: number;
  height?: number;
}

export function WpmChart({
  points,
  noteEvents = [],
  durationMs,
  width = 600,
  height = 200,
}: WpmChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry!.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const effectiveWidth = containerWidth;
  const maxWpm = Math.max(...points.map((p) => p.wpmRaw), 1);
  const paddingX = 40;
  const paddingY = 20;
  const chartW = effectiveWidth - paddingX * 2;
  const chartH = height - paddingY * 2;

  const toX = (i: number) => paddingX + (i / (points.length - 1 || 1)) * chartW;
  const toY = (wpm: number) => paddingY + chartH - (wpm / maxWpm) * chartH;

  const rawPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.wpmRaw)}`)
    .join(' ');

  const netPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.wpmNet)}`)
    .join(' ');

  if (points.length === 0) {
    return <div ref={containerRef} style={{ width: '100%', height }} />;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* SessionWaveform en overlay fond — opacité 15% */}
      {noteEvents.length > 2 && (
        <div
          style={{
            position: 'absolute',
            inset: `${paddingY}px ${paddingX}px`,
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        >
          <SessionWaveform
            noteEvents={noteEvents}
            durationMs={durationMs}
            width={chartW}
            height={chartH}
          />
        </div>
      )}

      {/* Graphique WPM */}
      <svg
        viewBox={`0 0 ${effectiveWidth} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label="Graphique WPM de la session"
      >
        {/* Axes */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX}
          y2={paddingY + chartH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        <line
          x1={paddingX}
          y1={paddingY + chartH}
          x2={paddingX + chartW}
          y2={paddingY + chartH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        {/* Courbe raw — gris */}
        <path
          d={rawPath}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1.5}
          opacity={0.5}
        />

        {/* Courbe net — teal */}
        <path
          d={netPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
        />

        {/* Points erreurs */}
        {points
          .filter((p) => p.hasError)
          .map((p, i) => (
            <circle
              key={i}
              cx={toX(points.indexOf(p))}
              cy={toY(p.wpmNet)}
              r={3}
              fill="var(--color-error)"
            />
          ))}
      </svg>
    </div>
  );
}
```

---

## Barre d'actions — 4 icônes

```tsx
// ResultsPage.tsx — barre d'actions

const ACTION_BUTTONS = [
  {
    icon: '>',
    labelKey: 'results.nextTest',
    action: 'next',
  },
  {
    icon: '↺',
    labelKey: 'results.repeatTest',
    action: 'repeat',
  },
  {
    icon: '♪',
    labelKey: 'results.relisten',
    action: 'relisten',
    available: noteEvents && noteEvents.length > 0,
  },
  {
    icon: '|◄',
    labelKey: 'results.shareReplay',
    action: 'share',
    available: !!sessionId,
  },
] as const;

// Action relisten — rejoue les NoteEvent[] via useAudioEngine
// (implémentation : itérer sur noteEvents, scheduleNote via Tone.Transport)

// Action share — encodeReplay(sessionId) → copie URL dans presse-papier
```

---

## `ResultsPageClient.tsx` — données enrichies

```typescript
// ResultsPageClient.tsx — après

'use client';

import { ResultsPage } from '@/components/typing/ResultsPage';
import { getPersonalRecords } from '@/lib/db';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PersonalRecords } from '@typewav/types';

export function ResultsPageClient() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<PersonalRecords | null>(null);

  // Métriques depuis URL params (produites par TypingArea lors de la complétion)
  const wpm = Number(searchParams.get('wpm') ?? '0');
  const wpmNet = Number(searchParams.get('wpmNet') ?? '0');
  const accuracy = Number(searchParams.get('accuracy') ?? '0');
  const consistency = Number(searchParams.get('consistency') ?? '0');
  const durationMs = Number(searchParams.get('duration') ?? '60000');
  const mode = (searchParams.get('mode') ?? 'classic') as TypingMode;
  const collectionId = searchParams.get('collection') ?? undefined;
  const sessionId = searchParams.get('id') ?? undefined;

  // NoteEvents depuis le store (stockés pendant la session)
  const noteEvents = useSessionStore((s) => s.noteEvents);
  const startedAt = useSessionStore((s) => s.startedAt);
  const endedAt = useSessionStore((s) => s.endedAt);
  const computedDurationMs = (startedAt && endedAt)
    ? endedAt - startedAt
    : durationMs;

  useEffect(() => {
    getPersonalRecords().then(setRecords);
  }, []);

  const isNewWpmRecord = records !== null && wpm > (records.maxWpm?.value ?? 0);
  const isNewAccuracyRecord = records !== null && accuracy > (records.maxAccuracy?.value ?? 0);

  return (
    <ResultsPage
      wpm={wpm}
      wpmNet={wpmNet}
      accuracy={accuracy}
      consistency={consistency}
      durationMs={computedDurationMs}
      mode={mode}
      collectionId={collectionId}
      sessionId={sessionId}
      noteEvents={noteEvents}
      isNewWpmRecord={isNewWpmRecord}
      isNewAccuracyRecord={isNewAccuracyRecord}
    />
  );
}
```

---

## Clés i18n

**Nouvelles clés à ajouter** dans `fr.json` namespace `results` :

```json
"results": {
  "wpm": "wpm",
  "wpmNet": "wpm net",
  "accuracy": "précision",
  "consistency": "consistance",
  "duration": "durée",
  "raw": "raw",
  "characters": "caractères",
  "record": "record",
  "newRecord": "nouveau record",
  "nextTest": "Prochain test",
  "repeatTest": "Répéter",
  "relisten": "Réécouter",
  "shareReplay": "Partager",
  "loginCta": "Se connecter pour sauvegarder"
}
```

**`en.json`** :

```json
"results": {
  "wpm": "wpm",
  "wpmNet": "wpm net",
  "accuracy": "accuracy",
  "consistency": "consistency",
  "duration": "duration",
  "raw": "raw",
  "characters": "characters",
  "record": "record",
  "newRecord": "new record",
  "nextTest": "Next test",
  "repeatTest": "Repeat",
  "relisten": "Relisten",
  "shareReplay": "Share",
  "loginCta": "Sign in to save"
}
```

---

## Tests requis

```typescript
// apps/web/components/typing/__tests__/ResultsPage.test.tsx

describe('ResultsPage', () => {
  const baseProps = {
    wpm: 87,
    wpmNet: 82,
    accuracy: 96,
    consistency: 88,
    durationMs: 51000,
    mode: 'classic' as TypingMode,
  };

  it('affiche les 4 stats primaires', () => {
    render(<ResultsPage {...baseProps} />);
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('96')).toBeInTheDocument();
  });

  it('StatCard ordre : label → valeur (pas valeur → label)', () => {
    render(<ResultsPage {...baseProps} />);
    // Le label "wpm" doit précéder "87" dans le DOM
    const wpmLabel = screen.getByText('wpm');
    const wpmValue = screen.getByText('87');
    expect(wpmLabel.compareDocumentPosition(wpmValue))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('affiche le marqueur record si isNewWpmRecord=true', () => {
    render(<ResultsPage {...baseProps} isNewWpmRecord={true} />);
    expect(screen.getByRole('status', { name: /record/i })).toBeInTheDocument();
  });

  it('n\'affiche pas de marqueur record si isNewWpmRecord=false', () => {
    render(<ResultsPage {...baseProps} isNewWpmRecord={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('affiche la barre d\'actions avec 4 boutons/liens', () => {
    render(<ResultsPage {...baseProps} />);
    // Prochain test, Répéter sont toujours présents
    expect(screen.getByRole('button', { name: /prochain/i }) ||
           screen.getByRole('link', { name: /prochain/i })).toBeInTheDocument();
  });

  it('rend sans crash avec noteEvents vides', () => {
    expect(() =>
      render(<ResultsPage {...baseProps} noteEvents={[]} />)
    ).not.toThrow();
  });

  it('rend le graphique WPM si keystrokeData renseignée', () => {
    const keystrokeData = [
      { wpmAtWord: 80, wpmNet: 78, errorCount: 0, wordIndex: 0 },
      { wpmAtWord: 90, wpmNet: 88, errorCount: 1, wordIndex: 1 },
    ];
    render(<ResultsPage {...baseProps} />);
    // WpmChart renders — vérifié par présence du SVG
    // (selon l'implémentation, l'assertion exacte dépend du markup)
  });
});

// apps/web/app/[locale]/results/__tests__/ResultsPageClient.test.tsx

describe('ResultsPageClient', () => {
  it('isNewWpmRecord=true quand wpm > records.maxWpm.value', async () => {
    // Mock getPersonalRecords → { maxWpm: { value: 70 } }
    // searchParams: wpm=87
    // → isNewWpmRecord=true passé à ResultsPage
  });
});
```

---

## Workflow

```
1. Modifier packages/types/src/session.ts si besoin (TypingMode, SessionResult)
2. RED : écrire les tests ResultsPage + ResultsPageClient
3. Refondre ResultsPage.tsx — layout 2 colonnes
4. Créer WpmChart.tsx — graphique SVG avec overlay SessionWaveform
5. Modifier ResultsPageClient.tsx — passer noteEvents, durationMs, records
6. Ajouter action relisten (rejouer NoteEvent[] via Tone.js)
7. Ajouter action share (copier URL replay dans presse-papier)
8. Ajouter i18n fr.json + en.json
9. GREEN : tous les tests passent
10. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
11. Commit
```

---

## Commit

```
feat(results): complete layout refonte — FORGE [2] + absorbs spec-25

- Two-column layout: left (wpm/wpmNet/accuracy/mode) + right (WPM chart)
- WpmChart: SVG chart with raw (grey) + net (teal) curves + error points
- SessionWaveform as chart background overlay (opacity 15%) — TypeWav signature
- StatCard order fixed: label → value → unit (was reversed)
- Personal best: subtle accent underline + "record" microlabel (no banner)
- 4-icon action bar: next (>), repeat (↺), relisten (♪), share (|◄)
- Action ♪: replay NoteEvent[] via Tone.js (exact musical performance)
- Action |◄: encodeReplay → copy URL to clipboard
- Login CTA for unauthenticated users
- ResultsPageClient: pass noteEvents, durationMs, records from IndexedDB

Absorbs spec-25 (PB detection, CTAs, StatCard order).
```
