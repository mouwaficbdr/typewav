# Spec 27 — Waveform Visualizer : rendre la musique visible (Signature)

> **Créé le : 10 Mars 2026**
> **Sévérité : VISION — Opportunité de signature produit**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #24**
> **Dépendances : spec-12 (sessionId), spec-23 (i18n) terminés**
> **Position dans le backlog : Dernière étape — VISION**

> ## ✅ PARTIELLEMENT IMPLÉMENTÉE — Mise à jour 11 Mars 2026
>
> **Commit d'implémentation :** `b6f7774 feat(waveform): live WaveformBars and post-session SessionWaveform visualizer`
>
> ### État des composants (confirmé dans le code)
>
> | Élément                                | Fichier                                          | Statut        |
> | -------------------------------------- | ------------------------------------------------ | ------------- |
> | `NoteEvent` type                       | `packages/types/src/session.ts:58-68`            | ✅ Implémenté |
> | `useSessionStore.noteEvents`           | `apps/web/stores/useSessionStore.ts:26`          | ✅ Implémenté |
> | `useSessionStore.recordNoteEvent`      | `apps/web/stores/useSessionStore.ts:118-129`     | ✅ Implémenté |
> | `useAudioEngine` appel recordNoteEvent | `apps/web/hooks/useAudioEngine.ts:231`           | ✅ Implémenté |
> | `WaveformBars.tsx`                     | `apps/web/components/typing/WaveformBars.tsx`    | ✅ Implémenté |
> | `SessionWaveform.tsx`                  | `apps/web/components/typing/SessionWaveform.tsx` | ✅ Implémenté |
>
> ### Changements restants (FORGE [1.6] et [2.3])
>
> **FORGE [1.6] — Zone 5 home :**
>
> - `WaveformBars` : `barCount` configurable (12–16), `maxHeightPx` réduit à 10px,
>   nouvelle prop `idlePulse` (légère pulsation au repos)
> - Ces props sont ajoutées dans **spec-29** (home layout refonte)
>
> **FORGE [2.3] — Page résultats :**
>
> - `SessionWaveform` n'est **plus** un bloc standalone sur la page résultats
> - Il devient un **overlay fond** du graphique WPM (`opacity: 0.15`), pas une figure séparée
> - L'intégration est dans **spec-30** (results refonte), composant `WpmChart.tsx`
>
> **Action requise :** Implémenter les props supplémentaires de WaveformBars (spec-29)
> et l'intégration overlay (spec-30). Le contenu de cette spec reste valide pour
> référence — ne pas réimplémenter ce qui est déjà en place.

---

---

## Vision

TypeWav est le seul outil de typing qui produit de la musique. Aucun autre concurrent ne
le fait. Pourtant, l'interface visuelle est identique à tous les autres : du texte sur fond
noir.

Cette spec implémente la signature visuelle manquante :

- **Pendant la frappe** : visualiseur de barres qui pulse à chaque note jouée
- **Après la session** : timeline de la session complète, montrant le rythme et les erreurs

Résultat : chaque session de typing produit une œuvre visuelle unique.

---

## Architecture

```
packages/types/src/session.ts         ← Ajouter NoteEvent type
apps/web/stores/useSessionStore.ts    ← Ajouter noteEvents + recordNoteEvent
apps/web/hooks/useAudioEngine.ts      ← Appeler recordNoteEvent sur playNote
apps/web/components/typing/
  WaveformBars.tsx                    ← NOUVEAU : visualiseur live
  SessionWaveform.tsx                 ← NOUVEAU : timeline post-session
  TypingArea.tsx                      ← Intégrer WaveformBars
apps/web/components/typing/
  ResultsPage.tsx                     ← Intégrer SessionWaveform
apps/web/app/[locale]/results/
  ResultsPageClient.tsx               ← Passer noteEvents en prop
```

---

## Phase 1 — Enregistrement des événements note

### 1.1 — Type `NoteEvent` dans `packages/types/src/session.ts`

```typescript
// packages/types/src/session.ts — AJOUTER

/** Événement note généré par une frappe correcte */
export interface NoteEvent {
  /** Nom de la note jouée, ex: "C4", "G5" */
  noteName: string;
  /** Timestamp absolu depuis le début de la session (ms) */
  timestamp: number;
  /** Index de position dans le texte */
  charIndex: number;
  /** Erreur sur ce caractère (true = silence, pas de noteEvent créé pour les erreurs) */
  isError: false;
}

// SessionResult existant — ENRICHIR (non breaking)
export interface SessionResult {
  // ...existants...
  noteEvents?: NoteEvent[]; // ← AJOUTER comme optional pour backward compat
}
```

