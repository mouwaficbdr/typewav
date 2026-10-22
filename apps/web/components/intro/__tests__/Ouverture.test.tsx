import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioStore } from '@/stores/useAudioStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
const mockTriggerErrorEcho = vi.fn().mockResolvedValue(undefined);
const mockTriggerResume = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: mockInitialize,
    playNoteName: mockPlayNoteName,
    triggerErrorEcho: mockTriggerErrorEcho,
    triggerResume: mockTriggerResume,
  }),
}));

// PlayScreen (écran 2) a sa propre suite (PlayScreen.test.tsx) : ici, un
// bouton de test suffit à vérifier que l'Ouverture avance correctement
// quand il signale la fin, sans retaper « les notes » dans chaque test.
vi.mock('../screens/PlayScreen', () => ({
  PlayScreen: ({ onDone }: { onDone: () => void }) => (
    <button type="button" data-testid="play-screen-done" onClick={onDone}>
      done
    </button>
  ),
}));

function setMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

import { Ouverture } from '../Ouverture';
import type { IntroExit } from '../apply-exit';

const DEFAULT_AUDIO_STATE = {
  isSamplerLoaded: false,
  samplerLoadError: null,
};

beforeEach(() => {
  setMatchMedia(false);
  useAudioStore.setState(DEFAULT_AUDIO_STATE);
  mockInitialize.mockClear();
  mockPlayNoteName.mockClear();
  mockTriggerErrorEcho.mockClear();
  mockTriggerResume.mockClear();
});

afterEach(() => {
  useAudioStore.setState(DEFAULT_AUDIO_STATE);
  vi.useRealTimers();
});

function currentScreen(): number {
  return Number(screen.getByRole('region').getAttribute('data-intro-screen'));
}

/** Avance jusqu'à l'écran voulu en simulant le piano déjà prêt. */
async function advanceToScreen(target: number, onClose = vi.fn()) {
  useAudioStore.setState({ isSamplerLoaded: true });
  render(
    <Ouverture urlLocale="fr" firstRun={true} onClose={onClose} />,
  );
  // L'avance automatique de l'écran 1 exige désormais un choix de langue
  // explicite cette fois-ci, pas seulement un piano déjà chaud (bug réel
  // corrigé dans Ouverture.tsx le 2026-10-22).
  fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });
  while (currentScreen() < target) {
    const current = currentScreen();
    const next = current + 1;
    if (current === 2) {
      fireEvent.click(screen.getByTestId('play-screen-done'));
    } else {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    }
    await waitFor(() =>
      expect(screen.getByRole('region')).toHaveAttribute(
        'data-intro-screen',
        String(next),
      ),
    );
  }
  return onClose;
}

describe('Ouverture : écran 1, la langue', () => {
  it('la langue de urlLocale est présélectionnée', () => {
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('language-fr')).toHaveAttribute(
      'data-selected',
      'true',
    );
    expect(screen.getByTestId('language-en')).toHaveAttribute(
      'data-selected',
      'false',
    );
  });

  it('E bascule les textes en anglais sans appeler de navigation', () => {
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    expect(screen.getByText('Skip · Esc')).toBeInTheDocument();
  });

  it("tant que isSamplerLoaded est faux, on reste sur l'écran 1 avec language.tuning", async () => {
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });
    await waitFor(() =>
      expect(mockInitialize).toHaveBeenCalled(),
    );
    expect(
      screen.getByText(/Le piano s'accorde/),
    ).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute(
      'data-intro-screen',
      '1',
    );
  });

  it("dès que isSamplerLoaded passe à vrai, l'écran 2 s'affiche", async () => {
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });
    await waitFor(() => expect(mockInitialize).toHaveBeenCalled());

    act(() => {
      useAudioStore.setState({ isSamplerLoaded: true });
    });

    await waitFor(() =>
      expect(screen.getByRole('region')).toHaveAttribute(
        'data-intro-screen',
        '2',
      ),
    );
  });

  it('au-delà de SAMPLER_WAIT_MS sans piano, soundFailed s’affiche et Espace avance quand même', async () => {
    vi.useFakeTimers();
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    expect(
      screen.getByText(/n'a pas pu démarrer/),
    ).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    });
    expect(screen.getByRole('region')).toHaveAttribute(
      'data-intro-screen',
      '2',
    );
  });
});

