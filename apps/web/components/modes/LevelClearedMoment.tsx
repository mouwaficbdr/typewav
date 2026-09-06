'use client';

/**
 * LevelClearedMoment : le moment "Niveau N validé" du mode Apprentissage.
 *
 * Parti pris (voir la conversation obsession-architect + elite-ui-designer) :
 * pas un écran de succès (ni trophée, ni coche, ni confettis). Le niveau
 * bouclé, ce sont des dizaines de frappes qui forment une ligne mélodique :
 * le moment la rejoue en la rendant visible (une onde qui se trace), la
 * cadence sonore se résout, et la note finale porte le numéro du niveau puis
 * file vers le rail à gauche. Transitoire (~3 s), auto-dismiss, sauté à la
 * première frappe. `prefers-reduced-motion` => carte statique, zéro mouvement.
 *
 * N'est PAS responsable du flag "déjà célébré" ni du spotlight de relais :
 * LearningMode orchestre. Ce composant se contente de jouer le moment et
 * d'appeler onDismiss (timeout ou input utilisateur).
 */

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { LEARNING_LEVELS } from '@typewav/types';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BACK_OUT: [number, number, number, number] = [0.68, -0.55, 0.265, 1.55];

// Contour mélodique dessiné à la main (pas un vrai sinus) : quelques crêtes,
// se termine à mi-hauteur côté droit, là où se pose la note numérotée.
const WAVE_PATH =
  'M0 42 C 34 42, 52 14, 92 15 S 150 44, 196 39 S 252 9, 300 16 S 356 47, 402 33 S 438 20, 460 28';
const WAVE_W = 460;
const WAVE_H = 56;
// Crêtes approximatives du tracé, pour y faire naître une note au passage.
const WAVE_PEAKS: { x: number; y: number; at: number }[] = [
  { x: 92, y: 15, at: 0.9 },
  { x: 300, y: 16, at: 1.18 },
  { x: 402, y: 33, at: 1.36 },
];

// Vol de la note numérotée vers le rail (bas-gauche) : apparition rapide,
// courte pause, trajet lent en RESTANT opaque (le geste directionnel doit
// s'imprimer), fondu seulement à l'arrivée.
const DISC_FLIGHT_DELAY = 1.42;
const DISC_FLIGHT = {
  x: [0, 0, 0, -560, -560],
  y: [0, 0, 0, 132, 132],
  times: [0, 0.06, 0.18, 0.85, 1],
  duration: 1.6,
};

interface LevelClearedMomentProps {
  levelId: number;
  /** Frappes correctes cumulées sur le niveau (post-session). */
  samples: number;
  /** Précision cumulée sur le niveau, 0-100. */
  accuracy: number;
  onDismiss: () => void;
}

