'use client';

/**
 * HomeClient — page d'accueil interactive.
 *
 * 6 zones spec-29 :
 *   Zone 1 — GlobalNav (layout.tsx)
 *   Zone 2 — ConfigBar
 *   Zone 3 — Source attribution
 *   Zone 4 — TypingArea
 *   Zone 5 — WaveformBars + ghost toggle + restart + hint
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
import { ConfigBar } from '@/components/typing/ConfigBar';
import { TypingArea } from '@/components/typing/TypingArea';
import { WaveformBars } from '@/components/typing/WaveformBars';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSyncCloud } from '@/hooks/useSyncCloud';
import { useUser } from '@/hooks/useUser';
import { getPersonalRecords, getSessionById } from '@/lib/db';
import { useAudioStore } from '@/stores/useAudioStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { MIDI_PIECES, type MidiPieceId } from '@typewav/audio-engine';
import type { CollectionConfig, PersonalRecords, UserProfile } from '@typewav/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioPreviewButton } from '@/components/typing/AudioPreviewButton';
import { getUserProfile } from '@/lib/db';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useSessionStore } from '@/stores/useSessionStore';
import Link from 'next/link';

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
  const tGhost = useTranslations('ghost');
  const tHint = useTranslations('hint');
  const tRanks = useTranslations('ranks');
  const tRank = useTranslations('rank');
  const tPreview = useTranslations('preview');
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
  const [records, setRecords] = useState<PersonalRecords | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Ref to avoid stale closure in useEffect (collections)
  const collectionsCacheRef = useRef(collectionsCache);
  collectionsCacheRef.current = collectionsCache;

  const activeCollection = useConfigStore((s) => s.activeCollection);
  const activeMode = useConfigStore((s) => s.activeMode);
  const setMode = useConfigStore((s) => s.setMode);

  const isLearningMode = activeMode === 'learning';
  const hasGhostData = ghostTimings !== null && ghostTimings.length > 0;
  const ghostEnabled = activeMode === 'ghost' && hasGhostData;

  const isTyping = useSessionStore((s) => s.startedAt !== null);
  const storeRank = useProgressionStore((s) => s.rank);
  const effectiveRank =
    storeRank !== 'novice' ? storeRank : (profile?.currentRank ?? 'novice');
  const hasHistory = records !== null && records.maxWpm.value > 0;
  const showRankBadge = hasHistory && effectiveRank !== 'novice';

  const { soundPackId } = useAudioStore();
  const { loadMidiPiece, disableMidiMode } = useAudioEngine();
  const { user, isPremium } = useUser();

  useSyncCloud(user?.id ?? null, isPremium);

  // Charger les records, le profil et les timings du ghost mode
  useEffect(() => {
    async function loadData() {
      const [fetchedRecords, fetchedProfile] = await Promise.all([
        getPersonalRecords(),
        getUserProfile(),
      ]);
      setRecords(fetchedRecords);
      setProfile(fetchedProfile);
      if (!fetchedRecords?.maxWpm?.sessionId) return;
      const session = await getSessionById(fetchedRecords.maxWpm.sessionId);
      if (!session || session.keystrokeData.length === 0) return;
      setGhostTimings(session.keystrokeData.map((k) => k.deltaMs));
    }
    void loadData();
  }, []);

  // Charger la collection quand activeCollection change
  useEffect(() => {
    if (activeMode === 'classics') return;
    const collKey = activeCollection as CollectionId;
    if (collectionsCacheRef.current[collKey]) return;
    setLoadingCollection(true);
    fetchCollection(collKey)
      .then((collection) => {
        setCollectionsCache((prev) => ({ ...prev, [collKey]: collection }));
      })
      .finally(() => setLoadingCollection(false));
  }, [activeCollection, activeMode]);

  // Mode MIDI quand activeMode === 'classics'
  useEffect(() => {
    if (activeMode === 'classics') {
      void loadMidiPiece(selectedPieceId);
    } else {
      disableMidiMode();
    }
  }, [activeMode, selectedPieceId, loadMidiPiece, disableMidiMode]);

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
    const collKey: CollectionId =
      activeMode === 'classics'
        ? 'litterature'
        : (activeCollection as CollectionId);
    const collection = collectionsCache[collKey];
    if (!collection || collection.texts.length === 0) {
      return { text: '', source: '', collectionId: '' };
    }
    const idx = getDailyIndex(collection.texts.length, shuffleOffset);
    const entry = collection.texts[idx]!;
    return {
      text: entry.content,
      source: entry.source,
      collectionId: collection.id,
    };
  }, [activeCollection, activeMode, shuffleOffset, collectionsCache]);

  // Mode effectif pour TypingArea
  const typingAreaMode =
    ghostEnabled && ghostTimings
      ? 'ghost'
      : activeMode === 'classics'
        ? 'classics'
        : activeMode === 'code'
          ? 'code'
          : activeMode === 'sprint'
            ? 'sprint'
            : 'classic';

  if (isLearningMode) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: 32,
          minHeight: 'calc(100dvh - 48px)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <button
          onClick={() => setMode('classic')}
          style={{
            alignSelf: 'flex-start',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Retour
        </button>
        <LearningMode />
      </main>
    );
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '24px 16px',
        minHeight: 'calc(100dvh - 48px)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Zone 2 — ConfigBar */}
      <ConfigBar />

      {/* Badge de rang — visible si historique + rang non-novice */}
      {showRankBadge && (
        <Link
          href={`/${locale}/profil`}
          aria-label={tRank('viewProfile')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            textDecoration: 'none',
          }}
          className="hover:text-[var(--color-text-primary)]"
        >
          <span style={{ color: 'var(--color-accent)' }}>
            {tRanks(effectiveRank)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{records?.maxWpm.value ?? 0} WPM</span>
        </Link>
      )}

      {/* Sélecteur de pièce (mode Classiques uniquement) */}
      {activeMode === 'classics' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {Object.values(MIDI_PIECES).map((piece) => (
            <button
              key={piece.id}
              onClick={() => void handlePieceChange(piece.id)}
              style={{
                fontFamily: 'var(--font-ui)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor:
                  selectedPieceId === piece.id
                    ? 'var(--color-border)'
                    : 'transparent',
                color:
                  selectedPieceId === piece.id
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {piece.title} — {piece.composer}
            </button>
          ))}
        </div>
      )}

      {/* Zone 3 — Source attribution */}
      {source && (
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
            textAlign: 'center',
            margin: 0,
            userSelect: 'none',
          }}
        >
          {activeMode === 'classics'
            ? `♩ ${MIDI_PIECES[selectedPieceId]?.title ?? selectedPieceId}`
            : source}
        </p>
      )}

      {/* Aperçu sonore — visible avant la première frappe */}
      {!isTyping && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AudioPreviewButton />
          <span
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
            }}
          >
            {tPreview('orStartTyping')}
          </span>
        </div>
      )}

      {/* Zone 4 — Zone de frappe */}
      {loadingCollection ? (
        <div
          role="status"
          aria-label="Chargement de la collection"
          style={{
            width: '100%',
            maxWidth: '70vw',
            height: 200,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
          }}
        />
      ) : (
        <TypingArea
          key={`${activeCollection}-${shuffleOffset}-${selectedPieceId}-${restartKey}`}
          text={text}
          collectionId={collectionId}
          mode={typingAreaMode}
          {...(ghostEnabled && ghostTimings ? { ghostTimings } : {})}
        />
      )}

      {/* Zone 5 — WaveformBars + ghost + restart + hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          width: '100%',
          maxWidth: '70vw',
          margin: '12px auto 0',
        }}
      >
        <WaveformBars
          barCount={14}
          maxHeightPx={10}
          idlePulse
          style={{ flex: 1, maxWidth: 120 }}
        />

        {/* Ghost toggle */}
        {(() => {
          return (
            <button
              data-testid="ghost-toggle"
              onClick={
                hasGhostData
                  ? () => setMode(ghostEnabled ? 'classic' : 'ghost')
                  : undefined
              }
              aria-disabled={!hasGhostData ? true : undefined}
              aria-label={
                hasGhostData
                  ? ghostEnabled
                    ? tGhost('disable')
                    : tGhost('enable')
                  : tGhost('locked')
              }
              title={!hasGhostData ? tGhost('lockedTooltip') : undefined}
              style={{
                background: 'transparent',
                border: 'none',
                color: ghostEnabled
                  ? 'var(--color-rank-ghost, #FFD700)'
                  : 'var(--color-text-muted)',
                cursor: hasGhostData ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                opacity: hasGhostData ? 1 : 0.45,
                padding: '3px 6px',
              }}
            >
              <AnimatePresence>
                {!hasGhostData && (
                  <motion.span
                    aria-hidden="true"
                    style={{ marginRight: 4, display: 'inline-block' }}
                    initial={{ opacity: 1 }}
                    exit={{
                      opacity: 0,
                      scale: shouldReduceMotion ? 1 : 0,
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                  >
                    🔒
                  </motion.span>
                )}
              </AnimatePresence>
              👻 {ghostEnabled ? tGhost('active') : tGhost('label')}
            </button>
          );
        })()}

        {/* Restart */}
        <button
          onClick={handleRestart}
          aria-label={tHint('restart')}
          tabIndex={-1}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-ui)',
            opacity: 0.5,
          }}
          className="hover:opacity-100"
        >
          ᴄ
        </button>

        {/* Hint tab + enter */}
        <p
          aria-hidden="true"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            letterSpacing: '0.05em',
            opacity: 0.5,
            margin: 0,
          }}
        >
          {tHint('tabEnter')}
        </p>

        {/* Shuffle */}
        <button
          onClick={handleShuffle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            opacity: 0.5,
          }}
          className="hover:opacity-100"
        >
          ↻
        </button>
      </div>

      {/* Zone 6 — Footer minimal */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 32,
          marginTop: 'auto',
          width: '100%',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          opacity: 0.5,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <a
            href="https://github.com/mouwaficbdr/typewav"
            style={{ color: 'inherit', textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            github
          </a>
          <a
            href={`/${locale}/transparence`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            terms
          </a>
          <a
            href={`/${locale}/transparence`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            privacy
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span>♪ {soundPackId}</span>
        </div>
      </footer>
    </main>
  );
}