### 1.2 — `useSessionStore.ts` — Ajouter `noteEvents` et `recordNoteEvent`

```typescript
// apps/web/stores/useSessionStore.ts

interface SessionState {
  // ...existants...
  noteEvents: NoteEvent[]
  recordNoteEvent: (noteName: string, charIndex: number) => void
  // Modifier reset pour vider noteEvents
}

// Dans create<SessionState>()
noteEvents: [],

recordNoteEvent: (noteName, charIndex) =>
  set((state) => ({
    noteEvents: [
      ...state.noteEvents,
      {
        noteName,
        timestamp: Date.now() - (state.startTime ?? Date.now()),
        charIndex,
        isError: false,
      },
    ],
  })),

reset: () => set({
  // ...existants...
  noteEvents: [],
}),
```

### 1.3 — `useAudioEngine.ts` — Appeler `recordNoteEvent` sur chaque note jouée

```typescript
// apps/web/hooks/useAudioEngine.ts

import { useSessionStore } from '@/stores/useSessionStore';

// Dans le hook, récupérer recordNoteEvent :
const recordNoteEvent = useSessionStore((s) => s.recordNoteEvent);

// Dans playNote(char, wordIndex) — AJOUTER après l'appel engine.playNote :
const noteName = engine.getLastPlayedNote(); // méthode à ajouter dans audio-engine si absente
recordNoteEvent(noteName, position);
```

**Alternative si `getLastPlayedNote()` n'existe pas dans le moteur audio** :
Implémenter le mapping `char → noteName` directement dans `useAudioEngine.ts` via la même
logique que `pentatonic.ts` (le mapping est déterministe — même char = même note). Documenter
pourquoi la duplication est acceptable.

---

## Phase 2 — Composant `WaveformBars` (visualiseur live)

```typescript
// apps/web/components/typing/WaveformBars.tsx
'use client'

/**
 * WaveformBars — visualiseur de barres réactif aux notes jouées.
 *
 * 12 barres verticales qui pulsent à chaque frappe correcte.
 * La hauteur de la barre activée correspond à la position relative
 * de la note dans la gamme pentatonique (grave → aigu = gauche → droite).
 * Une erreur : flash rouge + toutes les barres reviennent à minimum.
 *
 * Client Component justifié : animation CSS/React, state barre active.
 */

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const PENTATONIC_NOTES = ['C3','D3','E3','G3','A3','C4','D4','E4','G4','A4','C5','D5']
const BAR_COUNT = PENTATONIC_NOTES.length // 12

interface WaveformBarsProps {
  /** Dernière note jouée — undefined si silence/erreur */
  lastNote: string | undefined
  /** true si la dernière frappe était une erreur */
  isError: boolean
  className?: string
}

export function WaveformBars({ lastNote, isError, className }: WaveformBarsProps) {
  const shouldReduceMotion = useReducedMotion()
  const [activeBar, setActiveBar] = useState<number | null>(null)
  const [errorFlash, setErrorFlash] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isError) {
      setErrorFlash(true)
      setActiveBar(null)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setErrorFlash(false), 300)
      return
    }

    if (!lastNote) return

    const idx = PENTATONIC_NOTES.indexOf(lastNote)
    if (idx === -1) return

    setActiveBar(idx)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setActiveBar(null), shouldReduceMotion ? 0 : 200)
  }, [lastNote, isError, shouldReduceMotion])

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 32,
        width: '100%',
        padding: '0 0 2px',
      }}
    >
      {PENTATONIC_NOTES.map((note, i) => {
        const isActive = activeBar === i
        // Hauteur relative au registre : basses graves = petite barre, aigus = grande
        const baseHeight = 4 + Math.floor((i / BAR_COUNT) * 8)  // 4px à 12px
        const activeHeight = 8 + Math.floor((i / BAR_COUNT) * 22) // 8px à 30px

        return (
          <div
            key={note}
            style={{
              flex: 1,
              height: isActive ? activeHeight : baseHeight,
              backgroundColor: errorFlash
                ? 'var(--color-error)'
                : isActive
                  ? 'var(--color-accent)'
                  : 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
              borderRadius: 'var(--radius-sm)',
              transition: shouldReduceMotion
                ? 'none'
                : `height 0.15s ease-out, background-color 0.1s ease`,
            }}
          />
        )
      })}
    </div>
  )
}
```

