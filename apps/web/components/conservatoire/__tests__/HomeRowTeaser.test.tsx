import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlayNoteName = vi.fn().mockResolvedValue(undefined);
const mockTriggerSilence = vi.fn().mockResolvedValue(undefined);
const mockInitialize = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: mockInitialize,
    playNoteName: mockPlayNoteName,
    triggerSilence: mockTriggerSilence,
  }),
}));

let mockLocale = 'fr';
vi.mock('next-intl', () => ({
  useLocale: () => mockLocale,
}));

const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    span: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
  },
}));

import { HomeRowTeaser } from '../HomeRowTeaser';

beforeEach(() => {
  mockLocale = 'fr';
  mockUseReducedMotion.mockReturnValue(false);
  mockPlayNoteName.mockClear();
  mockTriggerSilence.mockClear();
  mockInitialize.mockClear();
});

afterEach(() => {
  mockLocale = 'fr';
});

describe('HomeRowTeaser', () => {
  it('joue la note de la touche de repos pressée et incrémente le ripple', async () => {
    const { container } = render(<HomeRowTeaser />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-ripple-count', '0');

    fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });

    await waitFor(() =>
      expect(mockPlayNoteName).toHaveBeenCalledWith('F4'),
    );
    await waitFor(() =>
      expect(root).toHaveAttribute('data-ripple-count', '1'),
    );
  });

  it("une touche hors rangée de repos ne joue pas de nouvelle note et ne fait pas progresser le ripple", async () => {
    const { container } = render(<HomeRowTeaser />);
    const root = container.firstElementChild as HTMLElement;

    fireEvent.keyDown(window, { code: 'KeyZ', key: 'z' });

    await waitFor(() => expect(mockTriggerSilence).toHaveBeenCalled());
    expect(mockPlayNoteName).not.toHaveBeenCalled();
    expect(root).toHaveAttribute('data-ripple-count', '0');
  });

  // Réactivé en tâche 10 : playNoteName ne renseigne lastPlayedNote qu'à
  // partir de là, donc l'écho n'est pas encore audible de bout en bout.
  it.todo(
    "une touche hors rangée de repos déclenche l'écho de la dernière note jouée",
  );

  it('un clic (souris, tactile, ou Entrée/Espace au clavier sur le bouton natif) joue la note', async () => {
    render(<HomeRowTeaser />);

    // fireEvent.click couvre aussi l'activation clavier native d'un <button>
    // (Entrée/Espace sur l'élément focalisé), pas seulement le pointeur.
    fireEvent.click(screen.getByTestId('home-row-key-KeyF'));

    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalledWith('F4'));
  });

  it('le libellé AZERTY se corrige en QWERTY dès la première frappe QWERTY', async () => {
    render(<HomeRowTeaser />);
    expect(screen.getByText('q')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyA', key: 'a' });

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.queryByText('q')).not.toBeInTheDocument();
    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalled());
  });

  it('le libellé QWERTY se corrige en AZERTY dès la première frappe AZERTY', async () => {
    mockLocale = 'en';
    render(<HomeRowTeaser />);
    expect(screen.getByText('a')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyA', key: 'q' });

    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.queryByText('a')).not.toBeInTheDocument();
    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalled());
  });

  it('sous mouvement réduit : aucun élément de ripple, la touche porte data-pressed', async () => {
    mockUseReducedMotion.mockReturnValue(true);
    render(<HomeRowTeaser />);

    fireEvent.keyDown(window, { code: 'KeyF', key: 'f' });

    expect(document.querySelector('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-ripple]')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-row-key-KeyF')).toHaveAttribute(
      'data-pressed',
      'true',
    );
    await waitFor(() => expect(mockPlayNoteName).toHaveBeenCalled());
  });
});
