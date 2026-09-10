import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';
import { CURRICULUM_VERSION } from '@typewav/types';
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

beforeEach(() => {
  store.clear();
});

describe('CurriculumLearningMode', () => {
  it("affiche l'étape d'enseignement du niveau 1 tant qu'il n'est pas dans taughtLevels", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    expect(await screen.findByText(/pose tes index/i)).toBeInTheDocument();
    expect(screen.queryByTestId('drill-zone')).not.toBeInTheDocument();
  });

  it("après l'étape du niveau 1 (anchors), débloque et passe à l'étape du niveau 2", async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /commencer/i });
    await user.keyboard('qsdfjklm'); // les 8 repères
    await user.click(screen.getByRole('button', { name: /commencer/i }));
    expect(await screen.findByText(/rangée du repos/i)).toBeInTheDocument();
    expect(
      (store.get('learning_level_progress') as { levelId: number; unlocked: boolean }[]).find(
        (p) => p.levelId === 2,
      )?.unlocked,
    ).toBe(true);
    expect(store.get('learning_taught_levels')).toEqual([1]);
  });

  it('applique la migration de version du curriculum au montage', async () => {
    render(<CurriculumLearningMode onExitTutorial={vi.fn()} />);
    await screen.findByText(/pose tes index/i);
    expect(store.get('learning_curriculum_version')).toBe(CURRICULUM_VERSION);
  });
});
