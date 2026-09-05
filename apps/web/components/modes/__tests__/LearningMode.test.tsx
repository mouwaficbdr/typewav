import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';

// Interpole les vraies chaînes fr.json (namespace + placeholders {x}) plutôt
// que de renvoyer la clé brute : les assertions ci-dessous vérifient de la
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

const keyboardDiagramPropsRef: {
  current: null | {
    layout?: string;
    showAllFingerColors?: boolean;
    confirmedKeys?: string[];
  };
} = {
  current: null,
};

vi.mock('@/components/modes/KeyboardDiagram', () => ({
  KeyboardDiagram: (props: {
    layout?: string;
    showAllFingerColors?: boolean;
    confirmedKeys?: string[];
  }) => {
    keyboardDiagramPropsRef.current = props;
    return <div data-testid="keyboard-diagram" />;
  },
}));

const mockGenerateLearningText = vi.fn(
  (levelId: number, _wordCount?: number, _layout?: string) =>
    `level-${levelId}`,
);

vi.mock('@/lib/words', () => ({
  generateLearningText: (
    levelId: number,
    wordCount?: number,
    layout?: string,
  ) => mockGenerateLearningText(levelId, wordCount, layout),
}));

const mockUseKeyboardLayoutPreference = vi.fn(() => ({ layout: 'qwerty' }));

vi.mock('@/hooks/useKeyboardLayoutPreference', () => ({
  useKeyboardLayoutPreference: () => mockUseKeyboardLayoutPreference(),
}));

// Par défaut "déjà vu" : l'écran de positionnement des doigts ne doit
// jamais s'interposer dans les tests qui ne le concernent pas explicitement.
const mockHasSeenFingerIntro = vi.fn().mockResolvedValue(true);
const mockMarkFingerIntroSeen = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/onboarding', () => ({
  hasSeenLearningFingerIntro: () => mockHasSeenFingerIntro(),
  markLearningFingerIntroSeen: () => mockMarkFingerIntroSeen(),
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
    span: ({ children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
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
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear().mockResolvedValue(true);
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it("affiche l'exigence dès un niveau tout juste ouvert, avant toute frappe", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(screen.getByText(/Encore 50 frappes/i)).toBeInTheDocument();
  });

  it('distingue le critère qui bloque : assez de frappes, précision encore trop basse', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 40,
        accuracy: 40,
        correct: 20,
        total: 50,
      });
    });

    expect(screen.getByText(/as fait assez de frappes/i)).toBeInTheDocument();
    expect(screen.queryByText(/Encore \d+ frappes/i)).not.toBeInTheDocument();
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
      screen.queryByRole('button', { name: /Niveau 2 pr.t/i }),
    ).not.toBeInTheDocument();
  });

  it("transforme la barre de progression en CTA et permet d'avancer en cliquant dessus quand les objectifs sont atteints", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    const readyCta = screen.getByRole('button', {
      name: /Niveau 2 pr.t/i,
    });
    expect(readyCta).toBeInTheDocument();

    fireEvent.click(readyCta);

    expect(screen.getByText(/Niveau 2.*Vers les aigus/i)).toBeInTheDocument();
  });

  it("annonce le déblocage pour un lecteur d'écran, pas seulement visuellement", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(screen.getByRole('status')).toHaveTextContent('');

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    expect(screen.getByRole('status')).toHaveTextContent(/Niveau 2 d.bloqu./i);
  });

  it('le stepper permet de revenir sur un niveau déjà débloqué (navigation, pas seulement avancer)', async () => {
    mockLoadLearningProgress.mockResolvedValue([
      { levelId: 1, accuracy: 92, samples: 60, unlocked: true },
      { levelId: 2, accuracy: 0, samples: 0, unlocked: true },
      { levelId: 3, accuracy: 0, samples: 0, unlocked: false },
      { levelId: 4, accuracy: 0, samples: 0, unlocked: false },
      { levelId: 5, accuracy: 0, samples: 0, unlocked: false },
    ]);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const level2Step = await screen.findByRole('button', {
      name: /Niveau 2 : Vers les aigus/i,
    });
    await waitFor(() => expect(level2Step).toBeEnabled());
    fireEvent.click(level2Step);
    expect(screen.getByText(/Niveau 2.*Vers les aigus/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Niveau 1 : Les premières notes/i,
      }),
    );
    expect(
      screen.getByText(/Niveau 1.*Les premières notes/i),
    ).toBeInTheDocument();
  });

  it('le stepper désactive les niveaux encore verrouillés', async () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await waitFor(() => expect(mockLoadLearningProgress).toHaveBeenCalled());

    const lockedStep = screen.getByRole('button', {
      name: /Niveau 2 : Vers les aigus/i,
    });
    expect(lockedStep).toBeDisabled();

    fireEvent.click(lockedStep);
    expect(
      screen.getByText(/Niveau 1.*Les premières notes/i),
    ).toBeInTheDocument();
  });
});

