import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

vi.mock('@/stores/useProgressionStore', () => ({
  useProgressionStore: () => ({
    rank: 'novice',
    personalRecords: null,
  }),
}));

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: (selector: (s: { position: number }) => unknown) =>
    selector({ position: 0 }),
}));

vi.mock('@/lib/db', () => ({
  getPersonalRecords: vi.fn().mockResolvedValue(null),
  getSessionById: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: ({ text }: { text: string }) => (
    <div data-testid="typing-area">{text}</div>
  ),
}));

vi.mock('@/components/modes/LearningMode', () => ({
  LearningMode: () => <div data-testid="learning-mode" />,
}));

vi.mock('@/components/typing/AudioPreviewButton', () => ({
  AudioPreviewButton: () => (
    <button data-testid="audio-preview-btn">Preview</button>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
  },
  useReducedMotion: () => false,
}));

const mockLitterature = {
  id: 'litterature',
  name: 'Littérature',
  texts: [
    {
      id: 'lit-01',
      content: 'Texte de littérature initial.',
      source: 'Victor Hugo',
    },
  ],
};

const mockPoesie = {
  id: 'poesie',
  name: 'Poésie',
  texts: [{ id: 'poe-01', content: 'Un poème.', source: 'Baudelaire' }],
};

beforeEach(() => {
  mockFetchCollection.mockClear();
});

describe('HomeClient — lazy loading collections', () => {
  it('charge seulement litterature au premier rendu', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(mockFetchCollection).not.toHaveBeenCalled();
    expect(screen.getByTestId('typing-area')).toBeInTheDocument();
  });

  it("charge la collection poésie quand l'onglet poésie est sélectionné", async () => {
    mockFetchCollection.mockResolvedValueOnce(mockPoesie);
    const user = userEvent.setup();
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await user.click(screen.getByRole('button', { name: /poésie/i }));

    await waitFor(() => {
      expect(mockFetchCollection).toHaveBeenCalledWith('poesie');
    });
  });

  it('ne recharge pas une collection déjà en cache', async () => {
    mockFetchCollection.mockResolvedValue(mockPoesie);
    const user = userEvent.setup();
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    // Aller sur poésie → fetch
    await user.click(screen.getByRole('button', { name: /poésie/i }));
    await waitFor(() => expect(mockFetchCollection).toHaveBeenCalledTimes(1));

    // Revenir à littérature (déjà en cache)
    await user.click(screen.getByRole('button', { name: /littérature/i }));
    // Retourner sur poésie (déjà en cache)
    await user.click(screen.getByRole('button', { name: /poésie/i }));

    await waitFor(() => expect(mockFetchCollection).toHaveBeenCalledTimes(1));
  });
});

describe('HomeClient — ghost mode button', () => {
  it('affiche le bouton ghost verrouillé si aucun record personnel', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      const ghostBtn = screen.getByTestId('ghost-toggle');
      expect(ghostBtn).toBeInTheDocument();
      expect(ghostBtn).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('le bouton ghost verrouillé affiche un titre tooltip', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => {
      const ghostBtn = screen.getByTestId('ghost-toggle');
      expect(ghostBtn).toHaveAttribute('title', 'lockedTooltip');
    });
  });

  it('ne lance pas le ghost mode si le bouton est verrouillé', async () => {
    const user = userEvent.setup();
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);

    await waitFor(() => screen.getByTestId('ghost-toggle'));
    const ghostBtn = screen.getByTestId('ghost-toggle');

    // Le bouton a aria-disabled donc le click ne devrait rien faire
    await user.click(ghostBtn);
    // Pas d'erreur, pas de crash — test de non-régression
    expect(ghostBtn).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('HomeClient — badge de rang', () => {
  it("n'affiche pas le badge si le rang est novice", async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(screen.queryByTestId('rank-badge')).not.toBeInTheDocument();
  });
});

describe('HomeClient — aperçu sonore', () => {
  it('affiche le bouton AudioPreviewButton avant de commencer à taper', async () => {
    const { HomeClient } = await import('../typing/HomeClient');
    render(<HomeClient initialCollection={mockLitterature as never} />);
    expect(screen.getByTestId('audio-preview-btn')).toBeInTheDocument();
  });
});
