# Spec 29 — Home Page Layout Refonte (Zones 1–6)

> **Créé le : 11 Mars 2026**
> **Sévérité : 🔵 VISION — identité produit**
> **Source : FORGE_NOTES.md — Point [1]**
> **Dépendances :**
>
> - spec-15 v2 (GlobalNav) doit être terminé avant (Zone 1)
> - spec-23 (i18n sweep) recommandé avant
> - spec-24 (design tokens) recommandé avant
> - spec-28 (soundpack cleanup) doit être terminé avant (Zone 2 — chip son)

---

## Vision

Layout MonkeyType appliqué à TypeWav. 6 zones, hiérarchie claire, zéro bruit visuel.
Tout ce qui ne fait pas partie de ces 6 zones est **supprimé de la home**.

**Éléments supprimés :**

- Tagline "IMMERSIVE MUSICAL TYPING" (marketing creux, remplacé par l'expérience elle-même)
- Badge rang en page principale (déplacé vers `/profil`)
- `AudioPreviewButton` standalone (l'audio se découvre en tapant)
- CTAs bas de page (profil, premium)

---

## Structure des 6 zones

```
┌────────────────────────────────────────────────────────────────────────┐
│  Zone 1 — GlobalNav (floating, voir spec-15 v2)                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Zone 2 — Config bar (2 lignes, centré, ~40px)                         │
│  [@ ponct] [# chiffres] [FR][EN][FR+EN]  |  [● Temps] [A Mots] ...    │
│  [Littérature · Poésie · Philo · Gaming]    [30s · 60s · 120s]  [♪▾]  │
│                                                                         │
│  Zone 3 — Espace respirant                                              │
│                        Herman Melville — Moby-Dick (1851)              │
│                                                                         │
│  Zone 4 — Zone de frappe (pleine largeur, 15% marges, ~24px)           │
│    Call me Ishmael. Some years ago—never mind how long precisely—      │
│    having little money in my purse, and nothing particular to           │
│    interest me on shore, I thought I would sail about a little...       │
│                                                                         │
│  Zone 5 — WaveformBars + restart + hint                                 │
│              ▁ ▂ ▃ ▅ ▇ ▇ ▅ ▃ ▂ ▁ ▁   ᴄ   tab + enter                 │
│                                                                         │
│  Zone 6 — Footer minimal                                                │
│  github · terms · privacy                         ♪ Piano  v1.0.0     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Fichiers à modifier / créer

```
# Créer
apps/web/components/typing/ConfigBar.tsx          ← NOUVEAU : barre de config 2 lignes
apps/web/components/typing/ConfigBar.test.tsx
apps/web/stores/useConfigStore.ts                 ← NOUVEAU : état config bar persisté

# Modifier significativement
apps/web/components/typing/HomeClient.tsx         ← refonte complète du layout
apps/web/app/[locale]/page.tsx                    ← ajuster imports si nécessaire

# Modifier légèrement
apps/web/components/typing/WaveformBars.tsx       ← ajuster nb de barres (12→16 max)
apps/web/messages/fr.json                         ← clés config.*, hint.*
apps/web/messages/en.json
```

---

## Zone 2 — Config Bar

### Store `useConfigStore.ts`

```typescript
// apps/web/stores/useConfigStore.ts
'use client';

import type { TypingMode } from '@typewav/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextLanguageFilter = 'fr' | 'en' | 'both';

interface ConfigState {
  // ── Mode principal ──────────────────────────────────────────────────────
  activeMode: TypingMode;
  // ── Modificateurs ligne 1 ───────────────────────────────────────────────
  punctuationEnabled: boolean;
  numbersEnabled: boolean;
  textLanguage: TextLanguageFilter;
  // ── Options ligne 2 (selon mode) ────────────────────────────────────────
  activeCollection:
    | 'litterature'
    | 'poesie'
    | 'philosophie'
    | 'gaming'
    | 'code';
  wordCount: 10 | 25 | 50 | 100;
  durationSeconds: 15 | 30 | 60 | 120;
  // ── Pack sonore ─────────────────────────────────────────────────────────
  // soundPackId est dans useAudioStore — référencer depuis là
}

interface ConfigActions {
  setMode: (mode: TypingMode) => void;
  setCollection: (id: ConfigState['activeCollection']) => void;
  setWordCount: (count: ConfigState['wordCount']) => void;
  setDuration: (seconds: ConfigState['durationSeconds']) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  setTextLanguage: (lang: TextLanguageFilter) => void;
}

const DEFAULT: ConfigState = {
  activeMode: 'classic',
  punctuationEnabled: false,
  numbersEnabled: false,
  textLanguage: 'both',
  activeCollection: 'litterature',
  wordCount: 25,
  durationSeconds: 60,
};

export const useConfigStore = create<ConfigState & ConfigActions>()(
  persist(
    (set) => ({
      ...DEFAULT,
      setMode: (mode) => set({ activeMode: mode }),
      setCollection: (id) => set({ activeCollection: id }),
      setWordCount: (count) => set({ wordCount: count }),
      setDuration: (seconds) => set({ durationSeconds: seconds }),
      togglePunctuation: () =>
        set((s) => ({ punctuationEnabled: !s.punctuationEnabled })),
      toggleNumbers: () => set((s) => ({ numbersEnabled: !s.numbersEnabled })),
      setTextLanguage: (lang) => set({ textLanguage: lang }),
    }),
    { name: 'typewav-config' },
  ),
);
```

### `ConfigBar.tsx`

```tsx
'use client';

/**
 * ConfigBar — barre de configuration 2 lignes, adaptée au mode actif.
 *
 * Ligne 1 (toujours visible) : modificateurs + modes
 * Ligne 2 (contextuelle) : options secondaires du mode actif + chip ♪
 *
 * Client Component justifié : état config (useConfigStore), interactions.
 */

import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslations } from 'next-intl';
import { MusicChip } from './MusicChip'; // spec-33

const MODES = [
  { id: 'classic', label: 'Temps', icon: '●' },
  { id: 'sprint', label: 'Mots', icon: 'A' },
  { id: 'quote', label: 'Citation', icon: '""' },
  { id: 'zen', label: 'Zen', icon: '△' },
  { id: 'code', label: 'Code', icon: '⌨' },
  { id: 'learning', label: 'Apprentissage', icon: '🎓' },
  { id: 'ghost', label: 'Fantôme', icon: '👻' },
  { id: 'classics', label: 'Classiques', icon: '♪' },
  { id: 'custom', label: 'Libre', icon: '✏' },
  { id: 'challenge', label: 'Challenge', icon: '🏆' },
] as const;

const COLLECTIONS = [
  { id: 'litterature', label: 'Littérature' },
  { id: 'poesie', label: 'Poésie' },
  { id: 'philosophie', label: 'Philosophie' },
  { id: 'gaming', label: 'Gaming' },
] as const;

const DURATIONS = [15, 30, 60, 120] as const;
const WORD_COUNTS = [10, 25, 50, 100] as const;

export function ConfigBar() {
  const t = useTranslations('config');
  const {
    activeMode,
    setMode,
    punctuationEnabled,
    togglePunctuation,
    numbersEnabled,
    toggleNumbers,
    textLanguage,
    setTextLanguage,
    activeCollection,
    setCollection,
    wordCount,
    setWordCount,
    durationSeconds,
    setDuration,
  } = useConfigStore();

  const chipStyle = (active: boolean) => ({
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    padding: '3px 8px',
    transition: 'color 0.1s',
  });

  const separator = (
    <span
      aria-hidden="true"
      style={{
        color: 'var(--color-border)',
        fontSize: '0.75rem',
        margin: '0 4px',
      }}
    >
      |
    </span>
  );

  // Modes qui supportent les modificateurs ponctuation/chiffres/langue
  const supportsModifiers = [
    'classic',
    'sprint',
    'zen',
    'quote',
    'learning',
  ].includes(activeMode);

  return (
    <div
      role="toolbar"
      aria-label={t('label')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        maxWidth: 700,
        margin: '0 auto',
      }}
    >
      {/* ── Ligne 1 : modificateurs + modes ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'nowrap',
          overflowX: 'auto',
        }}
      >
        {/* Modificateurs (visibles seulement si le mode les supporte) */}
        {supportsModifiers && (
          <>
            <button
              style={chipStyle(punctuationEnabled)}
              onClick={togglePunctuation}
              aria-pressed={punctuationEnabled}
              title={t('punctuation')}
            >
              @ {t('punctuationShort')}
            </button>
            <button
              style={chipStyle(numbersEnabled)}
              onClick={toggleNumbers}
              aria-pressed={numbersEnabled}
              title={t('numbers')}
            >
              # {t('numbersShort')}
            </button>
            {/* Langue des textes */}
            {['fr', 'en', 'both'].map((lang) => (
              <button
                key={lang}
                style={chipStyle(textLanguage === lang)}
                onClick={() => setTextLanguage(lang as never)}
                aria-pressed={textLanguage === lang}
              >
                {lang === 'both' ? 'FR+EN' : lang.toUpperCase()}
              </button>
            ))}
            {separator}
          </>
        )}

        {/* Modes */}
        {MODES.map(({ id, label, icon }) => (
          <button
            key={id}
            style={chipStyle(activeMode === id)}
            onClick={() => setMode(id as never)}
            aria-pressed={activeMode === id}
            title={label}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Ligne 2 : options contextuelles + chip ♪ ─────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {/* Options selon mode actif */}
        {activeMode === 'classic' && (
          <>
            {COLLECTIONS.map(({ id, label }) => (
              <button
                key={id}
                style={chipStyle(activeCollection === id)}
                onClick={() => setCollection(id)}
                aria-pressed={activeCollection === id}
              >
                {label}
              </button>
            ))}
            {separator}
            {DURATIONS.map((d) => (
              <button
                key={d}
                style={chipStyle(durationSeconds === d)}
                onClick={() => setDuration(d)}
                aria-pressed={durationSeconds === d}
              >
                {d}s
              </button>
            ))}
          </>
        )}

        {activeMode === 'sprint' && (
          <>
            {COLLECTIONS.map(({ id, label }) => (
              <button
                key={id}
                style={chipStyle(activeCollection === id)}
                onClick={() => setCollection(id)}
                aria-pressed={activeCollection === id}
              >
                {label}
              </button>
            ))}
            {separator}
            {WORD_COUNTS.map((wc) => (
              <button
                key={wc}
                style={chipStyle(wordCount === wc)}
                onClick={() => setWordCount(wc)}
                aria-pressed={wordCount === wc}
              >
                {wc}
              </button>
            ))}
          </>
        )}

        {/* Chip ♪ — toujours en fin de ligne 2 (spec-33) */}
        <div style={{ marginLeft: 'auto' }}>
          <MusicChip />
        </div>
      </div>
    </div>
  );
}
```

---

## Zone 3 — Attribution source

```tsx
// Dans HomeClient.tsx, entre ConfigBar et TypingArea :

{
  currentText?.source && (
    <p
      aria-label={t('source.label')}
      style={{
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        letterSpacing: '0.03em',
        textAlign: 'center',
        margin: '0',
        userSelect: 'none',
      }}
    >
      {currentText.source}
    </p>
  );
}
```

---

## Zone 4 — Zone de frappe

**Changements par rapport à l'actuel :**

- Police augmentée : `fontSize: '1.5rem'` (~24px)
- Marges latérales : `maxWidth: '70vw'` (laisse ~15% de chaque côté)
- Pas de boîte, pas de bordure — le texte flotte sur le fond
- 3 lignes visibles en permanence (géré par le composant TypingArea existant)
- Ligne courante : fond aura `color-mix(in srgb, var(--color-accent) 3%, transparent)`

**Modif dans `TypingArea.tsx` :**

```tsx
// Zone de frappe — wrapper style
style={{
  fontSize: '1.5rem',
  lineHeight: '2.2',
  maxWidth: '70vw',
  margin: '0 auto',
  position: 'relative',
  // Fond aura sur la ligne courante
  background: 'color-mix(in srgb, var(--color-accent) 3%, transparent)',
  // Zéro border, zéro outline
}}
```

---

## Zone 5 — WaveformBars + restart + hint

```tsx
// Dans HomeClient.tsx, sous la TypingArea

<div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    width: '100%',
    maxWidth: '70vw',
    margin: '12px auto 0',
  }}
>
  {/* WaveformBars — 12 à 16 barres, hauteur max 10px */}
  <WaveformBars
    lastNote={lastNoteEvent?.noteName}
    isError={lastKeyWasError}
    barCount={14} // entre 12 et 16 selon l'espace disponible
    maxHeightPx={10} // hauteur max réduite vs spec-27 (préférence UX)
    idlePulse={true} // légère pulsation au repos (subtile, ~3px)
    style={{ flex: 1, maxWidth: 120 }}
  />

  {/* Bouton restart — icône ᴄ centré */}
  <button
    onClick={handleRestart}
    aria-label={t('hint.restart')}
    tabIndex={-1} // ne pas intercepter le focus pendant la frappe
    style={{
      background: 'transparent',
      border: 'none',
      color: 'var(--color-text-muted)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontFamily: 'var(--font-ui)',
      opacity: 0.5,
      transition: 'opacity 0.15s',
      userSelect: 'none',
    }}
    className="hover:opacity-100"
  >
    ᴄ
  </button>

  {/* Hint raccourci tab+enter */}
  <p
    aria-hidden="true"
    style={{
      color: 'var(--color-text-muted)',
      fontFamily: 'var(--font-ui)',
      fontSize: '0.6875rem',
      letterSpacing: '0.05em',
      opacity: 0.5,
    }}
  >
    tab + enter
  </p>
</div>
```

**Modification `WaveformBars.tsx` pour supporter les nouvelles props :**

```typescript
interface WaveformBarsProps {
  lastNote: string | undefined;
  isError: boolean;
  barCount?: number; // ← NOUVEAU (défaut: 12)
  maxHeightPx?: number; // ← NOUVEAU (défaut: 30 per spec-27, now 10 for Zone 5)
  idlePulse?: boolean; // ← NOUVEAU (légère pulsation si silence)
  className?: string;
  style?: React.CSSProperties;
}
```

---

## Zone 6 — Footer minimal

```tsx
// Footer — remplace tout contenu actuel du footer HomeClient

<footer
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 32,
    marginTop: 'auto',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.6875rem',
    color: 'var(--color-text-muted)',
    opacity: 0.5,
  }}
