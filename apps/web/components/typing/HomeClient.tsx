'use client';

/**
 * HomeClient — page d'accueil interactive.
 *
 * Gère : sélection de collection, rotation de texte (quotidienne + shuffle),
 * sélection du pack sonore, mode Classiques MIDI.
 *
 * Client Component justifié : état interactif, TypingArea, audio.
 * Spec : docs/ARCHITECTURE.md — Client Components ('use client')
 */

import { LearningMode } from '@/components/modes/LearningMode';
import { TypingArea } from '@/components/typing/TypingArea';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSyncCloud } from '@/hooks/useSyncCloud';
import { useUser } from '@/hooks/useUser';
import { getPersonalRecords, getSessionById } from '@/lib/db';
import { useAudioStore } from '@/stores/useAudioStore';
import { MIDI_PIECES, type MidiPieceId } from '@typewav/audio-engine';
import type { CollectionConfig } from '@typewav/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface HomeClientProps {
  litterature: CollectionConfig;
  poesie: CollectionConfig;
  code: CollectionConfig;
  philosophie: CollectionConfig;
  gaming: CollectionConfig;
}

type CollectionTab =
  | 'litterature'
  | 'poesie'
  | 'code'
  | 'philosophie'
  | 'gaming'
  | 'classiques';
type FreeSoundPackId = 'piano' | 'marimba' | 'synth-lofi' | 'chiptune';
type PremiumSoundPackId = 'cinematic' | 'phonk' | 'jazz-piano';
type SoundPackId = FreeSoundPackId | PremiumSoundPackId;

const FREE_PACKS: { id: FreeSoundPackId; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'marimba', label: 'Marimba' },
  { id: 'synth-lofi', label: 'Synth' },
  { id: 'chiptune', label: 'Chiptune' },
];

const PREMIUM_PACKS: { id: PremiumSoundPackId; label: string }[] = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'phonk', label: 'Phonk' },
  { id: 'jazz-piano', label: 'Jazz Piano' },
];

const MIDI_PIECE_LIST = Object.values(MIDI_PIECES);

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

