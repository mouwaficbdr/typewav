import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetchCollection = vi.fn();

vi.mock('@/app/[locale]/actions/collections', () => ({
  fetchCollection: (...args: unknown[]) => mockFetchCollection(...args),
}));

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    playNote: vi.fn().mockResolvedValue(undefined),
    triggerSilence: vi.fn(),
    triggerResume: vi.fn().mockResolvedValue(undefined),
    loadMidiPiece: vi.fn().mockResolvedValue(undefined),
    disableMidiMode: vi.fn(),
  }),
}));


vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ setSoundPack: vi.fn(), soundPackId: 'piano' }),
}));

const mockGetPersonalRecords = vi.fn().mockResolvedValue(null);
const mockGetSessionById = vi.fn().mockResolvedValue(null);
const mockGetPersonalTexts = vi.fn().mockResolvedValue([]);
const mockSavePersonalText = vi.fn().mockResolvedValue(undefined);
const mockDeletePersonalText = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db', () => ({
  getPersonalRecords: (...args: unknown[]) => mockGetPersonalRecords(...args),
  getSessionById: (...args: unknown[]) => mockGetSessionById(...args),
  getPersonalTexts: (...args: unknown[]) => mockGetPersonalTexts(...args),
  savePersonalText: (...args: unknown[]) => mockSavePersonalText(...args),
  deletePersonalText: (...args: unknown[]) => mockDeletePersonalText(...args),
  getUserProfile: vi.fn().mockResolvedValue({
    currentRank: 'novice',
    pseudo: '',
    unlockedThemes: [],
    unlockedCollections: [],
  }),
}));

const typingAreaPropsRef: {
  current: null | {
    onNoteChange?: (
      note: string | null,
      isError: boolean,
      isPhraseBoundary: boolean,
    ) => void;
    autoNavigate?: boolean;
    trackProgress?: boolean;
    onComplete?: (wpm: number) => void;
  };
} = { current: null };

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: (props: {
    text: string;
    onNoteChange?: (
      note: string | null,
      isError: boolean,
      isPhraseBoundary: boolean,
    ) => void;
    autoNavigate?: boolean;
    trackProgress?: boolean;
    onComplete?: (wpm: number) => void;
  }) => {
    typingAreaPropsRef.current = props;
    return <div data-testid="typing-area">{props.text}</div>;
  },
}));

const learningModePropsRef: {
  current: null | {
    isOnboarding?: boolean;
    onExitTutorial: () => void;
  };
} = { current: null };

vi.mock('@/components/modes/LearningMode', () => ({
  LearningMode: (props: {
    isOnboarding?: boolean;
    onExitTutorial: () => void;
  }) => {
    learningModePropsRef.current = props;
    return <div data-testid="learning-mode" />;
  },
}));

const mockHasCompletedOnboarding = vi.fn().mockResolvedValue(true);
const mockMarkOnboardingComplete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/onboarding', () => ({
  hasCompletedOnboarding: () => mockHasCompletedOnboarding(),
  markOnboardingComplete: () => mockMarkOnboardingComplete(),
}));

// ConfigBar stub : rend les boutons de collection pour les tests d'intégration
vi.mock('@/components/typing/ConfigBar', () => ({
  ConfigBar: () => <div data-testid="config-bar" />,
}));

vi.mock('@/components/typing/WaveformBars', () => ({
  WaveformBars: () => <div data-testid="waveform-bars" />,
}));

vi.mock('@/components/typing/AmbientAura', () => ({
  AmbientAura: () => <div data-testid="ambient-aura" />,
}));

vi.mock('@/components/typing/ActiveSessionHeader', () => ({
  ActiveSessionHeader: () => <div data-testid="active-session-header" />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/fr',
}));