>
  {/* Côté gauche — liens */}
  <div style={{ display: 'flex', gap: 12 }}>
    <a
      href="https://github.com/..."
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      github
    </a>
    <a
      href={`/${locale}/transparence`}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      terms
    </a>
    <a
      href={`/${locale}/transparence`}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      privacy
    </a>
  </div>

  {/* Côté droit — pack actif + version */}
  <div style={{ display: 'flex', gap: 8 }}>
    <span>♪ {activeSoundPackName}</span>
    <span>v{APP_VERSION}</span>
  </div>
</footer>
```

---

## Clés i18n

**`fr.json`** :

```json
"config": {
  "label": "Configuration",
  "punctuation": "Activer la ponctuation",
  "punctuationShort": "ponctuation",
  "numbers": "Activer les chiffres",
  "numbersShort": "chiffres"
},
"hint": {
  "restart": "Recommencer (Tab + Entrée)",
  "tabEnter": "tab + entrée — nouveau texte"
},
"source": {
  "label": "Source du texte"
}
```

**`en.json`** :

```json
"config": {
  "label": "Configuration",
  "punctuation": "Enable punctuation",
  "punctuationShort": "punctuation",
  "numbers": "Enable numbers",
  "numbersShort": "numbers"
},
"hint": {
  "restart": "Restart (Tab + Enter)",
  "tabEnter": "tab + enter — new text"
},
"source": {
  "label": "Text source"
}
```

---

## Tests requis

```typescript
// apps/web/stores/__tests__/useConfigStore.test.ts

