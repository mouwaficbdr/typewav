'use client';

/**
 * CurriculumLearningMode : le mode Apprentissage piloté par le curriculum AZERTY
 * déclaratif (`LEARNING_CURRICULUM_AZERTY`). `LearningMode` bifurque ici quand la
 * disposition choisie est `azerty` ; `LegacyLearningMode` garde le chemin QWERTY.
 *
 * Task 12 (ce fichier) : squelette — migration de version au montage, chargement
 * de la progression / maîtrise / niveaux enseignés, routage étape
 * d'enseignement vs boucle de drill, rail de niveaux. La boucle de drill
 * elle-même (contenu généré, intégration de la maîtrise par touche, déblocage,
 * audio) arrive Task 13 : ici la zone de drill est un simple placeholder.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';
import {
  createInitialLevelProgress,
  ensureCurriculumVersion,
  loadKeyMastery,
  loadLearningProgress,
  loadTaughtLevels,
  saveLearningProgress,
  saveTaughtLevels,
  unlockLevel,
  type KeyMastery,
  type LevelProgress,
} from '@/lib/learning-progress';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LevelTeachStep } from './LevelTeachStep';
import type { LearningModeProps } from './LegacyLearningMode';

const CURRICULUM = LEARNING_CURRICULUM_AZERTY;
const RAIL_COMPACT_QUERY = '(max-width: 900px)';

function highestUnlockedId(progress: LevelProgress[]): number {
  return progress.reduce((max, p) => (p.unlocked ? Math.max(max, p.levelId) : max), 1);
}

export function CurriculumLearningMode({ onExitTutorial }: LearningModeProps) {
  const t = useTranslations('learning');
  const railCompact = useMediaQuery(RAIL_COMPACT_QUERY);

  const [loaded, setLoaded] = useState(false);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>(() =>
    createInitialLevelProgress(CURRICULUM),
  );
  const [keyMastery, setKeyMastery] = useState<KeyMastery>({});
  const [taughtLevels, setTaughtLevels] = useState<number[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState(1);

  // Maîtrise chargée : consommée par la boucle de drill (Task 13). Référencée
  // ici pour ne pas la perdre au montage.
  void keyMastery;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureCurriculumVersion();
      const [progress, mastery, taught] = await Promise.all([
        loadLearningProgress(),
        loadKeyMastery(),
        loadTaughtLevels(),
      ]);
      if (cancelled) return;
      const list = progress ?? createInitialLevelProgress(CURRICULUM);
      setLevelProgress(list);
      setKeyMastery(mastery);
      setTaughtLevels(taught);
      setCurrentLevelId(highestUnlockedId(list));
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

  const handleTeachDone = useCallback(() => {
    if (!currentLevel) return;
    const nextTaught = taughtLevels.includes(currentLevelId)
      ? taughtLevels
      : [...taughtLevels, currentLevelId];
    setTaughtLevels(nextTaught);
    void saveTaughtLevels(nextTaught);

    // Le niveau 1 (`anchors`) EST son étape d'enseignement : la valider revient
    // à valider le niveau. On débloque directement le suivant.
    if (currentLevel.kind === 'anchors') {
      const nextId = currentLevelId + 1;
      const nextProgress = unlockLevel(levelProgress, nextId);
      setLevelProgress(nextProgress);
      void saveLearningProgress(nextProgress);
      setCurrentLevelId(nextId);
    }
    // Sinon : `currentLevelId` est maintenant « enseigné » → la zone de drill
    // s'affiche (Task 13).
  }, [currentLevel, currentLevelId, taughtLevels, levelProgress]);

  const goToLevel = useCallback(
    (id: number) => {
      const target = levelProgress.find((p) => p.levelId === id);
      if (target?.unlocked) setCurrentLevelId(id);
    },
    [levelProgress],
  );

  if (!loaded || !currentLevel) {
    return <div aria-busy="true" style={{ minHeight: 200 }} />;
  }

  if (!taughtLevels.includes(currentLevelId)) {
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
        <p
          role="status"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('curriculum.levelCounter', {
            id: currentLevelId,
            total: CURRICULUM.length,
          })}
        </p>
        {/* Zone de drill : remplie Task 13 (contenu généré + TypingArea). */}
        <div data-testid="drill-zone" style={{ width: '100%', flex: '1 1 0%', minHeight: 0 }} />
        {currentLevelId === CURRICULUM.length && (
          <button type="button" onClick={onExitTutorial}>
            {t('exitToClassic')}
          </button>
        )}
      </section>
    </div>
  );
}
