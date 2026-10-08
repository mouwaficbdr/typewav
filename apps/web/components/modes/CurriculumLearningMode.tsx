'use client';

/**
 * CurriculumLearningMode : le mode Apprentissage piloté par le curriculum AZERTY
 * déclaratif (`LEARNING_CURRICULUM_AZERTY`). `LearningMode` bifurque ici quand la
 * disposition choisie est `azerty` ; `LegacyLearningMode` garde le chemin QWERTY.
 *
 * Flux : migration de version au montage → chargement progression / maîtrise /
 * niveaux enseignés → pour chaque niveau, une étape d'enseignement
 * (`LevelTeachStep`) tant qu'il n'est pas « enseigné », puis une boucle de drill
 * (contenu généré selon `kind`, série relancée à chaque fin). La maîtrise par
 * touche s'accumule à partir du `keystrokeData` de `TypingArea` ; quand chaque
 * nouveau geste atteint sa barre (et, pour un niveau `text`, la précision
 * globale), le niveau suivant se débloque, avec `LevelClearedMoment` + relais
 * spotlight vers son point de rail.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LEARNING_CURRICULUM_AZERTY, type CurriculumLevel } from '@typewav/types';
import { clearLoadedPiece } from '@typewav/audio-engine';
import {
  applyLearningKeystrokes,
  applySessionStats,
  calculateCurriculumProgress,
  canUnlockCurriculumLevel,
  createInitialLevelProgress,
  ensureCurriculumVersion,
  loadKeyMastery,
  loadLearningProgress,
  loadTaughtLevels,
  saveKeyMastery,
  saveLearningProgress,
  saveTaughtLevels,
  unlockLevel,
  type KeyMastery,
  type LevelProgress,
} from '@/lib/learning-progress';
import { generateLevelText, mapCharToGestureId } from '@/lib/learning-content';
import {
  getCelebratedLearningLevels,
  markLearningLevelCelebrated,
} from '@/lib/onboarding';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TypingArea } from '@/components/typing/TypingArea';
import {
  LevelClearedMoment,
  getLevelsWithClearedMoment,
} from './LevelClearedMoment';
import { LevelTeachStep } from './LevelTeachStep';
import type { LearningModeProps } from './LegacyLearningMode';

const CURRICULUM = LEARNING_CURRICULUM_AZERTY;
const RAIL_COMPACT_QUERY = '(max-width: 900px)';
const CELEBRATED_LEVELS = getLevelsWithClearedMoment(CURRICULUM.length);

/** Morceau par défaut pour les niveaux `audio: 'piece'` (aucune sélection de
 *  morceau dans le parcours). `TypingArea` le joue note à note. */
const DEFAULT_LEARNING_PIECE = 'fur-elise';

/** Note isolée jouée à chaque frappe correcte sur un niveau `audio: 'simple'`,
 *  calée sur la rangée physique du niveau (musical, pas une mélodie). */
const SIMPLE_PITCH_BY_SLUG: Record<string, string> = {
  'home-row': 'C4',
  'top-row': 'G4',
  'bottom-row': 'G3',
};

const NAV_BUTTON_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]';
const NAV_BUTTON_STYLE = {
  padding: '8px 18px',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-ui)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
} as const;

function highestUnlockedId(progress: LevelProgress[]): number {
  return progress.reduce(
    (max, p) => (p.unlocked ? Math.max(max, p.levelId) : max),
    1,
  );
}

