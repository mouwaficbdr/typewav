'use client';

/**
 * ResultsPage : « la séance gravée ».
 *
 * Tu n'as pas tapé du texte, tu as joué un morceau. L'écran le présente comme
 * un artefact : la mélodie gravée plein cadre (SessionWaveform, tracé L→R),
 * ta vitesse nette posée comme un titre en serif, une phrase honnête sur la
 * séance (session-verdict, jamais deux fois pareille), ENCORE au clavier.
 *
 * Peak-End Rule : la fin de la séance pèse autant que sa moyenne dans le
 * souvenir. Un seul enchaînement chorégraphié (le tracé + le compteur), tout
 * le reste en fondus courts. Sous prefers-reduced-motion : état final direct.
 *
 * Client Component justifié : interactions (relisten, share, défi), raccourci
 * clavier, compteur animé.
 */

import { AmbientAura } from '@/components/typing/AmbientAura';
import { SessionWaveform } from '@/components/typing/SessionWaveform';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { getSessionById } from '@/lib/db';
import { generateReplayLink } from '@/lib/replay';
import { getSessionVerdict } from '@/lib/session-verdict';
import type { SessionResult, TypingMode } from '@typewav/types';
import { RANKS } from '@typewav/types';
import { generateChallengeLink } from '@/lib/challenge';
import { useProgressionStore } from '@/stores/useProgressionStore';
import {
  CornerDownLeft,
  Play,
  Share2,
  Square,
  Swords,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Fenêtre max de réécoute : au-delà, la mélodie est tronquée. */
const RELISTEN_MAX_MS = 22_000;
/** Courbe signature (démarrage vif, fin longue et douce). */
const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const REVEAL_INITIAL = { opacity: 0, y: 14 } as const;
const REVEAL_ANIMATE = { opacity: 1, y: 0 } as const;

interface ResultsPageProps {
  wpm: number;
  wpmNet: number;
  accuracy: number;
  consistency: number;
  /** Durée totale en ms */
  durationMs: number;
  mode: TypingMode;
  collectionId?: string;
  sessionId?: string;
  noteEvents?: SessionResult['noteEvents'];
  isNewWpmRecord?: boolean;
  isNewAccuracyRecord?: boolean;
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

/**
 * Décide, une fois, si l'écran joue son entrée chorégraphiée. `true` seulement
 * pour un vrai utilisateur devant l'onglet : sous prefers-reduced-motion, ou si
 * l'onglet est en arrière-plan (rAF gelé, personne ne regarde), on rend
 * directement l'état final : jamais de contenu bloqué à `opacity: 0`. Décidé
 * au 1er rendu client ; le SSR rend l'état final (aucun flash à l'hydratation).
 */
function useEntranceAnimated(): boolean {
  const reduceMotion = useReducedMotion();
  const [visibleAtMount] = useState(
    () => typeof document !== 'undefined' && !document.hidden,
  );
  return visibleAtMount && !reduceMotion;
}

/** Compteur 0 → cible, ease-out. Désactivé = renvoie la cible tout de suite. */
function useCountUp(target: number, enabled: boolean, ms = 640): number {
  const [value, setValue] = useState(() => (enabled ? 0 : target));
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    // `start` pris depuis le PREMIER timestamp rAF (même horloge que `now`),
    // et `p` borné [0,1] : jamais de valeur négative ni de boucle qui ne se
    // termine pas, quelles que soient les bizarreries de timing du frame.
    let start = 0;
    const tick = (now: number) => {
      if (start === 0) start = now;
      const p = Math.min(1, Math.max(0, (now - start) / ms));
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, ms]);
  return value;
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

function IconTextButton({
  icon,
  label,
  onClick,
  disabled,
  ariaLabel,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        padding: '6px 2px',
        color: disabled
          ? 'var(--color-border)'
          : active
            ? 'var(--color-accent)'
            : 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.82rem',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'color 0.15s',
      }}
      className="results-inline-action"
    >
      {icon}
      {label}
    </button>
  );
}