describe('LearningMode — persistance de la progression', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear().mockResolvedValue(true);
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
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
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear().mockResolvedValue(true);
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it("n'affiche pas de bouton \"Passer le tutoriel\" quand isOnboarding n'est pas passé", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    expect(
      screen.queryByRole('button', { name: /passer le tutoriel/i }),
    ).not.toBeInTheDocument();
  });

  it('appelle tout de même onExitTutorial en terminant réellement le tutoriel', () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    for (let level = 1; level <= 4; level++) {
      act(() => {
        typingAreaPropsRef.current?.onSessionComplete?.({
          wpm: 55,
          accuracy: 100,
          correct: 100,
          total: 100,
        });
      });
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(`Niveau ${level + 1} pr.t`, 'i'),
        }),
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

describe('LearningMode, isOnboarding', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear().mockResolvedValue(true);
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it('affiche le bouton "Passer le tutoriel" et appelle onExitTutorial au clic', () => {
    render(<LearningMode isOnboarding onExitTutorial={mockOnExitTutorial} />);

    const skipButton = screen.getByRole('button', {
      name: /passer le tutoriel/i,
    });
    fireEvent.click(skipButton);

    expect(mockOnExitTutorial).toHaveBeenCalledOnce();
  });
});

describe('LearningMode — disposition clavier (ticket #62)', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    keyboardDiagramPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear().mockResolvedValue(true);
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it('transmet la disposition qwerty par défaut au clavier visuel et au générateur de texte', async () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByTestId('keyboard-diagram');

    expect(keyboardDiagramPropsRef.current?.layout).toBe('qwerty');
    expect(mockGenerateLearningText).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      'qwerty',
    );
  });

  it('transmet la disposition azerty au clavier visuel et au générateur de texte', async () => {
    mockUseKeyboardLayoutPreference.mockReturnValue({ layout: 'azerty' });

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByTestId('keyboard-diagram');

    expect(keyboardDiagramPropsRef.current?.layout).toBe('azerty');
    expect(mockGenerateLearningText).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      'azerty',
    );
  });
});

describe('LearningMode — écran de positionnement des doigts (ticket #62)', () => {
  beforeEach(() => {
    typingAreaPropsRef.current = null;
    mockLoadLearningProgress.mockClear().mockResolvedValue(undefined);
    mockSaveLearningProgress.mockClear().mockResolvedValue(undefined);
    mockOnExitTutorial.mockClear();
    mockGenerateLearningText.mockClear();
    mockUseKeyboardLayoutPreference.mockClear().mockReturnValue({
      layout: 'qwerty',
    });
    mockHasSeenFingerIntro.mockClear();
    mockMarkFingerIntroSeen.mockClear().mockResolvedValue(undefined);
  });

  it("affiche l'écran de positionnement des doigts quand il n'a jamais été vu, à la place de la leçon", async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(
      await screen.findByRole('button', { name: /commencer/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('typing-area')).not.toBeInTheDocument();
  });

  it('passe à la leçon après clic sur "Commencer" et persiste le flag', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const startButton = await screen.findByRole('button', {
      name: /commencer/i,
    });
    fireEvent.click(startButton);

    expect(mockMarkFingerIntroSeen).toHaveBeenCalledOnce();
    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
  });

  it("n'affiche pas l'écran si déjà vu : la leçon est immédiatement accessible", async () => {
    mockHasSeenFingerIntro.mockResolvedValue(true);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByTestId('typing-area');

    expect(screen.getByTestId('typing-area')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /commencer/i }),
    ).not.toBeInTheDocument();
  });

  it('demande à KeyboardDiagram de colorer les 8 doigts simultanément (pas juste une touche active)', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByTestId('keyboard-diagram');

    expect(keyboardDiagramPropsRef.current?.showAllFingerColors).toBe(true);
  });

  it("l'étape interactive démarre à 0 repère touché", async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    expect(await screen.findByText(/0\/8/)).toBeInTheDocument();
  });

  it('toucher une touche de la home row au clavier incrémente le compteur', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByText(/0\/8/);

    fireEvent.keyDown(window, { key: 'f' });

    expect(await screen.findByText(/1\/8/)).toBeInTheDocument();
    expect(keyboardDiagramPropsRef.current?.confirmedKeys).toEqual(['f']);
  });

  it('une touche hors home row (ex. la barre espace) ne compte pas', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByText(/0\/8/);

    fireEvent.keyDown(window, { key: ' ' });

    expect(screen.getByText(/0\/8/)).toBeInTheDocument();
  });

  it('"Commencer" reste cliquable sans avoir touché aucun repère (skippable, exigence du ticket #62)', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const startButton = await screen.findByRole('button', {
      name: /commencer/i,
    });
    expect(startButton).toBeEnabled();
    fireEvent.click(startButton);

    expect(await screen.findByTestId('typing-area')).toBeInTheDocument();
  });
});