export function LevelClearedMoment({
  levelId,
  samples,
  accuracy,
  onDismiss,
}: LevelClearedMomentProps) {
  const t = useTranslations('learning');
  const shouldReduceMotion = useReducedMotion();
  const { playNoteName } = useAudioEngine();
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  // Cadence montante qui se résout sur la tonique (E4, G4, C5 tenue), calée
  // pour que le C5 tombe quand l'onde a fini de se tracer. No-op silencieux
  // si l'audio n'est pas prêt (aucun bip de secours).
  const playCadence = useCallback(() => {
    const steps: [string, number, number][] = [
      ['E4', 0, 0.45],
      ['G4', 160, 0.45],
      ['C5', 340, 1.1],
    ];
    for (const [note, delay, dur] of steps) {
      window.setTimeout(() => {
        void playNoteName(note, dur);
      }, delay);
    }
  }, [playNoteName]);

  const name = t(`level.${levelId}.name`);
  const levelTagline = t(`level.${levelId}.tagline`);
  const accuracyLabel = Math.round(accuracy);

  // Compteur de frappes qui monte (0 -> total). En reduced-motion : valeur
  // finale d'emblée, aucun tick.
  const count = useMotionValue(shouldReduceMotion ? samples : 0);
  const [displayCount, setDisplayCount] = useState(
    shouldReduceMotion ? samples : 0,
  );

  useEffect(() => {
    const dismiss = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDismiss();
    };

    // Le moment ne se ferme JAMAIS tout seul (retour Mouwafic) : il attend
    // une action. N'importe quelle frappe / clic / Échap le ferme.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return; // laisser la navigation clavier tranquille
      e.preventDefault();
      dismiss();
    };
    const onPointer = () => dismiss();

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    rootRef.current?.focus({ preventScroll: true });

    const cadenceTimer = window.setTimeout(
      playCadence,
      shouldReduceMotion ? 150 : 1120,
    );

    const countControls = shouldReduceMotion
      ? null
      : animate(count, samples, {
          duration: 0.62,
          delay: 0.48,
          ease: EXPO_OUT,
        });
    const unsub = count.on('change', (v) => setDisplayCount(Math.round(v)));

    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
      window.clearTimeout(cadenceTimer);
      countControls?.stop();
      unsub();
    };
  }, [count, samples, onDismiss, playCadence, shouldReduceMotion]);

  const reveal = (delay: number) =>
    shouldReduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.45, ease: EXPO_OUT },
        };

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      aria-label={t('unlockedAnnouncement', { id: levelId, name })}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: EXPO_OUT }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        // Fond teinté thème + flou léger : l'app est sentie derrière, pas
        // effacée. Jamais un voile noir.
        background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      {/* Halo d'ambiance (écho d'AmbientAura) : inspire à l'entrée, expire
          en fond. Décalé vers la gauche, il annonce la direction de la
          résolution (vers le rail). */}
      <motion.div
        aria-hidden="true"
        initial={
          shouldReduceMotion
            ? { opacity: 0.5, scale: 1 }
            : { opacity: 0, scale: 0.88 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 0.5, scale: 1 }
            : { opacity: [0, 0.9, 0.55], scale: [0.88, 1.05, 1] }
        }
        transition={{ duration: 1.6, ease: EXPO_OUT }}
        style={{
          position: 'absolute',
          left: '34%',
          top: '50%',
          width: 'min(760px, 80vw)',
          height: 'min(760px, 80vw)',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 62%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: 'min(460px, 86vw)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          gap: 6,
        }}
      >
        <motion.p
          {...reveal(0.1)}
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('levelCleared.eyebrow', { id: levelId })}
        </motion.p>

        <motion.h2
          {...reveal(0.2)}
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(1.9rem, 4.4vw, 2.6rem)',
            lineHeight: 1.1,
            color: 'var(--color-text-primary)',
          }}
        >
          {name}
        </motion.h2>

        <motion.div
          {...reveal(0.3)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 2,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 1,
              background: 'var(--color-accent)',
              display: 'block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            {t('levelCleared.status')}
          </span>
        </motion.div>

        <motion.p
          {...reveal(0.38)}
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            lineHeight: 1.4,
            color: 'var(--color-accent)',
          }}
        >
          {levelTagline}
        </motion.p>

        <motion.p
          {...reveal(0.48)}
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('levelCleared.proof', {
            samples: displayCount,
            accuracy: accuracyLabel,
          })}
        </motion.p>

        {/* L'onde : la phrase mélodique du niveau qui se relit de gauche à
            droite. Se termine côté droit, là où se pose la note numérotée. */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            marginTop: 16,
          }}
        >
          <svg
            viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
            width="100%"
            height={WAVE_H}
            fill="none"
            aria-hidden="true"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="lcm-wave-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-accent)"
                  stopOpacity="0.18"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-accent)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Aire sous la courbe : une "étagère" accent discrète, écho de
                SessionWaveform, qui donne du corps au trait. */}
            <motion.path
              d={`${WAVE_PATH} L ${WAVE_W} ${WAVE_H} L 0 ${WAVE_H} Z`}
              fill="url(#lcm-wave-fill)"
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 1.15,
                duration: shouldReduceMotion ? 0 : 0.5,
                ease: EXPO_OUT,
              }}
            />

            {/* Halo : même tracé, épais et flou, sous le trait net. */}
            <motion.path
              d={WAVE_PATH}
              stroke="var(--color-accent)"
              strokeWidth={6}
              strokeLinecap="round"
              opacity={0.32}
              style={{ filter: 'blur(3px)' }}
              initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.56,
                duration: shouldReduceMotion ? 0 : 0.9,
                ease: EXPO_OUT,
              }}
            />

            {/* Trait net. */}
            <motion.path
              d={WAVE_PATH}
              stroke="var(--color-accent)"
              strokeWidth={2.25}
              strokeLinecap="round"
              initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.56,
                duration: shouldReduceMotion ? 0 : 0.9,
                ease: EXPO_OUT,
              }}
            />

            {!shouldReduceMotion &&
              WAVE_PEAKS.map((p, i) => (
                <g key={`peak-${i}`}>
                  {/* Onde qui s'ouvre : une note qui se pose. */}
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={1.25}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [0.4, 2.6], opacity: [0, 0.6, 0] }}
                    transition={{ delay: p.at, duration: 0.7, ease: EXPO_OUT }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="var(--color-accent)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }}
                    transition={{ delay: p.at, duration: 0.5, ease: EXPO_OUT }}
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  />
                </g>
              ))}
          </svg>

          {/* La note finale : porte le numéro du niveau, puis se détache et
              file vers le rail (bas-gauche, hors de la colonne), en laissant
              une traînée de notes fantômes qui la suivent avec un temps de
              retard (effet comète). */}
          {!shouldReduceMotion &&
            [
              { delay: 0.06, blur: 2, peak: 0.32 },
              { delay: 0.13, blur: 3.5, peak: 0.18 },
            ].map((g, i) => (
              <motion.span
                key={`disc-trail-${i}`}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, g.peak, g.peak, g.peak, 0],
                  scale: [0, 0.92, 0.92, 0.85, 0.5],
                  x: DISC_FLIGHT.x,
                  y: DISC_FLIGHT.y,
                }}
                transition={{
                  delay: DISC_FLIGHT_DELAY + g.delay,
                  duration: DISC_FLIGHT.duration,
                  times: DISC_FLIGHT.times,
                  ease: [BACK_OUT, EXPO_OUT, EXPO_OUT, EXPO_OUT],
                }}
                style={{
                  position: 'absolute',
                  right: -13,
                  top: `calc(${(28 / WAVE_H) * 100}% - 13px)`,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  filter: `blur(${g.blur}px)`,
                  pointerEvents: 'none',
                }}
              />
            ))}
          <motion.div
            aria-hidden="true"
            initial={
              shouldReduceMotion
                ? { opacity: 1, scale: 1, x: -WAVE_W * 0.92, y: 0 }
                : { opacity: 0, scale: 0 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1, x: -WAVE_W * 0.92, y: 0 }
                : {
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0, 1, 1, 0.9, 0.5],
                    x: DISC_FLIGHT.x,
                    y: DISC_FLIGHT.y,
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    delay: DISC_FLIGHT_DELAY,
                    duration: DISC_FLIGHT.duration,
                    times: DISC_FLIGHT.times,
                    ease: [BACK_OUT, EXPO_OUT, EXPO_OUT, EXPO_OUT],
                  }
            }
            style={{
              position: 'absolute',
              // Bout droit du tracé (x=460, y=28 dans un viewBox 460x56).
              right: -13,
              top: `calc(${(28 / WAVE_H) * 100}% - 13px)`,
              width: 26,
              height: 26,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              boxShadow:
                '0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent), 0 0 18px 2px color-mix(in srgb, var(--color-accent) 45%, transparent)',
            }}
          >
            {levelId}
          </motion.div>
        </div>
      </div>

      <motion.p
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 0.85 } : { opacity: 0 }}
        animate={{ opacity: shouldReduceMotion ? 0.85 : [0, 0, 0.85] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 1.5, times: [0, 0.55, 1] }
        }
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 6vh, 56px)',
          left: 0,
          right: 0,
          textAlign: 'center',
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'var(--color-text-muted)',
        }}
      >
        {t('levelCleared.continueHint')}
      </motion.p>
    </motion.div>
  );
}

/** Ids des niveaux qui prennent ce moment (pas le dernier : il enchaîne sur
 *  l'écran de fin de tutoriel). Exporté pour que LearningMode et les tests
 *  partagent la même règle. */
export const LEVELS_WITH_CLEARED_MOMENT = LEARNING_LEVELS.slice(0, -1).map(
  (l) => l.id,
);