vi.mock('@typewav/audio-engine', () => ({
  MIDI_PIECES: {
    'fur-elise': { id: 'fur-elise', title: 'Für Elise', composer: 'Beethoven' },
  },
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    span: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
    button: ({
      children,
      whileTap: _wt,
      ...props
    }: {
      children?: React.ReactNode;
      whileTap?: unknown;
      [key: string]: unknown;
    }) => (
      <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('@/components/typing/AudioPreviewButton', () => ({
  AudioPreviewButton: () => (
    <button data-testid="audio-preview-button">▶ preview</button>
  ),
}));

const mockSetRank = vi.fn();

vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: Object.assign(
    (selector: (s: { rank: string }) => unknown) =>
      selector({ rank: 'novice' }),
    { getState: () => ({ rank: 'novice', setRank: mockSetRank }) },
  ),
}));

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: Object.assign(
    (selector: (s: { startedAt: null }) => unknown) =>
      selector({ startedAt: null }),
    { getState: () => ({ keystrokes: [] }) },
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {children}
    </a>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockLitterature = {
  id: 'litterature',
  name: 'Littérature',
  texts: [
    {
      id: 'lit-01',
      content: 'Texte de littérature initial.',
      source: 'Victor Hugo',
      language: 'fr',
      difficulty: 2,
      wordCount: 4,
      charCount: 30,
    },
  ],
};

const mockPoesie = {
  id: 'poesie',
  name: 'Poésie',
  texts: [
    {
      id: 'poe-01',
      content: 'Un poème.',
      source: 'Baudelaire',
      language: 'fr',
      difficulty: 2,
      wordCount: 2,
      charCount: 9,
    },
  ],
};

const mockConfigFiltersCollection = {
  id: 'litterature',
  name: 'Littérature',
  texts: [
    {
      id: 'cfg-01',
      content: 'Hello, world! 2026 test rapide complet.',
      source: 'Test Source',
      language: 'en',
      difficulty: 1,
      wordCount: 6,
      charCount: 38,
    },
  ],
};

const mockTargetCollection = {
  id: 'litterature',
  name: 'Littérature',
  texts: [
    {
      id: 'short-01',
      content: 'Un texte court ici.',
      source: 'Auteur A',
      language: 'fr',
      difficulty: 1,
      wordCount: 5,
      charCount: 20,
    },
    {
      id: 'long-01',
      content: 'Un texte nettement plus long, pensé pour représenter un extrait de plus de cent mots, utile pour vérifier que la sélection cible bien la bonne tranche de longueur selon le nombre de mots demandé par le mode Sprint. Il continue encore un peu afin de dépasser confortablement le seuil des cent mots requis par ce test, avec quelques phrases supplémentaires ajoutées ici uniquement pour allonger le compte total de mots jusqu\'à la cible attendue par ce scénario précis de vérification automatisée du comportement exact de troncature en mode Mots, sans quoi le test ne serait pas assez long pour couvrir correctement ce cas de figure précis.',
      source: 'Auteur B',
      language: 'fr',
      difficulty: 3,
      wordCount: 106,
      charCount: 637,
    },
  ],
};

const mockDigitPreferenceCollection = {
  id: 'litterature',
  name: 'Littérature',
  texts: [
    {
      id: 'no-digit-01',
      content: 'Un texte sans le moindre chiffre nulle part.',
      source: 'Auteur A',
      language: 'fr',
      difficulty: 1,
      wordCount: 8,
      charCount: 45,
    },
    {
      id: 'no-digit-02',
      content: 'Encore un autre texte qui ne contient aucun nombre.',
      source: 'Auteur B',
      language: 'fr',
      difficulty: 1,
      wordCount: 9,
      charCount: 52,
    },
    {
      id: 'has-digit-01',
      content: 'En 1815 ce texte contient bel et bien un chiffre.',
      source: 'Auteur C',
      language: 'fr',
      difficulty: 1,
      wordCount: 9,
      charCount: 50,
    },
  ],
};

// Reset config store before each test
beforeEach(async () => {
  const { DEFAULT_CONFIG, useConfigStore } =
    await import('@/stores/useConfigStore');
  act(() => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
  localStorage.clear();
  mockFetchCollection.mockClear();
  learningModePropsRef.current = null;
  mockHasCompletedOnboarding.mockClear().mockResolvedValue(true);
  mockMarkOnboardingComplete.mockClear().mockResolvedValue(undefined);
  mockGetPersonalRecords.mockClear().mockResolvedValue(null);
  mockGetSessionById.mockClear().mockResolvedValue(null);
  mockGetPersonalTexts.mockClear().mockResolvedValue([]);
  mockSavePersonalText.mockClear().mockResolvedValue(undefined);
  mockDeletePersonalText.mockClear().mockResolvedValue(undefined);
  const { useCustomTextStore } = await import('@/stores/useCustomTextStore');
  act(() => {
    useCustomTextStore.setState({ activePersonalTextId: null });
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomeClient : lazy loading collections', () => {
  it('charge seulement litterature au premier rendu', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);
    // La zone de frappe n'apparaît qu'une fois l'onboarding tranché (lecture
    // IndexedDB async, mockée résolue par beforeEach).
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(mockFetchCollection).not.toHaveBeenCalled();
  });

  it("charge la collection poésie quand activeCollection passe à 'poesie'", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockPoesie);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    act(() => {
      useConfigStore.setState({ activeCollection: 'poesie' });
    });

    await waitFor(() => {
      expect(mockFetchCollection).toHaveBeenCalledWith('poesie');
    });
  });

  it('ne recharge pas une collection déjà en cache', async () => {
    mockFetchCollection.mockResolvedValue(mockPoesie);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    // Première fois → fetch
    act(() => {
      useConfigStore.setState({ activeCollection: 'poesie' });
    });
    await waitFor(() => expect(mockFetchCollection).toHaveBeenCalledTimes(1));

    // Retour littérature (déjà en cache)
    act(() => {
      useConfigStore.setState({ activeCollection: 'litterature' });
    });
    // Retour poésie (déjà en cache)
    act(() => {
      useConfigStore.setState({ activeCollection: 'poesie' });
    });

    await waitFor(() => expect(mockFetchCollection).toHaveBeenCalledTimes(1));
  });
});

describe('HomeClient : structure Zone 5', () => {
  it('n’affiche plus de bouton ghost dédié', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(screen.queryByTestId('ghost-toggle')).not.toBeInTheDocument();
      expect(screen.getByTestId('waveform-bars')).toBeInTheDocument();
    });
  });
});

