import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const typingAreaPropsRef: {
  current: null | {
    onSessionComplete?: (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
    }) => void;
  };
} = { current: null };

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: (props: {
    onSessionComplete?: (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
    }) => void;
  }) => {
    typingAreaPropsRef.current = props;
    return <div data-testid="typing-area" />;
  },
}));

vi.mock('@/components/modes/KeyboardDiagram', () => ({
  KeyboardDiagram: () => <div data-testid="keyboard-diagram" />,
}));

vi.mock('@/lib/words', () => ({
  generateLearningText: (levelId: number) => `level-${levelId}`,
}));

vi.mock('@/lib/learning-progress', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/learning-progress')>();
  return {
    ...actual,
    loadLearningProgress: vi.fn().mockResolvedValue(undefined),
    saveLearningProgress: vi.fn().mockResolvedValue(undefined),
  };
});

// Le point de ce fichier : forcer IS_DEV_MODE à true (par défaut, sous
// vitest, NODE_ENV='test' donc IS_DEV_MODE est déjà false — cohérent avec
// LearningMode.test.tsx qui vérifie le comportement verrouillé normal).
vi.mock('@/lib/featureFlags', () => ({
  IS_DEV_MODE: true,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    button: (
      props: ButtonHTMLAttributes<HTMLButtonElement> & {
        initial?: unknown;
        animate?: unknown;
        exit?: unknown;
        transition?: unknown;
      },
    ) => {
      const { initial, animate, exit, transition, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      return <button {...rest} />;
    },
  },
  useReducedMotion: () => false,
}));

import { LearningMode } from '../LearningMode';

describe('LearningMode — mode développement', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
  });

  it('affiche un bandeau explicite signalant le mode développement', () => {
    render(<LearningMode />);
    expect(screen.getByText(/mode d.veloppement/i)).toBeInTheDocument();
  });

  it('rend tous les niveaux sélectionnables sans avoir à les débloquer', () => {
    render(<LearningMode />);

    const level5Button = screen.getByRole('button', {
      name: /Niveau 5.*Shift & Punctuation/i,
    });
    expect(level5Button).not.toBeDisabled();

    fireEvent.click(level5Button);

    expect(screen.getByText(/Niveau 5.*Shift & Punctuation/i)).toBeInTheDocument();
  });

  it('affiche un message de fin de tutoriel une fois le dernier niveau réussi', () => {
    render(<LearningMode />);

    fireEvent.click(
      screen.getByRole('button', { name: /Niveau 5.*Shift & Punctuation/i }),
    );

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 60,
        accuracy: 100,
        correct: 100,
        total: 100,
      });
    });

    expect(
      screen.queryByRole('button', { name: /Débloquer le niveau 6/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/tutoriel termin/i)).toBeInTheDocument();
  });
});
