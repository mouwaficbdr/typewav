import { act, fireEvent, render, screen } from '@testing-library/react';
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

const mockOnExitTutorial = vi.fn();

describe('LearningMode — mode développement', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockOnExitTutorial.mockClear();
  });

  it('affiche un bandeau explicite signalant le mode développement', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    expect(screen.getByText(/mode d.veloppement/i)).toBeInTheDocument();
  });

  it('rend tous les niveaux sélectionnables sans avoir à les débloquer', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const level5Button = screen.getByRole('button', {
      name: /Niveau 5.*Nuances et silences/i,
    });
    expect(level5Button).not.toBeDisabled();

    fireEvent.click(level5Button);

    expect(screen.getByText(/Niveau 5.*Nuances et silences/i)).toBeInTheDocument();
  });

  it('affiche un message de fin de tutoriel une fois le dernier niveau réussi, et appelle onExitTutorial en cliquant dessus', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Niveau 5.*Nuances et silences/i }),
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

    fireEvent.click(
      screen.getByRole('button', { name: /passer en mode classique/i }),
    );
    expect(mockOnExitTutorial).toHaveBeenCalledOnce();
  });
});

describe('LearningMode — isOnboarding', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockOnExitTutorial.mockClear();
  });

  it('affiche le bouton "Passer le tutoriel" et appelle onExitTutorial au clic', () => {
    render(
      <LearningMode isOnboarding onExitTutorial={mockOnExitTutorial} />,
    );

    const skipButton = screen.getByRole('button', {
      name: /passer le tutoriel/i,
    });
    fireEvent.click(skipButton);

    expect(mockOnExitTutorial).toHaveBeenCalledOnce();
  });
});
