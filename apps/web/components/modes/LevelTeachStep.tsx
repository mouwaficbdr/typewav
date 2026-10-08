'use client';

/**
 * LevelTeachStep : l'étape interactive d'enseignement d'un niveau du curriculum
 * AZERTY. Généralise l'intro « où poser tes doigts » (#62) à tous les niveaux.
 *
 * Affiche le nom du niveau, la règle du geste en une phrase, le schéma clavier
 * AZERTY avec les nouveaux gestes surlignés par doigt, et une barre de pratique :
 * chaque nouveau geste doit être produit une fois pour activer « Commencer ».
 * La capture passe par un puits caché (`useHiddenCapture`), jamais un listener
 * `keydown` de texte : les touches mortes doivent pouvoir se composer.
 *
 * `onDone` conclut l'étape (le composant appelant décide de la suite : boucle de
 * drill, ou déblocage direct pour un niveau `kind: 'anchors'`).
 */

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { CurriculumLevel } from '@typewav/types';
import { KeyboardDiagramAzerty } from './KeyboardDiagramAzerty';
import { useHiddenCapture } from './useHiddenCapture';

/** Hauteur sous laquelle le schéma ne rétrécit plus (le corps défile alors). */
const DIAGRAM_MIN_HEIGHT = 120;

export interface LevelTeachStepProps {
  level: CurriculumLevel;
  onDone: () => void;
}

export function LevelTeachStep({ level, onDone }: LevelTeachStepProps) {
  const t = useTranslations('learning');
  const [produced, setProduced] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const total = level.newKeys.length;

  const handleChar = useCallback(
    (char: string) => {
      const match = level.newKeys.find(
        (k) => k.char.normalize('NFC') === char,
      );
      if (!match) return;
      setProduced((prev) => {
        if (prev.has(match.id)) return prev;
        const next = new Set(prev);
        next.add(match.id);
        return next;
      });
    },
    [level],
  );

  const { containerRef, inputRef } = useHiddenCapture(handleChar);

  const allProduced = produced.size >= total;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-4 w-full max-w-4xl"
      style={{ height: '100%', minHeight: 0 }}
    >
      {/* Corps défilant (titre, consigne, schéma). Le schéma se réduit pour tenir
          dans la hauteur disponible ; sous sa taille minimale, c'est ce corps
          qui défile, jamais un recouvrement. Le pied de page (progression +
          « Commencer ») est hors du corps et reste toujours visible. */}
      <div
        className="flex flex-col items-center gap-5 w-full"
        style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{ flexShrink: 0 }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent)',
              fontSize: 'clamp(1.5rem, 3.4vh, 2rem)',
              textAlign: 'center',
            }}
          >
            {t(`level.${level.slug}.name`)}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 15,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              maxWidth: 820,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {t(`level.${level.slug}.teach`)}
          </p>
        </div>

        <div
          style={{
            flex: '1 1 0%',
            minHeight: DIAGRAM_MIN_HEIGHT,
            width: '100%',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 0 }}>
            <KeyboardDiagramAzerty highlightKeys={level.newKeys} />
          </div>
        </div>
      </div>

      {/* Pied de page : progression et bouton sur une ligne, hors du corps
          défilant, donc toujours visibles et sans empiler de hauteur. */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        style={{ flexShrink: 0 }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{ flexShrink: 0 }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {t('teachStep.practiceLabel')}
          </p>
          <span
            role="status"
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-accent)',
              fontWeight: 600,
            }}
          >
            {t('teachStep.practiceProgress', {
              count: produced.size,
              total,
            })}
          </span>
        </div>
        <button
          type="button"
          disabled={!allProduced}
          onClick={onDone}
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
            opacity: allProduced ? 1 : 0.45,
            cursor: allProduced ? 'pointer' : 'not-allowed',
            transition: 'opacity 220ms ease',
          }}
        >
          {t('teachStep.start')}
        </button>
      </div>

      {/* Puits de capture clavier hors écran (voir useHiddenCapture). aria-hidden
          + tabIndex=-1 : hors des technologies d'assistance et de l'ordre de
          tabulation ; il reçoit le focus réel pour composer les touches mortes. */}
      <input
        ref={inputRef}
        aria-hidden="true"
        tabIndex={-1}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          border: 0,
          opacity: 0,
          pointerEvents: 'none',
          left: 0,
          top: 0,
          color: 'transparent',
          caretColor: 'transparent',
        }}
      />
    </div>
  );
}
