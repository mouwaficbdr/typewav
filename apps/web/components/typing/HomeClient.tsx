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
import { AmbientAura } from '@/components/typing/AmbientAura';
import { ConfigBar } from '@/components/typing/ConfigBar';
import { CollectionSelector } from '@/components/typing/CollectionSelector';
import { ContextSelectors } from '@/components/typing/ContextSelectors';
import { PersonalTextsPanel } from '@/components/typing/PersonalTextsPanel';
import { TypingArea } from '@/components/typing/TypingArea';
import { WaveformBars } from '@/components/typing/WaveformBars';
import { Keycap } from '@/components/ui/Keycap';
import {
  GhostIcon,
  MusicNoteIcon,
  PenIcon,
  RepeatIcon,
} from '@/components/ui/icons';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { NON_CITABLE_COLLECTIONS } from '@/lib/collection-support';
import {
  getPersonalRecords,
  getPersonalTexts,
  getSessionById,
  getUserProfile,
  type PersonalText,
} from '@/lib/db';
import { IS_DEV_MODE } from '@/lib/featureFlags';
import { noteNameToMidi } from '@/lib/note-visualization';
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from '@/lib/onboarding';
import { applyTextFilters } from '@/lib/text-filters';
import { useAudioStore } from '@/stores/useAudioStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useCustomTextStore } from '@/stores/useCustomTextStore';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { type MidiPieceId } from '@typewav/audio-engine';
import { selectFromTexts } from '@typewav/collections';
import type { CollectionConfig, TypingMode } from '@typewav/types';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import webPackage from '../../package.json';

interface HomeClientProps {
  initialCollection: CollectionConfig;
}

/**
 * Calcule un index de texte déterministe basé sur le jour de l'année.
 * Garantit l'absence de hydration mismatch (même valeur serveur/client).
 */