describe('Ouverture : sortie', () => {
  it('Échap à l’écran 1 avant tout choix : onClose({ chosenLanguage: null, introLanguage: urlLocale, firstRun })', () => {
    const onClose = vi.fn();
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={onClose} />);
    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith({
      chosenLanguage: null,
      introLanguage: 'fr',
      firstRun: true,
    } satisfies IntroExit);
  });

  it('Échap à l’écran 4 après le choix de en : onClose({ chosenLanguage: en, introLanguage: en, firstRun })', async () => {
    const onClose = vi.fn();
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={onClose} />);
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    await waitFor(() => expect(mockInitialize).toHaveBeenCalled());
    act(() => {
      useAudioStore.setState({ isSamplerLoaded: true });
    });
    while (currentScreen() < 4) {
      const current = currentScreen();
      const next = current + 1;
      if (current === 2) {
        fireEvent.click(screen.getByTestId('play-screen-done'));
      } else {
        fireEvent.keyDown(window, { code: 'Space', key: ' ' });
      }
      await waitFor(() =>
        expect(screen.getByRole('region')).toHaveAttribute(
          'data-intro-screen',
          String(next),
        ),
      );
    }

    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith({
      chosenLanguage: 'en',
      introLanguage: 'en',
      firstRun: true,
    } satisfies IntroExit);
  });
});

describe('Ouverture : navigation', () => {
  it('Flèche gauche revient à l’écran précédent', async () => {
    await advanceToScreen(3);
    fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft' });
    await waitFor(() =>
      expect(screen.getByRole('region')).toHaveAttribute(
        'data-intro-screen',
        '2',
      ),
    );
  });

  it('Retour arrière ne recule jamais d’écran', async () => {
    await advanceToScreen(3);
    fireEvent.keyDown(window, { code: 'Backspace', key: 'Backspace' });
    expect(screen.getByRole('region')).toHaveAttribute(
      'data-intro-screen',
      '3',
    );
  });

  it('chaque changement d’écran met à jour la région aria-live avec announce', async () => {
    await advanceToScreen(2);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/Écran 2 sur 6/);
  });
});

describe('Ouverture : écran 4, les envies', () => {
  it('les touches 1 à 5 activent l’envie correspondante', async () => {
    await advanceToScreen(4);
    fireEvent.keyDown(window, { code: 'Digit3', key: '3' });
    expect(screen.getByText('Les résultats et le replay')).toBeInTheDocument();
  });

  it('sans geste, les envies défilent seules (2800ms chacune) puis features.rest', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    useAudioStore.setState({ isSamplerLoaded: true });
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={onClose} />);
    act(() => {
      fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });
    });
    while (currentScreen() < 4) {
      act(() => {
        if (currentScreen() === 2) {
          fireEvent.click(screen.getByTestId('play-screen-done'));
        } else {
          fireEvent.keyDown(window, { code: 'Space', key: ' ' });
        }
      });
    }
    expect(screen.getByRole('region')).toHaveAttribute(
      'data-intro-screen',
      '4',
    );

    await act(async () => {
      vi.advanceTimersByTime(2800 * 5);
    });

    expect(screen.getByText('Le reste se découvre en jouant.')).toBeInTheDocument();
  });
});

describe('Ouverture : écran 5, les données', () => {
  it('I ouvre les quatre lignes terme et définition', async () => {
    await advanceToScreen(5);
    fireEvent.keyDown(window, { code: 'KeyI', key: 'i' });
    expect(screen.getByText('Navigation privée')).toBeInTheDocument();
    expect(screen.getByText('Effacer les données du site')).toBeInTheDocument();
    expect(screen.getByText('Autre navigateur, autre appareil')).toBeInTheDocument();
    expect(screen.getByText('Ta sauvegarde')).toBeInTheDocument();
  });
});

describe('Ouverture : écran 6, à toi', () => {
  it('Espace appelle onClose avec la langue choisie', async () => {
    const onClose = await advanceToScreen(6);
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(onClose).toHaveBeenCalledWith({
      chosenLanguage: 'fr',
      introLanguage: 'fr',
      firstRun: true,
    } satisfies IntroExit);
  });
});

describe('Ouverture : mode tactile', () => {
  it('isNonDesktopDevice vrai, aucune frappe : skipTouch et continueTouch visibles', () => {
    setMatchMedia(true);
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={vi.fn()} />);
    expect(screen.getByText('Passer')).toBeInTheDocument();
    expect(screen.getByText('Touche pour continuer')).toBeInTheDocument();
  });

  it('écran 6 montre start.share et start.explore en mode tactile', async () => {
    setMatchMedia(true);
    useAudioStore.setState({ isSamplerLoaded: true });
    const onClose = vi.fn();
    render(<Ouverture urlLocale="fr" firstRun={true} onClose={onClose} />);
    while (currentScreen() < 6) {
      const current = currentScreen();
      const next = current + 1;
      if (current === 2) {
        fireEvent.click(screen.getByTestId('play-screen-done'));
      } else {
        fireEvent.click(screen.getByTestId('intro-continue-touch'));
      }
      await waitFor(() =>
        expect(screen.getByRole('region')).toHaveAttribute(
          'data-intro-screen',
          String(next),
        ),
      );
    }
    expect(screen.getByText('Envoie-toi le lien')).toBeInTheDocument();
    expect(screen.getByText('Explorer quand même')).toBeInTheDocument();
  });
});