describe('HomeClient : application des filtres config', () => {
  it('applique les filtres ponctuation/chiffres en mode classic', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'classic',
        punctuationEnabled: false,
        numbersEnabled: false,
      });
    });

    render(
      <HomeClient initialCollection={mockConfigFiltersCollection as never} />,
    );

    expect(await screen.findByTestId('typing-area')).toHaveTextContent(
      'Hello world test rapide complet',
    );
  });

  it('force ponctuation/chiffres en mode code, même si désactivés dans la config', async () => {
    // Le mode Code bascule automatiquement la collection sur 'code' (voir
    // B2) : le cache initial ne la connaît que sous la clé 'litterature',
    // donc un fetch est déclenché ; on le mocke pour qu'il retourne ce même
    // fixture sous l'id 'code'.
    mockFetchCollection.mockResolvedValueOnce(mockConfigFiltersCollection);

    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'code',
        punctuationEnabled: false,
        numbersEnabled: false,
      });
    });

    render(
      <HomeClient initialCollection={mockConfigFiltersCollection as never} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        'Hello, world! 2026 test rapide complet.',
      );
    });
  });

  it('force aussi ponctuation/chiffres quand la collection Code est choisie depuis un autre mode (ex: Classic)', async () => {
    // La collection Code doit rester du vrai code même quand elle est
    // sélectionnée manuellement en dehors du mode Code (ex: mode Classic ;
    // le mode Citation, lui, exclut carrément Code de ses options, voir
    // 'ramène la collection sur litterature...' ci-dessous) : sans ce
    // garde-fou, retirer la ponctuation/les chiffres mutile la syntaxe (voir
    // la régression reproduite en live avant ce correctif).
    mockFetchCollection.mockResolvedValueOnce(mockConfigFiltersCollection);

    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'classic',
        activeCollection: 'code',
        punctuationEnabled: false,
        numbersEnabled: false,
      });
    });

    render(
      <HomeClient initialCollection={mockConfigFiltersCollection as never} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        'Hello, world! 2026 test rapide complet.',
      );
    });
  });

  it('sélectionne un texte de la bonne tranche de longueur (mode Mots · 100)', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'sprint', wordCount: 100 });
    });

    render(<HomeClient initialCollection={mockTargetCollection as never} />);

    // Sur 2 entrées (5 mots / 106 mots), seule celle à 106 mots a assez de
    // mots réels pour que la troncature en aval produise exactement 100 :
    // la sélection doit donc toujours retourner ce texte-là, jamais le
    // texte court (qui donnerait seulement 5 mots au lieu des 100 promis).
    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        /nettement plus long/,
      );
    });
    expect(screen.getByTestId('typing-area')).not.toHaveTextContent(
      'Un texte court ici.',
    );
  });

  it('le mode Mots · 100 affiche exactement 100 mots, jamais moins', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'sprint', wordCount: 100 });
    });

    render(<HomeClient initialCollection={mockTargetCollection as never} />);

    await waitFor(() => {
      const rendered = screen.getByTestId('typing-area').textContent ?? '';
      const actualWordCount = rendered.split(/\s+/).filter(Boolean).length;
      expect(actualWordCount).toBe(100);
    });
  });

  it('conserve le texte si wordCount est supérieur au nombre de mots', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'sprint',
        punctuationEnabled: true,
        numbersEnabled: true,
        wordCount: 10,
      });
    });

    render(
      <HomeClient initialCollection={mockConfigFiltersCollection as never} />,
    );

    expect(await screen.findByTestId('typing-area')).toHaveTextContent(
      'Hello, world! 2026',
    );
  });

  it('privilégie un texte contenant un chiffre quand chiffres est activé', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'classic',
        numbersEnabled: true,
      });
    });

    render(
      <HomeClient initialCollection={mockDigitPreferenceCollection as never} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        /1815/,
      );
    });
  });
});

