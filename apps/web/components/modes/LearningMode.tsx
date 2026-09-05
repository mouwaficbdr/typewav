'use client';

/**
 * LearningMode — mode d'apprentissage Home Row avec niveaux progressifs.
 *
 * Spec : docs/specs/03-training-modes.md — Mode Apprentissage
 * Client Component justifié : événements clavier, état de progression.
 */

import { KeyboardDiagram } from '@/components/modes/KeyboardDiagram';
import { TypingArea } from '@/components/typing/TypingArea';
import { useKeyboardLayoutPreference } from '@/hooks/useKeyboardLayoutPreference';
import { resolvePhysicalKey } from '@/lib/keyboardLayouts';
import {
  applySessionStats,
  calculateProgressPercent,
  canUnlockNextLevel,
  createInitialLevelProgress,
  loadLearningProgress,
  saveLearningProgress,
  unlockLevel,
  type LevelProgress,
} from '@/lib/learning-progress';
import {
  hasSeenLearningFingerIntro,
  markLearningFingerIntroSeen,
} from '@/lib/onboarding';
import { generateLearningText } from '@/lib/words';
import { LEARNING_LEVELS } from '@typewav/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface LearningSessionStats {
  correct: number;
  total: number;
  accuracy: number;
  wpm: number;
}

interface LearningModeProps {
  /** true seulement quand déclenché automatiquement à la première visite. */
  isOnboarding?: boolean;
  /**
   * Appelé quand l'utilisateur passe explicitement le tutoriel (isOnboarding
   * uniquement) OU le termine réellement (toujours, onboarding ou sélection
   * manuelle). LearningMode ne sait pas lequel des deux s'est produit — il
   * appelle juste ce callback, à charge de l'appelant de marquer l'onboarding
   * comme fait et de changer de mode.
   */
  onExitTutorial: () => void;
}