export function ResultsPage({
  wpm,
  wpmNet,
  accuracy,
  consistency,
  durationMs,
  mode,
  collectionId,
  sessionId,
  noteEvents,
  isNewWpmRecord,
  isNewAccuracyRecord,
}: ResultsPageProps) {
  const t = useTranslations('results');
  const tModes = useTranslations('config.modes' as never) as (
    key: string,
  ) => string;
  const locale = useLocale();
  const router = useRouter();
  const animating = useEntranceAnimated();
  const rank = useProgressionStore((s) => s.rank);

  const isNewRecord = Boolean(isNewWpmRecord) || Boolean(isNewAccuracyRecord);
  const events = noteEvents ?? [];
  const hasMelody = events.length > 0;

  const [session, setSession] = useState<SessionResult | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [copied, setCopied] = useState<null | 'share' | 'defy'>(null);
  const replayTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initialize, playNoteName } = useAudioEngine();

  const wpmNetShown = useCountUp(Math.round(wpmNet), animating);

  const verdict = getSessionVerdict({
    keystrokes: session?.keystrokeData ?? [],
    accuracy,
    consistency,
  });
  const verdictText =
    verdict.kind === 'fatigue'
      ? t('verdict.fatigue', { pct: verdict.dropPct })
      : verdict.kind === 'accelerated'
        ? t('verdict.accelerated', { pct: verdict.gainPct })
        : verdict.kind === 'hesitation'
          ? t('verdict.hesitation', { count: verdict.count })
          : verdict.kind === 'accuracy'
            ? t('verdict.accuracy', { count: verdict.errors })
            : t(`verdict.${verdict.kind}`);

  const stopRelisten = () => {
    for (const id of replayTimeouts.current) clearTimeout(id);
    replayTimeouts.current = [];
    setIsReplaying(false);
  };

  useEffect(() => {
    if (!sessionId) return;
    void getSessionById(sessionId).then((s) => {
      if (s) setSession(s);
    });
  }, [sessionId]);

  useEffect(() => stopRelisten, []);
  useEffect(
    () => () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    },
    [],
  );

  // ENCORE au clavier : Entrée n'importe où (sauf si le focus est sur une
  // commande, qui gère alors Entrée elle-même) relance un test.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key !== 'Enter' ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const el = document.activeElement;
      if (
        el &&
        ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
      )
        return;
      router.push(`/${locale}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, locale]);

  const handleRelisten = () => {
    if (isReplaying) {
      stopRelisten();
      return;
    }
    if (!hasMelody) return;

    const start = events[0]!.timestamp;
    const window_ = events.filter((e) => e.timestamp - start <= RELISTEN_MAX_MS);

    setIsReplaying(true);
    void initialize().then(() => {
      for (const event of window_) {
        const id = setTimeout(() => {
          void playNoteName(event.noteName);
        }, event.timestamp - start);
        replayTimeouts.current.push(id);
      }
      const endId = setTimeout(
        () => setIsReplaying(false),
        (window_.at(-1)?.timestamp ?? start) - start + 700,
      );
      replayTimeouts.current.push(endId);
    });
  };

  const flashCopied = (which: 'share' | 'defy') => {
    setCopied(which);
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => setCopied(null), 2200);
  };

  const handleShare = () => {
    if (!sessionId || !session?.text) return;
    const path = generateReplayLink({
      sessionId,
      text: session.text,
      keystrokeTimings: session.keystrokeData.map((k) => k.deltaMs),
      wpm,
      accuracy,
      theme: session.themeId,
      soundPack: session.soundPackId,
      achievedAt: session.timestamp,
    });
    const url = `${globalThis.location.origin}/${locale}${path}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => flashCopied('share'))
      .catch(() => null);
  };

  const handleDefy = () => {
    if (!session?.text) return;
    const path = generateChallengeLink(session.text, {
      duration: durationMs,
      mode,
      ...(Number.isFinite(wpm) ? { creatorWpm: Math.round(wpm) } : {}),
    });
    const url = `${globalThis.location.origin}/${locale}${path}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => flashCopied('defy'))
      .catch(() => null);
  };

  const modeLabel = (() => {
    try {
      const raw = tModes(mode);
      return raw.includes('.') ? mode : raw;
    } catch {
      return mode;
    }
  })();
  const rankLabel = RANKS[rank]?.label ?? '';

  // Chorégraphie : un délai croissant par bloc. Sans entrée animée, aucun
  // `initial`/`animate` : les blocs sont directement à leur état final.
  const reveal = (delay: number) =>
    animating
      ? {
          initial: REVEAL_INITIAL,
          animate: REVEAL_ANIMATE,
          transition: { duration: 0.5, delay, ease: REVEAL_EASE },
        }
      : {};

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100dvh - var(--nav-height))',
        padding: 'clamp(20px, 3vh, 44px) 24px',
        // Transparent : l'aura ambiante vit en z-index négatif derrière.
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      <AmbientAura
        pitch={null}
        isError={false}
        isPhraseBoundary={false}
        accentColor="var(--color-accent)"
        celebrate={isNewRecord}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 760,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(28px, 5vh, 52px)',
        }}
      >
        {/* 1 · Eyebrow : rang · mode · collection … durée */}
        <motion.div
          {...reveal(0)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span style={eyebrowStyle}>
            {[rankLabel, modeLabel, collectionId].filter(Boolean).join('  ·  ')}
          </span>
          <span
            style={{ ...eyebrowStyle, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatDuration(durationMs)}
          </span>
        </motion.div>

        {/* 2 · La mélodie : héros, se grave de gauche à droite */}
        <motion.div
          {...reveal(0.06)}
          role="group"
          aria-label={t('melodyAria')}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {hasMelody ? (
            <SessionWaveform
              noteEvents={events}
              durationMs={durationMs}
              mirror
              draw={animating}
              height={150}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                height: 150,
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                opacity: 0.4,
              }}
            />
          )}
          <button
            type="button"
            onClick={handleRelisten}
            disabled={!hasMelody}
            aria-label={isReplaying ? t('relistenStop') : t('relisten')}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 999,
              padding: '7px 16px 7px 12px',
              color: hasMelody
                ? 'var(--color-text-primary)'
                : 'var(--color-border)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.82rem',
              cursor: hasMelody ? 'pointer' : 'default',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            className="results-relisten"
          >
            {isReplaying ? (
              <Square size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
            {isReplaying ? t('relistenStop') : t('relisten')}
          </button>
        </motion.div>

        {/* 3 · Le chiffre héros + satellites */}
        <motion.div
          {...reveal(0.12)}
          style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(20px, 5vw, 56px)', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isNewWpmRecord && (
              <span
                role="status"
                aria-label={t('newRecord')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  marginBottom: 6,
                }}
              >
                {t('recordKicker')}
              </span>
            )}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(4.2rem, 12vw, 7rem)',
                fontWeight: 600,
                lineHeight: 1.04,
                color: 'var(--color-text-primary)',
              }}
            >
              {wpmNetShown}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: 14,
              }}
            >
              {t('wpmNet')}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'clamp(16px, 4vw, 36px)',
              paddingBottom: 8,
            }}
          >
            {(
              [
                [Math.round(accuracy), t('accuracy'), isNewAccuracyRecord],
                [Math.round(consistency), t('consistency'), false],
              ] as const
            ).map(([val, label, rec]) => (
              <div
                key={label}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.55rem',
                    fontVariantNumeric: 'tabular-nums',
                    color: rec
                      ? 'var(--color-accent)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {val}
                  <span style={{ fontSize: '0.9rem' }}>%</span>
                </span>
                <span style={eyebrowStyle}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4 · Le verdict : une phrase, jamais deux fois pareille */}
        <motion.p
          {...reveal(0.18)}
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.15rem, 2.4vw, 1.5rem)',
            lineHeight: 1.4,
            color: 'var(--color-text-primary)',
            maxWidth: '32ch',
          }}
        >
          {verdictText}
        </motion.p>

        {/* 5 · Actions : ENCORE au clavier, le reste discret */}
        <motion.div
          {...reveal(0.24)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(14px, 3vw, 28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={`/${locale}`}
            aria-label={t('nextTest')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
              padding: '13px 22px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
            className="results-encore"
          >
            {t('encore')}
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                opacity: 0.7,
              }}
            >
              <CornerDownLeft size={13} />
              {t('encoreKey')}
            </span>
          </Link>

          <IconTextButton
            icon={<Share2 size={15} />}
            label={t('share')}
            ariaLabel={t('shareReplay')}
            onClick={handleShare}
            disabled={!sessionId}
            active={copied === 'share'}
          />
          <IconTextButton
            icon={<Swords size={15} />}
            label={t('defy')}
            ariaLabel={t('challenge')}
            onClick={handleDefy}
            disabled={!session?.text}
            active={copied === 'defy'}
          />

          <span
            aria-live="polite"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
            }}
          >
            {copied ? t('copied') : ''}
          </span>
        </motion.div>
      </div>
    </main>
  );
}
