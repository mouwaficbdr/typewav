'use client';

/**
 * LearningMode : mode d'apprentissage Home Row avec niveaux progressifs.
 *
 * Spec : docs/specs/03-training-modes.md (Mode Apprentissage)
 * Client Component justifié : événements clavier, état de progression.
 */

import { KeyboardDiagram } from '@/components/modes/KeyboardDiagram';
import {
  LEVELS_WITH_CLEARED_MOMENT,
  LevelClearedMoment,
} from '@/components/modes/LevelClearedMoment';
import { LevelRailSpotlight } from '@/components/modes/LevelRailSpotlight';
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
  getCelebratedLearningLevels,
  hasSeenLearningFingerIntro,
  markLearningFingerIntroSeen,
  markLearningLevelCelebrated,
} from '@/lib/onboarding';
import { generateLearningText } from '@/lib/words';
import { LEARNING_LEVELS } from '@typewav/types';
import { Pointer } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Halo de la consigne (écran « Où poser tes doigts »). Intensité au repos,
// intensité apaisée une fois les 8 repères touchés, et le text-shadow diffus
// calculé depuis la variable CSS `--halo-strength` (pattern color-mix déjà
// utilisé ailleurs dans l'app). Trois couches proche/moyenne/lointaine pour
// une décroissance douce plutôt qu'un anneau net.
const HALO_STRENGTH_REST = 0.22;
const HALO_STRENGTH_CALM = 0.05;
const HINT_HALO_TEXT_SHADOW =
  '0 0 4px color-mix(in srgb, var(--color-accent) calc(var(--halo-strength) * 34%), transparent), ' +
  '0 0 22px color-mix(in srgb, var(--color-accent) calc(var(--halo-strength) * 46%), transparent), ' +
  '0 0 42px color-mix(in srgb, var(--color-accent) calc(var(--halo-strength) * 24%), transparent)';

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
   * manuelle). LearningMode ne sait pas lequel des deux s'est produit : il
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
  // active (effet de génération), jamais chronométrée ni notée. L'ordre est
  // libre, mais toucher les 8 repères est requis pour poursuivre : le
  // bouton « Commencer » ne s'active qu'à 8/8.
  const [touchedFingerKeys, setTouchedFingerKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const homeRowKeys = useMemo(
    () => LEARNING_LEVELS.find((l) => l.id === 1)?.keys ?? [],
    [],
  );
  const fingerAnchorsReady =
    homeRowKeys.length > 0 && touchedFingerKeys.size === homeRowKeys.length;

  // Halo de la consigne : une seule variable CSS (--halo-strength) animée
  // impérativement via des controls motion, donc entièrement hors du cycle
  // de rendu React (aucun re-render pendant la pulsation). Le text-shadow
  // des deux éléments (consigne + compteur) est calculé depuis cette
  // variable. Repos discret, pulsation à 2 respirations sur un clic
  // prématuré, apaisement une fois les 8 repères touchés.
  const hintControls = useAnimationControls();
  const startHintAnim = useCallback(
    (definition: Record<string, unknown>) => {
      // motion type ses cibles sans les custom properties CSS : cast local.
      void hintControls.start(
        definition as Parameters<typeof hintControls.start>[0],
      );
    },
    [hintControls],
  );

  useEffect(() => {
    if (fingerIntroDismissed) return;
    startHintAnim({
      '--halo-strength': fingerAnchorsReady
        ? HALO_STRENGTH_CALM
        : HALO_STRENGTH_REST,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    });
  }, [fingerAnchorsReady, fingerIntroDismissed, startHintAnim]);

  const pulseHintNow = useCallback(() => {
    if (shouldReduceMotion) {
      startHintAnim({
        '--halo-strength': [HALO_STRENGTH_REST, 0.9, HALO_STRENGTH_REST],
        transition: { duration: 0.5, ease: 'easeInOut' },
      });
      return;
    }
    startHintAnim({
      '--halo-strength': [HALO_STRENGTH_REST, 1, 0.55, 1, HALO_STRENGTH_REST],
      scale: [1, 1.025, 1.01, 1.025, 1],
      transition: {
        duration: 1.9,
        times: [0, 0.2, 0.5, 0.8, 1],
        ease: 'easeInOut',
      },
    });
  }, [startHintAnim, shouldReduceMotion]);

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

  // Sauvegarder à chaque changement, une fois le chargement initial terminé :
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

  // Moment "Niveau N validé" : joué une fois quand l'objectif cumulé du
  // niveau vient d'être atteint (canUnlockNext bascule), sauf sur le dernier
  // niveau (qui enchaîne sur l'écran de fin de tutoriel) et sauf s'il a déjà
  // été célébré (flag persisté). L'invite permanente à avancer reste le
  // pulse + la main sur le point suivant du rail ; ce moment est le pic
  // ponctuel qui pointe vers lui, puis se résout en spotlight.
  const prevCanUnlockNextRef = useRef(false);
  const celebratedLevelsRef = useRef<Set<number>>(new Set());
  const [celebration, setCelebration] = useState<{
    levelId: number;
    samples: number;
    accuracy: number;
  } | null>(null);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    getCelebratedLearningLevels().then((ids) => {
      if (!cancelled) celebratedLevelsRef.current = new Set(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const justUnlocked = canUnlockNext && !prevCanUnlockNextRef.current;
    prevCanUnlockNextRef.current = canUnlockNext;
    if (!justUnlocked || isLastLevel) return;
    if (!LEVELS_WITH_CLEARED_MOMENT.includes(currentLevelId)) return;
    if (celebratedLevelsRef.current.has(currentLevelId)) return;
    // Seulement si franchir CE niveau débloque vraiment le suivant : revenir
    // sur un niveau déjà bouclé (suivant déjà ouvert) ne rejoue rien. Couvre
    // aussi le chargement d'une sauvegarde où la progression était déjà
    // au-delà du seuil.
    const nextUnlocked = !!levelProgress.find(
      (p) => p.levelId === currentLevelId + 1,
    )?.unlocked;
    if (nextUnlocked) return;

    setCelebration({
      levelId: currentLevelId,
      samples: currentProgress.samples,
      accuracy: currentProgress.accuracy,
    });
  }, [
    canUnlockNext,
    isLastLevel,
    currentLevelId,
    levelProgress,
    currentProgress.samples,
    currentProgress.accuracy,
  ]);

  const handleCelebrationDismiss = useCallback(() => {
    setCelebration((current) => {
      if (current) {
        celebratedLevelsRef.current.add(current.levelId);
        void markLearningLevelCelebrated(current.levelId);
      }
      return null;
    });
    // Le point suivant du rail existe déjà (il pulse depuis que canUnlockNext
    // a basculé) : on mesure sa position ici (gestionnaire, pas un effet) et
    // on enchaîne sur le spotlight de relais.
    const dot = document.getElementById('level-rail-next-dot');
    if (dot) {
      const r = dot.getBoundingClientRect();
      setSpotlight({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  }, []);

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

        <motion.div
          className="flex flex-col items-center gap-2"
          initial={false}
          animate={hintControls}
          style={{
            flexShrink: 0,
            // Valeur de repos ; l'animation la fait osciller puis y revient,
            // et l'apaise à HALO_STRENGTH_CALM une fois les 8 repères touchés.
            // motion pose son propre will-change le temps de l'animation.
            ['--halo-strength' as string]: HALO_STRENGTH_REST,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              // Le texte reste en couleur primaire (contraste AA garanti) :
              // c'est le halo accent qui porte la mise en avant, pas un
              // recoloriage du texte.
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              textAlign: 'center',
              margin: 0,
              textShadow: HINT_HALO_TEXT_SHADOW,
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
              color: 'var(--color-accent)',
              fontWeight: 600,
              textShadow: HINT_HALO_TEXT_SHADOW,
            }}
          >
            {t('fingerIntro.practiceProgress', {
              count: touchedCount,
              total: homeRowKeys.length,
            })}
          </span>
        </motion.div>

        <button
          type="button"
          onClick={fingerAnchorsReady ? handleFingerIntroStart : pulseHintNow}
          aria-disabled={!fingerAnchorsReady}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
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
            // Pas l'attribut `disabled` natif : il avalerait le clic, or on
            // veut détecter le clic prématuré pour déclencher le halo. Le
            // bouton « s'allume » (opacité pleine) quand les 8 sont touchés.
            opacity: fingerAnchorsReady ? 1 : 0.45,
            cursor: fingerAnchorsReady ? 'pointer' : 'not-allowed',
            transition: 'opacity 220ms ease',
          }}
        >
          {t('fingerIntro.start')}
        </button>
      </div>
    );
  }

  const isReadyToAdvance = canUnlockNext && !isLastLevel;

  // Le trait de liaison du stepper doit finir au centre du dernier point.
  // Un grand point numéroté (niveau débloqué, actif, ou tout juste
  // débloquable) a son centre à ~15px du bas de la grille ; un petit point
  // verrouillé, à ~6px.
  const lastLevelId = LEARNING_LEVELS[LEARNING_LEVELS.length - 1]!.id;
  const lastDotIsBig =
    currentLevelId === lastLevelId ||
    !!levelProgress.find((p) => p.levelId === lastLevelId)?.unlocked ||
    (isReadyToAdvance && currentLevelId + 1 === lastLevelId);
  const connectorBottom = lastDotIsBig ? 15 : 6;

  return (
    <div
      // Grille à 3 colonnes (marge élastique, contenu, marge élastique)
      // plutôt qu'un flex centré sur (rail + contenu) comme bloc unique :
      // ce dernier collait le rail juste à gauche du texte, au milieu de
      // la page, pas contre le vrai bord gauche (retour Mouwafic sur le
      // premier rendu réel). En grille, le contenu reste centré sur la
      // largeur réelle de la page (2ᵉ colonne, à sa taille naturelle) et le
      // rail se cale contre le bord gauche de la 1ʳᵉ colonne élastique,
      // quelle que soit la largeur de l'écran.
      className="w-full"
      style={{
        height: '100%',
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '1fr minmax(0, 920px) 1fr',
        columnGap: 28,
      }}
    >
      <style>{`
        @keyframes level-next-ping {
          0% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 55%, transparent);
          }
          70%, 100% {
            box-shadow: 0 0 0 9px color-mix(in srgb, var(--color-accent) 0%, transparent);
          }
        }
        .level-next-cta {
          animation: level-next-ping 1.6s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .level-next-cta {
            animation: none !important;
          }
        }
      `}</style>

      {/* Rail de niveaux, en marge plutôt qu'empilé au-dessus de la leçon.
          Coûtait auparavant une rangée horizontale complète (stepper + nom +
          barre de progression), donc sa propre hauteur ET son propre gap-11 ;
          en colonne latérale, il ne coûte plus aucune hauteur au flux
          vertical principal, la vraie cause de l'ancien clavier réduit à
          zéro pixel pendant l'onboarding (mesuré en navigateur réel). Sert
          à revenir sur un niveau déjà débloqué ; pour avancer, une fois
          l'objectif atteint, le point suivant pulse et une main animée
          pointe vers lui (cliquer dessus passe au niveau suivant). N'a pas
          encore de repli dédié sous une largeur de fenêtre réduite : la
          vraie passe responsive est le ticket #71, volontairement après
          coup pour ne pas refaire ce travail plusieurs fois. */}
      <div
        style={{
          justifySelf: 'start',
          width: 264,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          paddingTop: 64,
        }}
      >
        {/* Grille à deux colonnes (point, 30px ; étiquette, le reste) plutôt
            qu'une étiquette positionnée en absolu à côté du point : en flux
            normal, la colonne de contenu ne peut jamais en hériter un
            chevauchement, quelle que soit la longueur du texte traduit
            (repéré en navigateur réel avec l'ancienne version en absolu, qui
            chevauchait "0/50 frappes..." juste à côté). Chaque niveau
            fournit exactement deux cellules (point, puis étiquette vide ou
            pleine) via Fragment pour ne jamais désaligner la grille. */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '30px 1fr',
            alignItems: 'center',
            rowGap: 18,
            columnGap: 16,
            width: '100%',
          }}
        >
          {/* Trait de liaison : du centre du premier point (~15px, le
              niveau 1 est toujours un grand point) au centre du dernier.
              Les points ont un fond opaque : ils masquent le trait sur leur
              diamètre, il ne reste visible que dans les intervalles, comme
              un vrai stepper. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 15,
              top: 15,
              bottom: connectorBottom,
              width: 1,
              background:
                'color-mix(in srgb, var(--color-text-muted) 32%, transparent)',
              zIndex: 0,
            }}
          />
          {LEARNING_LEVELS.map((level) => {
            const progress = levelProgress.find(
              (p) => p.levelId === level.id,
            )!;
            const isActive = level.id === currentLevelId;
            const isUnlocked = progress.unlocked;
            const levelName = t(`level.${level.id}.name`);

            // Prochaine étape : le niveau juste après l'actif, franchissable
            // maintenant mais pas encore franchi. C'est LUI qui porte
            // l'invite à avancer (pulse + main qui pointe), pas le point
            // actif (retour Mouwafic). Une fois franchi (ou déjà débloqué
            // dans une sauvegarde), il redevient un point ordinaire.
            const isNextUp =
              isReadyToAdvance &&
              level.id === currentLevelId + 1 &&
              !isUnlocked;

            // Verrouillé : petit point sobre, sans numéro. Tout le reste
            // (actif, déjà débloqué, ou tout juste débloquable) : grand
            // point numéroté, même diamètre que le point actif, pour ne pas
            // semer la confusion entre les états (retour Mouwafic).
            const isBig = isActive || isUnlocked || isNextUp;

            if (!isBig) {
              return (
                <Fragment key={level.id}>
                  <button
                    onClick={() => handleLevelSelect(level.id)}
                    disabled
                    aria-label={t('levelHeading', {
                      id: level.id,
                      name: levelName,
                    })}
                    style={{
                      justifySelf: 'center',
                      position: 'relative',
                      zIndex: 1,
                      width: 12,
                      height: 12,
                      padding: 0,
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                      background: 'var(--color-bg)',
                      border:
                        '1.5px solid color-mix(in srgb, var(--color-text-muted) 55%, transparent)',
                      cursor: 'not-allowed',
                    }}
                  />
                  <span aria-hidden="true" />
                </Fragment>
              );
            }

            const ringPercent = isActive
              ? isReadyToAdvance
                ? 100
                : Math.min(100, Math.max(0, progressPercent))
              : 100;

            return (
              <Fragment key={level.id}>
                <button
                  {...(isNextUp ? { id: 'level-rail-next-dot' } : {})}
                  onClick={
                    isNextUp
                      ? () => handleNextLevel()
                      : () => handleLevelSelect(level.id)
                  }
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={
                    isNextUp
                      ? t('readyToUnlock', { id: level.id, name: levelName })
                      : t('levelHeading', { id: level.id, name: levelName })
                  }
                  className={isNextUp ? 'level-next-cta' : undefined}
                  style={{
                    justifySelf: 'center',
                    // Le point actif est calé en haut de sa rangée (son
                    // étiquette la rend plus haute que 30px) ; les autres
                    // grands points tiennent dans une rangée de 30px.
                    ...(isActive ? { alignSelf: 'start' } : {}),
                    position: 'relative',
                    zIndex: 1,
                    width: 30,
                    height: 30,
                    padding: 3,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    // Anneau : progression réelle pour l'actif ; accent plein
                    // et vif pour le prochain (invite au clic) ; accent
                    // atténué pour un niveau déjà franchi.
                    background: isActive
                      ? `conic-gradient(var(--color-accent) ${ringPercent * 3.6}deg, var(--color-border) 0deg)`
                      : isNextUp
                        ? 'var(--color-accent)'
                        : 'color-mix(in srgb, var(--color-accent) 45%, var(--color-border))',
                    boxShadow: isActive
                      ? `0 0 0 5px color-mix(in srgb, var(--color-accent) 22%, transparent), 0 0 22px 3px color-mix(in srgb, var(--color-accent) ${isReadyToAdvance ? 70 : 48}%, transparent)`
                      : undefined,
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background:
                        isActive && isReadyToAdvance
                          ? 'var(--color-accent)'
                          : 'var(--color-surface)',
                      color:
                        isActive && isReadyToAdvance
                          ? '#000'
                          : isNextUp || isActive
                            ? 'var(--color-accent)'
                            : 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text))',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {level.id}
                  </span>
                </button>

                {isActive ? (
                  <div
                    style={{
                      textAlign: 'left',
                      minWidth: 0,
                      alignSelf: 'start',
                      paddingTop: 2,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-accent)',
                        fontSize: '1.05rem',
                        lineHeight: 1.25,
                      }}
                    >
                      {t('levelHeading', { id: level.id, name: levelName })}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.35,
                        marginTop: 2,
                      }}
                    >
                      {t('progressStats', {
                        samples: currentProgress.samples,
                        minSamples: currentLevel.minSamples,
                        accuracy: currentProgress.accuracy.toFixed(0),
                        targetAccuracy: currentLevel.minAccuracy,
                      })}
                    </div>
                  </div>
                ) : isNextUp ? (
                  <motion.div
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, x: 10 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.45,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <motion.span
                      aria-hidden="true"
                      {...(shouldReduceMotion
                        ? {}
                        : {
                            animate: { x: [0, -4, 0] },
                            transition: {
                              duration: 1.1,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          })}
                      style={{
                        color: 'var(--color-accent)',
                        flexShrink: 0,
                        display: 'flex',
                      }}
                    >
                      {/* Main lucide qui vise le point, à sa gauche
                          (l'icône pointe vers le haut par défaut). */}
                      <Pointer
                        size={17}
                        strokeWidth={2.25}
                        style={{ transform: 'rotate(-90deg)' }}
                      />
                    </motion.span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {levelName}
                    </span>
                  </motion.div>
                ) : (
                  <span aria-hidden="true" />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div
        // gap-8 (32px) entre les sections majeures : le compteur
        // wpm/précision de TypingArea flotte en `position: absolute;
        // top: -1.75rem` (-28px) au-dessus de sa propre boîte, donc l'écart
        // doit rester > ~28px (ici 4px de marge) pour qu'il ne semble pas
        // collé à ce qui précède ; en dessous de ça on redonne au clavier la
        // hauteur verticale que 3 gap-11 lui prenaient.
        className="flex flex-col items-center gap-8 w-full"
        style={{ height: '100%', minHeight: 0, maxWidth: 920 }}
      >
        {/* Annonce lecteur d'écran du déblocage : le moment "Niveau N validé"
            et le pulse du point suivant sont visuels, ce changement d'état
            doit rester perceptible sans les yeux. */}
        <div role="status" aria-live="polite" className="sr-only">
          {celebration && !isLastLevel
            ? t('unlockedAnnouncement', {
                id: celebration.levelId + 1,
                name: t(`level.${celebration.levelId + 1}.name`),
              })
            : ''}
        </div>

        {isOnboarding && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* La promesse musicale du produit vit dans les meta SEO, mais
                aucun utilisateur ne les voit jamais : c'est ici, au tout
                premier contact, qu'elle doit vivre à l'écran.
                Alignée à gauche plutôt que centrée sur toute la ligne : la
                centrer forçait un calcul de largeur fragile pour ne jamais
                chevaucher le bouton (vérifié en navigateur, cassait sur ce
                texte précis) ; space-between garantit qu'ils ne se
                chevauchent jamais, quelle que soit la longueur traduite. */}
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--color-accent)',
                fontSize: '1.1rem',
                margin: 0,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t('tagline')}
            </p>
            <button
              onClick={onExitTutorial}
              style={{
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
          </div>
        )}
      {/* Zone de frappe. Le compteur wpm/précision de TypingArea se
          positionne en absolute à top: -1.75rem (-28px) au-dessus de sa
          propre boîte (voir apps/web/components/typing/TypingArea.tsx) :
          le gap-11 du conteneur lui laisse déjà une marge confortable,
          plus besoin d'un marginTop dédié ici. */}
      <div style={{ flexShrink: 0 }}>
        <TypingArea
          key={`learning-${currentLevelId}-${runIndex}`}
          text={text}
          mode="learning"
          autoNavigate={false}
          onActiveKeyChange={setActiveKey}
          onSessionComplete={handleLearningSessionComplete}
        />
      </div>

      {/* N'occupe une place (et le gap-11 avant/après) que s'il y a
          vraiment quelque chose à montrer : sinon un div vide laissait un
          double espace fantôme entre la zone de frappe et le clavier,
          brisant le rythme uniforme des sections. */}
      {(lastSessionStats || !canUnlockNext) && (
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
          {/* Le décompte brut ("X/Y frappes") vit désormais sur le point de
              niveau actif (rail de gauche), pas ici en double : ne reste que
              le détail de ce qui bloque encore (frappes ou précision) et le
              rappel qu'une série interrompue ne compte pas. Le message
              "objectif atteint" vit lui aussi uniquement sur le point actif
              (anneau plein et lumineux), plus besoin de le répéter ici. */}
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
      )}

      {/* Schéma clavier : remplit l'espace vertical qui reste (flex:1)
          plutôt que de deviner une taille en vh (voir KeyboardDiagram) :
          c'est ce qui garantit que le pied de page (HomeClient) ne se fait
          plus jamais pousser hors de l'écran, quel que soit l'écran.
          alignItems:'flex-start' plutôt que 'center' : sur un écran haut,
          l'espace en trop (le clavier a son propre plafond de taille) doit
          s'accumuler vers le bas (rien d'important après lui), pas le
          faire flotter loin du contenu au-dessus. */}
      <div
        style={{
          width: '100%',
          flex: '1 1 0%',
          minHeight: 0,
          display: 'flex',
          alignItems: 'flex-start',
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

      {/* Moment "Niveau N validé" : overlay plein écran transitoire, puis
          relais spotlight vers le point suivant du rail. */}
      <AnimatePresence>
        {celebration && (
          <LevelClearedMoment
            key="level-cleared"
            levelId={celebration.levelId}
            samples={celebration.samples}
            accuracy={celebration.accuracy}
            onDismiss={handleCelebrationDismiss}
          />
        )}
      </AnimatePresence>
      {spotlight && (
        <LevelRailSpotlight
          x={spotlight.x}
          y={spotlight.y}
          onDone={() => setSpotlight(null)}
        />
      )}
    </div>
  );
}