/** Fenêtre d'historique anti-répétition (voir recentEntryIdsRef). */
const RECENT_ENTRIES_WINDOW = 5;

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
  const tAudio = useTranslations('audio');
  const tGhost = useTranslations('ghost');
  const shouldReduceMotion = useReducedMotion();

  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [selectedPieceId, setSelectedPieceId] =
    useState<MidiPieceId>('fur-elise');
  const [ghostData, setGhostData] = useState<{
    timings: number[];
    text: string;
    /** WPM du record rejoué — affiché comme repère (audit configbar, B8). */
    wpm: number;
  } | null>(null);
  // `ghostData === null` est ambigu à lui seul : "pas encore lu depuis
  // IndexedDB" (lecture async, même sur un vrai record existant) et "lu,
  // confirmé qu'il n'y a aucun record" ont la même valeur. Sans ce
  // deuxième état, la notice "aucun record" (voir plus bas) flashait à
  // tort au chargement le temps que la lecture IndexedDB résolve, avant de
  // basculer sur la vraie bannière fantôme.
  const [ghostDataLoaded, setGhostDataLoaded] = useState(false);
  const [collectionsCache, setCollectionsCache] = useState<
    Partial<Record<CollectionId, CollectionConfig>>
  >({ litterature: initialCollection });
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [lastNote, setLastNote] = useState<{
    pitch: number | null;
    isError: boolean;
    isPhraseBoundary: boolean;
  }>({ pitch: null, isError: false, isPhraseBoundary: false });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [personalTexts, setPersonalTexts] = useState<PersonalText[]>([]);
  const [isPersonalTextsPanelOpen, setIsPersonalTextsPanelOpen] =
    useState(false);

  // Historique des derniers textes sélectionnés — passé comme excludeIds à
  // selectFromTexts pour éviter une répétition au shuffle ou à un changement
  // de réglage. Une fenêtre de plusieurs entrées (pas juste la dernière,
  // audit configbar C3) : sur un pool réduit, exclure un seul id produit une
  // alternance figée A→B→A→B dès qu'il ne reste que deux textes ciblés.
  // selectFromTexts retombe déjà sur le pool complet si l'exclusion le
  // viderait (voir _applyFilters), donc élargir cette fenêtre ne risque
  // aucun blocage, même sur les pools les plus étroits.
  const recentEntryIdsRef = useRef<string[]>([]);
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

  // Mode réellement en train de tourner : identique au mode actif, sauf pour
  // Fantôme sans donnée personnelle, qui se comporte réellement comme
  // Classic (voir la bannière plus bas). Source unique pour tout ce qui doit
  // refléter ce comportement réel plutôt que le mode brut affiché dans la
  // ConfigBar : visibilité des contrôles (ConfigBar, sélecteurs de
  // langue/collection), ciblage de la sélection de texte, et le prop `mode`
  // passé à TypingArea. Ne jamais dupliquer ce calcul ailleurs dans ce
  // fichier : deux versions à synchroniser à la main, c'est exactement le
  // genre d'incohérence qui a produit les bugs corrigés dans ce composant.
  const effectiveMode: TypingMode =
    activeMode === 'ghost' && !ghostEnabled ? 'classic' : activeMode;

  // `initialized` volontairement absent de cet abonnement : le sampler est
  // préchargé au montage (indépendant du geste utilisateur), et s'abonner
  // ici forcerait un re-render de tout HomeClient au moment précis où
  // l'utilisateur tape sa première touche — juste avant que la première
  // note ne joue.
  const { soundPackId, midiLoadError, samplerLoadError } = useAudioStore();
  const { loadMidiPiece } = useAudioEngine();

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

  // Hydrate le rang persisté dès le montage : useProgressionStore ne le
  // recalcule qu'à la fin d'une session (useProgressionCheck), donc sans ce
  // chargement explicite, l'aura ambiante (voir AmbientAura) afficherait
  // toujours 'novice' pour un utilisateur revenant avec un rang déjà acquis,
  // jusqu'à ce qu'il termine une nouvelle session dans cet onglet.
  useEffect(() => {
    void getUserProfile().then((profile) => {
      useProgressionStore.getState().setRank(profile.currentRank);
    });
  }, []);

  // Charger le record personnel : timings ET texte original de cette
  // session — le curseur fantôme positionne ses timings par index de
  // caractère, donc rejouer un texte différent le désynchroniserait
  // entièrement.
  useEffect(() => {
    async function loadData() {
      const fetchedRecords = await getPersonalRecords();
      if (!fetchedRecords?.maxWpm?.sessionId) return null;
      const session = await getSessionById(fetchedRecords.maxWpm.sessionId);
      if (!session || session.keystrokeData.length === 0 || !session.text) {
        return null;
      }
      return {
        timings: session.keystrokeData.map((k) => k.deltaMs),
        text: session.text,
        wpm: session.wpm,
      };
    }
    void loadData().then((data) => {
      setGhostData(data);
      setGhostDataLoaded(true);
    });
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
  // déjà testé) : remplace l'ancien index déterministe par jour, qui
  // ignorait totalement la durée/le nombre de mots demandés. Tourne dans un
  // effet (jamais dans le rendu) : selectFromTexts utilise Math.random(),
  // qui provoquerait un mismatch d'hydratation SSR/client sinon.
  // Libre a sa propre source de texte (voir plus bas) ; Apprentissage ne
  // consomme pas ce texte du tout. Fantôme avec une vraie donnée personnelle
  // rejoue le texte original de la session enregistrée (voir plus bas) et
  // saute donc cet effet ; sans donnée, la session se comporte comme Classic
  // (bannière visible), donc cet effet tourne normalement pour elle aussi.
  useEffect(() => {
    if (
      effectiveMode === 'custom' ||
      effectiveMode === 'ghost' ||
      effectiveMode === 'learning'
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
        ...(effectiveMode === 'sprint' ? { wordCount } : {}),
        ...(effectiveMode === 'classic' ? { durationSeconds } : {}),
        ...(numbersEnabled ? { numbersEnabled: true } : {}),
        ...(recentEntryIdsRef.current.length > 0
          ? { excludeIds: recentEntryIdsRef.current }
          : {}),
      });
      if (!entry) return;

      recentEntryIdsRef.current = [
        entry.id,
        ...recentEntryIdsRef.current,
      ].slice(0, RECENT_ENTRIES_WINDOW);
      setSelectedEntry({ content: entry.content, source: entry.source ?? '' });
    });
  }, [
    activeCollection,
    effectiveMode,
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

  // Traque le mode précédent pour détecter une vraie TRANSITION hors de
  // Code (voir l'effet symétrique ci-dessous), sans réagir à un changement
  // de collection isolé.
  const prevModeRef = useRef<TypingMode>(activeMode);

  // Défaut sensé à l'entrée en mode Code — pas un verrou : l'utilisateur
  // reste libre de changer la collection ensuite via CollectionSelector.
  // Ne se déclenche qu'à la transition vers 'code' (dépendance activeMode),
  // jamais à chaque rendu.
  //
  // Symétrique en sortie (audit configbar, B7) : quitter Code sans changer
  // de collection laissait 'code' actif sous un mode qui parle de temps ou
  // de mots — ConfigBar masque alors ses bascules ponctuation/chiffres
  // (verrouillées par la collection Code, voir ConfigBar) sous un libellé de
  // mode qui n'a plus rien à voir. Ne se déclenche que sur la transition
  // Code → autre mode ; une sélection manuelle de la collection Code depuis
  // un autre mode (légitime, voir le test dédié) n'est jamais défaite.
  useEffect(() => {
    const prevMode = prevModeRef.current;
    prevModeRef.current = activeMode;

    if (activeMode === 'code') {
      setCollection('code');
    } else if (
      prevMode === 'code' &&
      useConfigStore.getState().activeCollection === 'code'
    ) {
      setCollection('litterature');
    }
    // activeCollection volontairement absent des dépendances (lu via
    // getState() ci-dessus) : cet effet ne doit réagir qu'à une vraie
    // TRANSITION de mode, jamais à un changement de collection isolé — sinon
    // il re-forcerait 'code' à chaque re-rendu tant que le mode Code reste
    // actif, écrasant un choix manuel de collection (voir le test « ne force
    // pas la collection à chaque rendu »).
  }, [activeMode, setCollection]);

  // Le mode Citation présente son texte comme une citation attribuée (voir
  // le rendu de `source` plus bas) : Code et Gaming n'ont pas de vraie
  // attribution auteur/œuvre (voir NON_CITABLE_COLLECTIONS). Si l'une d'elles
  // était active avant de basculer en Citation, on ramène vers le défaut
  // plutôt que d'afficher un texte sous une fausse attribution.
  useEffect(() => {
    if (
      activeMode === 'quote' &&
      NON_CITABLE_COLLECTIONS.includes(activeCollection)
    ) {
      setCollection('litterature');
    }
  }, [activeMode, activeCollection, setCollection]);

  // Déclenche le tutoriel d'onboarding uniquement à la toute première visite.
  //
  // TEMPORAIRE (phase de dev) : désactivé en dev pour ne plus avoir à le
  // traverser à chaque rechargement pendant qu'on itère sur le reste de
  // l'app. Se réactive tout seul en build de production (IS_DEV_MODE est
  // figé à false hors `next dev`), mais c'est un changement de comportement
  // voulu : pour voir/tester l'onboarding en dev, utiliser la route dédiée
  // /dev-onboarding (apps/web/app/[locale]/dev-onboarding), qui le rejoue à
  // chaque rechargement sans toucher au flag hasCompletedOnboarding réel.
  // À RETIRER (avec ce guard et le dossier dev-onboarding en entier) une
  // fois l'onboarding validé et prêt à revalider en conditions réelles.
  useEffect(() => {
    if (IS_DEV_MODE) return;
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
    setHasStarted(false);
  }, []);

  // Zen ne navigue jamais vers /results (voir autoNavigate plus bas) : sans
  // suite, l'extrait terminé resterait figé à l'écran sans action évidente.
  // Un court silence puis un nouvel extrait enchaîne le flux (audit
  // configbar, décision 3 / B1 : « un vrai Zen, sans verdict »).
  const zenContinueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const handleZenComplete = useCallback(() => {
    if (zenContinueTimeoutRef.current) {
      clearTimeout(zenContinueTimeoutRef.current);
    }
    zenContinueTimeoutRef.current = setTimeout(() => {
      handleShuffle();
    }, 1200);
  }, [handleShuffle]);
  useEffect(() => {
    return () => {
      if (zenContinueTimeoutRef.current) {
        clearTimeout(zenContinueTimeoutRef.current);
      }
    };
  }, []);

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1);
    setHasStarted(false);
  }, []);

  const handleNoteChange = useCallback(
    (note: string | null, isError: boolean, isPhraseBoundary: boolean) => {
      setHasStarted(true);
      const pitch = note ? noteNameToMidi(note) : null;
      setLastNote({ pitch, isError, isPhraseBoundary });
    },
    [],
  );

  // Chrome périphérique qui s'efface pendant la frappe (« focus mode »). Le
  // fondu est visuel ; `inert` retire vraiment le sous-arbre de l'ordre de
  // tabulation et de l'arbre d'accessibilité (opacity:0 + pointer-events:none
  // ne suffit pas, un utilisateur clavier tomberait dans des contrôles
  // invisibles). Sous prefers-reduced-motion, bascule instantanée.
  const fadeOnStart = (translateYpx: number) => ({
    opacity: hasStarted ? 0 : 1,
    transform: hasStarted ? `translateY(${translateYpx}px)` : 'translateY(0)',
    transition: shouldReduceMotion
      ? 'none'
      : 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  });

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

    // Un extrait de la collection Code force ponctuation/chiffres, qu'on y
    // soit arrivé via le mode Code (bascules masquées) ou en le sélectionnant
    // manuellement depuis un autre mode (Classic/Sprint/Zen/Citation) : sans
    // parenthèses, points-virgules ou chiffres, ce n'est plus du code, quel
    // que soit le chemin emprunté pour l'afficher.
    const isCodeContent = activeMode === 'code' || activeCollection === 'code';
    const filteredText = applyTextFilters(selectedEntry.content, {
      punctuationEnabled: isCodeContent ? true : punctuationEnabled,
      numbersEnabled: isCodeContent ? true : numbersEnabled,
      mode: effectiveMode,
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
    effectiveMode,
    punctuationEnabled,
    numbersEnabled,
    wordCount,
    activeCollection,
    activePersonalText,
  ]);

  // Le layout unifié supprime les "sauts" ou "jumps" de l'UI.
  // LearningMode y est maintenant intégré de manière fluide.
  const appVersion = webPackage.version;

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Le mode Apprentissage empile davantage de sections que les autres
        // (bandeau de niveau, sélecteur, zone de frappe, schéma clavier) sur
        // un conteneur à hauteur fixe qui ne scrolle jamais : le "airy
        // spacing" pensé pour les modes de test tient moins bien ici, donc
        // resserré spécifiquement pour ce mode plutôt que globalement.
        gap: isLearningMode ? 20 : 36,
        padding: isLearningMode ? '20px 32px 16px' : '32px 32px 16px',
        height: 'calc(100dvh - var(--nav-height))',
        overflow: 'hidden', // Account for nav height
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        backgroundColor: 'transparent',
      }}
    >
      {/* Aura ambiante — couleur = rang, respiration = tempo réel de la
          frappe (voir AmbientAura). Purement décorative, en z-index négatif,
          doit rester le tout premier enfant pour peindre derrière le reste. */}
      <AmbientAura
        pitch={lastNote.pitch}
        isError={lastNote.isError}
        isPhraseBoundary={lastNote.isPhraseBoundary}
      />

      {/* En-tête de Configuration */}
      {!isLearningMode ? (
        <div
          inert={hasStarted}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            // Réservation d'espace pour limiter les sauts de mise en page au
            // changement de mode (mode Libre ajoute un bouton). Valeur Gemini.
            minHeight: '130px',
            width: '100%',
            position: 'relative',
            zIndex: 10,
            ...fadeOnStart(-10),
          }}
        >
          {/* Zone 2 — ConfigBar */}
          <ConfigBar controlsMode={effectiveMode} />

          <div
            className="glass-panel"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '6px 16px',
              borderRadius: '9999px',
            }}
          >
            {/* Zone 3 : Active Session Header */}
            <ActiveSessionHeader
              selectedPieceId={selectedPieceId}
              onPieceChange={handlePieceChange}
            />

            <div style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />

            {/* Zone 3.5 : Context Selectors (Language + Collection) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ContextSelectors controlsMode={effectiveMode} />
              <CollectionSelector controlsMode={effectiveMode} />
            </div>
          </div>

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
              {tAudio('samplerFallbackLabel')}: {samplerLoadError}
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
              {tAudio('midiErrorLabel')}: {midiLoadError}
            </div>
          )}

          {activeMode === 'ghost' && ghostDataLoaded && !hasGhostData && (
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
              {tGhost('noRecordFallback')}
            </div>
          )}

          {/* Repère sur ce qui est rejoué (audit configbar, B8) : avant,
              rien ne distinguait "je tape mon record" de "je tape un texte
              quelconque" une fois le fantôme actif. Chip à largeur de
              contenu (même langage visuel que le chip Recommandation
              d'ActiveSessionHeader), pas une bannière pleine largeur : elle
              se fondait dans le reste de l'écran comme un cadre d'erreur
              générique plutôt qu'un repère ponctuel. */}
          {ghostEnabled && ghostData && (
            <div
              role="status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.78rem',
                color: 'var(--color-text-primary)',
                border:
                  '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
                background:
                  'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
              }}
            >
              <GhostIcon size={14} className="opacity-80" />
              {tGhost('replayingRecord', { wpm: Math.round(ghostData.wpm) })}
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
        <ConfigBar controlsMode={effectiveMode} />
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
              mode={effectiveMode}
              durationSeconds={durationSeconds}
              onNoteChange={handleNoteChange}
              // Zen ne juge jamais : pas de redirection vers /results, pas
              // de WPM/précision/verdict affichés (décision 3 / B1). Le flux
              // enchaîne plutôt un nouvel extrait, voir handleZenComplete.
              autoNavigate={effectiveMode !== 'zen'}
              // Ni sauvegarde ni progression pour Zen : une séance sans
              // notation ne doit laisser aucune trace (rang, records,
              // classement) une fois terminée.
              trackProgress={effectiveMode !== 'zen'}
              {...(effectiveMode === 'zen'
                ? { onComplete: handleZenComplete }
                : {})}
              {...(ghostEnabled && ghostData
                ? { ghostTimings: ghostData.timings }
                : {})}
            />
            {effectiveMode === 'quote' && source && (
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                - {source}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Zone 5 : Controls, Hints & Visualizer (centrés sous TypingArea), masqués en mode apprentissage */}
      {!isLearningMode && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            marginTop: '24px',
          }}
        >
          {/* WaveformBars : Reste toujours visible, agit comme le feedback musical central */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WaveformBars
              pitch={lastNote.pitch}
              isError={lastNote.isError}
              isPhraseBoundary={lastNote.isPhraseBoundary}
              numBars={24} /* Doubled for a wider, more premium look */
              maxHeightPx={32}
              idlePulse
              style={{ width: 180 }}
            />
          </div>

          {/* Contrôles et indices de redémarrage : Disparaissent pendant la frappe */}
          <div
            inert={hasStarted}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: 'var(--color-text-muted)',
              ...fadeOnStart(10),
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

            {/* Restart Hint : une seule touche façon MonkeyType (rectangle
                à jupe), portant "Tab + Entrée" en toutes lettres. La touche
                elle-même reste à pleine opacité (comme sur monkeytype.com,
                où la touche ne s'efface jamais) : seul le libellé de fin
                s'atténue au repos et remonte au survol. */}
            <button
              onClick={handleRestart}
              aria-label={tHint('restart')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-ui)',
                padding: '4px 16px',
              }}
              className="group hover:text-text-primary transition-colors"
              title={tHint('restartTestTooltip')}
            >
              <Keycap size="sm">{tHint('restartKeys')}</Keycap>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                {tHint('restartHintSuffix')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Zone 6 — Footer minimal avec les contrôles secondaires éparpillés */}
      <footer
        inert={hasStarted}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 'auto',
          // Respiration sous le footer : il était quasi collé au bord bas
          // (main a seulement 16px de padding bas). marginTop:auto absorbe
          // l'espace libre en premier, donc sur écran court ça se resserre
          // proprement sans pousser le contenu hors du cadre overflow:hidden.
          marginBottom: '30px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          paddingTop: '32px',
          ...fadeOnStart(10),
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
        </div>

        {/* === DROITE: Musique, Outils contextuels et versioning === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
