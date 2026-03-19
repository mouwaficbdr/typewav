'use client';

/**
 * HomeClient — page d'accueil interactive.
 *
 * 6 zones spec-29 :
 *   Zone 1 — GlobalNav (layout.tsx)
 *   Zone 2 — ConfigBar
 *   Zone 3 — Source attribution
 *   Zone 4 — TypingArea
 *   Zone 5 — WaveformBars + restart + hint
 *   Zone 6 — Footer minimal
 *
 * Client Component justifié : état interactif, TypingArea, audio.
 * Spec : docs/specs/29-home-layout.md
 */

import {
  type CollectionId,
  fetchCollection,
} from '@/app/[locale]/actions/collections';
import { LearningMode } from '@/components/modes/LearningMode';
import { ActiveSessionHeader } from '@/components/typing/ActiveSessionHeader';
import { ConfigBar } from '@/components/typing/ConfigBar';
import { ContextSelectors } from '@/components/typing/ContextSelectors';
import { TypingArea } from '@/components/typing/TypingArea';
import { WaveformBars } from '@/components/typing/WaveformBars';
import { MusicNoteIcon, RepeatIcon } from '@/components/ui/icons';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSyncCloud } from '@/hooks/useSyncCloud';
import { useUser } from '@/hooks/useUser';
import { getPersonalRecords, getSessionById } from '@/lib/db';
import { applyTextFilters } from '@/lib/text-filters';
import { useAudioStore } from '@/stores/useAudioStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { type MidiPieceId } from '@typewav/audio-engine';
import type { CollectionConfig } from '@typewav/types';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import webPackage from '../../package.json';

interface HomeClientProps {
  initialCollection: CollectionConfig;
}

/**
 * Calcule un index de texte déterministe basé sur le jour de l'année.
 * Garantit l'absence de hydration mismatch (même valeur serveur/client).
 */
function getDailyIndex(length: number, offset = 0): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return (dayOfYear + offset) % length;
}

