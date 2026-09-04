'use client';

/**
 * ConfigBar — barre de configuration 1 ligne, stricte et adaptative.
 *
 * Refonte MonkeyType :
 * - Tient sur une seule ligne.
 * - Supprime les modes non essentiels de l'affichage (classiques, libre, challenge).
 * - Modificateurs (ponctuation, chiffres) | Modes | Options contextuelles | Chip
 * - Trois groupes visuels distincts (fond plat, coin modérément arrondi,
 *   aucun flou), séparés par un vrai espace plutôt qu'un simple séparateur.
 *   Sélection = couleur seule (accent vs muted), jamais de fond ni de
 *   bordure sur l'option active : c'est le modèle MonkeyType, appliqué
 *   uniformément à tous les chips (modificateurs, modes, options).
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

  // Modèle MonkeyType : aucun chip, actif ou non, ne porte de fond ni de
  // bordure. La seule chose qui change est la couleur du texte/icône
  // (accent une fois sélectionné, muted sinon). Zen n'a plus de traitement
  // à part (ancien A6) : un chip qui ne bouge jamais en fond serait devenu
  // le seul repère visuel permanent de la barre, donc encore plus visible
  // que l'ancien souci qu'il corrigeait.
  const chipStyle = (active: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.8rem',
    fontWeight: 400,
    padding: '0 12px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  });

  // Fond plat opaque, coin modérément arrondi, aucun flou : chaque groupe
  // (modificateurs / modes / options) est son propre panneau MonkeyType,
  // pas une seule pilule glassmorphique commune.
  const groupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    height: '40px',
    padding: '0 8px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
  };

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
        // Élément de chrome permanent : hauteur stricte + flexShrink: 0 pour
        // qu'il ne soit jamais écrasé par du contenu voisin trop haut (ex.
        // mode Apprentissage). Sans ça, le parent flex-column à hauteur fixe
        // (overflow: hidden) le réduit à 0px : la barre reste dans le DOM
        // mais devient invisible, donc impossible de changer de mode.
        height: '46px',
        flexShrink: 0,
        margin: '0 auto',
        padding: '0 4px',
        gap: '14px',
      }}
      className="hide-scrollbar"
    >
      {/* ── Modificateurs ─────────────────────────────── */}
      {supportsModifiers && (
        <div role="group" aria-label={t('modifiersGroup')} style={groupStyle}>
          <button
            style={chipStyle(punctuationEnabled)}
            onClick={togglePunctuation}
            aria-pressed={punctuationEnabled}
            title={t('punctuation')}
            className="hover:text-text-primary transition-colors duration-200"
          >
            <AtIcon size={14} /> {t('punctuationShort')}
          </button>
          <button
            style={chipStyle(numbersEnabled)}
            onClick={toggleNumbers}
            aria-pressed={numbersEnabled}
            title={t('numbers')}
            className="hover:text-text-primary transition-colors duration-200"
          >
            <HashIcon size={14} /> {t('numbersShort')}
          </button>
        </div>
      )}

      {/* ── Modes ─────────────────────────────── */}
      <div role="group" aria-label={t('modesGroup')} style={groupStyle}>
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
              className="hover:text-text-primary transition-colors duration-200"
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
        <div role="group" aria-label={t('optionsGroup')} style={groupStyle}>
          {effectiveMode === 'classic' &&
            DURATIONS.map((d) => (
              <button
                key={d}
                style={chipStyle(durationSeconds === d)}
                onClick={() => setDuration(d)}
                aria-pressed={durationSeconds === d}
                className="hover:text-text-primary transition-colors duration-200"
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
                className="hover:text-text-primary transition-colors duration-200"
              >
                {wc}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