describe('HomeClient : mode Temps en flux continu (ticket #93)', () => {
  const timedFlowCollection = {
    id: 'litterature',
    name: 'Littérature',
    texts: Array.from({ length: 12 }, (_, i) => ({
      id: `flow-${i}`,
      content: `Fragment ${i} : une phrase de littérature assez longue pour peupler le flux continu du mode Temps sans jamais le finir. `,
      source: 'Auteur',
      language: 'fr' as const,
      difficulty: 2 as const,
      wordCount: 20,
      charCount: 116,
    })),
  };

  it('utilise buildContinuousText, jamais selectFromTexts avec durationSeconds', async () => {
    const collectionsModule = await import('@typewav/collections');
    const buildSpy = vi.spyOn(collectionsModule, 'buildContinuousText');
    const selectSpy = vi.spyOn(collectionsModule, 'selectFromTexts');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'classic', durationSeconds: 120 });
    });

    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={timedFlowCollection as never} />);

    await waitFor(() => expect(buildSpy).toHaveBeenCalled());

    for (const call of selectSpy.mock.calls) {
      expect(call[1]).not.toHaveProperty('durationSeconds');
    }
  });

  it('produit un texte nettement plus long que l’ancien plafond dimensionné à la durée', async () => {
    const { useConfigStore } = await import('@/stores/useConfigStore');
    act(() => {
      useConfigStore.setState({ activeMode: 'classic', durationSeconds: 15 });
    });

    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={timedFlowCollection as never} />);

    await waitFor(() => {
      const rendered =
        screen.getByTestId('typing-area').textContent ?? '';
      // Ancien plafond « Temps 15 » ≈ 15 x 3.5 x 1.4 ≈ 74 caractères.
      expect(rendered.length).toBeGreaterThan(300);
    });
  });
});

