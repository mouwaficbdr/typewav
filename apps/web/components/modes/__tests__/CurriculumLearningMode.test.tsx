import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';
import {
  CURRICULUM_VERSION,
  LEARNING_CURRICULUM_AZERTY,
} from '@typewav/types';
import { createInitialLevelProgress } from '@/lib/learning-progress';
import { CurriculumLearningMode } from '../CurriculumLearningMode';

vi.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) => {
      const path = `${namespace}.${key}`.split('.');
      let msg: unknown = frMessages;
      for (const segment of path) {
        msg = (msg as Record<string, unknown> | undefined)?.[segment];
      }
      if (typeof msg !== 'string') return `${namespace}.${key}`;
      return msg.replace(/\{(\w+)\}/g, (_m, token: string) =>
        String(values?.[token] ?? ''),
      );
    },
}));

// IndexedDB indisponible en jsdom : puits de préférences en mémoire. La vraie
// logique de `learning-progress` (migration de version, déblocage) tourne
// dessus.
const { store } = vi.hoisted(() => ({ store: new Map<string, unknown>() }));
vi.mock('@/lib/db', () => ({
  getPreference: vi.fn(async (key: string) => store.get(key)),
  setPreference: vi.fn(async (key: string, value: unknown) => {
    store.set(key, value);
  }),
}));

const { audio } = vi.hoisted(() => ({
  audio: {
    loadMidiPiece: vi.fn(async () => undefined),
    playNoteName: vi.fn(async () => undefined),
    playNote: vi.fn(async () => null),
    initialize: vi.fn(async () => undefined),
    triggerSilence: vi.fn(),
    triggerResume: vi.fn(async () => undefined),
    loadSoundPack: vi.fn(async () => undefined),
  },
}));
vi.mock('@/hooks/useAudioEngine', () => ({ useAudioEngine: () => audio }));

vi.mock('@typewav/audio-engine', () => ({ clearLoadedPiece: vi.fn() }));

// Stub TypingArea : expose ses props + un bouton qui rejoue une série complète
// correcte (keystrokeData aligné sur le texte reçu).
const typingAreaPropsRef: {
  current: null | {
    text: string;
    onActiveKeyChange?: (key: string | undefined) => void;
    onNoteChange?: (
      note: string | null,
      isError: boolean,
      isPhraseBoundary: boolean,
      char?: string,
    ) => void;
    onSessionComplete?: (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
      keystrokeData: { char: string; timestamp: number; correct: boolean; deltaMs: number }[];
    }) => void;
  };
} = { current: null };

vi.mock('@/components/typing/TypingArea', () => ({
  TypingArea: (props: {
    text: string;
    onActiveKeyChange?: (key: string | undefined) => void;
    onNoteChange?: (
      note: string | null,
      isError: boolean,
      isPhraseBoundary: boolean,
      char?: string,
    ) => void;
    onSessionComplete?: (stats: {
      wpm: number;
      accuracy: number;
      correct: number;
      total: number;
      keystrokeData: {
        char: string;
        timestamp: number;
        correct: boolean;
        deltaMs: number;
      }[];
    }) => void;
  }) => {
    typingAreaPropsRef.current = props;
    return (
      <div data-testid="typing-area-stub">
        <button
          type="button"
          onClick={() => {
            const chars = [...props.text];
            props.onSessionComplete?.({
              wpm: 40,
              accuracy: 100,
              correct: chars.length,
              total: chars.length,
              keystrokeData: chars.map((char, i) => ({
                char,
                timestamp: i,
                correct: true,
                deltaMs: 90,
              })),
            });
          }}
        >
          finir la série
        </button>
      </div>
    );
  },
}));

vi.mock('../LevelClearedMoment', () => ({
  getLevelsWithClearedMoment: (total: number) =>
    Array.from({ length: Math.max(0, total - 1) }, (_, i) => i + 1),
  LevelClearedMoment: (props: {
    levelId: number;
    levelName?: string;
    onDismiss: () => void;
  }) => (
    <div
      data-testid="level-cleared"
      data-level={props.levelId}
      data-name={props.levelName}
    >
      <button type="button" onClick={props.onDismiss}>
        fermer
      </button>
    </div>
  ),
}));

