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
import { CollectionSelector } from '@/components/typing/CollectionSelector';
import { ContextSelectors } from '@/components/typing/ContextSelectors';
import { PersonalTextsPanel } from '@/components/typing/PersonalTextsPanel';
import { TypingArea } from '@/components/typing/TypingArea';
import { WaveformBars } from '@/components/typing/WaveformBars';
import { MusicNoteIcon, PenIcon, RepeatIcon } from '@/components/ui/icons';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useSyncCloud } from '@/hooks/useSyncCloud';
import { useUser } from '@/hooks/useUser';
import {
  getPersonalRecords,
  getPersonalTexts,
  getSessionById,
  type PersonalText,
} from '@/lib/db';
import { noteNameToMidi } from '@/lib/note-visualization';
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from '@/lib/onboarding';
import { applyTextFilters } from '@/lib/text-filters';
import { useAudioStore } from '@/stores/useAudioStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useCustomTextStore } from '@/stores/useCustomTextStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { type MidiPieceId } from '@typewav/audio-engine';
import { selectFromTexts } from '@typewav/collections';
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
  const [ghostData, setGhostData] = useState<{
    timings: number[];
    text: string;
  } | null>(null);
  const [collectionsCache, setCollectionsCache] = useState<
    Partial<Record<CollectionId, CollectionConfig>>
  >({ litterature: initialCollection });
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [lastNote, setLastNote] = useState<{
    pitch: number | null;
    isError: boolean;
  }>({ pitch: null, isError: false });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [personalTexts, setPersonalTexts] = useState<PersonalText[]>([]);
  const [isPersonalTextsPanelOpen, setIsPersonalTextsPanelOpen] =
    useState(false);

  // Dernier texte sélectionné — passé comme excludeIds à selectFromTexts
  // pour éviter une répétition immédiate au shuffle ou à un changement de
  // réglage.
  const lastEntryIdRef = useRef<string | undefined>(undefined);
  const [selectedEntry, setSelectedEntry] = useState<{
    content: string;
    source: string;
  } | null>(() => {
    // Amorce le tout premier rendu avec un texte déjà là (évite un skeleton
    // de chargement) ; l'effet de sélection ci-dessous corrige aussitôt vers
    // la sélection consciente de la cible réelle (durée/nombre de mots).
    if (initialCollection.texts.length === 0) return null;
    const idx = getDailyIndex(initialCollection.texts.length, 0);
    const entry = initialCollection.texts[idx]!;
    return { content: entry.content, source: entry.source ?? '' };
  });

  // Ref to avoid stale closure in useEffect (collections)
  const collectionsCacheRef = useRef(collectionsCache);

  useEffect(() => {
    collectionsCacheRef.current = collectionsCache;
  }, [collectionsCache]);

  const activeCollection = useConfigStore((s) => s.activeCollection);
  const activeMode = useConfigStore((s) => s.activeMode);
  const setActiveMode = useConfigStore((s) => s.setMode);
  const setCollection = useConfigStore((s) => s.setCollection);
  const punctuationEnabled = useConfigStore((s) => s.punctuationEnabled);
  const numbersEnabled = useConfigStore((s) => s.numbersEnabled);
  const wordCount = useConfigStore((s) => s.wordCount);
  const textLanguage = useConfigStore((s) => s.textLanguage);
  const durationSeconds = useConfigStore((s) => s.durationSeconds);
  const activePersonalTextId = useCustomTextStore(
    (s) => s.activePersonalTextId,
  );

  const activePersonalText = useMemo(
    () => personalTexts.find((t) => t.id === activePersonalTextId) ?? null,
    [personalTexts, activePersonalTextId],
  );

  const isLearningMode = activeMode === 'learning';
  const hasGhostData = ghostData !== null;
  const ghostEnabled = activeMode === 'ghost' && hasGhostData;

  // `initialized` volontairement absent de cet abonnement : le sampler est
  // préchargé au montage (indépendant du geste utilisateur), et s'abonner
  // ici forcerait un re-render de tout HomeClient au moment précis où
  // l'utilisateur tape sa première touche — juste avant que la première
  // note ne joue.
  const { soundPackId, midiLoadError, samplerLoadError } = useAudioStore();
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

  const refreshPersonalTexts = useCallback(() => {
    void getPersonalTexts().then(setPersonalTexts);
  }, []);

  // Charger les textes personnels (mode Libre) une fois au montage ; rechargé
  // à chaque mutation (ajout/suppression) via refreshPersonalTexts, passé au
  // panneau de gestion.
  useEffect(() => {
    refreshPersonalTexts();
  }, [refreshPersonalTexts]);

  // Charger le record personnel : timings ET texte original de cette
  // session — le curseur fantôme positionne ses timings par index de
  // caractère, donc rejouer un texte différent le désynchroniserait
  // entièrement.
  useEffect(() => {
    async function loadData() {
      const fetchedRecords = await getPersonalRecords();
      if (!fetchedRecords?.maxWpm?.sessionId) return;
      const session = await getSessionById(fetchedRecords.maxWpm.sessionId);
      if (!session || session.keystrokeData.length === 0 || !session.text) {
        return;
      }
      setGhostData({
        timings: session.keystrokeData.map((k) => k.deltaMs),
        text: session.text,
      });
    }
    void loadData();
  }, []);

  // Charger la collection quand activeCollection change
  useEffect(() => {
    const collKey = activeCollection as CollectionId;
    if (collectionsCacheRef.current[collKey]) return;
    queueMicrotask(() => setLoadingCollection(true));
    fetchCollection(collKey)
      .then((collection) => {
        setCollectionsCache((prev) => ({ ...prev, [collKey]: collection }));
      })
      .finally(() => setLoadingCollection(false));
  }, [activeCollection, activeMode]);

  // Sélectionne un texte conscient de la cible réelle (durée en mode Temps,
  // nombre de mots en mode Mots) via selectFromTexts (@typewav/collections,
  // déjà testé) — remplace l'ancien index déterministe par jour, qui
  // ignorait totalement la durée/le nombre de mots demandés. Tourne dans un
  // effet (jamais dans le rendu) : selectFromTexts utilise Math.random(),
  // qui provoquerait un mismatch d'hydratation SSR/client sinon.
  // Libre/Fantôme ont leur propre source de texte (voir plus bas) ;
  // Apprentissage ne consomme pas ce texte du tout.
  useEffect(() => {
    if (
      activeMode === 'custom' ||
      activeMode === 'ghost' ||
      activeMode === 'learning'
    ) {
      return;
    }

    const collKey = activeCollection as CollectionId;
    const collection = collectionsCache[collKey];
    if (!collection || collection.texts.length === 0) return;

    // Différé en microtâche : la sélection (et le setState qui en découle)
    // ne doit pas s'exécuter de façon synchrone dans le corps de l'effet.
    queueMicrotask(() => {
      // Cet effet peut se redéclencher plusieurs fois dans les premières
      // centaines de ms après le montage (réhydratation asynchrone de
      // useConfigStore depuis IndexedDB, fetch de collection, etc.) — sans
      // jamais remonter TypingArea puisque `text` ne fait pas partie de sa
      // key. Si l'utilisateur a déjà tapé au moins une frappe sur le texte
      // affiché, changer `text` sous ses pieds réinitialiserait la session
      // (position, keystrokes) sans réinitialiser le séquenceur MIDI — un
      // curseur et une musique qui se désynchronisent, jusqu'à une frappe
      // pourtant correcte affichée en erreur. Une fois la frappe commencée,
      // le texte reste figé jusqu'au prochain essai (restart/shuffle).
      if (useSessionStore.getState().keystrokes.length > 0) return;

      const entry = selectFromTexts(collection.texts, {
        ...(textLanguage !== 'both' ? { language: textLanguage } : {}),
        ...(activeMode === 'sprint' ? { wordCount } : {}),
        ...(activeMode === 'classic' ? { durationSeconds } : {}),
        ...(numbersEnabled ? { numbersEnabled: true } : {}),
        ...(lastEntryIdRef.current
          ? { excludeIds: [lastEntryIdRef.current] }
          : {}),
      });
      if (!entry) return;

      lastEntryIdRef.current = entry.id;
      setSelectedEntry({ content: entry.content, source: entry.source ?? '' });
    });
  }, [
    activeCollection,
    activeMode,
    shuffleOffset,
    collectionsCache,
    textLanguage,
    wordCount,
    durationSeconds,
    numbersEnabled,
  ]);

  // La pièce musicale sélectionnée est toujours active.
  useEffect(() => {
    void loadMidiPiece(selectedPieceId);
  }, [selectedPieceId, loadMidiPiece]);

  // Défaut sensé à l'entrée en mode Code — pas un verrou : l'utilisateur
  // reste libre de changer la collection ensuite via CollectionSelector.
  // Ne se déclenche qu'à la transition vers 'code' (dépendance activeMode),
  // jamais à chaque rendu.
  useEffect(() => {
    if (activeMode === 'code') {
      setCollection('code');
    }
  }, [activeMode, setCollection]);

  // Déclenche le tutoriel d'onboarding uniquement à la toute première visite.
  useEffect(() => {
    let cancelled = false;
    hasCompletedOnboarding()
      .then((done) => {
        if (cancelled || done) return;
        setIsOnboarding(true);
        setActiveMode('learning');
      })
      .catch(() => {
        // Fail open : ne jamais forcer l'onboarding si on ne peut pas confirmer son état.
      });
    return () => {
      cancelled = true;
    };
  }, [setActiveMode]);

  const handleExitTutorial = useCallback(() => {
    setIsOnboarding(false);
    void markOnboardingComplete();
    setActiveMode('classic');
  }, [setActiveMode]);

  // Si l'utilisateur quitte le mode Apprentissage via la ConfigBar pendant
  // l'onboarding (plutôt que via le bouton "Passer le tutoriel"), c'est tout
  // aussi explicite : on considère le tutoriel terminé pour de bon, sinon
  // hasCompletedOnboarding() resterait faux et le piège onboarding reviendrait
  // au prochain chargement.
  useEffect(() => {
    if (!isOnboarding || activeMode === 'learning') return;
    let cancelled = false;
    void markOnboardingComplete().then(() => {
      if (!cancelled) setIsOnboarding(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOnboarding, activeMode]);

  const handlePieceChange = useCallback((pieceId: MidiPieceId) => {
    setSelectedPieceId(pieceId);
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffleOffset((prev) => prev + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1);
  }, []);

  const handleNoteChange = useCallback(
    (note: string | null, isError: boolean) => {
      const pitch = note ? noteNameToMidi(note) : null;
      setLastNote({ pitch, isError });
    },
    [],
  );

  const { text, source, collectionId } = useMemo(() => {
    // Mode Libre : texte personnel affiché tel quel, jamais filtré (A3) —
    // l'utilisateur a écrit ce texte lui-même, le dénaturer n'a pas de sens.
    if (activeMode === 'custom') {
      return {
        text: activePersonalText?.content ?? '',
        source: '',
        collectionId: 'custom',
      };
    }

    if (!selectedEntry) return { text: '', source: '', collectionId: '' };

    // Le mode Code force ponctuation/chiffres — un extrait sans parenthèses,
    // points-virgules ou chiffres n'est plus du code, quel que soit l'état
    // (masqué dans ce mode) des bascules ponctuation/chiffres.
    const filteredText = applyTextFilters(selectedEntry.content, {
      punctuationEnabled: activeMode === 'code' ? true : punctuationEnabled,
      numbersEnabled: activeMode === 'code' ? true : numbersEnabled,
      mode: activeMode,
      wordCount,
    });

    return {
      text: filteredText,
      source: selectedEntry.source,
      collectionId: activeCollection,
    };
  }, [
    selectedEntry,
    activeMode,
    punctuationEnabled,
    numbersEnabled,
    wordCount,
    activeCollection,
    activePersonalText,
  ]);

  // Mode effectif pour TypingArea
  const typingAreaMode =
    ghostEnabled && ghostData
      ? 'ghost'
      : activeMode === 'code'
        ? 'code'
        : activeMode === 'sprint'
          ? 'sprint'
          : activeMode === 'quote'
            ? 'quote'
            : activeMode === 'zen'
              ? 'zen'
              : activeMode === 'custom'
                ? 'custom'
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

          {/* Zone 3.5 — Context Selectors (Language + Collection) */}
          <ContextSelectors />
          <CollectionSelector />

          {activeMode === 'custom' && (
            <button
              data-testid="my-texts-button"
              onClick={() => setIsPersonalTextsPanelOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                padding: 0,
              }}
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              <PenIcon size={12} className="opacity-70" />
              {tHint('myTexts')}
            </button>
          )}

          {samplerLoadError && (
            <div
              role="alert"
              style={{
                width: '100%',
                maxWidth: '980px',
                fontSize: '0.78rem',
                color: 'var(--color-warning, var(--color-text-muted))',
                border:
                  '1px solid color-mix(in srgb, var(--color-text-muted) 35%, transparent)',
                background:
                  'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                textAlign: 'left',
              }}
            >
              Sampler fallback: {samplerLoadError}
            </div>
          )}

          {midiLoadError && (
            <div
              role="alert"
              style={{
                width: '100%',
                maxWidth: '980px',
                fontSize: '0.78rem',
                color: 'var(--color-error)',
                border:
                  '1px solid color-mix(in srgb, var(--color-error) 40%, transparent)',
                background:
                  'color-mix(in srgb, var(--color-error) 10%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                textAlign: 'left',
              }}
            >
              MIDI error: {midiLoadError}
            </div>
          )}

          {activeMode === 'ghost' && !hasGhostData && (
            <div
              role="status"
              style={{
                width: '100%',
                maxWidth: '980px',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                border:
                  '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
                background:
                  'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                textAlign: 'left',
              }}
            >
              Aucun record personnel pour l&apos;instant — terminez une
              session pour débloquer le mode Fantôme. Cette session se
              déroule en mode Classic.
            </div>
          )}

          {activeMode === 'custom' && !activePersonalText && (
            <div
              role="status"
              style={{
                width: '100%',
                maxWidth: '980px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                border:
                  '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
                background:
                  'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                textAlign: 'left',
              }}
            >
              <span>{tHint('noPersonalTextSelected')}</span>
              <button
                onClick={() => setIsPersonalTextsPanelOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                }}
              >
                {tHint('myTexts')}
              </button>
            </div>
          )}
        </div>
      ) : (
        // La ConfigBar reste visible même pendant l'onboarding : sans elle,
        // le mode Apprentissage devient un piège sans issue de navigation
        // (le logo ne fait rien tant qu'on est déjà sur la même route).
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
          // Le mode Apprentissage empile beaucoup plus de sections (bandeau,
          // titre, sélecteur de niveaux, zone de frappe, schéma clavier,
          // CTA) que les autres modes : sur un viewport bas, son contenu
          // dépasse la hauteur fixe de `main` (overflow: hidden plus haut),
          // ce qui coupait silencieusement le bas de l'écran (clavier,
          // bouton de déblocage) sans aucun moyen d'y accéder. minHeight: 0
          // autorise cet item flex à rétrécir sous sa taille de contenu —
          // sans lui, overflowY n'a jamais l'occasion de s'activer.
          ...(isLearningMode
            ? { minHeight: 0, overflowY: 'auto' as const }
            : {}),
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
            <LearningMode
              isOnboarding={isOnboarding}
              onExitTutorial={handleExitTutorial}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              gap: 10,
            }}
          >
            <TypingArea
              key={`${activeCollection}-${shuffleOffset}-${selectedPieceId}-${restartKey}-${activePersonalTextId ?? ''}`}
              text={ghostEnabled && ghostData ? ghostData.text : text}
              collectionId={collectionId}
              mode={typingAreaMode}
              durationSeconds={durationSeconds}
              onNoteChange={handleNoteChange}
              {...(ghostEnabled && ghostData
                ? { ghostTimings: ghostData.timings }
                : {})}
            />
            {activeMode === 'quote' && source && (
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                — {source}
              </p>
            )}
          </div>
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
                pitch={lastNote.pitch}
                isError={lastNote.isError}
                numBars={12}
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

      <PersonalTextsPanel
        isOpen={isPersonalTextsPanelOpen}
        onClose={() => setIsPersonalTextsPanelOpen(false)}
        personalTexts={personalTexts}
        onChange={refreshPersonalTexts}
      />
    </main>
  );
}