describe('HomeClient : anti-répétition sur plusieurs essais (audit C3)', () => {
  const manyTextsCollection = {
    id: 'litterature',
    name: 'Littérature',
    texts: Array.from({ length: 8 }, (_, i) => ({
      id: `lit-${i}`,
      content: `Texte numero ${i} pour le test anti repetition, assez long pour cibler la meme fenetre de duree a chaque fois.`,
      source: 'Auteur Test',
      language: 'fr',
      difficulty: 2,
      wordCount: 18,
      charCount: 108,
    })),
  };

  it('exclut plusieurs textes récents, pas seulement le dernier, après plusieurs essais consécutifs', async () => {
    mockFetchCollection.mockResolvedValueOnce(manyTextsCollection);
    const collectionsModule = await import('@typewav/collections');
    const selectSpy = vi.spyOn(collectionsModule, 'selectFromTexts');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    // Mode Citation : sélection d'un extrait unique via selectFromTexts (le
    // mode Temps est passé à un flux continu et ne suit plus ce chemin).
    act(() => {
      useConfigStore.setState({ activeMode: 'quote' });
    });

    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={manyTextsCollection as never} />);

    await waitFor(() => expect(selectSpy).toHaveBeenCalled());

    const shuffleButton = screen.getByTitle('nextTest');
    for (let i = 0; i < 4; i++) {
      const callsBefore = selectSpy.mock.calls.length;
      fireEvent.click(shuffleButton);
      await waitFor(() =>
        expect(selectSpy.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    }

    // Avant ce correctif : excludeIds ne portait jamais qu'un seul id, quel
    // que soit le nombre d'essais déjà faits.
    const lastCallOptions = selectSpy.mock.calls.at(-1)?.[1];
    expect(lastCallOptions?.excludeIds?.length ?? 0).toBeGreaterThan(1);
  });
});

describe('HomeClient : mode Zen sans notation (audit configbar, décision 3 / B1)', () => {
  it("ne navigue jamais vers /results (autoNavigate=false transmis à TypingArea)", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'zen' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(typingAreaPropsRef.current?.autoNavigate).toBe(false);
    });
  });

  it('un autre mode chronométré (classic) navigue normalement', async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');

    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(typingAreaPropsRef.current?.autoNavigate).toBe(true);
    });
  });

  it("n'est ni sauvegardée ni comptée pour la progression (trackProgress=false transmis à TypingArea)", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'zen' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(typingAreaPropsRef.current?.trackProgress).toBe(false);
    });
  });

  it('un autre mode chronométré (classic) reste compté pour la progression', async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');

    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(typingAreaPropsRef.current?.trackProgress).toBe(true);
    });
  });

  it('enchaîne un nouvel extrait après un court délai, sans action de l’utilisateur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const collectionsModule = await import('@typewav/collections');
    const selectSpy = vi.spyOn(collectionsModule, 'selectFromTexts');
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'zen' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => expect(typingAreaPropsRef.current).not.toBeNull());
    const callsBeforeCompletion = selectSpy.mock.calls.length;

    act(() => {
      typingAreaPropsRef.current?.onComplete?.(60);
    });
    // Rien ne se passe tant que le court délai n'est pas écoulé (pas de
    // rebond instantané, le temps de "voir" que l'extrait est terminé).
    expect(selectSpy.mock.calls.length).toBe(callsBeforeCompletion);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });

    expect(selectSpy.mock.calls.length).toBeGreaterThan(callsBeforeCompletion);

    vi.useRealTimers();
  });
});

describe('HomeClient : attribution mode citation', () => {
  it('affiche la source du texte en mode citation', async () => {
    const { useConfigStore } = await import('@/stores/useConfigStore');
    act(() => {
      useConfigStore.setState({ activeMode: 'quote' });
    });
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(await screen.findByText(/Victor Hugo/)).toBeInTheDocument();
  });

  it("n'affiche pas de source en mode classic", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Victor Hugo/)).not.toBeInTheDocument();
  });
});

describe('HomeClient : la config bar se verrouille dès la première frappe (audit A7)', () => {
  it("passe en inert au premier événement de frappe, correcte ou en erreur, empêchant toute bascule silencieuse en cours de session", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');

    render(<HomeClient initialCollection={mockLitterature as never} />);

    const configBar = await screen.findByTestId('config-bar');
    expect(configBar.closest('[inert]')).toBeNull();

    // Une frappe en erreur (silence, pas de note) marque déjà le début de
    // séance au même titre qu'une frappe correcte.
    act(() => {
      typingAreaPropsRef.current?.onNoteChange?.(null, true, false);
    });

    expect(configBar.closest('[inert]')).not.toBeNull();
  });
});