export function HomeClient({
  litterature,
  poesie,
  code,
  philosophie,
  gaming,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<CollectionTab>('litterature');
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [selectedPieceId, setSelectedPieceId] =
    useState<MidiPieceId>('fur-elise');
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [ghostTimings, setGhostTimings] = useState<number[] | null>(null);
  const [ghostEnabled, setGhostEnabled] = useState(false);

  const { setSoundPack, soundPackId } = useAudioStore();
  const { loadMidiPiece, disableMidiMode } = useAudioEngine();
  const { user, isPremium } = useUser();
  const router = useRouter();

  // Sync cloud silencieuse au démarrage pour les users premium
  useSyncCloud(user?.id ?? null, isPremium);

  // Charger les timings du record personnel pour le ghost mode
  useEffect(() => {
    async function loadGhostTimings() {
      const records = await getPersonalRecords();
      if (!records?.maxWpm?.sessionId) return;
      const session = await getSessionById(records.maxWpm.sessionId);
      if (!session || session.keystrokeData.length === 0) return;
      setGhostTimings(session.keystrokeData.map((k) => k.deltaMs));
    }
    void loadGhostTimings();
  }, []);

  // Texte actuel selon l'onglet et l'offset de shuffle
  const { text, source, collectionId } = useMemo(() => {
    if (activeTab === 'classiques') {
      // En mode Classiques, on utilise un texte de littérature (le MIDI joue en fond)
      const idx = getDailyIndex(litterature.texts.length, shuffleOffset);
      const entry = litterature.texts[idx]!;
      return {
        text: entry.content,
        source: entry.source,
        collectionId: litterature.id,
      };
    }
    const collection =
      activeTab === 'litterature'
        ? litterature
        : activeTab === 'poesie'
          ? poesie
          : activeTab === 'philosophie'
            ? philosophie
            : activeTab === 'gaming'
              ? gaming
              : code;
    const idx = getDailyIndex(collection.texts.length, shuffleOffset);
    const entry = collection.texts[idx]!;
    return {
      text: entry.content,
      source: entry.source,
      collectionId: collection.id,
    };
  }, [
    activeTab,
    shuffleOffset,
    litterature,
    poesie,
    code,
    philosophie,
    gaming,
  ]);

  const handleTabChange = useCallback(
    async (tab: CollectionTab) => {
      setActiveTab(tab);
      setShuffleOffset(0);
      if (tab === 'classiques') {
        await loadMidiPiece(selectedPieceId);
      } else {
        disableMidiMode();
      }
    },
    [selectedPieceId, loadMidiPiece, disableMidiMode],
  );

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

  const tabs: { id: CollectionTab; label: string }[] = [
    { id: 'litterature', label: 'Littérature' },
    { id: 'poesie', label: 'Poésie' },
    { id: 'code', label: 'Code' },
    { id: 'philosophie', label: 'Philosophie' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'classiques', label: '♩ Classiques' },
  ];

  if (isLearningMode) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <button
          onClick={() => setIsLearningMode(false)}
          className="self-start text-xs tracking-widest uppercase transition-colors hover:underline"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
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
      className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* En-tête */}
      <header className="text-center">
        <h1
          className="text-5xl font-light tracking-widest"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
          }}
        >
          TypeWav
        </h1>
        <p
          className="mt-2 text-sm tracking-widest uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          immersive musical typing
        </p>
      </header>

      {/* Sélecteur de collection */}
      <nav
        className="flex gap-1 rounded-md p-1"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        aria-label="Choisir une collection"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => void handleTabChange(tab.id)}
            className="rounded px-4 py-2 text-xs tracking-widest uppercase transition-colors"
            style={{
              fontFamily: 'var(--font-ui)',
              backgroundColor:
                activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color:
                activeTab === tab.id
                  ? 'var(--color-bg)'
                  : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.id ? '600' : '400',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Sélecteur de pièce (mode Classiques uniquement) */}
      {activeTab === 'classiques' && (
        <div className="flex flex-wrap justify-center gap-2">
          {MIDI_PIECE_LIST.map((piece) => (
            <button
              key={piece.id}
              onClick={() => void handlePieceChange(piece.id)}
              className="rounded px-3 py-1 text-xs transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                border: '1px solid var(--color-border)',
                backgroundColor:
                  selectedPieceId === piece.id
                    ? 'var(--color-border)'
                    : 'transparent',
                color:
                  selectedPieceId === piece.id
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
              }}
            >
              {piece.title} — {piece.composer}
            </button>
          ))}
        </div>
      )}

      {/* Zone de frappe */}
      <TypingArea
        key={`${activeTab}-${shuffleOffset}-${selectedPieceId}`}
        text={text}
        collectionId={collectionId}
        mode={
          ghostEnabled && ghostTimings
            ? 'ghost'
            : activeTab === 'classiques'
              ? 'classics'
              : activeTab === 'code'
                ? 'code'
                : 'classic'
        }
        {...(ghostEnabled && ghostTimings ? { ghostTimings } : {})}
      />

      {/* Pied de page — source + contrôles */}
      <footer className="flex w-full max-w-2xl flex-col items-center gap-4">
        <p
          className="text-xs text-center"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {activeTab === 'classiques'
            ? `♩ Mode Classiques — ${MIDI_PIECES[selectedPieceId].title}`
            : source}
        </p>

        {/* Contrôles : pack sonore + shuffle + apprentissage */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Pack sonore — gratuit */}
          <div className="flex flex-wrap gap-1">
            {FREE_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => setSoundPack(pack.id)}
                className="rounded px-2 py-1 text-xs transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--color-border)',
                  backgroundColor:
                    soundPackId === pack.id
                      ? 'var(--color-border)'
                      : 'transparent',
                  color:
                    soundPackId === pack.id
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)',
                }}
              >
                {pack.label}
              </button>
            ))}
            {/* Pack sonore — premium */}
            {PREMIUM_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => {
                  if (isPremium) {
                    setSoundPack(pack.id);
                  } else {
                    router.push('/premium');
                  }
                }}
                title={
                  isPremium ? undefined : 'Disponible avec TypeWav Premium'
                }
                className="rounded px-2 py-1 text-xs transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--color-border)',
                  backgroundColor:
                    soundPackId === pack.id
                      ? 'var(--color-border)'
                      : 'transparent',
                  color: isPremium
                    ? soundPackId === pack.id
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)'
                    : 'var(--color-border)',
                  cursor: isPremium ? 'pointer' : 'default',
                }}
              >
                {isPremium ? pack.label : `🔒 ${pack.label}`}
              </button>
            ))}
          </div>
          {/* Divider */}
          <span style={{ color: 'var(--color-border)' }}>|</span>
          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            className="text-xs tracking-widest uppercase transition-colors hover:underline"
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            ↻ Nouveau texte
          </button>
          {/* Mode Apprentissage */}
          <button
            onClick={() => setIsLearningMode(true)}
            className="text-xs tracking-widest uppercase transition-colors hover:underline"
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            ✦ Apprentissage
          </button>
          {/* Ghost mode — visible uniquement si un record personnel existe */}
          {ghostTimings && (
            <button
              onClick={() => setGhostEnabled((prev) => !prev)}
              className="text-xs tracking-widest uppercase transition-colors hover:underline"
              style={{
                color: ghostEnabled
                  ? 'var(--color-rank-ghost, #FFD700)'
                  : 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
              }}
              title="Rejouer votre meilleur record en curseur fantôme"
            >
              👻 Ghost
            </button>
          )}{' '}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/profil"
            className="text-xs tracking-widest uppercase transition-colors hover:underline"
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Profil &amp; statistiques →
          </Link>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <Link
            href="/premium"
            className="text-xs tracking-widest uppercase transition-colors hover:underline"
            style={{
              color: isPremium
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {isPremium ? '★ Premium' : 'Premium →'}
          </Link>
        </div>
      </footer>
    </main>
  );
}