describe('useConfigStore', () => {
  it('état initial : mode classic, 60s, both langues', () => {
    const { result } = renderHook(() => useConfigStore());
    expect(result.current.activeMode).toBe('classic');
    expect(result.current.durationSeconds).toBe(60);
    expect(result.current.textLanguage).toBe('both');
  });

  it('setMode change le mode', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.setMode('sprint'));
    expect(result.current.activeMode).toBe('sprint');
  });

  it('togglePunctuation bascule correctement', () => {
    const { result } = renderHook(() => useConfigStore());
    act(() => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(true);
    act(() => result.current.togglePunctuation());
    expect(result.current.punctuationEnabled).toBe(false);
  });
});

// apps/web/components/typing/__tests__/ConfigBar.test.tsx

describe('ConfigBar', () => {
  it('affiche les modes principaux', () => {
    render(<ConfigBar />);
    expect(screen.getByTitle('Temps')).toBeInTheDocument();
    expect(screen.getByTitle('Mots')).toBeInTheDocument();
    expect(screen.getByTitle('Code')).toBeInTheDocument();
  });

  it('le mode actif a aria-pressed="true"', () => {
    // Mock useConfigStore → activeMode: 'sprint'
    render(<ConfigBar />);
    expect(screen.getByTitle('Mots')).toHaveAttribute('aria-pressed', 'true');
  });

  it('les modificateurs sont cachés sur les modes sans modificateurs', () => {
    // Mock useConfigStore → activeMode: 'ghost'
    render(<ConfigBar />);
    expect(screen.queryByTitle('Activer la ponctuation')).not.toBeInTheDocument();
  });
});
```

---

## Workflow

```
1. Créer apps/web/stores/useConfigStore.ts
2. RED : écrire les tests useConfigStore
3. Implémenter useConfigStore
4. GREEN : useConfigStore tests passent
5. Créer apps/web/components/typing/ConfigBar.tsx
6. RED : écrire les tests ConfigBar
7. Implémenter ConfigBar
8. Modifier WaveformBars.tsx — ajouter props barCount, maxHeightPx, idlePulse
9. Refondre HomeClient.tsx — remplacer layout existant par les 6 zones
10. Ajouter i18n fr.json + en.json
11. Supprimer : tagline, AudioPreviewButton (retirer du JSX, garder le fichier),
    badge rang, CTAs bas de page
12. GREEN : tous les tests passent
13. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
14. Commit
```

---

## Commit

```
feat(home): 6-zone layout refonte — MonkeyType-inspired, TypeWav-flavored

Zone 1: GlobalNav (spec-15 v2) already integrated
Zone 2: ConfigBar 2-row adaptive component + useConfigStore (persisted)
  - Line 1: punctuation/numbers/FR-EN modifiers + all mode chips
  - Line 2: contextual options per mode + MusicChip (♪)
Zone 3: breathing space + source attribution (author — work)
Zone 4: full-width text, no borders, 24px font, 70vw max, aura bg
Zone 5: WaveformBars (14 bars, max 10px) + restart ᴄ + tab+enter hint
Zone 6: minimal footer (github · terms · privacy | ♪ pack vX.X.X)

Remove: tagline, rank badge, AudioPreviewButton, bottom CTAs
Add: useConfigStore (Zustand, persisted) for all typing configuration
```