describe('HomeClient : réouverture de la config bar au survol pendant la frappe (ticket #61)', () => {
  // Les minuteurs falsifiés cassent findBy*/waitFor de testing-library (leur
  // polling interne dépend de vrais setTimeout) : on n'active
  // vi.useFakeTimers() qu'une fois le rendu déjà stabilisé, jamais avant un
  // await findByTestId. afterEach en filet de sécurité si une assertion
  // échoue avant la restauration explicite, pour ne pas faire fuiter les
  // faux minuteurs sur les tests suivants.
  afterEach(() => {
    vi.useRealTimers();
  });

  it('le survol de la zone rend la config bar interactive malgré le focus mode, la sortie du survol (après la grâce) la referme', async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');

    render(<HomeClient initialCollection={mockLitterature as never} />);

    const configBar = await screen.findByTestId('config-bar');
    const hoverZone = screen.getByTestId('config-header-hover-zone');

    act(() => {
      typingAreaPropsRef.current?.onNoteChange?.(null, true, false);
    });
    expect(configBar.closest('[inert]')).not.toBeNull();

    act(() => {
      fireEvent.mouseEnter(hoverZone);
    });
    expect(configBar.closest('[inert]')).toBeNull();

    vi.useFakeTimers();

    act(() => {
      fireEvent.mouseLeave(hoverZone);
    });
    // Grâce de 200ms : ne se referme pas immédiatement.
    expect(configBar.closest('[inert]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(configBar.closest('[inert]')).not.toBeNull();
  });

  it('changer de mode en pleine frappe abandonne réellement la séance en cours (sort du focus mode)', async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    render(<HomeClient initialCollection={mockLitterature as never} />);

    const configBar = await screen.findByTestId('config-bar');

    act(() => {
      typingAreaPropsRef.current?.onNoteChange?.(null, true, false);
    });
    expect(configBar.closest('[inert]')).not.toBeNull();

    // Le reset (setRestartKey/setHasStarted) est différé par microtâche
    // dans le composant (react-hooks/set-state-in-effect) : flush explicite
    // avant l'assertion, même patron que les effets équivalents ailleurs
    // dans le code (voir useSession.secondsRemaining).
    await act(async () => {
      useConfigStore.setState({ activeMode: 'sprint' });
      await Promise.resolve();
    });

    expect(configBar.closest('[inert]')).toBeNull();
  });
});

describe('HomeClient : bascule automatique de collection', () => {
  it("bascule la collection sur 'code' en passant en mode Code", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(useConfigStore.getState().activeCollection).toBe('litterature');

    await act(async () => {
      useConfigStore.setState({ activeMode: 'code' });
    });

    await waitFor(() => {
      expect(useConfigStore.getState().activeCollection).toBe('code');
    });
  });

  it("ramène la collection sur 'litterature' en quittant Code pour un mode qui n'en a pas conscience (audit B7)", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'code', activeCollection: 'code' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(useConfigStore.getState().activeCollection).toBe('code');

    // Sans ce fix : la collection restait sur 'code' sous le mode Temps,
    // masquant ponctuation/chiffres derrière un libellé qui n'en parle pas.
    await act(async () => {
      useConfigStore.setState({ activeMode: 'classic' });
    });

    await waitFor(() => {
      expect(useConfigStore.getState().activeCollection).toBe('litterature');
    });
  });

  it("ne force pas la collection à chaque rendu : l'utilisateur peut la changer ensuite", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'code' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(useConfigStore.getState().activeCollection).toBe('code');
    });

    act(() => {
      useConfigStore.setState({ activeCollection: 'poesie' });
    });

    // Un re-rendu (ex: shuffle) ne doit pas re-forcer 'code'.
    act(() => {
      useConfigStore.setState({ punctuationEnabled: true });
    });

    expect(useConfigStore.getState().activeCollection).toBe('poesie');
  });

  it("ramène la collection sur 'litterature' en passant en mode Citation depuis Code (un snippet n'est pas une citation)", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'code', activeCollection: 'code' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(useConfigStore.getState().activeCollection).toBe('code');

    await act(async () => {
      useConfigStore.setState({ activeMode: 'quote' });
    });

    await waitFor(() => {
      expect(useConfigStore.getState().activeCollection).toBe('litterature');
    });
  });

  it("ramène aussi la collection sur 'litterature' en passant en mode Citation depuis Gaming (même absence d'attribution que Code)", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockLitterature);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'classic',
        activeCollection: 'gaming',
      });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(useConfigStore.getState().activeCollection).toBe('gaming');

    await act(async () => {
      useConfigStore.setState({ activeMode: 'quote' });
    });

    await waitFor(() => {
      expect(useConfigStore.getState().activeCollection).toBe('litterature');
    });
  });
});

