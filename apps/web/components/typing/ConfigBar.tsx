'use client';

/**
 * ConfigBar — barre de configuration 1 ligne, stricte et adaptative.
 *
 * Refonte MonkeyType :
 * - Tient sur une seule ligne.
 * - Supprime les modes non essentiels de l'affichage (classiques, libre, challenge).
 * - Modificateurs (ponctuation, chiffres) | Modes | Options contextuelles | Chip
 *
 * Spec : docs/specs/29-home-layout.md
 */

import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslations } from 'next-intl';
import {
  AlignLeftIcon,
  AtIcon,
  ClockIcon,
  CodeIcon,
  GhostIcon,
  GraduationIcon,
  HashIcon,
  PenIcon,
  QuoteIcon,
  ZenIcon,
} from '../ui/icons';

const MODE_ICONS = {
  classic: ClockIcon,
  sprint: AlignLeftIcon,
  quote: QuoteIcon,
  zen: ZenIcon,
  code: CodeIcon,
  learning: GraduationIcon,
  ghost: GhostIcon,
  custom: PenIcon,
} as const;

// On retire 'classics', 'challenge', potentiellement 'libre' si c'est un mode existant
const MODES = [
  'classic',
  'sprint',
  'quote',
  'zen',
  'code',
  'learning',
  'ghost',
  'custom',
] as const;

const DURATIONS = [15, 30, 60, 120] as const;
const WORD_COUNTS = [10, 25, 50, 100] as const;

export function ConfigBar() {
  const t = useTranslations('config');
  const tModes = useTranslations('config.modes' as never) as (
    k: string,
  ) => string;
  const {
    activeMode,
    setMode,
    punctuationEnabled,
    togglePunctuation,
    numbersEnabled,
    toggleNumbers,
    wordCount,
    setWordCount,
    durationSeconds,
    setDuration,
  } = useConfigStore();

  const chipStyle = (active: boolean): React.CSSProperties => ({
    background: active
      ? 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)'
      : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    fontWeight: active ? 500 : 400,
    padding: '0 8px' /* Removed vertical padding, relying on fixed height */,
    height: '26px' /* Strict height for buttons */,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: active ? 'scale(1.02)' : 'scale(1)',
  });

  const separator = (
    <div
      aria-hidden="true"
      style={{
        width: '2px',
        height: '14px',
        backgroundColor: 'var(--color-border)',
        margin: '0 6px',
        borderRadius: '2px',
        opacity: 0.5,
      }}
    />
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
        flexWrap: 'nowrap' /* Force la ligne unique */,
        overflowX:
          'auto' /* Permet le scroll horizontal si l'écran est trop petit */,
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        maxWidth: '1200px',
        height: '42px' /* Strict height */,
        // Élément de chrome permanent : ne doit jamais être écrasé par du
        // contenu voisin trop haut (ex. mode Apprentissage). Sans ça, le
        // parent flex-column à hauteur fixe (overflow: hidden) le réduit à
        // 0px — la barre reste dans le DOM mais devient invisible, et donc
        // impossible de changer de mode depuis là.
        flexShrink: 0,
        margin: '0 auto',
        padding: '0 16px',
        background:
          'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(8px)',
        gap: '4px',
      }}
      className="hide-scrollbar"
    >
      {/* ── Modificateurs ─────────────────────────────── */}
      {supportsModifiers && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <button
            style={chipStyle(punctuationEnabled)}
            onClick={togglePunctuation}
            aria-pressed={punctuationEnabled}
            title={t('punctuation')}
            className="hover:text-text-primary hover:scale-[1.05] transition-transform duration-200"
          >
            <AtIcon size={14} /> {t('punctuationShort')}
          </button>
          <button
            style={chipStyle(numbersEnabled)}
            onClick={toggleNumbers}
            aria-pressed={numbersEnabled}
            title={t('numbers')}
            className="hover:text-text-primary hover:scale-[1.05] transition-transform duration-200"
          >
            <HashIcon size={14} /> {t('numbersShort')}
          </button>

          {separator}
        </div>
      )}

      {/* ── Modes ─────────────────────────────── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
      >
        {MODES.map((id) => {
          const Icon = MODE_ICONS[id as keyof typeof MODE_ICONS];
          const label = tModes(id);
          return (
            <button
              key={id}
              style={{
                ...chipStyle(activeMode === id),
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => setMode(id as never)}
              aria-pressed={activeMode === id}
              title={label}
              className="hover:text-text-primary hover:scale-[1.05] transition-transform duration-200"
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Options Contextuelles ─────────────────── */}
      {(activeMode === 'classic' || activeMode === 'sprint') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          {separator}
          {activeMode === 'classic' &&
            DURATIONS.map((d) => (
              <button
                key={d}
                style={chipStyle(durationSeconds === d)}
                onClick={() => setDuration(d)}
                aria-pressed={durationSeconds === d}
                className="hover:text-text-primary hover:scale-[1.05] transition-transform duration-200"
              >
                {d}
              </button>
            ))}
          {activeMode === 'sprint' &&
            WORD_COUNTS.map((wc) => (
              <button
                key={wc}
                style={chipStyle(wordCount === wc)}
                onClick={() => setWordCount(wc)}
                aria-pressed={wordCount === wc}
                className="hover:text-text-primary hover:scale-[1.05] transition-transform duration-200"
              >
                {wc}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
