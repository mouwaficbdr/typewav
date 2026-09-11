import { render, screen, waitFor } from '@testing-library/react';
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
