import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import frMessages from '../../../messages/fr.json';
import { LevelTeachStep } from '../LevelTeachStep';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

// Convention du repo : on mocke next-intl avec un résolveur qui marche sur le
// vrai fr.json (cf. LevelClearedMoment.test.tsx) plutôt qu'un provider.
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

describe('LevelTeachStep', () => {
  it('« Commencer » est désactivé tant que chaque nouveau geste n’a pas été produit', async () => {
    const onDone = vi.fn();
    const level = LEARNING_CURRICULUM_AZERTY[2]!; // top-row, 10 lettres
    render(<LevelTeachStep level={level} onDone={onDone} />);
    const btn = screen.getByRole('button', { name: /commencer/i });
    expect(btn).toBeDisabled();
    const user = userEvent.setup();
    await user.keyboard('azertyuiop');
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('niveau anchors : 8 repères à toucher', async () => {
    const onDone = vi.fn();
    const level = LEARNING_CURRICULUM_AZERTY[0]!;
    render(<LevelTeachStep level={level} onDone={onDone} />);
    const btn = screen.getByRole('button', { name: /commencer/i });
    const user = userEvent.setup();
    await user.keyboard('qsdfjklm');
    expect(btn).toBeEnabled();
  });

  it('ignore les frappes hors des nouveaux gestes du niveau', async () => {
    const onDone = vi.fn();
    const level = LEARNING_CURRICULUM_AZERTY[2]!; // top-row : a z e r t y u i o p
    render(<LevelTeachStep level={level} onDone={onDone} />);
    const btn = screen.getByRole('button', { name: /commencer/i });
    const user = userEvent.setup();
    // 'q' n'est pas dans top-row ; répéter 'a' ne compte qu'une fois.
    await user.keyboard('qqqaaa');
    expect(btn).toBeDisabled();
  });
});
