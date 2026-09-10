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
import {
  generateLearningDrill,
  mapCharToGestureId,
  pickLearningText,
  pickLearningWords,
} from '@/lib/learning-content';
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
import { LevelRailSpotlight } from './LevelRailSpotlight';
import { LevelTeachStep } from './LevelTeachStep';
import type { LearningModeProps } from './LegacyLearningMode';

const CURRICULUM = LEARNING_CURRICULUM_AZERTY;
const RAIL_COMPACT_QUERY = '(max-width: 900px)';
const DRILL_WORD_COUNT = 18;
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

function highestUnlockedId(progress: LevelProgress[]): number {
  return progress.reduce(
    (max, p) => (p.unlocked ? Math.max(max, p.levelId) : max),
    1,
  );
}

function generateLevelText(level: CurriculumLevel, mastery: KeyMastery): string {
  switch (level.kind) {
    case 'drill':
      return generateLearningDrill(level, mastery, DRILL_WORD_COUNT);
    case 'words':
      return pickLearningWords(level, DRILL_WORD_COUNT);
    case 'text':
      return pickLearningText(level);
    case 'anchors':
    default:
      return '';
  }
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
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(
    null,
  );

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
      // revient à valider le niveau. On débloque directement le suivant.
      const nextId = currentLevelId + 1;
      const nextProgress = unlockLevel(levelProgress, nextId);
      setLevelProgress(nextProgress);
      void saveLearningProgress(nextProgress);
      setCurrentLevelId(nextId);
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

  const handleCelebrationDismiss = useCallback(() => {
    setCelebration(null);
    if (typeof document === 'undefined') return;
    const dot = document.getElementById('level-rail-next-dot');
    if (!dot) return;
    const r = dot.getBoundingClientRect();
    setSpotlight({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, []);

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
                width: railCompact ? 10 : 14,
                height: railCompact ? 10 : 14,
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
                padding: 0,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'background 160ms ease, border-color 160ms ease',
              }}
            />
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