vi.mock('../LevelRailSpotlight', () => ({
  LevelRailSpotlight: () => <div data-testid="level-rail-spotlight" />,
}));

const CURRICULUM = LEARNING_CURRICULUM_AZERTY;

function seed(opts: {
  taught: number[];
  unlockedUpTo: number;
  mastery?: Record<string, { correct: number; total: number }>;
}) {
  store.set('learning_curriculum_version', CURRICULUM_VERSION);
  store.set('learning_taught_levels', opts.taught);
  store.set(
    'learning_level_progress',
    createInitialLevelProgress(CURRICULUM).map((p) =>
      p.levelId <= opts.unlockedUpTo ? { ...p, unlocked: true } : p,
    ),
  );
  if (opts.mastery) store.set('learning_key_mastery', opts.mastery);
}

beforeEach(() => {
  store.clear();
  // Ecran d'accueil deja vu, sauf dans les tests qui le visent.
  store.set('learning_welcomed', true);
  audio.loadMidiPiece.mockClear();
  audio.playNoteName.mockClear();
});

describe('CurriculumLearningMode — routage étape/drill', () => {
  it("affiche l'étape d'enseignement du niveau 1 tant qu'il n'est pas dans taughtLevels", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    expect(await screen.findByText(/pose tes index/i)).toBeInTheDocument();
    expect(screen.queryByTestId('drill-zone')).not.toBeInTheDocument();
  });

  it("après l'étape du niveau 1 (anchors), débloque et passe à l'étape du niveau 2", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /commencer/i });
    await user.keyboard('qsdfjklm');
    await user.click(screen.getByRole('button', { name: /commencer/i }));
    expect(await screen.findByText(/rangée du repos/i)).toBeInTheDocument();
    expect(
      (
        store.get('learning_level_progress') as {
          levelId: number;
          unlocked: boolean;
        }[]
      ).find((p) => p.levelId === 2)?.unlocked,
    ).toBe(true);
    expect(store.get('learning_taught_levels')).toEqual([1]);
  });

  it('applique la migration de version du curriculum au montage', async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByText(/pose tes index/i);
    expect(store.get('learning_curriculum_version')).toBe(CURRICULUM_VERSION);
  });
});

describe('CurriculumLearningMode — boucle de drill', () => {
  it('intègre les frappes et débloque le niveau suivant quand chaque geste est à sa barre', async () => {
    const l2 = CURRICULUM[1]!; // home-row, 10 newKeys, drill
    const mastery = Object.fromEntries(
      l2.newKeys.map((k) => [k.id, { correct: 20, total: 20 }]),
    );
    seed({ taught: [1, 2], unlockedUpTo: 2, mastery });

    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /finir la série/i }));

    expect(await screen.findByTestId('level-cleared')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (
          store.get('learning_level_progress') as {
            levelId: number;
            unlocked: boolean;
          }[]
        ).find((p) => p.levelId === 3)?.unlocked,
      ).toBe(true),
    );
    expect(store.get('learning_key_mastery')).toBeTruthy();
  });

  it('ne débloque pas tant que les gestes ne sont pas à leur barre', async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 }); // aucune maîtrise
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /finir la série/i }));

    expect(screen.queryByTestId('level-cleared')).not.toBeInTheDocument();
    expect(
      (
        store.get('learning_level_progress') as {
          levelId: number;
          unlocked: boolean;
        }[]
      ).find((p) => p.levelId === 3)?.unlocked,
    ).toBe(false);
  });
});

