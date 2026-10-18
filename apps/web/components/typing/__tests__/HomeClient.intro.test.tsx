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
    triggerErrorEcho: vi.fn(),
    triggerResume: vi.fn().mockResolvedValue(undefined),
    loadMidiPiece: vi.fn().mockResolvedValue(undefined),
    disableMidiMode: vi.fn(),
  }),
}));

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ setSoundPack: vi.fn(), soundPackId: 'piano' }),
}));

vi.mock('@/lib/db', () => ({
  getPersonalRecords: vi.fn().mockResolvedValue(null),
  getSessionById: vi.fn().mockResolvedValue(null),
  getPersonalTexts: vi.fn().mockResolvedValue([]),
  savePersonalText: vi.fn().mockResolvedValue(undefined),
  deletePersonalText: vi.fn().mockResolvedValue(undefined),
  getUserProfile: vi.fn().mockResolvedValue({
    currentRank: 'novice',
    pseudo: '',
    unlockedThemes: [],
    unlockedCollections: [],
  }),
  getPreference: vi.fn().mockResolvedValue(undefined),
  setPreference: vi.fn().mockResolvedValue(undefined),
}));

const mockHasSeenIntro = vi.fn();
const mockMarkIntroSeen = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/intro', () => ({
  hasSeenIntro: () => mockHasSeenIntro(),
  markIntroSeen: () => mockMarkIntroSeen(),
}));

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: () => <div data-testid="typing-area" />,
}));

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
vi.mock('@/components/typing/AudioPreviewButton', () => ({
  AudioPreviewButton: () => <button data-testid="audio-preview-button" />,
}));

// L'Ouverture : suite dédiée (Ouverture.test.tsx). Ici, un stub exposant les
// callbacks suffit à vérifier le branchement côté HomeClient.
vi.mock('@/components/intro/Ouverture', () => ({
  Ouverture: ({
    firstRun,
    onClose,
  }: {
    urlLocale: string;
    firstRun: boolean;
    onClose: (exit: {
      chosenLanguage: 'fr' | 'en' | null;
      introLanguage: 'fr' | 'en';
      firstRun: boolean;
    }) => void;
  }) => (
    <div data-testid="ouverture" data-first-run={firstRun}>
      <button
        type="button"
        data-testid="close-en"
        onClick={() =>
          onClose({ chosenLanguage: 'en', introLanguage: 'en', firstRun })
        }
      >
        close-en
      </button>
      <button
        type="button"
        data-testid="close-same-language"
        onClick={() =>
          onClose({ chosenLanguage: null, introLanguage: 'fr', firstRun })
        }
      >
        close-same
      </button>
    </div>
  ),
}));

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  usePathname: () => '/fr',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
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
    }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
    button: ({
      children,
      whileTap: _wt,
      ...props
    }: { children?: React.ReactNode; whileTap?: unknown; [key: string]: unknown }) => (
      <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    ),
  },
  useReducedMotion: () => false,
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
  }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}));

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

let originalLocation: Location;

beforeEach(async () => {
  const { DEFAULT_CONFIG, useConfigStore } =
    await import('@/stores/useConfigStore');
  act(() => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
  localStorage.clear();
  mockFetchCollection.mockClear();
  mockHasSeenIntro.mockReset();
  mockMarkIntroSeen.mockClear();
  mockReplace.mockClear();
  const { useCustomTextStore } = await import('@/stores/useCustomTextStore');
  act(() => {
    useCustomTextStore.setState({ activePersonalTextId: null });
  });
  originalLocation = window.location;
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, search },
    writable: true,
    configurable: true,
  });
}

describe("HomeClient : l'Ouverture", () => {
  it("drapeau absent : l'Ouverture s'affiche avec firstRun = true", async () => {
    mockHasSeenIntro.mockResolvedValue(false);
    const { HomeClient } = await import('../HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    const ouverture = await screen.findByTestId('ouverture');
    expect(ouverture).toHaveAttribute('data-first-run', 'true');
  });

  it("drapeau présent : pas d'Ouverture", async () => {
    mockHasSeenIntro.mockResolvedValue(true);
    const { HomeClient } = await import('../HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await screen.findByTestId('typing-area');
    expect(screen.queryByTestId('ouverture')).not.toBeInTheDocument();
  });

  it("?intro=1 avec le drapeau présent : l'Ouverture s'affiche avec firstRun = false", async () => {
    mockHasSeenIntro.mockResolvedValue(true);
    setSearch('?intro=1');
    const { HomeClient } = await import('../HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    const ouverture = await screen.findByTestId('ouverture');
    expect(ouverture).toHaveAttribute('data-first-run', 'false');
  });

  it('onClose avec changement de langue (première visite) : drapeau posé, langue réglée, mode Temps 30s, navigation', async () => {
    mockHasSeenIntro.mockResolvedValue(false);
    const { HomeClient } = await import('../HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await screen.findByTestId('ouverture');
    fireEvent.click(screen.getByTestId('close-en'));

    await waitFor(() => expect(mockMarkIntroSeen).toHaveBeenCalled());
    expect(useConfigStore.getState().textLanguage).toBe('en');
    expect(useConfigStore.getState().activeMode).toBe('classic');
    expect(useConfigStore.getState().durationSeconds).toBe(30);
    expect(mockReplace).toHaveBeenCalledWith('/en');
  });

  it('onClose sans changement de langue : aucune navigation, la zone de frappe reçoit le focus', async () => {
    mockHasSeenIntro.mockResolvedValue(false);
    const { HomeClient } = await import('../HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await screen.findByTestId('ouverture');
    fireEvent.click(screen.getByTestId('close-same-language'));

    await waitFor(() => expect(mockMarkIntroSeen).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('rejouée (firstRun = false, aucune langue choisie) : ni le mode ni la durée ne changent', async () => {
    mockHasSeenIntro.mockResolvedValue(true);
    setSearch('?intro=1');
    const { HomeClient } = await import('../HomeClient');
    const { useConfigStore } = await import('@/stores/useConfigStore');
    act(() => {
      useConfigStore.setState({ activeMode: 'zen', durationSeconds: 60 });
    });
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await screen.findByTestId('ouverture');
    fireEvent.click(screen.getByTestId('close-same-language'));

    await waitFor(() => expect(mockMarkIntroSeen).toHaveBeenCalled());
    expect(useConfigStore.getState().activeMode).toBe('zen');
    expect(useConfigStore.getState().durationSeconds).toBe(60);
  });
});