### Intégration dans `TypingArea.tsx`

```tsx
// apps/web/components/typing/TypingArea.tsx

import { WaveformBars } from './WaveformBars'

// Récupérer depuis le store :
const noteEvents = useSessionStore((s) => s.noteEvents)
const lastNoteEvent = noteEvents[noteEvents.length - 1]

// AJOUTER dans le JSX, après le bloc de texte et avant les stats :
<WaveformBars
  lastNote={lastNoteEvent?.noteName}
  isError={lastKeyWasError}   // utiliser l'état d'erreur déjà suivi
/>
```

---

## Phase 3 — Composant `SessionWaveform` (timeline résultats)

```typescript
// apps/web/components/typing/SessionWaveform.tsx

/**
 * SessionWaveform — timeline SVG de la session complète.
 *
 * Visualise le rythme de frappe sur toute la durée de la session :
 * - Barres verticales = notes correctes (hauteur ∝ fréquence)
 * - Marqueurs rouges = erreurs
 * - Densité = vitesse de frappe (dense = rapide)
 *
 * SSR-safe : toutes les données sont passées en props.
 * Client Component justifié : dimensions dynamiques (ResizeObserver optionnel).
 */

import type { NoteEvent } from '@typewav/types'

const PENTATONIC_NOTES = ['C3','D3','E3','G3','A3','C4','D4','E4','G4','A4','C5','D5']

interface SessionWaveformProps {
  noteEvents: NoteEvent[]
  /** Durée totale de la session en ms */
  durationMs: number
  /** Positions des erreurs dans le texte */
  errorPositions?: number[]
  width?: number
  height?: number
}

export function SessionWaveform({
  noteEvents,
  durationMs,
  errorPositions = [],
  width = 600,
  height = 48,
}: SessionWaveformProps) {
  if (noteEvents.length === 0) {
    return (
      <div style={{
        width: '100%',
        height,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }} aria-hidden="true" />
    )
  }

  const maxTimestamp = durationMs || noteEvents[noteEvents.length - 1].timestamp

  const bars = noteEvents.map((event) => {
    const x = (event.timestamp / maxTimestamp) * width
    const noteIdx = PENTATONIC_NOTES.indexOf(event.noteName)
    // barHeight : 4 (graves) → 24 (aigus) sur hauteur 48px
    const barHeight = noteIdx === -1 ? 8 : 4 + Math.round((noteIdx / 11) * 20)
    const y = height - barHeight

    return { x, y, barHeight }
  })

  return (
    <figure aria-hidden="true" style={{ margin: 0, width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label="Session waveform"
      >
        {/* Background */}
        <rect width={width} height={height} fill="var(--color-surface)" rx={4} />

        {/* Barres de notes */}
        {bars.map(({ x, y, barHeight }, i) => (
          <rect
            key={i}
            x={x - 1}
            y={y}
            width={2}
            height={barHeight}
            fill="var(--color-accent)"
            rx={1}
            opacity={0.8}
          />
        ))}
      </svg>
    </figure>
  )
}
```

### Intégration dans `ResultsPage.tsx`

```tsx
// ResultsPage.tsx — AJOUTER les props nécessaires
interface ResultsPageProps {
  // ...existants...
  noteEvents?: NoteEvent[]; // ← NOUVEAU
  durationMs?: number; // ← NOUVEAU (durée session en ms)
}

// Dans le JSX, ajouter AVANT les StatCards :
{
  noteEvents && noteEvents.length > 2 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.05 }}
      style={{ width: '100%', maxWidth: 600 }}
    >
      <SessionWaveform
        noteEvents={noteEvents}
        durationMs={durationMs ?? 60000}
      />
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: 6,
        }}
      >
        {t('results.waveformLabel')}
      </p>
    </motion.div>
  );
}
```

Ajouter dans `fr.json` et `en.json`, namespace `results` :

```json
"waveformLabel": "votre session en notes"   // fr
"waveformLabel": "your session in notes"    // en
```

### Transmission depuis ResultsPageClient

```tsx
// ResultsPageClient.tsx — AJOUTER
import { useSessionStore } from '@/stores/useSessionStore';

// Dans le composant :
const noteEvents = useSessionStore((s) => s.noteEvents);
const sessionDuration = useSessionStore((s) => s.durationMs); // à ajouter au store si absent

return (
  <ResultsPage
    // ...existants...
    noteEvents={noteEvents}
    durationMs={sessionDuration}
  />
);
```

