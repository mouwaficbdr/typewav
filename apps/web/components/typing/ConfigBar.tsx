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

import { MODES_WITH_TEXT_CONFIG } from '@/lib/typing-mode-support';
import { useConfigStore } from '@/stores/useConfigStore';
import type { TypingMode } from '@typewav/types';
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

interface ConfigBarProps {
  // Mode à utiliser pour décider quels contrôles afficher (modificateurs,
  // options contextuelles). Distinct du mode actif du store quand celui-ci
  // ne reflète pas le comportement réel de la session (ex. Fantôme sans
  // donnée personnelle, qui se comporte comme Classic) : voir HomeClient.
  // Retombe sur le mode actif du store quand non fourni.
  controlsMode?: TypingMode;
}

export function ConfigBar({ controlsMode }: ConfigBarProps = {}) {
  const t = useTranslations('config');
  const tModes = useTranslations('config.modes' as never) as (
    k: string,
  ) => string;
  const {
    activeMode,
    setMode,
    activeCollection,
    punctuationEnabled,
    togglePunctuation,
    numbersEnabled,
    toggleNumbers,
    wordCount,
    setWordCount,
    durationSeconds,
    setDuration,
  } = useConfigStore();

  // Le mode Zen est le mode signature du produit (musicothérapie, sans
  // minuteur ni score) ; il ne doit jamais se fondre dans les 7 autres
  // modes utilitaires, d'où le traitement 'signature' à part.
  const chipStyle = (
    active: boolean,
    variant: 'default' | 'signature' = 'default',
  ): React.CSSProperties => {
    const isSignature = variant === 'signature';
    return {
      background: isSignature
        ? `color-mix(in srgb, var(--color-accent) ${active ? 20 : 5}%, transparent)`
        : active
          ? 'color-mix(in srgb, var(--color-text-primary) 12%, transparent)'
          : 'transparent',
      border: 'none',
      borderRadius: '9999px',
      color:
        isSignature || active
          ? 'var(--color-text-primary)'
          : 'color-mix(in srgb, var(--color-text-muted) 90%, transparent)',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      fontSize: '0.8rem',
      fontWeight: active || isSignature ? 500 : 400,
      padding: '0 12px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: active ? 'scale(1)' : 'scale(1)',
      boxShadow: active && isSignature ? '0 0 12px color-mix(in srgb, var(--color-accent) 40%, transparent)' : 'none',
      // Respire doucement pour attirer l'œil vers le mode signature, mais
      // s'arrête net une fois sélectionné : Zen promet le calme, un glow
      // qui continue de pulser pendant la frappe serait le contredire.
      animation:
        isSignature && !active
          ? 'zen-breathe 3.6s ease-in-out infinite'
          : undefined,
    };
  };

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

  // Modes qui supportent les modificateurs ponctuation/chiffres/langue.
  // Apprentissage volontairement absent : generateLearningText (words.ts)
  // ne lit jamais ces deux réglages, les afficher là n'aurait aucun effet.
  // Collection Code exclue quel que soit le mode : ponctuation/chiffres y
  // sont forcés à true (voir HomeClient) pour garantir du vrai code, donc
  // des bascules qui prétendraient les contrôler mentiraient sur l'état réel.
  const effectiveMode = controlsMode ?? activeMode;
  const supportsModifiers =
    MODES_WITH_TEXT_CONFIG.includes(effectiveMode) &&
    activeCollection !== 'code';

  return (
    <>
      <style>{`
        @keyframes zen-breathe {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
          }
          50% {
            box-shadow: 0 0 8px 1px color-mix(in srgb, var(--color-accent) 40%, transparent);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .configbar-zen-chip {
            animation: none !important;
          }
        }
      `}</style>
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
          height: '46px' /* Strict height, slightly taller for touch targets */,
          flexShrink: 0,
          margin: '0 auto',
          padding: '0 12px',
          gap: '6px',
          borderRadius: '9999px', // Fully rounded pill shape
        }}
        className="hide-scrollbar glass-panel"
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          {MODES.map((id) => {
            const Icon = MODE_ICONS[id as keyof typeof MODE_ICONS];
            const label = tModes(id);
            const isSignature = id === 'zen';
            return (
              <button
                key={id}
                style={{
                  ...chipStyle(
                    activeMode === id,
                    isSignature ? 'signature' : 'default',
                  ),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => setMode(id as never)}
                aria-pressed={activeMode === id}
                title={label}
                className={
                  isSignature
                    ? 'configbar-zen-chip hover:text-text-primary hover:scale-[1.05] transition-transform duration-200'
                    : 'hover:text-text-primary hover:scale-[1.05] transition-transform duration-200'
                }
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Options Contextuelles ─────────────────── */}
        {/* effectiveMode, pas activeMode : Fantôme sans donnée personnelle
            tourne réellement en session chronométrée façon Classic (voir
            HomeClient), le réglage de durée doit rester visible/ajustable
            dans ce cas plutôt que masqué derrière le mode brut 'ghost'. */}
        {(effectiveMode === 'classic' || effectiveMode === 'sprint') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
          >
            {separator}
            {effectiveMode === 'classic' &&
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
            {effectiveMode === 'sprint' &&
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
    </>
  );
}
