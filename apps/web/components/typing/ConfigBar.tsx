'use client';

/**
 * ConfigBar — barre de configuration 2 lignes, adaptée au mode actif.
 *
 * Ligne 1 (toujours visible) : modificateurs + modes
 * Ligne 2 (contextuelle) : options secondaires du mode actif + chip ♪
 *
 * Client Component justifié : état config (useConfigStore), interactions.
 * Spec : docs/specs/29-home-layout.md
 */

import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslations } from 'next-intl';
import { MusicChip } from './MusicChip';

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

  const chipStyle = (active: boolean): React.CSSProperties => ({
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
            {(['fr', 'en', 'both'] as const).map((lang) => (
              <button
                key={lang}
                style={chipStyle(textLanguage === lang)}
                onClick={() => setTextLanguage(lang)}
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