export function CurriculumLearningMode({ onExitTutorial }: LearningModeProps) {
  const t = useTranslations('learning');
  const railCompact = useMediaQuery(RAIL_COMPACT_QUERY);
  const { loadMidiPiece, playNoteName } = useAudioEngine();

  const [loaded, setLoaded] = useState(false);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>(() =>
    createInitialLevelProgress(CURRICULUM),
  );
  const [keyMastery, setKeyMastery] = useState<KeyMastery>({});
  const [taughtLevels, setTaughtLevels] = useState<number[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [text, setText] = useState('');
  const [runIndex, setRunIndex] = useState(0);
  const [, setActiveKey] = useState<string | undefined>(undefined);
  const [celebration, setCelebration] = useState<{
    levelId: number;
    samples: number;
    accuracy: number;
  } | null>(null);

  const celebratedLevelsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureCurriculumVersion();
      const [progress, mastery, taught, celebrated] = await Promise.all([
        loadLearningProgress(),
        loadKeyMastery(),
        loadTaughtLevels(),
        getCelebratedLearningLevels(),
      ]);
      if (cancelled) return;
      const list = progress ?? createInitialLevelProgress(CURRICULUM);
      const startId = highestUnlockedId(list);
      const startLevel = CURRICULUM[startId - 1];
      celebratedLevelsRef.current = new Set(celebrated);
      setLevelProgress(list);
      setKeyMastery(mastery);
      setTaughtLevels(taught);
      setCurrentLevelId(startId);
      if (
        startLevel &&
        taught.includes(startId) &&
        startLevel.kind !== 'anchors'
      ) {
        setText(generateLevelText(startLevel, mastery));
      }
      setLoaded(true);
    })().catch(() => {
      // Fail open : sur erreur de lecture, on reste sur l'état initial (niveau 1)
      // dont l'utilisateur peut sortir en avançant normalement.
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentLevel = CURRICULUM[currentLevelId - 1];
  const isTaught = taughtLevels.includes(currentLevelId);
  const isLastLevel = currentLevelId === CURRICULUM.length;

  // La régénération du texte est explicite (passage étape → drill, navigation
  // rail, fin de série), jamais dans un effet : un effet qui `setText` +
  // `setRunIndex` au montage remonterait `TypingArea` juste après le premier
  // rendu.
  const startDrill = useCallback(
    (level: CurriculumLevel) => {
      if (level.kind === 'anchors') return;
      setText(generateLevelText(level, keyMastery));
      setRunIndex((i) => i + 1);
    },
    [keyMastery],
  );

  // Bascule audio au changement de niveau : `piece` charge le morceau,
  // `simple` vide le séquenceur (chaque frappe correcte joue une note isolée).
  useEffect(() => {
    if (!loaded) return;
    const lvl = CURRICULUM[currentLevelId - 1];
    if (!lvl) return;
    if (lvl.audio === 'piece') {
      void loadMidiPiece(DEFAULT_LEARNING_PIECE);
    } else {
      clearLoadedPiece();
    }
  }, [currentLevelId, loaded, loadMidiPiece]);

  const targetGestureIds = useMemo(
    () => [...text].map((ch) => mapCharToGestureId(ch)),
    [text],
  );

  const currentProgress = levelProgress.find(
    (p) => p.levelId === currentLevelId,
  );
  const curriculumProgress = currentLevel
    ? calculateCurriculumProgress(currentLevel, keyMastery)
    : { percent: 0, weakestKeyId: null, weakestKeyAccuracy: null };
  const canUnlock =
    !!currentLevel &&
    !!currentProgress &&
    canUnlockCurriculumLevel(currentLevel, keyMastery, {
      samples: currentProgress.samples,
      accuracy: currentProgress.accuracy,
    });
  const tutorialComplete = isLastLevel && canUnlock;

  const maybeCelebrate = useCallback(
    (levelId: number, samples: number, accuracy: number) => {
      if (!CELEBRATED_LEVELS.includes(levelId)) return; // le dernier enchaîne sur la fin
      if (celebratedLevelsRef.current.has(levelId)) return;
      celebratedLevelsRef.current.add(levelId);
      void markLearningLevelCelebrated(levelId);
      setCelebration({
        levelId,
        samples: Math.round(samples),
        accuracy: Math.round(accuracy),
      });
    },
    [],
  );

  const handleSessionComplete = useCallback(
    (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
      keystrokeData: { char: string; correct: boolean }[];
    }) => {
      if (!currentLevel) return;

      const entries = stats.keystrokeData
        .map((k, i) => ({ gestureId: targetGestureIds[i] ?? '', correct: k.correct }))
        .filter((e) => e.gestureId !== '');
      const nextMastery = applyLearningKeystrokes(keyMastery, entries);
      setKeyMastery(nextMastery);
      void saveKeyMastery(nextMastery);

      let nextProgress = applySessionStats(levelProgress, currentLevelId, {
        correct: stats.correct,
        total: stats.total,
      });
      const cp = nextProgress.find((p) => p.levelId === currentLevelId);
      const unlocks =
        !!cp &&
        !isLastLevel &&
        canUnlockCurriculumLevel(currentLevel, nextMastery, {
          samples: cp.samples,
          accuracy: cp.accuracy,
        });
      if (unlocks) {
        nextProgress = unlockLevel(nextProgress, currentLevelId + 1);
      }
      setLevelProgress(nextProgress);
      void saveLearningProgress(nextProgress);

      // Nouvelle série sur le même niveau (adaptative pour les niveaux `drill`).
      setText(generateLevelText(currentLevel, nextMastery));
      setRunIndex((i) => i + 1);

      if (unlocks && cp) {
        maybeCelebrate(currentLevelId, cp.samples, cp.accuracy);
      }
    },
    [
      currentLevel,
      currentLevelId,
      isLastLevel,
      keyMastery,
      levelProgress,
      targetGestureIds,
      maybeCelebrate,
    ],
  );

  const handleNoteChange = useCallback(
    (_note: string | null, isError: boolean) => {
      if (isError) return;
      const lvl = CURRICULUM[currentLevelId - 1];
      if (lvl?.audio !== 'simple') return;
      void playNoteName(SIMPLE_PITCH_BY_SLUG[lvl.slug] ?? 'C4');
    },
    [currentLevelId, playNoteName],
  );

  const handleTeachDone = useCallback(() => {
    if (!currentLevel) return;
    const nextTaught = taughtLevels.includes(currentLevelId)
      ? taughtLevels
      : [...taughtLevels, currentLevelId];
    setTaughtLevels(nextTaught);
    void saveTaughtLevels(nextTaught);

    if (currentLevel.kind === 'anchors') {
      // Le niveau 1 (`anchors`) EST son étape d'enseignement : la valider
      // revient à valider le niveau. On débloque le suivant, puis on va au plus
      // haut niveau atteint (rejouer les repères depuis le rail ne doit pas
      // renvoyer au niveau 2).
      const nextProgress = unlockLevel(levelProgress, currentLevelId + 1);
      setLevelProgress(nextProgress);
      void saveLearningProgress(nextProgress);
      const targetId = highestUnlockedId(nextProgress);
      const target = CURRICULUM[targetId - 1];
      setCurrentLevelId(targetId);
      if (target && nextTaught.includes(targetId)) startDrill(target);
    } else {
      // Passage de l'étape d'enseignement à la boucle de drill du même niveau.
      startDrill(currentLevel);
    }
  }, [currentLevel, currentLevelId, taughtLevels, levelProgress, startDrill]);

  const goToLevel = useCallback(
    (id: number) => {
      const target = levelProgress.find((p) => p.levelId === id);
      if (!target?.unlocked) return;
      setCurrentLevelId(id);
      const lvl = CURRICULUM[id - 1];
      if (lvl && taughtLevels.includes(id)) startDrill(lvl);
    },
    [levelProgress, taughtLevels, startDrill],
  );

  // Fermer la célébration mène au niveau qui vient de se débloquer : le
  // « une touche pour continuer » du moment dit vrai.
  const handleCelebrationDismiss = useCallback(() => {
    const clearedId = celebration?.levelId;
    setCelebration(null);
    if (clearedId !== undefined) goToLevel(clearedId + 1);
  }, [celebration, goToLevel]);

  if (!loaded || !currentLevel) {
    return <div aria-busy="true" style={{ minHeight: 200 }} />;
  }

  // Niveau `anchors` (1) : toujours son étape d'enseignement, jamais de drill.
  if (!isTaught || currentLevel.kind === 'anchors') {
    return (
      <LevelTeachStep
        key={currentLevelId}
        level={currentLevel}
        onDone={handleTeachDone}
      />
    );
  }

  const unlockedById = new Map(levelProgress.map((p) => [p.levelId, p.unlocked]));
  // Niveau suivant déjà débloqué (validé à l'instant, ou déjà passé) : un bouton
  // large y mène, sans avoir à viser une pastille du rail.
  const nextLevel =
    !isLastLevel && unlockedById.get(currentLevelId + 1)
      ? CURRICULUM[currentLevelId]
      : undefined;

  return (
    <div
      className="flex w-full gap-6"
      style={{
        flexDirection: railCompact ? 'column' : 'row',
        alignItems: railCompact ? 'center' : 'stretch',
        height: '100%',
        minHeight: 0,
      }}
    >
      <nav
        aria-label={t('curriculum.levelCounter', {
          id: currentLevelId,
          total: CURRICULUM.length,
        })}
        className="flex"
        style={{
          flexDirection: railCompact ? 'row' : 'column',
          gap: railCompact ? 8 : 10,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {CURRICULUM.map((level) => {
          const isCurrent = level.id === currentLevelId;
          const isUnlocked = unlockedById.get(level.id) ?? false;
          const isNext = level.id === currentLevelId + 1;
          return (
            <button
              key={level.id}
              type="button"
              {...(isNext ? { id: 'level-rail-next-dot' } : {})}
              onClick={() => goToLevel(level.id)}
              disabled={!isUnlocked}
              aria-current={isCurrent ? 'step' : undefined}
              title={t(`level.${level.slug}.name`)}
              style={{
                width: railCompact ? 24 : 28,
                height: railCompact ? 24 : 28,
                borderRadius: '50%',
                border: `2px solid ${
                  isCurrent || isUnlocked
                    ? 'var(--color-accent)'
                    : 'var(--color-border, rgba(255,255,255,0.2))'
                }`,
                background: isCurrent
                  ? 'var(--color-accent)'
                  : isUnlocked
                    ? 'transparent'
                    : 'var(--color-border, rgba(255,255,255,0.12))',
                color: isCurrent
                  ? '#000'
                  : isUnlocked
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'background 160ms ease, border-color 160ms ease',
              }}
            >
              {level.id}
            </button>
          );
        })}
      </nav>

      <section
        className="flex flex-col items-center gap-4 flex-1"
        style={{ minHeight: 0, justifyContent: 'center', width: '100%' }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
            fontSize: '1.5rem',
            textAlign: 'center',
          }}
        >
          {t(`level.${currentLevel.slug}.name`)}
        </h2>

        <div
          role="progressbar"
          aria-valuenow={curriculumProgress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            width: 'min(420px, 100%)',
            height: 6,
            borderRadius: 999,
            background: 'var(--color-border, rgba(255,255,255,0.12))',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${curriculumProgress.percent}%`,
              height: '100%',
              background: 'var(--color-accent)',
              transition: 'width 240ms ease',
            }}
          />
        </div>
        {curriculumProgress.weakestKeyId && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
            }}
          >
            {t('mastery.weakKey', {
              key: curriculumProgress.weakestKeyId,
              accuracy: curriculumProgress.weakestKeyAccuracy ?? 0,
            })}
          </p>
        )}

        <div
          data-testid="drill-zone"
          style={{ width: '100%', flex: '1 1 0%', minHeight: 0 }}
        >
          <TypingArea
            key={`clm-${currentLevelId}-${runIndex}`}
            text={text}
            mode="learning"
            autoNavigate={false}
            onActiveKeyChange={setActiveKey}
            onNoteChange={handleNoteChange}
            onSessionComplete={handleSessionComplete}
          />
        </div>

        {(currentLevelId > 1 || nextLevel) && (
          <div
            className="flex flex-wrap items-center justify-center gap-3"
            style={{ flexShrink: 0 }}
          >
            {currentLevelId > 1 && (
              <button
                type="button"
                onClick={() => goToLevel(currentLevelId - 1)}
                className={NAV_BUTTON_CLASS}
                style={{
                  ...NAV_BUTTON_STYLE,
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border, rgba(255,255,255,0.2))',
                }}
              >
                {t('prevLevelCta')}
              </button>
            )}
            {nextLevel && (
              <button
                type="button"
                onClick={() => goToLevel(nextLevel.id)}
                className={NAV_BUTTON_CLASS}
                style={{
                  ...NAV_BUTTON_STYLE,
                  background: 'var(--color-accent)',
                  color: '#000',
                  border: 'none',
                }}
              >
                {t('nextLevelNamed', {
                  id: nextLevel.id,
                  name: t(`level.${nextLevel.slug}.name`),
                })}
              </button>
            )}
          </div>
        )}

        {tutorialComplete && (
          <button
            type="button"
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
            {t('tutorialComplete')}
          </button>
        )}
      </section>

      {celebration && (
        <LevelClearedMoment
          levelId={celebration.levelId}
          samples={celebration.samples}
          accuracy={celebration.accuracy}
          onDismiss={handleCelebrationDismiss}
          levelName={t(
            `level.${CURRICULUM[celebration.levelId - 1]?.slug ?? ''}.name`,
          )}
          levelTagline={t(
            `level.${CURRICULUM[celebration.levelId - 1]?.slug ?? ''}.tagline`,
          )}
        />
      )}
    </div>
  );
}