---

## Tests requis

```typescript
// apps/web/stores/__tests__/useSessionStore.test.ts
describe('useSessionStore — noteEvents', () => {
  it('recordNoteEvent ajoute un événement au tableau', () => {
    const { result } = renderHook(() => useSessionStore())
    act(() => { result.current.recordNoteEvent('C4', 5) })
    expect(result.current.noteEvents).toHaveLength(1)
    expect(result.current.noteEvents[0].noteName).toBe('C4')
  })

  it('reset vide noteEvents', () => {
    const { result } = renderHook(() => useSessionStore())
    act(() => { result.current.recordNoteEvent('G4', 0) })
    act(() => { result.current.reset() })
    expect(result.current.noteEvents).toHaveLength(0)
  })
})

// apps/web/components/__tests__/WaveformBars.test.tsx
describe('WaveformBars', () => {
  it('rend 12 barres', () => {
    render(<WaveformBars lastNote={undefined} isError={false} />)
    // 12 divs dans le conteneur aria-hidden
    const container = document.querySelector('[aria-hidden="true"]')
    expect(container?.children).toHaveLength(12)
  })

  it('une erreur ne crash pas le composant', () => {
    expect(() => render(<WaveformBars lastNote={undefined} isError={true} />)).not.toThrow()
  })
})

// apps/web/components/__tests__/SessionWaveform.test.tsx
describe('SessionWaveform', () => {
  it('renders sans crash avec events vides', () => {
    expect(() => render(<SessionWaveform noteEvents={[]} durationMs={30000} />)).not.toThrow()
  })

  it('renders le SVG quand des events sont présents', () => {
    const events = [
      { noteName: 'C4', timestamp: 0, charIndex: 0, isError: false },
      { noteName: 'G4', timestamp: 500, charIndex: 1, isError: false },
    ] as NoteEvent[]
    render(<SessionWaveform noteEvents={events} durationMs={5000} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })
})
```

---

## Notes de compatibilité

- `NoteEvent.isError: false` est un literal type — les erreurs ne génèrent PAS d'événement
  note (le moteur audio joue un silence sur erreur)
- `SessionWaveform` est SSR-safe (pas de `useEffect`, pas de `window`)
- `WaveformBars` est Client Component — doit rester dans `'use client'`
- Le champ `noteEvents?: NoteEvent[]` dans `SessionResult` est optional pour ne pas casser
  les sessions déjà sauvegardées en IndexedDB (migration backward-compatible)
- `useReducedMotion()` : si `shouldReduceMotion`, les transitions CSS des barres = `none`

---

## Workflow

```
1. Ajouter NoteEvent type dans packages/types/src/session.ts
2. Modifier SessionResult pour ajouter noteEvents?: NoteEvent[] (optional)
3. Modifier useSessionStore : ajouter noteEvents, recordNoteEvent
4. Modifier useAudioEngine : appeler recordNoteEvent après playNote
5. Créer WaveformBars.tsx (composant live)
6. Intégrer WaveformBars dans TypingArea.tsx
7. Créer SessionWaveform.tsx (composant résultats)
8. Modifier ResultsPage.tsx (recevoir noteEvents, rendre SessionWaveform)
9. Modifier ResultsPageClient.tsx (passer noteEvents depuis store)
10. Ajouter clé results.waveformLabel dans fr.json et en.json
11. Écrire tous les tests
12. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
13. Commit
```

## Commit

```
feat(waveform): live WaveformBars and post-session SessionWaveform visualizer

- Add NoteEvent type to packages/types (optional in SessionResult for backward compat)
- useSessionStore: add noteEvents array + recordNoteEvent action
- useAudioEngine: call recordNoteEvent on each successful keystroke
- WaveformBars: 12-bar live visualizer reacting to played notes
- SessionWaveform: SVG timeline of full session (bars = notes, density = speed)
- TypingArea: integrate WaveformBars below text area
- ResultsPage: integrate SessionWaveform above stat cards
- ResultsPageClient: pass noteEvents from store to ResultsPage
- Add results.waveformLabel i18n key (fr + en)
- Respect useReducedMotion() in WaveformBars (transitions disabled)

Makes TypeWav's musical differentiator visually tangible
```