describe('HomeClient : mode Fantôme', () => {
  it("n'affiche pas la notice \"aucun record\" tant que le chargement IndexedDB n'est pas resolu (evite le flash au rechargement)", async () => {
    let resolveRecords!: (value: unknown) => void;
    mockGetPersonalRecords.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRecords = resolve;
        }),
    );

    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'ghost' });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    // Tant que getPersonalRecords() n'a pas resolu, on ne sait pas encore
    // s'il existe un record : la notice "aucun record, terminez une
    // session..." ne doit pas s'afficher a tort le temps de la lecture
    // IndexedDB (async par nature, meme sur un vrai record existant).
    expect(screen.queryByText('noRecordFallback')).not.toBeInTheDocument();

    await act(async () => {
      resolveRecords(null);
    });

    // Une fois confirme qu'il n'y a vraiment aucun record, la notice peut
    // legitimement s'afficher.
    expect(await screen.findByText('noRecordFallback')).toBeInTheDocument();
  });

  it("affiche une notice explicite quand aucun record personnel n'existe", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'ghost' });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(
      await screen.findByText('noRecordFallback'),
    ).toBeInTheDocument();
  });

  it('rejoue le texte original de la session enregistrée (pas un texte indépendant)', async () => {
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 80, sessionId: 'session-1', achievedAt: Date.now() },
    });
    mockGetSessionById.mockResolvedValue({
      id: 'session-1',
      timestamp: Date.now(),
      wpm: 80,
      wpmNet: 78,
      accuracy: 98,
      consistency: 90,
      duration: 30_000,
      mode: 'classic',
      themeId: 'terminal',
      soundPackId: 'piano',
      keystrokeData: [
        { char: 'x', timestamp: 1000, correct: true, deltaMs: 0 },
        { char: 'y', timestamp: 1100, correct: true, deltaMs: 100 },
      ],
      text: 'Texte original du record : distinct du texte du jour.',
    });

    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'ghost' });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(
      await screen.findByText(
        'Texte original du record : distinct du texte du jour.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('noRecordFallback'),
    ).not.toBeInTheDocument();
    // Réplique fixe d'une session enregistrée : les sélecteurs de langue et
    // de collection n'ont pas de sens ici, ils doivent rester masqués.
    expect(screen.queryByTitle('changeLanguage')).not.toBeInTheDocument();
    expect(screen.queryByTitle('changeCollection')).not.toBeInTheDocument();
  });

  it("affiche un repère explicite sur le record rejoué (audit B8)", async () => {
    mockGetPersonalRecords.mockResolvedValue({
      maxWpm: { value: 85, sessionId: 'session-1', achievedAt: Date.now() },
    });
    mockGetSessionById.mockResolvedValue({
      id: 'session-1',
      timestamp: Date.now(),
      wpm: 85,
      wpmNet: 82,
      accuracy: 97,
      consistency: 88,
      duration: 30_000,
      mode: 'classic',
      themeId: 'terminal',
      soundPackId: 'piano',
      keystrokeData: [
        { char: 'x', timestamp: 1000, correct: true, deltaMs: 0 },
      ],
      text: 'Texte du record.',
    });

    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'ghost' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    // Avant : rien ne distinguait "je tape mon record" d'un texte quelconque.
    expect(await screen.findByText('replayingRecord')).toBeInTheDocument();
  });

  it("sans donnée personnelle, la session tourne réellement en Classic : sélecteurs visibles et texte régénéré depuis la collection active", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({
        activeMode: 'ghost',
        punctuationEnabled: false,
        numbersEnabled: false,
      });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    await screen.findByText('noRecordFallback');

    // La bannière promet un comportement Classic : les contrôles qui
    // pilotent ce comportement doivent être visibles, pas cachés derrière
    // le mode brut 'ghost'.
    expect(screen.getByTitle('changeLanguage')).toBeInTheDocument();
    expect(screen.getByTitle('changeCollection')).toBeInTheDocument();

    // Le texte affiché doit être réellement issu de la collection active
    // (filtré comme en Classic), pas un texte figé d'avant le repli.
    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        'Texte de littérature initial',
      );
    });
  });
});