export function HomeClient({ initialCollection }: HomeClientProps) {
  const tHint = useTranslations('typing');
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();

  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [selectedPieceId, setSelectedPieceId] =
    useState<MidiPieceId>('fur-elise');
  const [ghostTimings, setGhostTimings] = useState<number[] | null>(null);
  const [collectionsCache, setCollectionsCache] = useState<
    Partial<Record<CollectionId, CollectionConfig>>
  >({ litterature: initialCollection });
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [lastNote, setLastNote] = useState<{
    key: string | null;
    isError: boolean;
  }>({ key: null, isError: false });

  // Ref to avoid stale closure in useEffect (collections)
  const collectionsCacheRef = useRef(collectionsCache);
  collectionsCacheRef.current = collectionsCache;

  const activeCollection = useConfigStore((s) => s.activeCollection);
  const activeMode = useConfigStore((s) => s.activeMode);
  const punctuationEnabled = useConfigStore((s) => s.punctuationEnabled);
  const numbersEnabled = useConfigStore((s) => s.numbersEnabled);
  const wordCount = useConfigStore((s) => s.wordCount);
  const textLanguage = useConfigStore((s) => s.textLanguage);
  const durationSeconds = useConfigStore((s) => s.durationSeconds);

  const isLearningMode = activeMode === 'learning';
  const hasGhostData = ghostTimings !== null && ghostTimings.length > 0;
  const ghostEnabled = activeMode === 'ghost' && hasGhostData;

  const { soundPackId } = useAudioStore();
  const { loadMidiPiece } = useAudioEngine();
  const { user, isPremium } = useUser();

  useSyncCloud(user?.id ?? null, isPremium);

  // Empêcher fermement le défilement de la page entière (100vh)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Charger les records et les timings du ghost mode
  useEffect(() => {
    async function loadData() {
      const fetchedRecords = await getPersonalRecords();
      if (!fetchedRecords?.maxWpm?.sessionId) return;
      const session = await getSessionById(fetchedRecords.maxWpm.sessionId);
      if (!session || session.keystrokeData.length === 0) return;
      setGhostTimings(session.keystrokeData.map((k) => k.deltaMs));
    }
    void loadData();
  }, []);

  // Charger la collection quand activeCollection change
  useEffect(() => {
    const collKey = activeCollection as CollectionId;
    if (collectionsCacheRef.current[collKey]) return;
    setLoadingCollection(true);
    fetchCollection(collKey)
      .then((collection) => {
        setCollectionsCache((prev) => ({ ...prev, [collKey]: collection }));
      })
      .finally(() => setLoadingCollection(false));
  }, [activeCollection, activeMode]);

  // La pièce musicale sélectionnée est toujours active.
  useEffect(() => {
    void loadMidiPiece(selectedPieceId);
  }, [selectedPieceId, loadMidiPiece]);

  const handlePieceChange = useCallback(
    async (pieceId: MidiPieceId) => {
      setSelectedPieceId(pieceId);
      await loadMidiPiece(pieceId);
    },
    [loadMidiPiece],
  );

  const handleShuffle = useCallback(() => {
    setShuffleOffset((prev) => prev + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1);
  }, []);

  const { text, source, collectionId } = useMemo(() => {
    const collKey: CollectionId = activeCollection as CollectionId;
    const collection = collectionsCache[collKey];
    if (!collection || collection.texts.length === 0) {
      return { text: '', source: '', collectionId: '' };
    }

    const languageScopedTexts =
      textLanguage === 'both'
        ? collection.texts
        : collection.texts.filter((entry) => entry.language === textLanguage);

    const candidateTexts =
      languageScopedTexts.length > 0 ? languageScopedTexts : collection.texts;

    const idx = getDailyIndex(candidateTexts.length, shuffleOffset);
    const entry = candidateTexts[idx]!;

    const filteredText = applyTextFilters(entry.content, {
      punctuationEnabled,
      numbersEnabled,
      mode: activeMode,
      wordCount,
    });

    return {
      text: filteredText,
      source: entry.source,
      collectionId: collection.id,
    };
  }, [
    activeCollection,
    activeMode,
    shuffleOffset,
    collectionsCache,
    textLanguage,
    punctuationEnabled,
    numbersEnabled,
    wordCount,
  ]);

  // Mode effectif pour TypingArea
  const typingAreaMode =
    ghostEnabled && ghostTimings
      ? 'ghost'
      : activeMode === 'code'
        ? 'code'
        : activeMode === 'sprint'
          ? 'sprint'
          : activeMode === 'quote'
            ? 'quote'
            : activeMode === 'zen'
              ? 'zen'
              : 'classic';

  // Le layout unifié supprime les "sauts" ou "jumps" de l'UI.
  // LearningMode y est maintenant intégré de manière fluide.
  const appVersion = webPackage.version;

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 36, // Airy spacing
        padding: '32px 32px 16px',
        height: 'calc(100dvh - 100px)',
        overflow: 'hidden', // Account for nav height
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: 'transparent',
      }}
    >
      {/* En-tête de Configuration */}
      {!isLearningMode ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 36,
            minHeight: '166px', // Réservation stricte de l'espace pour éviter les sauts
            width: '100%',
          }}
        >
          {/* Zone 2 — ConfigBar */}
          <ConfigBar />

          {/* Zone 3 — Active Session Header */}
          <ActiveSessionHeader
            selectedPieceId={selectedPieceId}
            onPieceChange={handlePieceChange}
          />

          {/* Zone 3.5 — Context Selectors (Language) */}
          <ContextSelectors />
        </div>
      ) : (
        <ConfigBar />
      )}

      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginBottom: 'auto',
          // On descend la zone de texte pour la centrer visuellement (sauf en mode apprentissage)
          marginTop: isLearningMode ? '0' : '4vh',
        }}
      >
        {loadingCollection && !isLearningMode ? (
          <div
            role="status"
            aria-label={tHint('ariaLoadingCollection')}
            className="content-typing"
            style={{
              height: 150,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
        ) : isLearningMode ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <LearningMode />
          </div>
        ) : (
          <TypingArea
            key={`${activeCollection}-${shuffleOffset}-${selectedPieceId}-${restartKey}`}
            text={text}
            collectionId={collectionId}
            mode={typingAreaMode}
            durationSeconds={durationSeconds}
            onNoteChange={(note, isError) =>
              setLastNote({ key: note, isError })
            }
            {...(ghostEnabled && ghostTimings ? { ghostTimings } : {})}
          />
        )}
      </div>

      {/* Zone 5 — Controls & Hints (Centered under TypingArea) - Masqué en mode apprentissage */}
      {!isLearningMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            width: '100%',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            {/* Shuffle / Next Test (MonkeyType style, centered below text) */}
            <button
              onClick={handleShuffle}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                opacity: 0.8,
              }}
              className="hover:text-text-primary hover:rotate-90 transition-all duration-300"
              title={tHint('nextTest')}
            >
              <RepeatIcon size={20} />
            </button>

            {/* Restart Hint */}
            <button
              onClick={handleRestart}
              aria-label={tHint('restart')}
              tabIndex={-1}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-ui)',
                padding: '4px 16px',
                opacity: 0.6,
              }}
              className="hover:text-text-primary hover:opacity-100 transition-colors"
              title={tHint('restartTestTooltip')}
            >
              {tHint('tabEnterToRestart')}
            </button>
          </div>
        </div>
      )}

      {/* Zone 6 — Footer minimal avec les contrôles secondaires éparpillés */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 'auto',
          marginBottom: '14px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          paddingTop: '32px',
        }}
      >
        {/* === GAUCHE: Liens externes === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="https://github.com/mouwaficbdr/typewav"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            &lt;/&gt; github
          </a>
          <a
            href={`/${locale}/transparence`}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            className="hover:text-text-primary transition-colors"
          >
            {tHint('terms')}
          </a>
        </div>

        {/* === DROITE: Musique, Outils contextuels et versioning === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!isLearningMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WaveformBars
                lastNote={lastNote.key ?? undefined}
                isError={lastNote.isError}
                barCount={12}
                maxHeightPx={20}
                idlePulse
                style={{ width: 80 }}
              />
            </div>
          )}

          <span
            className="hover:text-text-primary cursor-pointer transition-colors"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MusicNoteIcon size={12} /> {soundPackId}
          </span>
          <span>v{appVersion}</span>
        </div>
      </footer>
    </main>
  );
}
