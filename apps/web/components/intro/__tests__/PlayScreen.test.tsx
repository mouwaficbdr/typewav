import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioStore } from '@/stores/useAudioStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
const mockTriggerErrorEcho = vi.fn().mockResolvedValue(undefined);
const mockTriggerResume = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    playNoteName: mockPlayNoteName,
    triggerErrorEcho: mockTriggerErrorEcho,
    triggerResume: mockTriggerResume,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (key === 'play.text' ? 'les notes' : key),
}));

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
  motion: {
    line: (props: Record<string, unknown>) => <line {...stripMotionProps(props)} />,
    circle: (props: Record<string, unknown>) => <circle {...stripMotionProps(props)} />,
  },
}));

function stripMotionProps(props: Record<string, unknown>) {
  const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
  return rest;
}

import { PlayScreen } from '../screens/PlayScreen';

function typeInHiddenInput(value: string) {
  const input = document.querySelector('input') as HTMLInputElement;
  for (const char of value) {
    // useHiddenCapture écoute `input` via addEventListener natif, hors du
    // système d'événements synthétiques de React : act() explicite ici.
    act(() => {
      fireEvent.input(input, {
        target: { value: char },
        inputType: 'insertText',
        data: char,
      });
    });
  }
}

beforeEach(() => {
  useAudioStore.setState({ isSamplerLoaded: true });
  mockPlayNoteName.mockClear();
  mockTriggerErrorEcho.mockClear();
  mockTriggerResume.mockClear();
});

afterEach(() => {
  useAudioStore.setState({ isSamplerLoaded: false });
});

describe('PlayScreen : au clavier', () => {
  it("taper « les notes » joue chaque note d'INTRO_MELODY dans l'ordre, la dernière frappe jouant A4 et A2, et passe à askMiss", async () => {
    const { container } = render(<PlayScreen onDone={vi.fn()} touch={false} />);
    typeInHiddenInput('les notes');

    await waitFor(() =>
      expect(mockPlayNoteName.mock.calls.map((c) => c[0])).toEqual([
        'E5',
        'D#5',
        'E5',
        'D#5',
        'E5',
        'B4',
        'D5',
        'C5',
        'A4',
        'A2',
      ]),
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-play-phase',
      'askMiss',
    );
  });

  it('une lettre fausse en cours de saisie : aucune note, écho une fois, le caret ne bouge pas', async () => {
    const { container } = render(<PlayScreen onDone={vi.fn()} touch={false} />);
    typeInHiddenInput('l');
    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalledTimes(1));
    mockPlayNoteName.mockClear();

    typeInHiddenInput('z');
    await waitFor(() => expect(mockTriggerErrorEcho).toHaveBeenCalledTimes(1));
    expect(mockPlayNoteName).not.toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute(
      'data-play-phase',
      'typing',
    );
  });

  it('en askMiss, une touche fausse : écho, phase waiting, texte play.waiting', async () => {
    const { container } = render(<PlayScreen onDone={vi.fn()} touch={false} />);
    typeInHiddenInput('les notes');
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'askMiss',
      ),
    );
    mockTriggerErrorEcho.mockClear();

    typeInHiddenInput('x');
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'waiting',
      ),
    );
    expect(mockTriggerErrorEcho).toHaveBeenCalledTimes(1);
    expect(screen.getByText('play.waiting')).toBeInTheDocument();
  });

  it('retour arrière depuis waiting : triggerResume, rejoue A4 et A2, phase resumed, continue visible', async () => {
    const { container } = render(<PlayScreen onDone={vi.fn()} touch={false} />);
    typeInHiddenInput('les notes');
    typeInHiddenInput('x');
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'waiting',
      ),
    );
    mockPlayNoteName.mockClear();

    act(() => {
      fireEvent.keyDown(window, { code: 'Backspace', key: 'Backspace' });
    });

    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'resumed',
      ),
    );
    expect(mockTriggerResume).toHaveBeenCalledTimes(1);
    expect(mockPlayNoteName.mock.calls.map((c) => c[0])).toEqual(['A4', 'A2']);
    expect(screen.getByText('continue')).toBeInTheDocument();
  });

  it('Espace en phase resumed appelle onDone', async () => {
    const onDone = vi.fn();
    const { container } = render(<PlayScreen onDone={onDone} touch={false} />);
    typeInHiddenInput('les notes');
    typeInHiddenInput('x');
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'waiting',
      ),
    );
    act(() => {
      fireEvent.keyDown(window, { code: 'Backspace', key: 'Backspace' });
    });
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute(
        'data-play-phase',
        'resumed',
      ),
    );

    act(() => {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('deux caractères dans la même tâche donnent deux notes au plus, jamais plus de neuf au total', async () => {
    render(<PlayScreen onDone={vi.fn()} touch={false} />);
    const input = document.querySelector('input') as HTMLInputElement;
    act(() => {
      fireEvent.input(input, {
        target: { value: 'l' },
        inputType: 'insertText',
        data: 'l',
      });
      fireEvent.input(input, {
        target: { value: 'e' },
        inputType: 'insertText',
        data: 'e',
      });
    });
    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalledTimes(2));
    expect(mockPlayNoteName.mock.calls.map((c) => c[0])).toEqual(['E5', 'D#5']);
  });
});

describe('PlayScreen : mode tactile', () => {
  it('chaque toucher joue la note suivante ; après neuf touchers, touchMissLine puis continueTouch', async () => {
    render(<PlayScreen onDone={vi.fn()} touch={true} />);
    const surface = screen.getByTestId('play-touch-surface');
    for (let i = 0; i < 9; i++) {
      fireEvent.click(surface);
      await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalledTimes(
        i < 8 ? i + 1 : i + 2,
      ));
    }
    expect(screen.getByText('play.touchMissLine')).toBeInTheDocument();
    expect(screen.getByText('continueTouch')).toBeInTheDocument();
  });

  it('un toucher après la fin appelle onDone', async () => {
    const onDone = vi.fn();
    render(<PlayScreen onDone={onDone} touch={true} />);
    const surface = screen.getByTestId('play-touch-surface');
    for (let i = 0; i < 9; i++) {
      fireEvent.click(surface);
    }
    await waitFor(() => expect(screen.getByText('continueTouch')).toBeInTheDocument());
    act(() => {
      fireEvent.click(surface);
    });
    expect(onDone).toHaveBeenCalledOnce();
  });
});