describe('CurriculumLearningMode — audio', () => {
  it("niveau 'simple' (drill) : ne charge aucune pièce MIDI", async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    expect(audio.loadMidiPiece).not.toHaveBeenCalled();
  });

  it("niveau 'piece' (words) : charge une pièce au montage", async () => {
    seed({ taught: [1, 2, 3, 4, 5], unlockedUpTo: 5 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    await waitFor(() => expect(audio.loadMidiPiece).toHaveBeenCalled());
  });
});

const levelName = (slug: string): string =>
  (frMessages.learning.level as Record<string, { name: string }>)[slug]!.name;

function masteredKeys(levelIndex: number) {
  return Object.fromEntries(
    CURRICULUM[levelIndex]!.newKeys.map((k) => [k.id, { correct: 20, total: 20 }]),
  );
}

describe('CurriculumLearningMode : navigation entre niveaux (#115)', () => {
  it("après « Niveau validé », fermer la célébration mène à l'enseignement du niveau suivant", async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2, mastery: masteredKeys(1) });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /finir la série/i }));
    await user.click(await screen.findByRole('button', { name: 'fermer' }));

    expect(
      await screen.findByRole('heading', { name: levelName('top-row') }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('drill-zone')).not.toBeInTheDocument();
  });

  it('sur un niveau validé, un bouton large mène au niveau suivant, nom compris', async () => {
    seed({ taught: [1, 2, 3], unlockedUpTo: 3, mastery: masteredKeys(1) });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await screen.findByTestId('drill-zone');
    await user.click(screen.getByRole('button', { name: /^2\b/ })); // pastille du niveau 2

    const next = await screen.findByRole('button', {
      name: new RegExp(`niveau 3.*${levelName('top-row')}`, 'i'),
    });
    await user.click(next);
    expect(
      await screen.findByRole('heading', { name: levelName('top-row') }),
    ).toBeInTheDocument();
  });

  it('un bouton « Niveau précédent » ramène au niveau d\'avant', async () => {
    seed({ taught: [1, 2, 3], unlockedUpTo: 3 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await screen.findByTestId('drill-zone');
    await user.click(screen.getByRole('button', { name: /niveau précédent/i }));
    expect(
      await screen.findByRole('heading', { name: levelName('home-row') }),
    ).toBeInTheDocument();
  });

  it('les pastilles du rail sont numérotées et font au moins 24 px', async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    const dots = screen
      .getAllByRole('button')
      .filter((b) => /^\d+$/.test(b.textContent ?? ''));
    expect(dots.map((b) => b.textContent)).toEqual(
      CURRICULUM.map((l) => String(l.id)),
    );
    for (const dot of dots) {
      expect(parseInt(dot.style.width, 10)).toBeGreaterThanOrEqual(24);
      expect(parseInt(dot.style.height, 10)).toBeGreaterThanOrEqual(24);
    }
  });

  it("rejouer les repères depuis le rail puis « Commencer » ramène au niveau où l'on en était", async () => {
    seed({ taught: [1, 2, 3, 4, 5], unlockedUpTo: 5 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await screen.findByTestId('drill-zone');
    await user.click(screen.getByRole('button', { name: /^1\b/ })); // pastille du niveau 1
    await screen.findByRole('button', { name: /commencer/i });
    await user.keyboard('qsdfjklm');
    await user.click(screen.getByRole('button', { name: /commencer/i }));

    expect(await screen.findByTestId('drill-zone')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: levelName('first-words') }),
    ).toBeInTheDocument();
  });
});