export function LearningMode({
  isOnboarding = false,
  onExitTutorial,
}: LearningModeProps) {
  const t = useTranslations('learning');
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.3;
  const { layout } = useKeyboardLayoutPreference();

  // Fail open, comme isOnboarding dans HomeClient : ne jamais interposer
  // l'écran s'il est impossible de confirmer qu'il n'a pas déjà été vu.
  const [fingerIntroDismissed, setFingerIntroDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    hasSeenLearningFingerIntro()
      .then((seen) => {
        if (!cancelled && !seen) setFingerIntroDismissed(false);
      })
      .catch(() => {
        // Fail open : ne jamais forcer l'écran si on ne peut pas confirmer son état.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFingerIntroStart = useCallback(() => {
    setFingerIntroDismissed(true);
    void markLearningFingerIntroSeen();
  }, []);

  // Étape interactive de l'écran de positionnement des doigts (ticket #62,
  // obsession-architect) : transforme une lecture passive en pratique
  // active (effet de génération), jamais chronométrée ni notée. N'importe
  // quel ordre, aucune contrainte : le but est de sentir les 8 repères, pas
  // de réussir un test.
  const [touchedFingerKeys, setTouchedFingerKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const homeRowKeys = useMemo(
    () => LEARNING_LEVELS.find((l) => l.id === 1)?.keys ?? [],
    [],
  );

  useEffect(() => {
    if (fingerIntroDismissed) return;
    function onKeyDown(e: KeyboardEvent) {
      const physicalKey = resolvePhysicalKey(e.key.toLowerCase(), layout);
      if (!homeRowKeys.includes(physicalKey)) return;
      setTouchedFingerKeys((prev) => {
        if (prev.has(physicalKey)) return prev;
        return new Set(prev).add(physicalKey);
      });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fingerIntroDismissed, layout, homeRowKeys]);

  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>(() =>
    createInitialLevelProgress(LEARNING_LEVELS),
  );
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  // '' plutôt que generateLearningText(1) : ce texte est tiré au hasard
  // (pickRandomWords), donc un appel dans l'initialiseur de useState
  // produirait une valeur différente au rendu serveur et au premier rendu
  // client, un mismatch d'hydratation React. Le useEffect ci-dessous (déjà
  // là pour régénérer le texte à chaque changement de niveau) le pose côté
  // client uniquement, même filet que getDailyIndex/selectFromTexts dans
  // HomeClient.tsx pour la même raison.
  const [text, setText] = useState('');
  const [runIndex, setRunIndex] = useState(0);
  const [lastSessionStats, setLastSessionStats] =
    useState<LearningSessionStats | null>(null);

  // Charger la progression sauvegardée une seule fois au montage.
  useEffect(() => {
    let cancelled = false;
    loadLearningProgress().then((saved) => {
      if (cancelled) return;
      if (saved) setLevelProgress(saved);
      setProgressLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sauvegarder à chaque changement, une fois le chargement initial terminé —
  // sans ce garde, on écraserait la progression sauvegardée par l'état
  // initial (tout à zéro) pendant le court instant où le chargement est en vol.
  useEffect(() => {
    if (!progressLoaded) return;
    void saveLearningProgress(levelProgress);
  }, [levelProgress, progressLoaded]);

  const currentLevel = LEARNING_LEVELS.find((l) => l.id === currentLevelId)!;
  const currentProgress = levelProgress.find(
    (p) => p.levelId === currentLevelId,
  )!;

  const progressPercent = useMemo(
    () => calculateProgressPercent(currentProgress, currentLevel),
    [currentProgress, currentLevel],
  );

  const canUnlockNext = useMemo(
    () => canUnlockNextLevel(currentProgress, currentLevel),
    [currentProgress, currentLevel],
  );

  const isLastLevel = currentLevelId === LEARNING_LEVELS.length;
  const tutorialComplete = isLastLevel && canUnlockNext;

  // Le CTA "Débloquer le niveau X" empilé en bas de la colonne était la
  // vraie cause du débordement intermittent du mode Apprentissage (~60px
  // ajoutés uniquement quand il apparaissait, sur un conteneur à hauteur
  // fixe). Au lieu de lui trouver une place, l'action se déplace dans le
  // sélecteur de niveaux lui-même : l'onglet suivant s'anime et devient
  // cliquable directement, avec une salve de notes ponctuelle (aucune
  // hauteur ajoutée, jamais).
  const prevCanUnlockNextRef = useRef(false);
  const [showUnlockBurst, setShowUnlockBurst] = useState(false);

  useEffect(() => {
    const justUnlocked = canUnlockNext && !prevCanUnlockNextRef.current;
    prevCanUnlockNextRef.current = canUnlockNext;
    if (!justUnlocked || isLastLevel) return;

    setShowUnlockBurst(true);
    const timeout = setTimeout(() => setShowUnlockBurst(false), 1300);
    return () => clearTimeout(timeout);
  }, [canUnlockNext, isLastLevel]);

  const remainingSamples = Math.max(
    0,
    currentLevel.minSamples - currentProgress.samples,
  );

  function handleLevelSelect(levelId: number) {
    const progress = levelProgress.find((p) => p.levelId === levelId);
    if (!progress?.unlocked) return;
    setCurrentLevelId(levelId);
    setLastSessionStats(null);
    setRunIndex((prev) => prev + 1);
    setText(generateLearningText(levelId, 20, layout));
  }

  function handleNextLevel() {
    if (!canUnlockNext) return;
    const nextId = currentLevelId + 1;
    if (nextId > LEARNING_LEVELS.length) return;

    setLevelProgress((prev) => unlockLevel(prev, nextId));
    setCurrentLevelId(nextId);
    setLastSessionStats(null);
    setRunIndex((prev) => prev + 1);
    setText(generateLearningText(nextId, 20, layout));
  }

  const handleLearningSessionComplete = useCallback(
    (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
    }) => {
      setLastSessionStats({
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.accuracy,
        wpm: stats.wpm,
      });

      setLevelProgress((prev) =>
        applySessionStats(prev, currentLevelId, {
          correct: stats.correct,
          total: stats.total,
        }),
      );

      // Redémarre une session d'entraînement immédiatement sur le même niveau.
      setText(generateLearningText(currentLevelId, 20, layout));
      setRunIndex((prev) => prev + 1);
    },
    [currentLevelId, layout],
  );

  // Régénérer le texte quand le niveau (ou la disposition clavier) change
  useEffect(() => {
    setText(generateLearningText(currentLevelId, 20, layout));
  }, [currentLevelId, layout]);

  // Écran de positionnement des doigts (ticket #62) : remplace entièrement
  // la leçon plutôt que de s'empiler dessus, pour ne jamais ajouter de
  // hauteur au conteneur à hauteur fixe du mode Apprentissage. Montré une
  // fois (flag persisté), toujours ré-accessible manuellement depuis
  // Paramètres (qui réinitialise ce flag avant de naviguer ici).
  if (!fingerIntroDismissed) {
    const touchedCount = touchedFingerKeys.size;
    return (
      <div
        className="flex flex-col items-center gap-5 w-full max-w-4xl"
        style={{
          // HomeClient donne maintenant une vraie hauteur à ce mode (flex:1
          // dans la colonne fixe de <main>) : le clavier ci-dessous
          // (flex:1 également) remplit ce qui reste après le texte et le
          // bouton, sans jamais deviner une taille et sans jamais déborder
          // (contrairement à un minHeight calé sur une mesure ponctuelle).
          height: '100%',
          minHeight: 0,
          justifyContent: 'center',
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{ flexShrink: 0 }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent)',
              fontSize: '2rem',
              textAlign: 'center',
            }}
          >
            {t('fingerIntro.title')}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 15,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              // Large plutôt qu'étroit : ce texte tenait sur 3 lignes à
              // 520px alors que la page a bien plus de largeur disponible.
              // Moins de lignes = moins de hauteur empilée sur un
              // conteneur qui ne scrolle jamais (voir minHeight ci-dessus).
              maxWidth: 820,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {t('fingerIntro.caption')}
          </p>
        </div>

        <div
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <KeyboardDiagram
            layout={layout}
            showAllFingerColors
            confirmedKeys={Array.from(touchedFingerKeys)}
            allowedKeys={homeRowKeys}
          />
        </div>

        <div
          className="flex flex-col items-center gap-2"
          style={{ flexShrink: 0 }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {t('fingerIntro.practiceLabel')}
          </p>
          <span
            role="status"
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color:
                touchedCount === homeRowKeys.length
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              fontWeight: 600,
            }}
          >
            {t('fingerIntro.practiceProgress', {
              count: touchedCount,
              total: homeRowKeys.length,
            })}
          </span>
        </div>

        <button
          onClick={handleFingerIntroStart}
          style={{
            flexShrink: 0,
            padding: '12px 32px',
            background: 'var(--color-accent)',
            color: '#000',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {t('fingerIntro.start')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 w-full max-w-3xl"
      style={{ height: '100%', minHeight: 0 }}
    >
      {/* Annonce lecteur d'écran du déblocage : le glow et la salve de notes
          sur la barre de progression sont purement visuels, ce changement
          d'état doit rester perceptible sans les yeux. */}
      <div role="status" aria-live="polite" className="sr-only">
        {showUnlockBurst && !isLastLevel
          ? t('unlockedAnnouncement', {
              id: currentLevelId + 1,
              name: t(`level.${currentLevelId + 1}.name`),
            })
          : ''}
      </div>

      {isOnboarding && (
        <>
          {/* La promesse "musicothérapie" existe dans les meta SEO depuis
              toujours, mais aucun utilisateur ne les voit jamais : c'est ici,
              au tout premier contact, qu'elle doit vivre à l'écran. */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--color-accent)',
              fontSize: '1.1rem',
              textAlign: 'center',
              margin: 0,
              flexShrink: 0,
            }}
          >
            {t('tagline')}
          </p>
          <button
            onClick={onExitTutorial}
            style={{
              alignSelf: 'flex-end',
              flexShrink: 0,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            {t('skipTutorial')}
          </button>
        </>
      )}

      {/* Position dans le parcours + niveau courant.
          Remplace un titre H2 séparé + une rangée de 5 boutons pleine
          largeur avec noms (retour Mouwafic) : le nom de niveau était
          répété deux fois (titre ET onglet actif), et connaître le NOM des
          étapes suivantes n'apporte rien tant qu'on n'y est pas — seule la
          position/le nombre compte. Le stepper ci-dessous reste un pur
          outil de navigation (revenir sur un niveau déjà débloqué) ; le
          nom du niveau courant vit désormais à côté, en petit, une seule
          fois. Avancer se fait via la barre de progression juste en
          dessous (voir "level-cta-ready"), pas en cliquant un onglet. */}
      <style>{`
        @keyframes level-ready-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
          }
          50% {
            box-shadow: 0 0 10px 2px color-mix(in srgb, var(--color-accent) 45%, transparent);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .level-cta-ready {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="flex flex-col items-center gap-2"
        style={{ flexShrink: 0 }}
      >
        <div className="flex items-center gap-4">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: 14,
                right: 14,
                height: 1,
                background: 'var(--color-border)',
                transform: 'translateY(-50%)',
              }}
            />
            {LEARNING_LEVELS.map((level, idx) => {
              const progress = levelProgress.find(
                (p) => p.levelId === level.id,
              )!;
              const isActive = level.id === currentLevelId;
              const isSelectable = progress.unlocked;
              const levelName = t(`level.${level.id}.name`);
              return (
                <button
                  key={level.id}
                  onClick={() => handleLevelSelect(level.id)}
                  disabled={!isSelectable}
                  aria-label={t('levelHeading', {
                    id: level.id,
                    name: levelName,
                  })}
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight:
                      idx < LEARNING_LEVELS.length - 1 ? 14 : 0,
                    border: `1px solid ${
                      isActive
                        ? 'var(--color-accent)'
                        : isSelectable
                          ? 'var(--color-text-muted)'
                          : 'var(--color-border)'
                    }`,
                    background: isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-surface)',
                    color: isActive
                      ? '#000'
                      : isSelectable
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isSelectable ? 'pointer' : 'not-allowed',
                    opacity: isSelectable ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}
                >
                  {level.id}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col" style={{ textAlign: 'left' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-accent)',
                fontSize: '1.15rem',
              }}
            >
              {t('levelHeading', {
                id: currentLevelId,
                name: t(`level.${currentLevelId}.name`),
              })}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              {t(`level.${currentLevelId}.tagline`)}
            </span>
          </div>
        </div>

        {/* Progression : devient elle-même le mécanisme pour avancer une
            fois l'objectif atteint, à la place d'un onglet séparé à
            cliquer. C'est l'endroit que l'œil regarde déjà pendant la
            frappe, la transition progression → bouton n'a besoin d'aucune
            explication. */}
        <div className="flex items-center gap-3 mt-1">
          <div
            style={{
              width: 160,
              height: 4,
              background: 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--color-accent)',
                borderRadius: 'var(--radius-sm)',
              }}
              animate={{ width: `${Math.min(100, progressPercent)}%` }}
              transition={{ duration }}
            />
          </div>
          {canUnlockNext && !isLastLevel ? (
            <button
              onClick={handleNextLevel}
              className="level-cta-ready"
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                // Vraie zone cliquable des deux côtés (10px), mais la
                // marge négative à gauche ne compense qu'une partie du
                // padding (-4px sur 10px) : le bouton ne se rapproche que
                // de 6px de la barre de progression à sa gauche, jamais
                // au point d'empiéter sur son espace (gap-3 = 12px).
                padding: '4px 10px',
                margin: '-4px -10px -4px -4px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-accent)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                animation: 'level-ready-glow 2.2s ease-in-out infinite',
              }}
            >
              {t('readyToUnlock', {
                id: currentLevelId + 1,
                name: t(`level.${currentLevelId + 1}.name`),
              })}
              {showUnlockBurst && !shouldReduceMotion && (
                <AnimatePresence>
                  {['♪', '♫', '♪'].map((glyph, i) => (
                    <motion.span
                      key={`unlock-note-${i}`}
                      aria-hidden="true"
                      initial={{ opacity: 0, y: 0, x: (i - 1) * 8 }}
                      animate={{ opacity: [0, 1, 0], y: -22 }}
                      transition={{
                        duration: 1.1,
                        delay: i * 0.15,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        position: 'absolute',
                        top: -4,
                        left: `${30 + i * 20}%`,
                        color: 'var(--color-accent)',
                        fontSize: 14,
                        pointerEvents: 'none',
                      }}
                    >
                      {glyph}
                    </motion.span>
                  ))}
                </AnimatePresence>
              )}
            </button>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              {t('progressStats', {
                samples: currentProgress.samples,
                minSamples: currentLevel.minSamples,
                accuracy: currentProgress.accuracy.toFixed(0),
                targetAccuracy: currentLevel.minAccuracy,
              })}
            </span>
          )}
        </div>
      </div>

      {/* Zone de frappe.
          marginTop supplémentaire : le compteur wpm/précision de TypingArea
          se positionne en absolute à top: -1.75rem (-28px) au-dessus de sa
          propre boîte (voir apps/web/components/typing/TypingArea.tsx). Le
          gap-4 du conteneur (16px) ne suffit plus à lui seul depuis le
          resserrement de l'espacement du mode Apprentissage : sans cette
          marge, le compteur chevauche le sélecteur de niveaux au-dessus. */}
      <div style={{ marginTop: '1rem', flexShrink: 0 }}>
        <TypingArea
          key={`learning-${currentLevelId}-${runIndex}`}
          text={text}
          mode="learning"
          autoNavigate={false}
          onActiveKeyChange={setActiveKey}
          onSessionComplete={handleLearningSessionComplete}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: 1.4,
          flexShrink: 0,
        }}
      >
        {lastSessionStats && (
          <div>
            {t('lastSession', {
              wpm: Math.round(lastSessionStats.wpm),
              accuracy: Math.round(lastSessionStats.accuracy),
              correct: lastSessionStats.correct,
              total: lastSessionStats.total,
            })}
          </div>
        )}
        {/* Le message "objectif atteint" vit désormais uniquement dans la
            barre de progression ci-dessus (le CTA "level-cta-ready") :
            plus besoin de le répéter ici une fois l'objectif rempli. Ne
            reste que le cas où il manque encore quelque chose, avec le
            détail de ce qui bloque (frappes ou précision), et le rappel
            qu'une série interrompue ne compte pas. */}
        {!canUnlockNext && (
          <div>
            {remainingSamples > 0
              ? t('needMoreReps', {
                  samples: remainingSamples,
                  accuracy: currentLevel.minAccuracy,
                })
              : t('needMoreAccuracy', {
                  accuracy: currentLevel.minAccuracy,
                })}
          </div>
        )}
      </div>

      {/* Schéma clavier : remplit l'espace vertical qui reste (flex:1)
          plutôt que de deviner une taille en vh (voir KeyboardDiagram) —
          c'est ce qui garantit que le pied de page (HomeClient) ne se fait
          plus jamais pousser hors de l'écran, quel que soit l'écran. */}
      <div
        style={{
          width: '100%',
          flex: '1 1 0%',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyboardDiagram
          layout={layout}
          {...(activeKey !== undefined ? { activeKey } : {})}
          {...(currentLevel.keys.length > 0
            ? { allowedKeys: currentLevel.keys }
            : {})}
        />
      </div>

      {/* Fin de tutoriel : le seul cas restant à occuper la pile verticale,
          un moment unique par utilisateur, pas répété à chaque niveau (voir
          le sélecteur de niveaux plus haut pour le cas courant). */}
      <AnimatePresence>
        {tutorialComplete && (
          <motion.div
            key="tutorial-complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                color: 'var(--color-text-primary)',
              }}
            >
              🎉 {t('tutorialComplete')}
            </span>
            <button
              onClick={onExitTutorial}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: '#000',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {t('exitToClassic')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
