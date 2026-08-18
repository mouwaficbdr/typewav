import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';

// Interpole les vraies chaînes fr.json (namespace + placeholders {x}) plutôt
// que de renvoyer la clé brute — les assertions ci-dessous vérifient de la
// vraie copie utilisateur (noms de niveaux, CTA), pas le câblage i18n en soi.
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
    const path = `${namespace}.${key}`.split('.');
    let msg: unknown = frMessages;
    for (const segment of path) {
      msg = (msg as Record<string, unknown> | undefined)?.[segment];
    }
    if (typeof msg !== 'string') return `${namespace}.${key}`;
    return msg.replace(/\{(\w+)\}/g, (_match, token: string) =>
      String(values?.[token] ?? ''),
    );
  },
}));

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

const mockLoadLearningProgress = vi.fn().mockResolvedValue(undefined);
const mockSaveLearningProgress = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/learning-progress', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/learning-progress')>();
  return {
    ...actual,
    loadLearningProgress: () => mockLoadLearningProgress(),
    saveLearningProgress: (progress: unknown) =>
      mockSaveLearningProgress(progress),
  };
});

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

const mockOnExitTutorial = vi.fn();

describe('LearningMode progression wiring', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
  });

  it('met a jour les stats de progression apres une session terminee', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(screen.getByText(/0\/50 frappes/i)).toBeInTheDocument();

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 32,
        accuracy: 80,
        correct: 8,
        total: 10,
      });
    });

    expect(screen.getByText(/10\/50 frappes/i)).toBeInTheDocument();
    expect(screen.getByText(/Derni.re session/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /D.bloquer le niveau 2/i }),
    ).not.toBeInTheDocument();
  });

  it('affiche le deblocage du niveau suivant quand les objectifs sont atteints', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    const unlockButton = screen.getByRole('button', {
      name: /D.bloquer le niveau 2/i,
    });
    expect(unlockButton).toBeInTheDocument();

    fireEvent.click(unlockButton);

    expect(screen.getByText(/Niveau 2.*Vers les aigus/i)).toBeInTheDocument();
  });
});

describe('LearningMode — persistance de la progression', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
  });

  it('charge la progression sauvegardée au montage', async () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await waitFor(() => expect(mockLoadLearningProgress).toHaveBeenCalled());
  });

  it("affiche la progression déjà sauvegardée (pas 0/50) quand elle existe", async () => {
    mockLoadLearningProgress.mockResolvedValue([
      { levelId: 1, accuracy: 92, samples: 30, unlocked: true },
      { levelId: 2, accuracy: 0, samples: 0, unlocked: false },
      { levelId: 3, accuracy: 0, samples: 0, unlocked: false },
      { levelId: 4, accuracy: 0, samples: 0, unlocked: false },
      { levelId: 5, accuracy: 0, samples: 0, unlocked: false },
    ]);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(await screen.findByText(/30\/50 frappes/i)).toBeInTheDocument();
  });

  it('sauvegarde la progression mise à jour après une session terminée', async () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await waitFor(() => expect(mockLoadLearningProgress).toHaveBeenCalled());

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 32,
        accuracy: 80,
        correct: 8,
        total: 10,
      });
    });

    // Un appel de sauvegarde initial (état encore à zéro) peut survenir juste
    // après le chargement — on vérifie qu'un appel reflète bien la mise à
    // jour, sans dépendre de sa position exacte dans l'historique des appels.
    await waitFor(() => {
      const calls = mockSaveLearningProgress.mock.calls as Array<
        [Array<{ levelId: number; samples: number }>]
      >;
      const matched = calls.some(
        ([progress]) => progress.find((p) => p.levelId === 1)?.samples === 10,
      );
      expect(matched).toBe(true);
    });
  });
});

describe('LearningMode — sélection manuelle (pas d’onboarding)', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
  });

  it("n'affiche pas de bouton \"Passer le tutoriel\" quand isOnboarding n'est pas passé", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    expect(
      screen.queryByRole('button', { name: /passer le tutoriel/i }),
    ).not.toBeInTheDocument();
  });

  it('appelle tout de même onExitTutorial en terminant réellement le tutoriel', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /D.bloquer le niveau 2/i }));

    for (let level = 2; level <= 4; level++) {
      act(() => {
        typingAreaPropsRef.current?.onSessionComplete?.({
          wpm: 55,
          accuracy: 100,
          correct: 100,
          total: 100,
        });
      });
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(`D.bloquer le niveau ${level + 1}`, 'i') }),
      );
    }

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 100,
        total: 100,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /passer en mode classique/i }));
    expect(mockOnExitTutorial).toHaveBeenCalledOnce();
  });
});
