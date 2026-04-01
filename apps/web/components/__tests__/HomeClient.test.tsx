import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/hooks/useSyncCloud', () => ({ useSyncCloud: vi.fn() }));

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: null, isPremium: false, loading: false }),
}));

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ setSoundPack: vi.fn(), soundPackId: 'piano' }),
}));

vi.mock('@/lib/db', () => ({
  getPersonalRecords: vi.fn().mockResolvedValue(null),
  getSessionById: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue({
    currentRank: 'novice',
    pseudo: '',
    unlockedThemes: [],
    unlockedSoundPacks: [],
    unlockedCollections: [],
    unlockedMilestoneIds: [],
  }),
}));

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: ({ text }: { text: string }) => (
    <div data-testid="typing-area">{text}</div>
  ),
}));

vi.mock('@/components/modes/LearningMode', () => ({
  LearningMode: () => <div data-testid="learning-mode" />,
}));

// ConfigBar stub — rend les boutons de collection pour les tests d'intégration
vi.mock('@/components/typing/ConfigBar', () => ({
  ConfigBar: () => <div data-testid="config-bar" />,
}));

vi.mock('@/components/typing/WaveformBars', () => ({
  WaveformBars: () => <div data-testid="waveform-bars" />,
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

vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: (selector: (s: { rank: string }) => unknown) =>
    selector({ rank: 'novice' }),
}));

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: (selector: (s: { startedAt: null }) => unknown) =>
    selector({ startedAt: null }),
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

// Reset config store before each test
beforeEach(async () => {
  const { DEFAULT_CONFIG, useConfigStore } =
    await import('@/stores/useConfigStore');
  act(() => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
  localStorage.clear();
  mockFetchCollection.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomeClient — lazy loading collections', () => {
  it('charge seulement litterature au premier rendu', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(mockFetchCollection).not.toHaveBeenCalled();
    expect(screen.getByTestId('typing-area')).toBeInTheDocument();
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

describe('HomeClient — structure Zone 5', () => {
  it('n’affiche plus de bouton ghost dédié', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      expect(screen.queryByTestId('ghost-toggle')).not.toBeInTheDocument();
      expect(screen.getByTestId('waveform-bars')).toBeInTheDocument();
    });
  });
});

describe('HomeClient — application des filtres config', () => {
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

    expect(screen.getByTestId('typing-area')).toHaveTextContent(
      'Hello world test rapide complet',
    );
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

    expect(screen.getByTestId('typing-area')).toHaveTextContent(
      'Hello, world! 2026',
    );
  });
});
