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

const mockGetCelebratedLevels = vi.fn().mockResolvedValue([]);
const mockMarkLevelCelebrated = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/onboarding', () => ({
  hasSeenLearningFingerIntro: () => mockHasSeenFingerIntro(),
  markLearningFingerIntroSeen: () => mockMarkFingerIntroSeen(),
  getCelebratedLearningLevels: () => mockGetCelebratedLevels(),
  markLearningLevelCelebrated: (id: number) => mockMarkLevelCelebrated(id),
}));

// Le moment "Niveau N validé" a ses propres tests (motion, audio, timers) ;
// ici on veut juste vérifier qu'il apparaît/disparaît au bon moment et
// déclenche le relais. Stub qui expose ses props + un bouton de fermeture.
const levelClearedPropsRef: {
  current: null | {
    levelId: number;
    samples: number;
    accuracy: number;
    onDismiss: () => void;
  };
} = { current: null };

vi.mock('@/components/modes/LevelClearedMoment', () => ({
  // Même règle que le vrai module : tous les niveaux sauf le dernier.
  LEVELS_WITH_CLEARED_MOMENT: [1, 2, 3, 4],
  LevelClearedMoment: (props: {
    levelId: number;
    samples: number;
    accuracy: number;
    onDismiss: () => void;
  }) => {
    levelClearedPropsRef.current = props;
    return (
      <div data-testid="level-cleared-moment">
        <button type="button" onClick={props.onDismiss}>
          fermer le moment
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/modes/LevelRailSpotlight', () => ({
  LevelRailSpotlight: ({ onDone }: { onDone: () => void }) => {
    void onDone;
    return <div data-testid="level-rail-spotlight" />;
  },
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

type MotionExtraProps = {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement> & MotionExtraProps) => {
      const { initial, animate, exit, transition, children, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      return <div {...rest}>{children}</div>;
    },
    span: (props: HTMLAttributes<HTMLSpanElement> & MotionExtraProps) => {
      const { initial, animate, exit, transition, children, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      return <span {...rest}>{children}</span>;
    },
    button: (
      props: ButtonHTMLAttributes<HTMLButtonElement> & MotionExtraProps,
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
  useAnimationControls: () => ({
    start: () => Promise.resolve(),
    set: () => {},
    stop: () => {},
  }),
}));

import { LearningMode } from '../LearningMode';

const mockOnExitTutorial = vi.fn();

beforeEach(() => {
  levelClearedPropsRef.current = null;
  mockGetCelebratedLevels.mockClear().mockResolvedValue([]);
  mockMarkLevelCelebrated.mockClear().mockResolvedValue(undefined);
});

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

  it("une fois l'objectif atteint, c'est le point du niveau suivant qui porte le CTA (et cliquer dessus avance)", () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    // Le CTA "prêt" est sur le point du niveau 2, pas sur le point actif
    // (niveau 1, qui garde son libellé neutre "vous êtes ici").
    const readyCta = screen.getByRole('button', { name: /Niveau 2 pr.t/i });
    expect(readyCta).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^Niveau 1 : Les premières notes$/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(readyCta);

    // Libellé visible exact (pas l'annonce SR "Niveau 2 débloqué : ...").
    expect(
      screen.getByText('Niveau 2 : Vers les aigus'),
    ).toBeInTheDocument();
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

  it('joue le moment "Niveau N validé" quand l\'objectif est atteint, puis le relais spotlight à la fermeture', async () => {
    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await act(async () => {}); // laisse getCelebratedLearningLevels() se résoudre

    expect(screen.queryByTestId('level-cleared-moment')).not.toBeInTheDocument();

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    expect(screen.getByTestId('level-cleared-moment')).toBeInTheDocument();
    expect(levelClearedPropsRef.current?.levelId).toBe(1);
    expect(levelClearedPropsRef.current?.samples).toBeGreaterThanOrEqual(50);
    expect(screen.queryByTestId('level-rail-spotlight')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /fermer le moment/i }));

    expect(mockMarkLevelCelebrated).toHaveBeenCalledWith(1);
    expect(screen.queryByTestId('level-cleared-moment')).not.toBeInTheDocument();
    expect(screen.getByTestId('level-rail-spotlight')).toBeInTheDocument();
  });

  it('ne rejoue pas le moment pour un niveau déjà célébré', async () => {
    mockGetCelebratedLevels.mockResolvedValue([1]);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await act(async () => {}); // laisse celebratedLevelsRef se peupler ([1])

    act(() => {
      typingAreaPropsRef.current?.onSessionComplete?.({
        wpm: 55,
        accuracy: 100,
        correct: 50,
        total: 50,
      });
    });

    expect(screen.queryByTestId('level-cleared-moment')).not.toBeInTheDocument();
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

describe('LearningMode : persistance de la progression', () => {
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
    // après le chargement : on vérifie qu'un appel reflète bien la mise à
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

describe('LearningMode : sélection manuelle (pas d’onboarding)', () => {
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

describe('LearningMode : disposition clavier (ticket #62)', () => {
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

describe('LearningMode : écran de positionnement des doigts (ticket #62)', () => {
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

  // Les 8 repères de la home row (niveau 1), en disposition qwerty (mock).
  const HOME_ROW_ANCHORS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

  async function touchAllAnchors() {
    await screen.findByText(/0\/8/);
    // Laisse l'effet qui pose le listener window keydown se monter.
    await act(async () => {});
    for (const key of HOME_ROW_ANCHORS) {
      fireEvent.keyDown(window, { key });
    }
    await screen.findByText(/8\/8/);
  }

  it('passe à la leçon après avoir touché les 8 repères puis cliqué "Commencer", et persiste le flag', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    await touchAllAnchors();
    const startButton = screen.getByRole('button', { name: /commencer/i });
    expect(startButton).toHaveAttribute('aria-disabled', 'false');
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

    // waitFor plutôt qu'une assertion synchrone juste après findByTestId :
    // le nœud peut apparaître au commit avant que le ref de props capturé
    // par le mock (assigné pendant le rendu, mais potentiellement un rendu
    // précédent laissé par un test voisin) ne reflète le rendu courant.
    await waitFor(() =>
      expect(keyboardDiagramPropsRef.current?.showAllFingerColors).toBe(true),
    );
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
    // Laisse l'effet qui pose le listener window keydown se monter avant de
    // frapper (sinon la frappe part dans le vide sous charge du full-suite).
    await act(async () => {});

    fireEvent.keyDown(window, { key: 'f' });

    expect(await screen.findByText(/1\/8/)).toBeInTheDocument();
    expect(keyboardDiagramPropsRef.current?.confirmedKeys).toEqual(['f']);
  });

  it('une touche hors home row (ex. la barre espace) ne compte pas', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);
    await screen.findByText(/0\/8/);
    await act(async () => {});

    fireEvent.keyDown(window, { key: ' ' });

    expect(screen.getByText(/0\/8/)).toBeInTheDocument();
  });

  it('"Commencer" est aria-disabled tant que les 8 repères ne sont pas touchés', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const startButton = await screen.findByRole('button', {
      name: /commencer/i,
    });
    expect(startButton).toHaveAttribute('aria-disabled', 'true');

    await screen.findByText(/0\/8/);
    await act(async () => {});
    fireEvent.keyDown(window, { key: 'f' });
    await screen.findByText(/1\/8/);
    expect(startButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('un clic prématuré sur "Commencer" ne quitte pas l\'écran et ne persiste rien', async () => {
    mockHasSeenFingerIntro.mockResolvedValue(false);

    render(<LearningMode onExitTutorial={mockOnExitTutorial} />);

    const startButton = await screen.findByRole('button', {
      name: /commencer/i,
    });
    await screen.findByText(/0\/8/);
    await act(async () => {});
    fireEvent.keyDown(window, { key: 'f' });
    await screen.findByText(/1\/8/);

    fireEvent.click(startButton);

    expect(mockMarkFingerIntroSeen).not.toHaveBeenCalled();
    expect(screen.queryByTestId('typing-area')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /commencer/i }),
    ).toBeInTheDocument();
  });
});