describe('CurriculumLearningMode : schéma clavier pendant le drill (#116)', () => {
  const activeKey = (el: Element) =>
    el.querySelector('[data-active="true"]')?.getAttribute('data-key');
  const expectKey = (char: string | undefined) =>
    act(() => typingAreaPropsRef.current!.onActiveKeyChange!(char));

  it('montre la touche attendue', async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    const diagram = screen.getByLabelText(/clavier azerty/i);

    expectKey('f');
    expect(activeKey(diagram)).toBe('f');
    expectKey(undefined);
    expect(activeKey(diagram)).toBeUndefined();
  });

  it('majuscule : touche minuscule active et Maj de la main opposée tenu', async () => {
    seed({ taught: [1, 2, 3, 4, 5, 6], unlockedUpTo: 6 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    const diagram = screen.getByLabelText(/clavier azerty/i);

    expectKey('M'); // m : auriculaire droit, donc Maj gauche
    expect(activeKey(diagram)).toBe('m');
    expect(
      diagram.querySelector('[data-key="ShiftLeft"]')?.getAttribute('data-hold'),
    ).toBe('true');
  });

  it('touche morte : étape 1 sur ^, étape 2 sur la voyelle après la touche morte', async () => {
    seed({ taught: [1, 2, 3, 4, 5, 6, 7, 8], unlockedUpTo: 8 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    const diagram = screen.getByLabelText(/clavier azerty/i);

    expectKey('ê');
    expect(activeKey(diagram)).toBe('^');
    fireEvent.keyDown(window, { key: 'Dead' });
    expect(activeKey(diagram)).toBe('e');

    // Caractère suivant puis un autre ê : on repart à l'étape 1.
    expectKey('ê');
    expect(activeKey(diagram)).toBe('^');
  });
});

describe("CurriculumLearningMode : accueil, règle et premiers sons (#117)", () => {
  const welcome = frMessages.learning.welcome;

  it("à la toute première arrivée, un accueil explique le principe avant le niveau 1", async () => {
    store.delete('learning_welcomed');
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    expect(
      await screen.findByRole('heading', { name: welcome.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(welcome.rule)).toBeInTheDocument();
    expect(screen.queryByText(/pose tes index/i)).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: welcome.start }));
    expect(await screen.findByText(/pose tes index/i)).toBeInTheDocument();
    expect(store.get('learning_welcomed')).toBe(true);
  });

  it("pas d'accueil quand une progression existe déjà", async () => {
    store.delete('learning_welcomed');
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    expect(
      screen.queryByRole('heading', { name: welcome.title }),
    ).not.toBeInTheDocument();
  });

  it("la règle note / silence / retour arrière est visible au premier entraînement, puis cède la place", async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    expect(await screen.findByText(frMessages.learning.ruleReminder)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /finir la série/i }));
    expect(screen.queryByText(frMessages.learning.ruleReminder)).not.toBeInTheDocument();
  });

  it("la règle ne revient pas au premier entraînement d'un niveau ultérieur", async () => {
    store.set('learning_curriculum_version', CURRICULUM_VERSION);
    store.set('learning_taught_levels', [1, 2, 3]);
    store.set(
      'learning_level_progress',
      createInitialLevelProgress(CURRICULUM).map((p) =>
        p.levelId <= 3
          ? { ...p, unlocked: true, samples: p.levelId === 2 ? 300 : 0 }
          : p,
      ),
    );
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');
    expect(screen.queryByText(frMessages.learning.ruleReminder)).not.toBeInTheDocument();
  });

  it("niveau 'simple' : chaque frappe juste joue la note de sa touche", async () => {
    seed({ taught: [1, 2], unlockedUpTo: 2 });
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByTestId('drill-zone');

    act(() => typingAreaPropsRef.current!.onNoteChange!(null, false, false, 'f'));
    act(() => typingAreaPropsRef.current!.onNoteChange!(null, false, false, 'q'));
    expect(audio.playNoteName).toHaveBeenNthCalledWith(1, 'G4');
    expect(audio.playNoteName).toHaveBeenNthCalledWith(2, 'C4');

    audio.playNoteName.mockClear();
    act(() => typingAreaPropsRef.current!.onNoteChange!(null, true, false, 'x'));
    expect(audio.playNoteName).not.toHaveBeenCalled();
  });

  it("dès l'enseignement du niveau 1, une touche tapée joue une note", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByRole('button', { name: /commencer/i });
    await userEvent.setup().keyboard('q');
    expect(audio.playNoteName).toHaveBeenCalledWith('C4');
  });
});