describe('HomeClient : mode Libre (textes personnels)', () => {
  it("affiche un message explicite quand aucun texte personnel n'est actif", async () => {
    mockGetPersonalTexts.mockResolvedValue([]);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'custom' });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(
      await screen.findByText('noPersonalTextSelected'),
    ).toBeInTheDocument();
  });

  it('affiche le texte personnel actif sans filtrage ponctuation/chiffres', async () => {
    mockGetPersonalTexts.mockResolvedValue([
      {
        id: 'pt-1',
        title: 'Mon texte',
        content: 'Un texte avec, ponctuation! et 123 chiffres.',
        createdAt: 1,
        lastUsed: 1,
        isFavorite: false,
      },
    ]);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    const { useCustomTextStore } = await import(
      '@/stores/useCustomTextStore'
    );

    act(() => {
      useConfigStore.setState({
        activeMode: 'custom',
        punctuationEnabled: false,
        numbersEnabled: false,
      });
      useCustomTextStore.setState({ activePersonalTextId: 'pt-1' });
    });

    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(screen.getByTestId('typing-area')).toHaveTextContent(
        'Un texte avec, ponctuation! et 123 chiffres.',
      );
    });
  });

  it("le bouton \"Mes textes\" n'apparaît qu'en mode Libre", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    const { rerender } = render(
      <HomeClient initialCollection={mockLitterature as never} />,
    );
    expect(screen.queryByTestId('my-texts-button')).not.toBeInTheDocument();

    act(() => {
      useConfigStore.setState({ activeMode: 'custom' });
    });
    rerender(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(screen.getByTestId('my-texts-button')).toBeInTheDocument();
    });
  });

  it('cliquer "Mes textes" ouvre le panneau de gestion', async () => {
    mockGetPersonalTexts.mockResolvedValue([]);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');

    act(() => {
      useConfigStore.setState({ activeMode: 'custom' });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => screen.getByTestId('my-texts-button'));
    fireEvent.click(screen.getByTestId('my-texts-button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('HomeClient : onboarding première visite', () => {
  it("ne montre ni frappe ni apprentissage tant que l'onboarding n'est pas tranché (pas de flash)", async () => {
    // hasCompletedOnboarding ne répond jamais : on est dans la fenêtre juste
    // après le montage, avant que la lecture IndexedDB ait abouti.
    mockHasCompletedOnboarding.mockImplementation(
      () => new Promise<boolean>(() => {}),
    );
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(screen.queryByTestId('typing-area')).not.toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
  });

  it("montre la frappe dès que l'onboarding est confirmé terminé", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
  });

  it("force le mode apprentissage mais garde la ConfigBar visible : la navigation doit toujours rester possible", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(learningModePropsRef.current?.isOnboarding).toBe(true);
    });
    expect(screen.getByTestId('learning-mode')).toBeInTheDocument();
    expect(screen.getByTestId('config-bar')).toBeInTheDocument();
  });

  it("changer de mode depuis la ConfigBar pendant l'onboarding marque le tutoriel comme terminé (le piège ne doit pas revenir au prochain chargement)", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(learningModePropsRef.current?.isOnboarding).toBe(true);
    });

    act(() => {
      useConfigStore.setState({ activeMode: 'classic' });
    });

    await waitFor(() => {
      expect(mockMarkOnboardingComplete).toHaveBeenCalledOnce();
    });
    expect(screen.getByTestId('config-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
  });

  it("n'affiche pas le mode apprentissage quand l'onboarding est déjà complété", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(true);
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => expect(mockHasCompletedOnboarding).toHaveBeenCalled());
    expect(screen.getByTestId('config-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('learning-mode')).not.toBeInTheDocument();
  });

  it("marque l'onboarding comme terminé et repasse en mode classique à la sortie du tutoriel", async () => {
    mockHasCompletedOnboarding.mockResolvedValue(false);
    const { HomeClient } = await import('../typing/HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(learningModePropsRef.current?.onExitTutorial).toBeInstanceOf(
        Function,
      );
    });

    act(() => {
      learningModePropsRef.current?.onExitTutorial();
    });

    expect(mockMarkOnboardingComplete).toHaveBeenCalledOnce();
    expect(useConfigStore.getState().activeMode).toBe('classic');
    expect(screen.getByTestId('config-bar')).toBeInTheDocument();
  });
});

describe('HomeClient : hydratation du rang (AmbientAura)', () => {
  it("hydrate useProgressionStore depuis le profil persisté au montage, plutôt que de laisser 'novice' par défaut jusqu'à la fin d'une session", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(mockSetRank).toHaveBeenCalledWith('novice');
    });
  });
});
